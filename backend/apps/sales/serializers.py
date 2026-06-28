from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
import random
from apps.catalog.models import Product
from apps.partners.models import Customer
from apps.inventory.models import Stock, StockMovement
from apps.branches.models import Branch
from .models import Sale, SaleItem, Invoice, Payment, CashRegister, CashRegisterTransaction


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'quantity', 'unit_price', 'total_price',
            'unit_cost', 'total_cost', 'discount_amount'
        ]
        read_only_fields = ['id', 'total_price', 'unit_cost', 'total_cost']


class SaleListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    outstanding_balance = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Sale
        fields = [
            'id', 'sale_number', 'branch', 'branch_name',
            'customer', 'customer_name', 'sale_date',
            'total_amount', 'paid_amount', 'outstanding_balance',
            'status', 'payment_method', 'items_count',
            'created_by', 'created_by_username', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']
    
    def get_outstanding_balance(self, obj):
        return obj.get_outstanding_balance()
    
    def get_items_count(self, obj):
        return obj.items.count()


class SaleDetailSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    items = SaleItemSerializer(many=True, read_only=True)
    payments = serializers.SerializerMethodField()
    outstanding_balance = serializers.SerializerMethodField()
    
    class Meta:
        model = Sale
        fields = [
            'id', 'sale_number', 'branch', 'branch_name',
            'customer', 'customer_name', 'sale_date',
            'subtotal', 'tax_amount', 'discount_amount',
            'total_amount', 'paid_amount', 'outstanding_balance',
            'payment_method', 'payment_details',
            'status', 'currency', 'exchange_rate',
            'notes', 'created_by', 'created_by_username',
            'items', 'payments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']
    
    def get_outstanding_balance(self, obj):
        return obj.get_outstanding_balance()
    
    def get_payments(self, obj):
        from .serializers import PaymentSerializer
        return PaymentSerializer(obj.payments.all(), many=True).data


class SaleCreateSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    
    class Meta:
        model = Sale
        fields = [
            'customer', 'branch', 'payment_method',
            'currency', 'exchange_rate', 'notes', 'items'
        ]
    
    def validate(self, data):
        user = self.context['request'].user
        
        # Check that branch belongs to the tenant
        if data['branch'].tenant != user.tenant:
            raise serializers.ValidationError("Branch does not belong to your company.")
        
        # Check customer belongs to the tenant (if provided)
        if data.get('customer'):
            if data['customer'].tenant != user.tenant:
                raise serializers.ValidationError("Customer does not belong to your company.")
        
        # Check all products and stock
        for item in data['items']:
            product = item['product']
            if product.tenant != user.tenant:
                raise serializers.ValidationError(f"Product {product.name} does not belong to your company.")
            
            # Check stock availability
            try:
                stock = Stock.objects.get(
                    tenant=user.tenant,
                    branch=data['branch'],
                    product=product
                )
                if stock.quantity < item['quantity']:
                    raise serializers.ValidationError(
                        f"Insufficient stock for {product.name}. Available: {stock.quantity}, Required: {item['quantity']}"
                    )
            except Stock.DoesNotExist:
                raise serializers.ValidationError(f"Product {product.name} not found in stock.")
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        
        # Generate sale number
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        sale_number = f"SA-{timestamp}-{random_num}"
        
        # Calculate totals
        subtotal = Decimal('0')
        total_cost = Decimal('0')
        total_tax = Decimal('0')
        total_discount = Decimal('0')
        
        processed_items = []
        
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            unit_price = item_data['unit_price']
            
            # Get product cost (from stock average cost)
            try:
                stock = Stock.objects.get(
                    tenant=user.tenant,
                    branch=validated_data['branch'],
                    product=product
                )
                unit_cost = stock.average_cost
            except Stock.DoesNotExist:
                unit_cost = product.purchase_price
            
            item_total = quantity * unit_price
            item_cost = quantity * unit_cost
            
            subtotal += item_total
            total_cost += item_cost
            
            processed_items.append({
                'product': product,
                'quantity': quantity,
                'unit_price': unit_price,
                'total_price': item_total,
                'unit_cost': unit_cost,
                'total_cost': item_cost,
                'discount_amount': 0
            })
        
        # Calculate final total
        total_amount = subtotal + total_tax - total_discount
        
        # Create sale
        sale = Sale.objects.create(
            tenant=user.tenant,
            sale_number=sale_number,
            subtotal=subtotal,
            tax_amount=total_tax,
            discount_amount=total_discount,
            total_amount=total_amount,
            status='completed',
            created_by=user,
            **validated_data
        )
        
        # Create sale items and update stock
        for item_data in processed_items:
            # Create sale item
            SaleItem.objects.create(
                sale=sale,
                product=item_data['product'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                total_price=item_data['total_price'],
                unit_cost=item_data['unit_cost'],
                total_cost=item_data['total_cost'],
                discount_amount=item_data['discount_amount']
            )
            
            # Update stock
            stock = Stock.objects.get(
                tenant=user.tenant,
                branch=validated_data['branch'],
                product=item_data['product']
            )
            stock.quantity -= item_data['quantity']
            stock.save()
            
            # Create stock movement
            StockMovement.objects.create(
                tenant=user.tenant,
                branch=validated_data['branch'],
                product=item_data['product'],
                quantity=item_data['quantity'],
                movement_type='out',
                unit_cost=item_data['unit_cost'],
                total_cost=item_data['total_cost'],
                reference=sale.sale_number,
                notes=f"Sale: {sale_number}",
                created_by=user
            )
        
        # Create invoice
        due_date = timezone.now().date() + timedelta(days=30)
        
        # Generate invoice number
        invoice_number = f"INV-{timestamp}-{random_num}"
        
        invoice = Invoice.objects.create(
            tenant=user.tenant,
            sale=sale,
            branch=validated_data['branch'],
            customer=validated_data.get('customer'),
            invoice_number=invoice_number,
            due_date=due_date,
            total_amount=total_amount,
            status='sent'
        )
        
        # Handle payment if paid
        if validated_data.get('payment_method') != 'credit':
            # Create payment record
            payment_number = f"PAY-{timestamp}-{random_num}"
            
            payment = Payment.objects.create(
                tenant=user.tenant,
                branch=validated_data['branch'],
                sale=sale,
                invoice=invoice,
                customer=validated_data.get('customer'),
                payment_number=payment_number,
                amount=total_amount,
                payment_method=validated_data['payment_method'],
                received_by=user
            )
            
            # Update sale paid amount
            sale.paid_amount = total_amount
            sale.save()
            
            # Update invoice paid amount
            invoice.paid_amount = total_amount
            invoice.save()
            
            # Update cash register
            self.update_cash_register(sale, total_amount, 'in', user)
        
        return sale
    
    def update_cash_register(self, sale, amount, transaction_type, user):
        """Update cash register balance"""
        try:
            register, created = CashRegister.objects.get_or_create(
                tenant=sale.tenant,
                branch=sale.branch,
                currency=sale.currency,
                defaults={
                    'opening_balance': 0,
                    'balance': 0
                }
            )
            
            balance_before = register.balance
            
            if transaction_type == 'in':
                register.balance += amount
            else:
                register.balance -= amount
            
            register.save()
            
            # Create transaction record
            CashRegisterTransaction.objects.create(
                tenant=sale.tenant,
                branch=sale.branch,
                register=register,
                transaction_type='sale',
                amount=amount,
                reference=sale.sale_number,
                reference_id=sale.id,
                balance_before=balance_before,
                balance_after=register.balance,
                notes=f"Sale: {sale.sale_number}",
                created_by=user
            )
        except Exception as e:
            # Log error but don't fail the sale
            print(f"Error updating cash register: {e}")


class SaleVoidSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True)


class PaymentSerializer(serializers.ModelSerializer):
    sale_number = serializers.CharField(source='sale.sale_number', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    received_by_username = serializers.CharField(source='received_by.username', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'sale', 'sale_number',
            'invoice', 'invoice_number', 'customer', 'customer_name',
            'amount', 'payment_date', 'payment_method',
            'reference', 'notes', 'received_by', 'received_by_username',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'sale', 'invoice', 'amount', 'payment_method',
            'reference', 'notes'
        ]
    
    def validate(self, data):
        user = self.context['request'].user
        
        # Validate sale exists and belongs to tenant
        if data.get('sale'):
            if data['sale'].tenant != user.tenant:
                raise serializers.ValidationError("Sale does not belong to your company.")
            
            # Check outstanding balance
            outstanding = data['sale'].get_outstanding_balance()
            if data['amount'] > outstanding:
                raise serializers.ValidationError(
                    f"Payment amount exceeds outstanding balance. Outstanding: {outstanding}"
                )
        
        # Validate invoice if provided
        if data.get('invoice'):
            if data['invoice'].tenant != user.tenant:
                raise serializers.ValidationError("Invoice does not belong to your company.")
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        sale = validated_data.get('sale')
        invoice = validated_data.get('invoice')
        amount = validated_data['amount']
        
        # Generate payment number
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        payment_number = f"PAY-{timestamp}-{random_num}"
        
        # Create payment
        payment = Payment.objects.create(
            tenant=user.tenant,
            branch=sale.branch if sale else invoice.branch,
            payment_number=payment_number,
            received_by=user,
            **validated_data
        )
        
        # Update sale paid amount
        if sale:
            sale.paid_amount += amount
            sale.save()
        
        # Update invoice paid amount
        if invoice:
            invoice.paid_amount += amount
            invoice.save()
        
        # Update cash register
        self.update_cash_register(sale or invoice, amount, 'in', user)
        
        return payment
    
    def update_cash_register(self, reference_obj, amount, transaction_type, user):
        """Update cash register balance"""
        try:
            branch = reference_obj.branch if hasattr(reference_obj, 'branch') else reference_obj.sale.branch
            tenant = reference_obj.tenant if hasattr(reference_obj, 'tenant') else reference_obj.sale.tenant
            currency = reference_obj.currency if hasattr(reference_obj, 'currency') else 'USD'
            
            register, created = CashRegister.objects.get_or_create(
                tenant=tenant,
                branch=branch,
                currency=currency,
                defaults={
                    'opening_balance': 0,
                    'balance': 0
                }
            )
            
            balance_before = register.balance
            
            if transaction_type == 'in':
                register.balance += amount
            else:
                register.balance -= amount
            
            register.save()
            
            # Create transaction record
            CashRegisterTransaction.objects.create(
                tenant=tenant,
                branch=branch,
                register=register,
                transaction_type='payment',
                amount=amount,
                reference=reference_obj.sale_number if hasattr(reference_obj, 'sale_number') else str(reference_obj.id),
                reference_id=reference_obj.id if hasattr(reference_obj, 'id') else None,
                balance_before=balance_before,
                balance_after=register.balance,
                notes=f"Payment received",
                created_by=user
            )
        except Exception as e:
            # Log error but don't fail the payment
            print(f"Error updating cash register: {e}")


class InvoiceSerializer(serializers.ModelSerializer):
    sale_number = serializers.CharField(source='sale.sale_number', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    outstanding_balance = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'sale', 'sale_number',
            'customer', 'customer_name', 'branch', 'branch_name',
            'invoice_date', 'due_date', 'total_amount',
            'paid_amount', 'outstanding_balance',
            'status', 'is_overdue', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']
    
    def get_outstanding_balance(self, obj):
        return obj.get_outstanding_balance()
    
    def get_is_overdue(self, obj):
        return obj.is_overdue()


class CashRegisterSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = CashRegister
        fields = [
            'id', 'branch', 'branch_name', 'balance',
            'opening_balance', 'closing_balance', 'currency',
            'opening_date', 'closing_date', 'is_closed',
            'last_reconciled_at', 'last_reconciled_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']


class CashRegisterTransactionSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = CashRegisterTransaction
        fields = [
            'id', 'branch', 'branch_name', 'register',
            'transaction_type', 'amount', 'reference',
            'balance_before', 'balance_after',
            'notes', 'created_by', 'created_by_username', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']