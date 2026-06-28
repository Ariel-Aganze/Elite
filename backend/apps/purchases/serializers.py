from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from apps.catalog.models import Product
from .models import PurchaseOrder, PurchaseItem, PurchaseReception, PurchaseReceptionItem

class PurchaseItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = PurchaseItem
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'quantity', 'received_quantity', 'unit_price', 'total_price',
            'landed_cost_per_unit', 'final_unit_cost'
        ]
        read_only_fields = ['id', 'received_quantity', 'final_unit_cost']


class PurchaseOrderListSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    outstanding_balance = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'order_number', 'supplier', 'supplier_name',
            'branch', 'branch_name', 'order_date', 'expected_delivery_date',
            'total_amount', 'paid_amount', 'outstanding_balance',
            'status', 'currency', 'items_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_outstanding_balance(self, obj):
        return obj.get_outstanding_balance()
    
    def get_items_count(self, obj):
        return obj.items.count()


class PurchaseOrderDetailSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    items = PurchaseItemSerializer(many=True, read_only=True)
    outstanding_balance = serializers.SerializerMethodField()
    total_landed_cost = serializers.SerializerMethodField()
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'order_number', 'supplier', 'supplier_name',
            'branch', 'branch_name', 'order_date', 'expected_delivery_date',
            'subtotal', 'tax_amount', 'discount_amount', 'total_amount',
            'paid_amount', 'outstanding_balance',
            'transport_cost', 'customs_cost', 'handling_cost', 'other_costs',
            'landed_cost_total', 'total_landed_cost',
            'status', 'currency', 'exchange_rate', 'notes',
            'received_by', 'received_at', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']

    def get_outstanding_balance(self, obj):
        return obj.get_outstanding_balance()
    
    def get_total_landed_cost(self, obj):
        return obj.get_total_landed_cost()


class PurchaseOrderCreateSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True)
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'supplier', 'branch', 'expected_delivery_date',
            'transport_cost', 'customs_cost', 'handling_cost', 'other_costs',
            'currency', 'exchange_rate', 'notes', 'items'
        ]

    def validate(self, data):
        # Check that supplier belongs to the same tenant
        user = self.context['request'].user
        if data['supplier'].tenant != user.tenant:
            raise serializers.ValidationError("Supplier does not belong to your company.")
        
        # Check that branch belongs to the same tenant
        if data['branch'].tenant != user.tenant:
            raise serializers.ValidationError("Branch does not belong to your company.")
        
        # Check all products belong to the same tenant
        for item in data['items']:
            if item['product'].tenant != user.tenant:
                raise serializers.ValidationError(f"Product {item['product'].name} does not belong to your company.")
        
        return data

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        
        # Generate order number
        from datetime import datetime
        import random
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        order_number = f"PO-{timestamp}-{random_num}"
        
        # Calculate subtotal
        subtotal = Decimal('0')
        for item in items_data:
            subtotal += item['quantity'] * item['unit_price']
        
        # Calculate total amount (subtotal + tax - discount)
        total_amount = subtotal  # For now, we'll handle tax/discount later
        
        # Create purchase order
        purchase_order = PurchaseOrder.objects.create(
            tenant=user.tenant,
            order_number=order_number,
            subtotal=subtotal,
            total_amount=total_amount,
            **validated_data
        )
        
        # Create purchase items
        for item_data in items_data:
            PurchaseItem.objects.create(
                purchase_order=purchase_order,
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                total_price=item_data['quantity'] * item_data['unit_price'],
                product=item_data['product']
            )
        
        return purchase_order


class PurchaseOrderUpdateStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=PurchaseOrder.STATUS_CHOICES)


class PurchaseReceptionItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = PurchaseReceptionItem
        fields = [
            'id', 'purchase_item', 'product', 'product_name', 'product_sku',
            'quantity_received', 'quantity_damaged', 'quantity_accepted',
            'unit_cost', 'total_cost'
        ]
        read_only_fields = ['id', 'quantity_accepted', 'total_cost']


class PurchaseReceptionSerializer(serializers.ModelSerializer):
    items = PurchaseReceptionItemSerializer(many=True)
    
    class Meta:
        model = PurchaseReception
        fields = [
            'id', 'purchase_order', 'branch', 'reception_number',
            'reception_date', 'received_by', 'notes', 'items'
        ]
        read_only_fields = ['id', 'reception_number', 'reception_date']


class PurchaseReceptionCreateSerializer(serializers.Serializer):
    """
    Serializer for creating a reception without a separate model creation.
    This will directly update the purchase order and create stock movements.
    """
    purchase_order_id = serializers.UUIDField()
    items = serializers.ListField(
        child=serializers.DictField()
    )
    notes = serializers.CharField(required=False)

    def validate_items(self, value):
        for item in value:
            if 'purchase_item_id' not in item:
                raise serializers.ValidationError("Each item must have a purchase_item_id")
            if 'quantity_received' not in item:
                raise serializers.ValidationError("Each item must have quantity_received")
            if 'quantity_damaged' not in item:
                item['quantity_damaged'] = 0
        return value