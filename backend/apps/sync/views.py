from decimal import Decimal

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist
from django_filters.rest_framework import DjangoFilterBackend  # Add this import
import uuid
import json
from datetime import datetime, timedelta

from apps.tenants.models import Tenant
from apps.branches.models import Branch
from apps.catalog.models import Category, Brand, Unit, Product
from apps.partners.models import Supplier, Customer
from apps.inventory.models import Stock, StockMovement, Transfer, TransferItem
from apps.purchases.models import PurchaseOrder, PurchaseItem
from apps.sales.models import Sale, SaleItem, Invoice, Payment
from apps.expenses.models import ExpenseCategory, Expense
from .models import SyncLog, PendingOperation
from .serializers import (
    SyncLogSerializer,
    PendingOperationSerializer,
    PullSyncRequestSerializer,
    PushSyncRequestSerializer
)


# ============ Pull Sync View ============

class PullSyncView(APIView):
    """
    Pull changes from the server since the last sync timestamp.
    This is the main sync endpoint for downloading data to the client.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Determine tenant
        if user.is_platform_admin:
            tenant_id = request.data.get('tenant')
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
        
        # Validate request
        serializer = PullSyncRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        last_sync = serializer.validated_data['last_sync_timestamp']
        branch_id = serializer.validated_data.get('branch_id')
        models_to_pull = serializer.validated_data.get('models', [])
        
        # Create sync log
        sync_log = SyncLog.objects.create(
            tenant=tenant,
            branch_id=branch_id,
            user=user,
            sync_type='pull',
            status='processing',
            client_version=request.data.get('client_version', ''),
            device_id=request.data.get('device_id', ''),
            device_name=request.data.get('device_name', ''),
            started_at=timezone.now()
        )
        
        try:
            # Base filter for all models
            base_filter = {'tenant': tenant, 'is_deleted': False}
            if branch_id:
                base_filter['branch_id'] = branch_id
            
            # Filter for changes since last sync
            sync_filter = base_filter.copy()
            sync_filter['updated_at__gt'] = last_sync
            
            # If no specific models requested, pull all
            if not models_to_pull:
                models_to_pull = ['all']
            
            data = {}
            deleted_ids = {}
            
            # Helper function to get queryset with proper filtering
            def get_queryset(model, filter_dict, only_updated=True):
                qs = model.objects.filter(**filter_dict)
                if only_updated and 'updated_at__gt' in filter_dict:
                    qs = qs.filter(updated_at__gt=last_sync)
                return qs
            
            # Pull catalog models
            if 'all' in models_to_pull or 'category' in models_to_pull:
                data['categories'] = list(get_queryset(Category, {'tenant': tenant, 'is_deleted': False}).values())
            
            if 'all' in models_to_pull or 'brand' in models_to_pull:
                data['brands'] = list(get_queryset(Brand, {'tenant': tenant, 'is_deleted': False}).values())
            
            if 'all' in models_to_pull or 'unit' in models_to_pull:
                data['units'] = list(get_queryset(Unit, {'tenant': tenant, 'is_deleted': False}).values())
            
            if 'all' in models_to_pull or 'product' in models_to_pull:
                data['products'] = list(get_queryset(Product, {'tenant': tenant, 'is_deleted': False}).values())
            
            # Pull partner models
            if 'all' in models_to_pull or 'supplier' in models_to_pull:
                data['suppliers'] = list(get_queryset(Supplier, {'tenant': tenant, 'is_deleted': False}).values())
            
            if 'all' in models_to_pull or 'customer' in models_to_pull:
                data['customers'] = list(get_queryset(Customer, {'tenant': tenant, 'is_deleted': False}).values())
            
            # Pull inventory models
            if 'all' in models_to_pull or 'stock' in models_to_pull:
                stock_filter = {'tenant': tenant, 'is_deleted': False}
                if branch_id:
                    stock_filter['branch_id'] = branch_id
                data['stock'] = list(Stock.objects.filter(**stock_filter).values())
            
            if 'all' in models_to_pull or 'transfer' in models_to_pull:
                transfer_filter = {'tenant': tenant, 'is_deleted': False}
                if branch_id:
                    transfer_filter = Q(from_branch_id=branch_id) | Q(to_branch_id=branch_id)
                data['transfers'] = list(Transfer.objects.filter(transfer_filter).values())
                data['transfer_items'] = list(TransferItem.objects.filter(
                    transfer__tenant=tenant,
                    is_deleted=False
                ).values())
            
            # Pull sales models
            if 'all' in models_to_pull or 'sale' in models_to_pull:
                sale_filter = {'tenant': tenant, 'is_deleted': False}
                if branch_id:
                    sale_filter['branch_id'] = branch_id
                data['sales'] = list(Sale.objects.filter(**sale_filter).values())
                data['sale_items'] = list(SaleItem.objects.filter(
                    sale__tenant=tenant,
                    is_deleted=False
                ).values())
            
            if 'all' in models_to_pull or 'invoice' in models_to_pull:
                invoice_filter = {'tenant': tenant, 'is_deleted': False}
                if branch_id:
                    invoice_filter['branch_id'] = branch_id
                data['invoices'] = list(Invoice.objects.filter(**invoice_filter).values())
            
            if 'all' in models_to_pull or 'payment' in models_to_pull:
                payment_filter = {'tenant': tenant, 'is_deleted': False}
                if branch_id:
                    payment_filter['branch_id'] = branch_id
                data['payments'] = list(Payment.objects.filter(**payment_filter).values())
            
            # Pull expense models
            if 'all' in models_to_pull or 'expense' in models_to_pull:
                expense_filter = {'tenant': tenant, 'is_deleted': False}
                if branch_id:
                    expense_filter['branch_id'] = branch_id
                data['expenses'] = list(Expense.objects.filter(**expense_filter).values())
                data['expense_categories'] = list(ExpenseCategory.objects.filter(
                    tenant=tenant,
                    is_deleted=False
                ).values())
            
            # Pull purchase models (with branch filtering)
            if 'all' in models_to_pull or 'purchase' in models_to_pull:
                purchase_filter = {'tenant': tenant, 'is_deleted': False}
                if branch_id:
                    purchase_filter['branch_id'] = branch_id
                data['purchases'] = list(PurchaseOrder.objects.filter(**purchase_filter).values())
                data['purchase_items'] = list(PurchaseItem.objects.filter(
                    purchase_order__tenant=tenant,
                    is_deleted=False
                ).values())
            
            # Get deleted IDs (soft deleted records)
            def get_deleted_ids(model, filter_dict):
                return list(model.objects.filter(
                    tenant=tenant,
                    is_deleted=True,
                    updated_at__gt=last_sync
                ).values_list('id', flat=True))
            
            deleted_ids['categories'] = get_deleted_ids(Category, {})
            deleted_ids['brands'] = get_deleted_ids(Brand, {})
            deleted_ids['units'] = get_deleted_ids(Unit, {})
            deleted_ids['products'] = get_deleted_ids(Product, {})
            deleted_ids['suppliers'] = get_deleted_ids(Supplier, {})
            deleted_ids['customers'] = get_deleted_ids(Customer, {})
            
            # Update sync log
            sync_log.status = 'completed'
            sync_log.completed_at = timezone.now()
            sync_log.records_pulled = sum(len(v) for v in data.values())
            sync_log.save()
            
            return Response({
                'status': 'success',
                'last_sync_timestamp': timezone.now().isoformat(),
                'data': data,
                'deleted_ids': deleted_ids,
                'sync_log_id': str(sync_log.id)
            })
            
        except Exception as e:
            sync_log.status = 'failed'
            sync_log.error_message = str(e)
            sync_log.completed_at = timezone.now()
            sync_log.save()
            
            return Response({
                'status': 'error',
                'message': str(e),
                'sync_log_id': str(sync_log.id)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============ Push Sync View ============

class PushSyncView(APIView):
    """
    Push pending operations from the client to the server.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Determine tenant
        if user.is_platform_admin:
            tenant_id = request.data.get('tenant')
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
        
        # Validate request
        serializer = PushSyncRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        operations = serializer.validated_data['operations']
        
        # Create sync log
        sync_log = SyncLog.objects.create(
            tenant=tenant,
            branch=user.branch,
            user=user,
            sync_type='push',
            status='processing',
            client_version=request.data.get('client_version', ''),
            device_id=request.data.get('device_id', ''),
            device_name=request.data.get('device_name', ''),
            started_at=timezone.now()
        )
        
        successful = []
        failed = []
        conflicts = []
        
        for operation_data in operations:
            client_mutation_id = operation_data.get('client_mutation_id')
            
            # Check for duplicate (idempotency)
            if PendingOperation.objects.filter(
                client_mutation_id=client_mutation_id,
                status='completed'
            ).exists():
                # Already processed, skip
                successful.append({
                    'client_mutation_id': client_mutation_id,
                    'message': 'Already processed'
                })
                continue
            
            operation_type = operation_data.get('operation_type')
            data = operation_data.get('data', {})
            
            try:
                # Process the operation based on type
                result = self.process_operation(
                    operation_type=operation_type,
                    data=data,
                    tenant=tenant,
                    user=user,
                    client_mutation_id=client_mutation_id
                )
                
                successful.append({
                    'client_mutation_id': client_mutation_id,
                    'server_id': result.get('server_id'),
                    'message': 'Success'
                })
                
                # Mark as processed in pending operations
                PendingOperation.objects.create(
                    tenant=tenant,
                    branch=user.branch,
                    user=user,
                    operation_type=operation_type,
                    operation_id=operation_data.get('operation_id'),
                    client_mutation_id=client_mutation_id,
                    data=data,
                    status='completed',
                    created_at_local=operation_data.get('created_at'),
                    processed_at=timezone.now(),
                    server_response=result
                )
                
            except Exception as e:
                failed.append({
                    'client_mutation_id': client_mutation_id,
                    'error': str(e)
                })
                
                # Save failed operation
                PendingOperation.objects.create(
                    tenant=tenant,
                    branch=user.branch,
                    user=user,
                    operation_type=operation_type,
                    operation_id=operation_data.get('operation_id'),
                    client_mutation_id=client_mutation_id,
                    data=data,
                    status='failed',
                    created_at_local=operation_data.get('created_at'),
                    error_message=str(e),
                    attempt_count=1
                )
        
        # Update sync log
        sync_log.status = 'completed'
        sync_log.completed_at = timezone.now()
        sync_log.records_pushed = len(successful)
        sync_log.records_failed = len(failed)
        sync_log.save()
        
        return Response({
            'status': 'success',
            'successful': successful,
            'failed': failed,
            'conflicts': conflicts,
            'sync_log_id': str(sync_log.id)
        })
    
    def process_operation(self, operation_type, data, tenant, user, client_mutation_id):
        """
        Process a specific operation type.
        This is where the business logic for each operation is implemented.
        """
        from django.db import transaction as db_transaction
        
        with db_transaction.atomic():
            if operation_type == 'sale':
                return self.process_sale(data, tenant, user, client_mutation_id)
            elif operation_type == 'payment':
                return self.process_payment(data, tenant, user, client_mutation_id)
            elif operation_type == 'expense':
                return self.process_expense(data, tenant, user, client_mutation_id)
            elif operation_type == 'customer':
                return self.process_customer(data, tenant, user, client_mutation_id)
            elif operation_type == 'supplier':
                return self.process_supplier(data, tenant, user, client_mutation_id)
            elif operation_type == 'product':
                return self.process_product(data, tenant, user, client_mutation_id)
            elif operation_type == 'stock_adjustment':
                return self.process_stock_adjustment(data, tenant, user, client_mutation_id)
            elif operation_type == 'transfer':
                return self.process_transfer(data, tenant, user, client_mutation_id)
            elif operation_type == 'purchase':
                return self.process_purchase(data, tenant, user, client_mutation_id)
            else:
                raise ValueError(f"Unknown operation type: {operation_type}")
    
    def process_sale(self, data, tenant, user, client_mutation_id):
        """Process a sale created offline"""
        from apps.sales.models import Sale, SaleItem, Invoice, Payment
        from apps.inventory.models import Stock, StockMovement
        from apps.branches.models import Branch
        from apps.catalog.models import Product
        from apps.partners.models import Customer
        
        # Validate branch belongs to tenant
        branch_id = data.get('branch')
        try:
            branch = Branch.objects.get(id=branch_id, tenant=tenant)
        except Branch.DoesNotExist:
            raise ValueError(f"Branch {branch_id} not found or does not belong to tenant")
        
        # Validate customer if provided
        customer_id = data.get('customer')
        customer = None
        if customer_id:
            try:
                customer = Customer.objects.get(id=customer_id, tenant=tenant)
            except Customer.DoesNotExist:
                raise ValueError(f"Customer {customer_id} not found or does not belong to tenant")
        
        # Process sale items
        items = data.get('items', [])
        if not items:
            raise ValueError("Sale must have at least one item")
        
        # Create sale
        from decimal import Decimal
        import random
        from datetime import datetime
        
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        sale_number = f"SA-{timestamp}-{random_num}"
        
        subtotal = Decimal('0')
        total_cost = Decimal('0')
        
        sale = Sale.objects.create(
            tenant=tenant,
            branch=branch,
            customer=customer,
            sale_number=sale_number,
            status='completed',
            created_by=user,
            payment_method=data.get('payment_method', 'cash'),
            currency=data.get('currency', 'USD'),
            exchange_rate=Decimal(str(data.get('exchange_rate', 1.0))),
            notes=data.get('notes', '')
        )
        
        processed_items = []
        
        for item_data in items:
            product_id = item_data.get('product')
            try:
                product = Product.objects.get(id=product_id, tenant=tenant)
            except Product.DoesNotExist:
                raise ValueError(f"Product {product_id} not found or does not belong to tenant")
            
            quantity = int(item_data.get('quantity', 0))
            unit_price = Decimal(str(item_data.get('unit_price', 0)))
            
            if quantity <= 0 or unit_price <= 0:
                raise ValueError(f"Invalid quantity or price for product {product.name}")
            
            # Get cost from stock
            try:
                stock = Stock.objects.get(tenant=tenant, branch=branch, product=product)
                unit_cost = stock.average_cost
            except Stock.DoesNotExist:
                unit_cost = product.purchase_price
            
            item_total = quantity * unit_price
            item_cost = quantity * unit_cost
            
            subtotal += item_total
            total_cost += item_cost
            
            # Create sale item
            SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                total_price=item_total,
                unit_cost=unit_cost,
                total_cost=item_cost
            )
            
            processed_items.append({
                'product': product,
                'quantity': quantity,
                'unit_cost': unit_cost
            })
        
        # Update sale totals
        sale.subtotal = subtotal
        sale.total_amount = subtotal
        sale.save()
        
        # Update stock
        for item in processed_items:
            stock = Stock.objects.get(tenant=tenant, branch=branch, product=item['product'])
            stock.quantity -= item['quantity']
            stock.save()
            
            StockMovement.objects.create(
                tenant=tenant,
                branch=branch,
                product=item['product'],
                quantity=item['quantity'],
                movement_type='out',
                unit_cost=item['unit_cost'],
                total_cost=item['quantity'] * item['unit_cost'],
                reference=sale.sale_number,
                notes=f"Offline sale: {sale_number}",
                created_by=user
            )
        
        # Create invoice
        invoice_number = f"INV-{timestamp}-{random_num}"
        Invoice.objects.create(
            tenant=tenant,
            sale=sale,
            branch=branch,
            customer=customer,
            invoice_number=invoice_number,
            due_date=timezone.now().date() + timedelta(days=30),
            total_amount=subtotal,
            status='sent'
        )
        
        # Handle payment if paid
        paid_amount = Decimal(str(data.get('paid_amount', 0)))
        if paid_amount > 0:
            payment_number = f"PAY-{timestamp}-{random_num}"
            Payment.objects.create(
                tenant=tenant,
                branch=branch,
                sale=sale,
                customer=customer,
                payment_number=payment_number,
                amount=paid_amount,
                payment_method=data.get('payment_method', 'cash'),
                received_by=user,
                notes="Payment from offline sale"
            )
            sale.paid_amount = paid_amount
            sale.save()
        
        return {
            'server_id': str(sale.id),
            'sale_number': sale.sale_number,
            'total_amount': float(subtotal)
        }
    
    def process_payment(self, data, tenant, user, client_mutation_id):
        """Process a payment created offline"""
        from apps.sales.models import Sale, Payment
        
        sale_id = data.get('sale')
        try:
            sale = Sale.objects.get(id=sale_id, tenant=tenant)
        except Sale.DoesNotExist:
            raise ValueError(f"Sale {sale_id} not found or does not belong to tenant")
        
        import random
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        payment_number = f"PAY-{timestamp}-{random_num}"
        
        payment = Payment.objects.create(
            tenant=tenant,
            branch=sale.branch,
            sale=sale,
            customer=sale.customer,
            payment_number=payment_number,
            amount=Decimal(str(data.get('amount', 0))),
            payment_method=data.get('payment_method', 'cash'),
            received_by=user,
            reference=data.get('reference', ''),
            notes=data.get('notes', '')
        )
        
        # Update sale paid amount
        sale.paid_amount += payment.amount
        sale.save()
        
        # Update invoice if exists
        if hasattr(sale, 'invoice'):
            sale.invoice.paid_amount = sale.paid_amount
            sale.invoice.save()
        
        return {
            'server_id': str(payment.id),
            'payment_number': payment.payment_number
        }
    
    def process_expense(self, data, tenant, user, client_mutation_id):
        """Process an expense created offline"""
        from apps.expenses.models import Expense, ExpenseCategory
        from apps.branches.models import Branch
        
        branch_id = data.get('branch')
        try:
            branch = Branch.objects.get(id=branch_id, tenant=tenant)
        except Branch.DoesNotExist:
            raise ValueError(f"Branch {branch_id} not found or does not belong to tenant")
        
        category_id = data.get('category')
        category = None
        if category_id:
            try:
                category = ExpenseCategory.objects.get(id=category_id, tenant=tenant)
            except ExpenseCategory.DoesNotExist:
                raise ValueError(f"Category {category_id} not found or does not belong to tenant")
        
        import random
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        expense_number = f"EXP-{timestamp}-{random_num}"
        
        expense = Expense.objects.create(
            tenant=tenant,
            branch=branch,
            category=category,
            expense_number=expense_number,
            amount=Decimal(str(data.get('amount', 0))),
            description=data.get('description', ''),
            notes=data.get('notes', ''),
            currency=data.get('currency', 'USD'),
            exchange_rate=Decimal(str(data.get('exchange_rate', 1.0))),
            is_approved=False,
            created_by=user
        )
        
        return {
            'server_id': str(expense.id),
            'expense_number': expense.expense_number
        }
    
    def process_customer(self, data, tenant, user, client_mutation_id):
        """Process a customer created offline"""
        from apps.partners.models import Customer
        
        # Check if customer already exists
        if data.get('id'):
            try:
                customer = Customer.objects.get(id=data['id'], tenant=tenant)
                # Update existing customer
                customer.name = data.get('name', customer.name)
                customer.phone = data.get('phone', customer.phone)
                customer.email = data.get('email', customer.email)
                customer.address = data.get('address', customer.address)
                customer.city = data.get('city', customer.city)
                customer.save()
                return {'server_id': str(customer.id), 'updated': True}
            except Customer.DoesNotExist:
                pass
        
        # Create new customer
        customer = Customer.objects.create(
            tenant=tenant,
            id=data.get('id', uuid.uuid4()),
            name=data.get('name'),
            phone=data.get('phone', ''),
            email=data.get('email', ''),
            address=data.get('address', ''),
            city=data.get('city', ''),
            gender=data.get('gender', ''),
            is_active=True
        )
        
        return {'server_id': str(customer.id), 'created': True}
    
    def process_supplier(self, data, tenant, user, client_mutation_id):
        """Process a supplier created offline"""
        from apps.partners.models import Supplier
        
        # Check if supplier already exists
        if data.get('id'):
            try:
                supplier = Supplier.objects.get(id=data['id'], tenant=tenant)
                # Update existing supplier
                supplier.name = data.get('name', supplier.name)
                supplier.phone = data.get('phone', supplier.phone)
                supplier.email = data.get('email', supplier.email)
                supplier.address = data.get('address', supplier.address)
                supplier.country = data.get('country', supplier.country)
                supplier.city = data.get('city', supplier.city)
                supplier.save()
                return {'server_id': str(supplier.id), 'updated': True}
            except Supplier.DoesNotExist:
                pass
        
        # Create new supplier
        supplier = Supplier.objects.create(
            tenant=tenant,
            id=data.get('id', uuid.uuid4()),
            name=data.get('name'),
            phone=data.get('phone', ''),
            email=data.get('email', ''),
            address=data.get('address', ''),
            country=data.get('country', ''),
            city=data.get('city', ''),
            contact_person=data.get('contact_person', ''),
            contact_phone=data.get('contact_phone', ''),
            is_active=True
        )
        
        return {'server_id': str(supplier.id), 'created': True}
    
    def process_product(self, data, tenant, user, client_mutation_id):
        """Process a product created offline"""
        from apps.catalog.models import Product, Category, Brand, Unit
        
        # Check if product already exists
        if data.get('id'):
            try:
                product = Product.objects.get(id=data['id'], tenant=tenant)
                # Update existing product
                product.name = data.get('name', product.name)
                product.sku = data.get('sku', product.sku)
                product.barcode = data.get('barcode', product.barcode)
                product.purchase_price = Decimal(str(data.get('purchase_price', 0)))
                product.sale_price = Decimal(str(data.get('sale_price', 0)))
                product.save()
                return {'server_id': str(product.id), 'updated': True}
            except Product.DoesNotExist:
                pass
        
        # Get or create category
        category = None
        if data.get('category_id'):
            try:
                category = Category.objects.get(id=data['category_id'], tenant=tenant)
            except Category.DoesNotExist:
                pass
        
        # Get or create brand
        brand = None
        if data.get('brand_id'):
            try:
                brand = Brand.objects.get(id=data['brand_id'], tenant=tenant)
            except Brand.DoesNotExist:
                pass
        
        # Get or create unit
        unit = None
        if data.get('unit_id'):
            try:
                unit = Unit.objects.get(id=data['unit_id'], tenant=tenant)
            except Unit.DoesNotExist:
                pass
        
        # Create new product
        product = Product.objects.create(
            tenant=tenant,
            id=data.get('id', uuid.uuid4()),
            name=data.get('name'),
            sku=data.get('sku'),
            barcode=data.get('barcode', ''),
            category=category,
            brand=brand,
            unit=unit,
            purchase_price=Decimal(str(data.get('purchase_price', 0))),
            sale_price=Decimal(str(data.get('sale_price', 0))),
            min_price=Decimal(str(data.get('min_price', 0))),
            description=data.get('description', ''),
            is_active=True
        )
        
        return {'server_id': str(product.id), 'created': True}
    
    def process_stock_adjustment(self, data, tenant, user, client_mutation_id):
        """Process a stock adjustment created offline"""
        from apps.inventory.models import Stock, StockMovement, InventoryAdjustment
        from apps.branches.models import Branch
        from apps.catalog.models import Product
        
        branch_id = data.get('branch')
        try:
            branch = Branch.objects.get(id=branch_id, tenant=tenant)
        except Branch.DoesNotExist:
            raise ValueError(f"Branch {branch_id} not found or does not belong to tenant")
        
        product_id = data.get('product')
        try:
            product = Product.objects.get(id=product_id, tenant=tenant)
        except Product.DoesNotExist:
            raise ValueError(f"Product {product_id} not found or does not belong to tenant")
        
        adjustment_type = data.get('adjustment_type')
        quantity = int(data.get('quantity', 0))
        
        if adjustment_type not in ['increase', 'decrease']:
            raise ValueError(f"Invalid adjustment type: {adjustment_type}")
        
        # Get current stock
        stock, created = Stock.objects.get_or_create(
            tenant=tenant,
            branch=branch,
            product=product,
            defaults={'quantity': 0, 'average_cost': 0}
        )
        
        old_quantity = stock.quantity
        
        if adjustment_type == 'increase':
            new_quantity = old_quantity + quantity
        else:
            new_quantity = old_quantity - quantity
            if new_quantity < 0:
                raise ValueError(f"Cannot decrease below zero for {product.name}")
        
        # Create adjustment
        adjustment = InventoryAdjustment.objects.create(
            tenant=tenant,
            branch=branch,
            product=product,
            adjustment_type=adjustment_type,
            quantity=quantity,
            old_quantity=old_quantity,
            new_quantity=new_quantity,
            reason=data.get('reason', 'Offline adjustment'),
            created_by=user,
            is_approved=True  # Auto-approve for offline
        )
        
        # Update stock
        stock.quantity = new_quantity
        stock.save()
        
        # Create stock movement
        StockMovement.objects.create(
            tenant=tenant,
            branch=branch,
            product=product,
            quantity=quantity,
            movement_type='adjustment',
            reference=adjustment.id,
            notes=f"Offline adjustment: {adjustment.reason}",
            created_by=user
        )
        
        return {
            'server_id': str(adjustment.id),
            'adjustment_type': adjustment_type,
            'new_quantity': new_quantity
        }
    
    def process_transfer(self, data, tenant, user, client_mutation_id):
        """Process a transfer created offline"""
        from apps.inventory.models import Transfer, TransferItem, Stock, StockMovement
        from apps.branches.models import Branch
        from apps.catalog.models import Product
        
        from_branch_id = data.get('from_branch')
        try:
            from_branch = Branch.objects.get(id=from_branch_id, tenant=tenant)
        except Branch.DoesNotExist:
            raise ValueError(f"Source branch {from_branch_id} not found or does not belong to tenant")
        
        to_branch_id = data.get('to_branch')
        try:
            to_branch = Branch.objects.get(id=to_branch_id, tenant=tenant)
        except Branch.DoesNotExist:
            raise ValueError(f"Destination branch {to_branch_id} not found or does not belong to tenant")
        
        import random
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        transfer_number = f"TR-{timestamp}-{random_num}"
        
        # Create transfer
        transfer = Transfer.objects.create(
            tenant=tenant,
            from_branch=from_branch,
            to_branch=to_branch,
            transfer_number=transfer_number,
            status='requested',
            notes=data.get('notes', ''),
            requested_by=user
        )
        
        # Process items
        items = data.get('items', [])
        for item_data in items:
            product_id = item_data.get('product')
            try:
                product = Product.objects.get(id=product_id, tenant=tenant)
            except Product.DoesNotExist:
                raise ValueError(f"Product {product_id} not found or does not belong to tenant")
            
            quantity = int(item_data.get('quantity', 0))
            if quantity <= 0:
                raise ValueError(f"Invalid quantity for product {product.name}")
            
            # Get unit cost
            try:
                stock = Stock.objects.get(tenant=tenant, branch=from_branch, product=product)
                unit_cost = stock.average_cost
            except Stock.DoesNotExist:
                unit_cost = product.purchase_price
            
            TransferItem.objects.create(
                transfer=transfer,
                product=product,
                quantity=quantity,
                unit_cost=unit_cost,
                total_cost=quantity * unit_cost
            )
        
        return {
            'server_id': str(transfer.id),
            'transfer_number': transfer.transfer_number,
            'status': 'requested'
        }
    
    def process_purchase(self, data, tenant, user, client_mutation_id):
        """Process a purchase created offline"""
        from apps.purchases.models import PurchaseOrder, PurchaseItem
        from apps.partners.models import Supplier
        from apps.branches.models import Branch
        from apps.catalog.models import Product
        
        supplier_id = data.get('supplier')
        try:
            supplier = Supplier.objects.get(id=supplier_id, tenant=tenant)
        except Supplier.DoesNotExist:
            raise ValueError(f"Supplier {supplier_id} not found or does not belong to tenant")
        
        branch_id = data.get('branch')
        try:
            branch = Branch.objects.get(id=branch_id, tenant=tenant)
        except Branch.DoesNotExist:
            raise ValueError(f"Branch {branch_id} not found or does not belong to tenant")
        
        import random
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        order_number = f"PO-{timestamp}-{random_num}"
        
        # Create purchase order
        purchase = PurchaseOrder.objects.create(
            tenant=tenant,
            branch=branch,
            supplier=supplier,
            order_number=order_number,
            status='draft',
            currency=data.get('currency', 'USD'),
            exchange_rate=Decimal(str(data.get('exchange_rate', 1.0))),
            notes=data.get('notes', '')
        )
        
        # Process items
        subtotal = Decimal('0')
        items = data.get('items', [])
        for item_data in items:
            product_id = item_data.get('product')
            try:
                product = Product.objects.get(id=product_id, tenant=tenant)
            except Product.DoesNotExist:
                raise ValueError(f"Product {product_id} not found or does not belong to tenant")
            
            quantity = int(item_data.get('quantity', 0))
            unit_price = Decimal(str(item_data.get('unit_price', 0)))
            
            if quantity <= 0 or unit_price <= 0:
                raise ValueError(f"Invalid quantity or price for product {product.name}")
            
            item_total = quantity * unit_price
            subtotal += item_total
            
            PurchaseItem.objects.create(
                purchase_order=purchase,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                total_price=item_total
            )
        
        # Update purchase totals
        purchase.subtotal = subtotal
        purchase.total_amount = subtotal
        purchase.save()
        
        return {
            'server_id': str(purchase.id),
            'order_number': purchase.order_number,
            'status': 'draft'
        }


# ============ Sync Status View ============

class SyncStatusView(APIView):
    """
    Get sync status and pending operations count.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        if user.is_platform_admin:
            return Response({
                'error': 'Platform admin cannot check sync status for a specific tenant'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        pending_count = PendingOperation.objects.filter(
            tenant=user.tenant,
            status='pending',
            is_deleted=False
        ).count()
        
        failed_count = PendingOperation.objects.filter(
            tenant=user.tenant,
            status='failed',
            is_deleted=False
        ).count()
        
        last_sync = SyncLog.objects.filter(
            tenant=user.tenant,
            status='completed'
        ).order_by('-started_at').first()
        
        return Response({
            'pending_operations': pending_count,
            'failed_operations': failed_count,
            'last_sync': {
                'timestamp': last_sync.started_at if last_sync else None,
                'records_pulled': last_sync.records_pulled if last_sync else 0,
                'records_pushed': last_sync.records_pushed if last_sync else 0
            } if last_sync else None
        })


# ============ Sync Log Views ============

class SyncLogListView(generics.ListAPIView):
    """
    List sync logs for auditing.
    """
    serializer_class = SyncLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'sync_type']

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return SyncLog.objects.all()
        if user.tenant:
            return SyncLog.objects.filter(tenant=user.tenant, is_deleted=False)
        return SyncLog.objects.none()


# ============ Pending Operation Views ============

class PendingOperationListView(generics.ListAPIView):
    """
    List pending operations.
    """
    serializer_class = PendingOperationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'operation_type']

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return PendingOperation.objects.all()
        if user.tenant:
            return PendingOperation.objects.filter(tenant=user.tenant, is_deleted=False)
        return PendingOperation.objects.none()


class PendingOperationDetailView(generics.RetrieveAPIView):
    """
    Retrieve a specific pending operation.
    """
    serializer_class = PendingOperationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return PendingOperation.objects.all()
        if user.tenant:
            return PendingOperation.objects.filter(tenant=user.tenant, is_deleted=False)
        return PendingOperation.objects.none()