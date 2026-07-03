from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from apps.catalog.models import Product
from apps.users.models import User
from .models import Stock, StockMovement, Transfer, TransferItem, InventoryAdjustment, StockLoss

class StockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_id = serializers.CharField(source='product.id', read_only=True)
    product_min_stock = serializers.IntegerField(source='product.min_stock', read_only=True, default=0)
    available_quantity = serializers.SerializerMethodField()
    total_value = serializers.SerializerMethodField()
    
    class Meta:
        model = Stock
        fields = [
            'id', 'branch', 'product', 'product_id', 'product_name', 'product_sku',
            'product_min_stock', 'quantity', 'reserved_quantity', 'available_quantity',
            'average_cost', 'total_value', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']
    
    def get_available_quantity(self, obj):
        return obj.get_available_quantity()
    
    def get_total_value(self, obj):
        return obj.get_total_value()


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'branch', 'branch_name', 'product', 'product_name',
            'movement_type', 'quantity', 'unit_cost', 'total_cost',
            'reference', 'notes', 'created_by', 'created_by_username',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TransferItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = TransferItem
        fields = [
            'id', 'product', 'product_name', 'product_sku',
            'quantity', 'received_quantity', 'unit_cost', 'total_cost'
        ]
        read_only_fields = ['id', 'received_quantity', 'total_cost']


class TransferListSerializer(serializers.ModelSerializer):
    from_branch_name = serializers.CharField(source='from_branch.name', read_only=True)
    to_branch_name = serializers.CharField(source='to_branch.name', read_only=True)
    requested_by_username = serializers.CharField(source='requested_by.username', read_only=True)
    total_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = Transfer
        fields = [
            'id', 'transfer_number', 'from_branch', 'from_branch_name',
            'to_branch', 'to_branch_name', 'transfer_date',
            'status', 'total_quantity', 'requested_by', 'requested_by_username',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']
    
    def get_total_quantity(self, obj):
        return obj.get_total_quantity()


class TransferDetailSerializer(serializers.ModelSerializer):
    from_branch_name = serializers.CharField(source='from_branch.name', read_only=True)
    to_branch_name = serializers.CharField(source='to_branch.name', read_only=True)
    requested_by_username = serializers.CharField(source='requested_by.username', read_only=True)
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True)
    dispatched_by_username = serializers.CharField(source='dispatched_by.username', read_only=True)
    received_by_username = serializers.CharField(source='received_by.username', read_only=True)
    items = TransferItemSerializer(many=True, read_only=True)
    total_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = Transfer
        fields = [
            'id', 'transfer_number', 'from_branch', 'from_branch_name',
            'to_branch', 'to_branch_name', 'transfer_date',
            'status', 'notes',
            'requested_by', 'requested_by_username',
            'approved_by', 'approved_by_username', 'approved_at',
            'dispatched_by', 'dispatched_by_username', 'dispatched_at',
            'received_by', 'received_by_username', 'received_at',
            'total_quantity', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']
    
    def get_total_quantity(self, obj):
        return obj.get_total_quantity()


class TransferCreateSerializer(serializers.ModelSerializer):
    items = TransferItemSerializer(many=True)
    
    class Meta:
        model = Transfer
        fields = [
            'from_branch', 'to_branch', 'notes', 'items'
        ]
    
    def validate(self, data):
        # Check that branches belong to the same tenant
        user = self.context['request'].user
        if data['from_branch'].tenant != user.tenant:
            raise serializers.ValidationError("Source branch does not belong to your company.")
        if data['to_branch'].tenant != user.tenant:
            raise serializers.ValidationError("Destination branch does not belong to your company.")
        
        # Prevent transfer to same branch
        if data['from_branch'] == data['to_branch']:
            raise serializers.ValidationError("Source and destination branches cannot be the same.")
        
        # Check all products belong to the same tenant
        for item in data['items']:
            if item['product'].tenant != user.tenant:
                raise serializers.ValidationError(f"Product {item['product'].name} does not belong to your company.")
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        
        # Generate transfer number
        from datetime import datetime
        import random
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        transfer_number = f"TR-{timestamp}-{random_num}"
        
        # Create transfer
        transfer = Transfer.objects.create(
            tenant=user.tenant,
            transfer_number=transfer_number,
            requested_by=user,
            **validated_data
        )
        
        # Create transfer items and calculate costs
        for item_data in items_data:
            product = item_data['product']
            
            # Get the average cost from source branch stock
            try:
                stock = Stock.objects.get(
                    tenant=user.tenant,
                    branch=validated_data['from_branch'],
                    product=product
                )
                unit_cost = stock.average_cost
            except Stock.DoesNotExist:
                unit_cost = product.purchase_price
            
            total_cost = item_data['quantity'] * unit_cost
            
            TransferItem.objects.create(
                transfer=transfer,
                unit_cost=unit_cost,
                total_cost=total_cost,
                **item_data
            )
        
        return transfer


class TransferUpdateStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Transfer.TRANSFER_STATUS_CHOICES)


class TransferApproveSerializer(serializers.Serializer):
    approved = serializers.BooleanField()


class InventoryAdjustmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = InventoryAdjustment
        fields = [
            'id', 'branch', 'branch_name', 'product', 'product_name',
            'adjustment_type', 'quantity', 'old_quantity', 'new_quantity',
            'reason', 'is_approved', 'approved_by', 'approved_by_username',
            'approved_at', 'created_by', 'created_by_username', 'created_at'
        ]
        read_only_fields = ['id', 'old_quantity', 'new_quantity', 'created_at', 'updated_at', 'sync_version']


class InventoryAdjustmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryAdjustment
        fields = ['branch', 'product', 'adjustment_type', 'quantity', 'reason']
    
    def validate(self, data):
        user = self.context['request'].user
        if data['branch'].tenant != user.tenant:
            raise serializers.ValidationError("Branch does not belong to your company.")
        if data['product'].tenant != user.tenant:
            raise serializers.ValidationError("Product does not belong to your company.")
        return data


class InventoryAdjustmentApproveSerializer(serializers.Serializer):
    approve = serializers.BooleanField()


class StockLossSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = StockLoss
        fields = [
            'id', 'branch', 'branch_name', 'product', 'product_name',
            'loss_type', 'quantity', 'unit_cost', 'total_cost',
            'reason', 'notes', 'is_approved',
            'approved_by', 'approved_by_username', 'approved_at',
            'created_by', 'created_by_username', 'created_at'
        ]
        read_only_fields = ['id', 'unit_cost', 'total_cost', 'created_at', 'updated_at', 'sync_version']


class StockLossCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockLoss
        fields = ['branch', 'product', 'loss_type', 'quantity', 'reason', 'notes']
    
    def validate(self, data):
        user = self.context['request'].user
        if data['branch'].tenant != user.tenant:
            raise serializers.ValidationError("Branch does not belong to your company.")
        if data['product'].tenant != user.tenant:
            raise serializers.ValidationError("Product does not belong to your company.")
        return data


class StockLossApproveSerializer(serializers.Serializer):
    approve = serializers.BooleanField()