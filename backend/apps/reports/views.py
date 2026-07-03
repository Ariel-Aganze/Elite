from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, Avg, F, Q, DecimalField
from django.db.models.functions import TruncDate, TruncMonth, TruncDay
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from collections import defaultdict

from apps.tenants.models import Tenant
from apps.branches.models import Branch
from apps.catalog.models import Product, Category
from apps.partners.models import Supplier, Customer
from apps.inventory.models import Stock, StockMovement
from apps.purchases.models import PurchaseOrder, PurchaseItem
from apps.sales.models import Sale, SaleItem, Invoice, Payment
from apps.expenses.models import Expense


class DashboardSummaryView(APIView):
    """
    Get dashboard summary statistics for a tenant.
    This is the main dashboard view - answers critical business questions in <30 seconds.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Determine tenant and branch scope
        if user.is_platform_admin:
            tenant = request.query_params.get('tenant')
            if tenant:
                try:
                    tenant = Tenant.objects.get(id=tenant)
                except Tenant.DoesNotExist:
                    return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                tenant = Tenant.objects.filter(is_active=True).first()
                if not tenant:
                    return Response({'error': 'No tenant found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            tenant = user.tenant
            if not tenant:
                return Response({'error': 'No tenant associated with user'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Branch filter
        branch_id = None
        if not user.is_platform_admin and not user.is_tenant_admin and user.branch:
            branch_id = user.branch.id
        elif user.is_platform_admin:
            branch_id = request.query_params.get('branch')
        
        # Date ranges
        today = timezone.now().date()
        month_start = today.replace(day=1)
        year_start = today.replace(month=1, day=1)
        last_30_days = today - timedelta(days=30)
        
        # ============ Sales Data ============
        sales_queryset = Sale.objects.filter(
            tenant=tenant,
            status='completed',
            is_deleted=False
        )
        if branch_id:
            sales_queryset = sales_queryset.filter(branch_id=branch_id)
        
        # Today's sales
        today_sales = sales_queryset.filter(sale_date__date=today).aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        # Month sales
        month_sales = sales_queryset.filter(sale_date__date__gte=month_start).aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        # Year sales
        year_sales = sales_queryset.filter(sale_date__date__gte=year_start).aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        # Last 30 days sales
        last_30_sales = sales_queryset.filter(sale_date__date__gte=last_30_days).aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        # ============ Purchase Data ============
        purchase_queryset = PurchaseOrder.objects.filter(
            tenant=tenant,
            status='received',
            is_deleted=False
        )
        if branch_id:
            purchase_queryset = purchase_queryset.filter(branch_id=branch_id)
        
        # Month purchases
        month_purchases = purchase_queryset.filter(
            order_date__gte=month_start
        ).aggregate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        # ============ Stock Data ============
        stock_queryset = Stock.objects.filter(
            tenant=tenant,
            is_deleted=False
        )
        if branch_id:
            stock_queryset = stock_queryset.filter(branch_id=branch_id)
        
        stock_value = stock_queryset.aggregate(
            total_value=Sum(F('quantity') * F('average_cost'))
        )
        
        # Low stock items
        low_stock = stock_queryset.filter(
            quantity__lte=F('product__min_stock'),
            product__min_stock__gt=0
        ).count()
        
        # Out of stock items
        out_of_stock = stock_queryset.filter(quantity=0).count()
        
        # Total products in stock
        total_products_in_stock = stock_queryset.filter(quantity__gt=0).count()
        
        # ============ Customer Data (Receivables) ============
        customer_sales = Sale.objects.filter(
            tenant=tenant,
            status='completed',
            is_deleted=False
        ).values('customer').annotate(
            total_sales=Sum('total_amount')
        )
        
        customer_payments = Payment.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).values('customer').annotate(
            total_payments=Sum('amount')
        )
        
        total_receivable = Decimal('0')
        for sale in customer_sales:
            customer_id = sale['customer']
            total_sales = sale['total_sales'] or Decimal('0')
            total_paid = Decimal('0')
            for payment in customer_payments:
                if payment['customer'] == customer_id:
                    total_paid = payment['total_payments'] or Decimal('0')
                    break
            total_receivable += (total_sales - total_paid)
        
        # Outstanding invoices
        outstanding_invoices = Invoice.objects.filter(
            tenant=tenant,
            status__in=['sent', 'partially_paid', 'overdue'],
            is_deleted=False
        )
        if branch_id:
            outstanding_invoices = outstanding_invoices.filter(branch_id=branch_id)
        
        outstanding_total = outstanding_invoices.aggregate(
            total=Sum(F('total_amount') - F('paid_amount'))
        )
        
        overdue_invoices = outstanding_invoices.filter(
            due_date__lt=today,
            status__in=['sent', 'partially_paid']
        ).count()
        
        # ============ Supplier Data (Payables) ============
        supplier_purchases = PurchaseOrder.objects.filter(
            tenant=tenant,
            status='received',
            is_deleted=False
        ).values('supplier').annotate(
            total_purchases=Sum('total_amount')
        )
        
        supplier_payments = PurchaseOrder.objects.filter(
            tenant=tenant,
            status='received',
            is_deleted=False
        ).values('supplier').annotate(
            total_paid=Sum('paid_amount')
        )
        
        total_payable = Decimal('0')
        for purchase in supplier_purchases:
            supplier_id = purchase['supplier']
            total_purchases = purchase['total_purchases'] or Decimal('0')
            total_paid = Decimal('0')
            for payment in supplier_payments:
                if payment['supplier'] == supplier_id:
                    total_paid = payment['total_paid'] or Decimal('0')
                    break
            total_payable += (total_purchases - total_paid)
        
        # ============ Branch Performance ============
        branch_performance = []
        branches = Branch.objects.filter(tenant=tenant, is_active=True, is_deleted=False)
        
        for branch in branches:
            branch_sales = Sale.objects.filter(
                tenant=tenant,
                branch=branch,
                status='completed',
                is_deleted=False
            )
            
            branch_expenses = Expense.objects.filter(
                tenant=tenant,
                branch=branch,
                is_approved=True,
                is_deleted=False
            )
            
            branch_sales_total = branch_sales.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            branch_expenses_total = branch_expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0')
            branch_profit = branch_sales_total - branch_expenses_total
            
            branch_stock_value = Stock.objects.filter(
                tenant=tenant,
                branch=branch,
                is_deleted=False
            ).aggregate(
                total=Sum(F('quantity') * F('average_cost'))
            )['total'] or Decimal('0')
            
            branch_performance.append({
                'branch_id': str(branch.id),
                'branch_name': branch.name,
                'sales_total': float(branch_sales_total),
                'sales_count': branch_sales.count(),
                'expenses_total': float(branch_expenses_total),
                'profit': float(branch_profit),
                'stock_value': float(branch_stock_value)
            })
        
        branch_performance.sort(key=lambda x: x['profit'], reverse=True)
        
        # ============ Top Products ============
        sale_items_qs = SaleItem.objects.filter(
            sale__tenant=tenant,
            sale__status='completed',
            sale__is_deleted=False
        )
        if branch_id:
            sale_items_qs = sale_items_qs.filter(sale__branch_id=branch_id)
        
        # Use Python to calculate totals instead of ExpressionWrapper
        product_data = {}
        for item in sale_items_qs.select_related('product'):
            product_id = item.product_id
            if product_id not in product_data:
                product_data[product_id] = {
                    'product__id': product_id,
                    'product__name': item.product.name,
                    'product__sku': item.product.sku,
                    'total_quantity': 0,
                    'total_revenue': Decimal('0'),
                    'total_cost': Decimal('0'),
                }
            product_data[product_id]['total_quantity'] += item.quantity
            product_data[product_id]['total_revenue'] += item.total_price
            product_data[product_id]['total_cost'] += item.total_cost
        
        top_products = sorted(
            product_data.values(),
            key=lambda x: x['total_revenue'],
            reverse=True
        )[:10]
        
        for p in top_products:
            p['total_profit'] = p['total_revenue'] - p['total_cost']
        
        # ============ Top Customers ============
        top_customers_qs = Sale.objects.filter(
            tenant=tenant,
            status='completed',
            is_deleted=False
        )
        if branch_id:
            top_customers_qs = top_customers_qs.filter(branch_id=branch_id)
        
        top_customers = top_customers_qs.values('customer__id', 'customer__name', 'customer__phone').annotate(
            total_sales=Sum('total_amount'),
            total_paid=Sum('paid_amount'),
            count=Count('id')
        ).order_by('-total_sales')[:10]
        
        for customer in top_customers:
            customer['outstanding'] = (customer['total_sales'] or 0) - (customer['total_paid'] or 0)
        
        # ============ Daily Sales Chart Data (Last 30 Days) ============
        daily_sales = sales_queryset.filter(
            sale_date__date__gte=last_30_days
        ).annotate(
            day=TruncDate('sale_date')
        ).values('day').annotate(
            total=Sum('total_amount'),
            count=Count('id')
        ).order_by('day')
        
        # ============ Sales by Category ============
        category_data = {}
        category_items = sale_items_qs.select_related('product__category')
        for item in category_items:
            category_name = item.product.category.name if item.product.category else 'Sans catégorie'
            if category_name not in category_data:
                category_data[category_name] = {
                    'product__category__name': category_name,
                    'total_revenue': Decimal('0'),
                    'total_quantity': 0,
                    'total_cost': Decimal('0'),
                }
            category_data[category_name]['total_revenue'] += item.total_price
            category_data[category_name]['total_quantity'] += item.quantity
            category_data[category_name]['total_cost'] += item.total_cost
        
        category_sales = sorted(
            category_data.values(),
            key=lambda x: x['total_revenue'],
            reverse=True
        )
        
        for c in category_sales:
            c['total_profit'] = c['total_revenue'] - c['total_cost']
        
        # ============ Build Response ============
        response_data = {
            'commerce': {
                'today_sales': {
                    'total': float(today_sales['total'] or 0),
                    'count': today_sales['count'] or 0
                },
                'month_sales': {
                    'total': float(month_sales['total'] or 0),
                    'count': month_sales['count'] or 0
                },
                'year_sales': {
                    'total': float(year_sales['total'] or 0),
                    'count': year_sales['count'] or 0
                },
                'last_30_days_sales': {
                    'total': float(last_30_sales['total'] or 0),
                    'count': last_30_sales['count'] or 0
                },
                'month_purchases': {
                    'total': float(month_purchases['total'] or 0),
                    'count': month_purchases['count'] or 0
                }
            },
            'stock': {
                'total_value': float(stock_value['total_value'] or 0),
                'low_stock_items': low_stock,
                'out_of_stock_items': out_of_stock,
                'total_products_in_stock': total_products_in_stock,
                'daily_sales_chart': list(daily_sales)
            },
            'finances': {
                'customer_receivables': {
                    'total': float(total_receivable)
                },
                'supplier_payables': {
                    'total': float(total_payable)
                },
                'outstanding_invoices': {
                    'total': float(outstanding_total['total'] or 0),
                    'count': outstanding_invoices.count(),
                    'overdue_count': overdue_invoices
                }
            },
            'performance': {
                'top_products': top_products,
                'top_customers': list(top_customers),
                'best_branch': branch_performance[0] if branch_performance else None,
                'branch_performance': branch_performance,
                'category_sales': category_sales
            },
            'alerts': {
                'overdue_invoices': overdue_invoices,
                'low_stock': low_stock,
                'out_of_stock': out_of_stock,
                'pending_transfers': self.get_pending_transfers(tenant, branch_id)
            }
        }
        
        return Response(response_data)
    
    def get_pending_transfers(self, tenant, branch_id):
        """Get count of pending transfers"""
        from apps.inventory.models import Transfer
        
        transfers = Transfer.objects.filter(
            tenant=tenant,
            status__in=['requested', 'approved', 'dispatched'],
            is_deleted=False
        )
        
        if branch_id:
            transfers = transfers.filter(
                Q(from_branch_id=branch_id) | Q(to_branch_id=branch_id)
            )
        
        return transfers.count()


class SalesReportView(APIView):
    """
    Detailed sales report with filters.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Determine tenant
        if user.is_platform_admin:
            tenant_id = request.query_params.get('tenant')
            if tenant_id:
                try:
                    tenant = Tenant.objects.get(id=tenant_id)
                except Tenant.DoesNotExist:
                    return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'error': 'Platform admin must specify a tenant'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            tenant = user.tenant
            if not tenant:
                return Response({'error': 'No tenant associated with user'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Filters
        branch_id = request.query_params.get('branch')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        product_id = request.query_params.get('product')
        category_id = request.query_params.get('category')
        
        # Build queryset
        queryset = Sale.objects.filter(
            tenant=tenant,
            status='completed',
            is_deleted=False
        )
        
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        if start_date:
            queryset = queryset.filter(sale_date__date__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(sale_date__date__lte=end_date)
        
        if product_id:
            queryset = queryset.filter(items__product_id=product_id).distinct()
        
        if category_id:
            queryset = queryset.filter(items__product__category_id=category_id).distinct()
        
        # Aggregations - using correct field names
        sales_summary = queryset.aggregate(
            total_revenue=Sum('total_amount'),
            total_paid=Sum('paid_amount'),
            total_items=Sum('items__quantity'),
            count=Count('id')
        )
        
        # Get total revenue as Decimal
        total_revenue = sales_summary['total_revenue'] or Decimal('0')
        total_paid = sales_summary['total_paid'] or Decimal('0')
        
        # Calculate cost and profit from SaleItem
        sale_items = SaleItem.objects.filter(sale__in=queryset)
        
        # Get total cost and profit using separate aggregates
        total_cost = sale_items.aggregate(total=Sum('total_cost'))['total'] or Decimal('0')
        total_price = sale_items.aggregate(total=Sum('total_price'))['total'] or Decimal('0')
        total_profit = total_price - total_cost
        
        # Sales by day
        sales_by_day = queryset.annotate(
            day=TruncDate('sale_date')
        ).values('day').annotate(
            revenue=Sum('total_amount'),
            count=Count('id')
        ).order_by('day')
        
        # Sales by product - using Python
        product_data = {}
        for item in sale_items.select_related('product'):
            product_id_val = item.product_id
            if product_id_val not in product_data:
                product_data[product_id_val] = {
                    'product__id': product_id_val,
                    'product__name': item.product.name,
                    'product__sku': item.product.sku,
                    'total_quantity': 0,
                    'total_revenue': Decimal('0'),
                    'total_cost': Decimal('0'),
                }
            product_data[product_id_val]['total_quantity'] += item.quantity
            product_data[product_id_val]['total_revenue'] += item.total_price
            product_data[product_id_val]['total_cost'] += item.total_cost
        
        sales_by_product = []
        for p in product_data.values():
            p['total_profit'] = p['total_revenue'] - p['total_cost']
            sales_by_product.append(p)
        
        sales_by_product.sort(key=lambda x: x['total_revenue'], reverse=True)
        
        # Sales by branch
        sales_by_branch = queryset.values('branch__id', 'branch__name').annotate(
            revenue=Sum('total_amount'),
            count=Count('id')
        ).order_by('-revenue')
        
        # Add profit per branch
        for branch in sales_by_branch:
            branch_items = SaleItem.objects.filter(
                sale__in=queryset.filter(branch_id=branch['branch__id'])
            )
            branch_total_price = branch_items.aggregate(total=Sum('total_price'))['total'] or Decimal('0')
            branch_total_cost = branch_items.aggregate(total=Sum('total_cost'))['total'] or Decimal('0')
            branch['profit'] = float(branch_total_price - branch_total_cost)
        
        # Sales by payment method
        sales_by_payment = queryset.values('payment_method').annotate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        # Convert to float for JSON response
        total_revenue_float = float(total_revenue)
        total_paid_float = float(total_paid)
        
        return Response({
            'summary': {
                'total_revenue': total_revenue_float,
                'total_paid': total_paid_float,
                'total_outstanding': total_revenue_float - total_paid_float,
                'total_items': sales_summary['total_items'] or 0,
                'total_cost': float(total_cost),
                'total_profit': float(total_profit),
                'margin': float((total_profit / total_revenue * 100) if total_revenue > 0 else 0),
                'count': sales_summary['count'] or 0
            },
            'sales_by_day': list(sales_by_day),
            'sales_by_product': sales_by_product,
            'sales_by_branch': list(sales_by_branch),
            'sales_by_payment': list(sales_by_payment)
        })


class StockReportView(APIView):
    """
    Detailed stock report.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if user.is_platform_admin:
            tenant_id = request.query_params.get('tenant')
            if tenant_id:
                try:
                    tenant = Tenant.objects.get(id=tenant_id)
                except Tenant.DoesNotExist:
                    return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'error': 'Platform admin must specify a tenant'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            tenant = user.tenant
            if not tenant:
                return Response({'error': 'No tenant associated with user'}, status=status.HTTP_400_BAD_REQUEST)
        
        branch_id = request.query_params.get('branch')
        category_id = request.query_params.get('category')
        low_stock_only = request.query_params.get('low_stock_only', 'false').lower() == 'true'
        out_of_stock_only = request.query_params.get('out_of_stock_only', 'false').lower() == 'true'
        
        queryset = Stock.objects.filter(
            tenant=tenant,
            is_deleted=False
        )
        
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        if category_id:
            queryset = queryset.filter(product__category_id=category_id)
        
        if low_stock_only:
            queryset = queryset.filter(
                quantity__lte=F('product__min_stock'),
                product__min_stock__gt=0
            )
        
        if out_of_stock_only:
            queryset = queryset.filter(quantity=0)
        
        stock_summary = queryset.aggregate(
            total_quantity=Sum('quantity'),
            total_value=Sum(F('quantity') * F('average_cost')),
            total_products=Count('product', distinct=True)
        )
        
        stock_by_product = queryset.values(
            'product__id', 'product__name', 'product__sku',
            'product__min_stock', 'product__max_stock'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_value=Sum(F('quantity') * F('average_cost')),
            average_cost=Avg('average_cost'),
            branch_count=Count('branch', distinct=True)
        ).order_by('product__name')
        
        stock_by_branch = queryset.values('branch__id', 'branch__name').annotate(
            total_quantity=Sum('quantity'),
            total_value=Sum(F('quantity') * F('average_cost')),
            product_count=Count('product', distinct=True)
        ).order_by('-total_value')
        
        stock_by_category = queryset.values('product__category__name').annotate(
            total_quantity=Sum('quantity'),
            total_value=Sum(F('quantity') * F('average_cost')),
            product_count=Count('product', distinct=True)
        ).order_by('-total_value')
        
        return Response({
            'summary': {
                'total_quantity': stock_summary['total_quantity'] or 0,
                'total_value': float(stock_summary['total_value'] or 0),
                'total_products': stock_summary['total_products'] or 0
            },
            'stock_by_product': list(stock_by_product),
            'stock_by_branch': list(stock_by_branch),
            'stock_by_category': list(stock_by_category)
        })


class CustomerReportView(APIView):
    """
    Customer report with outstanding balances.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if user.is_platform_admin:
            tenant_id = request.query_params.get('tenant')
            if tenant_id:
                try:
                    tenant = Tenant.objects.get(id=tenant_id)
                except Tenant.DoesNotExist:
                    return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'error': 'Platform admin must specify a tenant'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            tenant = user.tenant
            if not tenant:
                return Response({'error': 'No tenant associated with user'}, status=status.HTTP_400_BAD_REQUEST)
        
        branch_id = request.query_params.get('branch')
        has_balance = request.query_params.get('has_balance', 'false').lower() == 'true'
        
        # Get customers
        customers = Customer.objects.filter(
            tenant=tenant,
            is_active=True,
            is_deleted=False
        )
        
        if branch_id:
            customers = customers.filter(sales__branch_id=branch_id).distinct()
        
        customer_data = []
        total_balance = Decimal('0')
        
        for customer in customers:
            # Calculate total sales for this customer
            total_sales = Sale.objects.filter(
                tenant=tenant,
                customer=customer,
                status='completed',
                is_deleted=False
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            
            # Calculate total payments for this customer
            total_paid = Payment.objects.filter(
                tenant=tenant,
                customer=customer,
                is_deleted=False
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            balance = total_sales - total_paid
            
            if has_balance and balance <= 0:
                continue
            
            total_balance += balance
            
            customer_data.append({
                'id': str(customer.id),
                'name': customer.name,
                'phone': customer.phone,
                'email': customer.email,
                'city': customer.city,
                'total_sales': float(total_sales),
                'total_paid': float(total_paid),
                'balance': float(balance),
                'invoice_count': Invoice.objects.filter(
                    tenant=tenant,
                    customer=customer,
                    status__in=['sent', 'partially_paid', 'overdue'],
                    is_deleted=False
                ).count()
            })
        
        # Sort by balance (highest first)
        customer_data.sort(key=lambda x: x['balance'], reverse=True)
        
        return Response({
            'summary': {
                'total_customers': len(customer_data),
                'total_balance': float(total_balance)
            },
            'customers': customer_data
        })


class SupplierReportView(APIView):
    """
    Supplier report with outstanding payables.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if user.is_platform_admin:
            tenant_id = request.query_params.get('tenant')
            if tenant_id:
                try:
                    tenant = Tenant.objects.get(id=tenant_id)
                except Tenant.DoesNotExist:
                    return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'error': 'Platform admin must specify a tenant'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            tenant = user.tenant
            if not tenant:
                return Response({'error': 'No tenant associated with user'}, status=status.HTTP_400_BAD_REQUEST)
        
        suppliers = Supplier.objects.filter(
            tenant=tenant,
            is_active=True,
            is_deleted=False
        )
        
        supplier_data = []
        total_payable = Decimal('0')
        
        for supplier in suppliers:
            total_purchases = PurchaseOrder.objects.filter(
                tenant=tenant,
                supplier=supplier,
                status='received',
                is_deleted=False
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            
            total_paid = PurchaseOrder.objects.filter(
                tenant=tenant,
                supplier=supplier,
                status='received',
                is_deleted=False
            ).aggregate(total=Sum('paid_amount'))['total'] or Decimal('0')
            
            payable = total_purchases - total_paid
            
            total_payable += payable
            
            supplier_data.append({
                'id': str(supplier.id),
                'name': supplier.name,
                'phone': supplier.phone,
                'email': supplier.email,
                'country': supplier.country,
                'contact_person': supplier.contact_person,
                'total_purchases': float(total_purchases),
                'total_paid': float(total_paid),
                'payable': float(payable),
                'purchase_count': PurchaseOrder.objects.filter(
                    tenant=tenant,
                    supplier=supplier,
                    status='received',
                    is_deleted=False
                ).count()
            })
        
        supplier_data.sort(key=lambda x: x['payable'], reverse=True)
        
        return Response({
            'summary': {
                'total_suppliers': len(supplier_data),
                'total_payable': float(total_payable)
            },
            'suppliers': supplier_data
        })


class ProfitabilityReportView(APIView):
    """
    Profitability report by product and branch.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if user.is_platform_admin:
            tenant_id = request.query_params.get('tenant')
            if tenant_id:
                try:
                    tenant = Tenant.objects.get(id=tenant_id)
                except Tenant.DoesNotExist:
                    return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'error': 'Platform admin must specify a tenant'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            tenant = user.tenant
            if not tenant:
                return Response({'error': 'No tenant associated with user'}, status=status.HTTP_400_BAD_REQUEST)
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        sales_qs = Sale.objects.filter(
            tenant=tenant,
            status='completed',
            is_deleted=False
        )
        
        if start_date:
            sales_qs = sales_qs.filter(sale_date__date__gte=start_date)
        
        if end_date:
            sales_qs = sales_qs.filter(sale_date__date__lte=end_date)
        
        # Profit by product - using Python
        sale_items = SaleItem.objects.filter(sale__in=sales_qs).select_related('product')
        
        product_data = {}
        for item in sale_items:
            product_id = item.product_id
            if product_id not in product_data:
                product_data[product_id] = {
                    'product__id': product_id,
                    'product__name': item.product.name,
                    'product__sku': item.product.sku,
                    'total_quantity': 0,
                    'total_revenue': Decimal('0'),
                    'total_cost': Decimal('0'),
                }
            product_data[product_id]['total_quantity'] += item.quantity
            product_data[product_id]['total_revenue'] += item.total_price
            product_data[product_id]['total_cost'] += item.total_cost
        
        product_profit_list = []
        for item in product_data.values():
            revenue = item['total_revenue']
            profit = revenue - item['total_cost']
            margin = (profit / revenue * 100) if revenue > 0 else 0
            product_profit_list.append({
                'product__id': item['product__id'],
                'product__name': item['product__name'],
                'product__sku': item['product__sku'],
                'total_quantity': item['total_quantity'],
                'total_revenue': float(revenue),
                'total_cost': float(item['total_cost']),
                'total_profit': float(profit),
                'avg_margin': float(margin),
            })
        
        product_profit_list.sort(key=lambda x: x['total_profit'], reverse=True)
        
        # Profit by branch
        branch_profit = sales_qs.values('branch__id', 'branch__name').annotate(
            total_revenue=Sum('total_amount'),
            sale_count=Count('id')
        ).order_by('-total_revenue')
        
        branch_profit_list = []
        for branch in branch_profit:
            branch_items = SaleItem.objects.filter(
                sale__in=sales_qs.filter(branch_id=branch['branch__id'])
            )
            branch_total_price = Decimal('0')
            branch_total_cost = Decimal('0')
            for item in branch_items:
                branch_total_price += item.total_price or Decimal('0')
                branch_total_cost += item.total_cost or Decimal('0')
            branch_total_profit = branch_total_price - branch_total_cost
            
            branch_profit_list.append({
                'branch__id': branch['branch__id'],
                'branch__name': branch['branch__name'],
                'total_revenue': float(branch['total_revenue'] or 0),
                'total_cost': float(branch_total_cost),
                'total_profit': float(branch_total_profit),
                'sale_count': branch['sale_count'],
            })
        
        # Overall summary
        total_revenue = Decimal('0')
        total_cost = Decimal('0')
        for item in sale_items:
            total_revenue += item.total_price or Decimal('0')
            total_cost += item.total_cost or Decimal('0')
        total_profit = total_revenue - total_cost
        sale_count = sales_qs.count()
        
        return Response({
            'summary': {
                'total_revenue': float(total_revenue),
                'total_cost': float(total_cost),
                'total_profit': float(total_profit),
                'margin': float((total_profit / total_revenue * 100) if total_revenue > 0 else 0),
                'sale_count': sale_count
            },
            'profit_by_product': product_profit_list,
            'profit_by_branch': branch_profit_list
        })