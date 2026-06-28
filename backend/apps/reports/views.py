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
                return Response({'error': 'Platform admin must specify a tenant'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            tenant = user.tenant
            if not tenant:
                return Response({'error': 'No tenant associated with user'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Branch filter
        branch_filter = {}
        if not user.is_platform_admin and not user.is_tenant_admin and user.branch:
            branch_filter = {'branch': user.branch}
        elif user.is_platform_admin:
            branch = request.query_params.get('branch')
            if branch:
                branch_filter = {'branch__id': branch}
        
        # Date ranges
        today = timezone.now().date()
        month_start = today.replace(day=1)
        year_start = today.replace(month=1, day=1)
        last_30_days = today - timedelta(days=30)
        
        # ============ Sales Data ============
        sales_queryset = Sale.objects.filter(
            tenant=tenant,
            status='completed',
            is_deleted=False,
            **branch_filter
        )
        
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
            is_deleted=False,
            **branch_filter
        )
        
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
        if branch_filter:
            stock_queryset = stock_queryset.filter(**branch_filter)
        
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
        customer_balance = Customer.objects.filter(
            tenant=tenant,
            is_active=True,
            is_deleted=False
        ).aggregate(
            total_receivable=Sum('sales__total_amount') - Sum('sales__paid_amount')
        )
        
        # Outstanding invoices
        outstanding_invoices = Invoice.objects.filter(
            tenant=tenant,
            status__in=['sent', 'partially_paid', 'overdue'],
            is_deleted=False
        )
        if branch_filter:
            outstanding_invoices = outstanding_invoices.filter(**branch_filter)
        
        outstanding_total = outstanding_invoices.aggregate(
            total=Sum(F('total_amount') - F('paid_amount'))
        )
        
        overdue_invoices = outstanding_invoices.filter(
            due_date__lt=today,
            status__in=['sent', 'partially_paid']
        ).count()
        
        # ============ Supplier Data (Payables) ============
        supplier_payable = Supplier.objects.filter(
            tenant=tenant,
            is_active=True,
            is_deleted=False
        ).aggregate(
            total_payable=Sum('purchases__total_amount') - Sum('purchases__paid_amount')
        )
        
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
            
            branch_sales_total = branch_sales.aggregate(total=Sum('total_amount'))['total'] or 0
            branch_expenses_total = branch_expenses.aggregate(total=Sum('amount'))['total'] or 0
            branch_profit = branch_sales_total - branch_expenses_total
            
            branch_stock_value = Stock.objects.filter(
                tenant=tenant,
                branch=branch,
                is_deleted=False
            ).aggregate(
                total=Sum(F('quantity') * F('average_cost'))
            )['total'] or 0
            
            branch_performance.append({
                'branch_id': str(branch.id),
                'branch_name': branch.name,
                'sales_total': float(branch_sales_total),
                'sales_count': branch_sales.count(),
                'expenses_total': float(branch_expenses_total),
                'profit': float(branch_profit),
                'stock_value': float(branch_stock_value)
            })
        
        # Sort by profit (best performing first)
        branch_performance.sort(key=lambda x: x['profit'], reverse=True)
        
        # ============ Top Products ============
        top_products = SaleItem.objects.filter(
            sale__tenant=tenant,
            sale__status='completed',
            sale__is_deleted=False,
            **branch_filter
        ).values('product__id', 'product__name', 'product__sku').annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total_price'),
            total_cost=Sum('total_cost'),
            total_profit=Sum('total_price') - Sum('total_cost')
        ).order_by('-total_revenue')[:10]
        
        # ============ Top Customers ============
        top_customers = Sale.objects.filter(
            tenant=tenant,
            status='completed',
            is_deleted=False,
            **branch_filter
        ).values('customer__id', 'customer__name', 'customer__phone').annotate(
            total_sales=Sum('total_amount'),
            total_paid=Sum('paid_amount'),
            count=Count('id')
        ).order_by('-total_sales')[:10]
        
        for customer in top_customers:
            customer['outstanding'] = customer['total_sales'] - customer['total_paid']
        
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
        category_sales = SaleItem.objects.filter(
            sale__tenant=tenant,
            sale__status='completed',
            sale__is_deleted=False,
            **branch_filter
        ).values('product__category__name').annotate(
            total_revenue=Sum('total_price'),
            total_quantity=Sum('quantity'),
            total_profit=Sum('total_price') - Sum('total_cost')
        ).order_by('-total_revenue')
        
        # ============ Build Response ============
        response_data = {
            # Commerce
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
            # Stock
            'stock': {
                'total_value': float(stock_value['total_value'] or 0),
                'low_stock_items': low_stock,
                'out_of_stock_items': out_of_stock,
                'total_products_in_stock': total_products_in_stock,
                'daily_sales_chart': list(daily_sales)
            },
            # Finances
            'finances': {
                'customer_receivables': {
                    'total': float(customer_balance['total_receivable'] or 0)
                },
                'supplier_payables': {
                    'total': float(supplier_payable['total_payable'] or 0)
                },
                'outstanding_invoices': {
                    'total': float(outstanding_total['total'] or 0),
                    'count': outstanding_invoices.count(),
                    'overdue_count': overdue_invoices
                }
            },
            # Performance
            'performance': {
                'top_products': list(top_products),
                'top_customers': list(top_customers),
                'best_branch': branch_performance[0] if branch_performance else None,
                'branch_performance': branch_performance,
                'category_sales': list(category_sales)
            },
            # Alert counts
            'alerts': {
                'overdue_invoices': overdue_invoices,
                'low_stock': low_stock,
                'out_of_stock': out_of_stock,
                'pending_transfers': self.get_pending_transfers(tenant, branch_filter)
            }
        }
        
        return Response(response_data)
    
    def get_pending_transfers(self, tenant, branch_filter):
        """Get count of pending transfers"""
        transfers = Transfer.objects.filter(
            tenant=tenant,
            status__in=['requested', 'approved', 'dispatched'],
            is_deleted=False
        )
        if branch_filter:
            transfers = transfers.filter(**branch_filter)
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
        
        # Aggregations
        sales_summary = queryset.aggregate(
            total_revenue=Sum('total_amount'),
            total_paid=Sum('paid_amount'),
            total_items=Sum('items__quantity'),
            total_cost=Sum('items__total_cost'),
            total_profit=Sum('items__total_price') - Sum('items__total_cost'),
            count=Count('id')
        )
        
        # Sales by day
        sales_by_day = queryset.annotate(
            day=TruncDate('sale_date')
        ).values('day').annotate(
            revenue=Sum('total_amount'),
            count=Count('id')
        ).order_by('day')
        
        # Sales by product
        sales_by_product = SaleItem.objects.filter(
            sale__in=queryset
        ).values(
            'product__id', 'product__name', 'product__sku'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total_price'),
            total_cost=Sum('total_cost'),
            total_profit=Sum('total_price') - Sum('total_cost')
        ).order_by('-total_revenue')
        
        # Sales by branch
        sales_by_branch = queryset.values('branch__id', 'branch__name').annotate(
            revenue=Sum('total_amount'),
            count=Count('id'),
            profit=Sum('items__total_price') - Sum('items__total_cost')
        ).order_by('-revenue')
        
        # Sales by payment method
        sales_by_payment = queryset.values('payment_method').annotate(
            total=Sum('total_amount'),
            count=Count('id')
        )
        
        return Response({
            'summary': {
                'total_revenue': float(sales_summary['total_revenue'] or 0),
                'total_paid': float(sales_summary['total_paid'] or 0),
                'total_outstanding': float(sales_summary['total_revenue'] or 0) - float(sales_summary['total_paid'] or 0),
                'total_items': sales_summary['total_items'] or 0,
                'total_cost': float(sales_summary['total_cost'] or 0),
                'total_profit': float(sales_summary['total_profit'] or 0),
                'margin': float((sales_summary['total_profit'] or 0) / (sales_summary['total_revenue'] or 1) * 100),
                'count': sales_summary['count'] or 0
            },
            'sales_by_day': list(sales_by_day),
            'sales_by_product': list(sales_by_product),
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
        category_id = request.query_params.get('category')
        low_stock_only = request.query_params.get('low_stock_only', 'false').lower() == 'true'
        out_of_stock_only = request.query_params.get('out_of_stock_only', 'false').lower() == 'true'
        
        # Build queryset
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
        
        # Aggregations
        stock_summary = queryset.aggregate(
            total_quantity=Sum('quantity'),
            total_value=Sum(F('quantity') * F('average_cost')),
            total_products=Count('product', distinct=True)
        )
        
        # Stock by product
        stock_by_product = queryset.values(
            'product__id', 'product__name', 'product__sku',
            'product__min_stock', 'product__max_stock'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_value=Sum(F('quantity') * F('average_cost')),
            average_cost=Avg('average_cost'),
            branch_count=Count('branch', distinct=True)
        ).order_by('product__name')
        
        # Stock by branch
        stock_by_branch = queryset.values('branch__id', 'branch__name').annotate(
            total_quantity=Sum('quantity'),
            total_value=Sum(F('quantity') * F('average_cost')),
            product_count=Count('product', distinct=True)
        ).order_by('-total_value')
        
        # Stock by category
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
        has_balance = request.query_params.get('has_balance', 'false').lower() == 'true'
        
        # Get customers
        customers = Customer.objects.filter(
            tenant=tenant,
            is_active=True,
            is_deleted=False
        )
        
        if branch_id:
            customers = customers.filter(sales__branch_id=branch_id).distinct()
        
        # Calculate balances
        customer_data = []
        total_balance = Decimal('0')
        
        for customer in customers:
            total_sales = Sale.objects.filter(
                tenant=tenant,
                customer=customer,
                status='completed',
                is_deleted=False
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
            
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
        
        # Get suppliers
        suppliers = Supplier.objects.filter(
            tenant=tenant,
            is_active=True,
            is_deleted=False
        )
        
        # Calculate payables
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
        
        # Sort by payable (highest first)
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
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Sales queryset
        sales_qs = Sale.objects.filter(
            tenant=tenant,
            status='completed',
            is_deleted=False
        )
        
        if start_date:
            sales_qs = sales_qs.filter(sale_date__date__gte=start_date)
        
        if end_date:
            sales_qs = sales_qs.filter(sale_date__date__lte=end_date)
        
        # Profit by product
        product_profit = SaleItem.objects.filter(
            sale__in=sales_qs
        ).values(
            'product__id', 'product__name', 'product__sku'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total_price'),
            total_cost=Sum('total_cost'),
            total_profit=Sum('total_price') - Sum('total_cost'),
            avg_margin=Avg((F('total_price') - F('total_cost')) / F('total_price')) * 100
        ).order_by('-total_profit')
        
        # Profit by branch
        branch_profit = sales_qs.values('branch__id', 'branch__name').annotate(
            total_revenue=Sum('total_amount'),
            total_cost=Sum('items__total_cost'),
            total_profit=Sum('items__total_price') - Sum('items__total_cost'),
            sale_count=Count('id')
        ).order_by('-total_profit')
        
        # Overall summary
        summary = sales_qs.aggregate(
            total_revenue=Sum('total_amount'),
            total_cost=Sum('items__total_cost'),
            total_profit=Sum('items__total_price') - Sum('items__total_cost'),
            sale_count=Count('id')
        )
        
        return Response({
            'summary': {
                'total_revenue': float(summary['total_revenue'] or 0),
                'total_cost': float(summary['total_cost'] or 0),
                'total_profit': float(summary['total_profit'] or 0),
                'margin': float((summary['total_profit'] or 0) / (summary['total_revenue'] or 1) * 100),
                'sale_count': summary['sale_count'] or 0
            },
            'profit_by_product': list(product_profit),
            'profit_by_branch': list(branch_profit)
        })