from apps.inventory import serializers
from rest_framework import generics, filters, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Q, Sum, F
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from decimal import Decimal

from apps.core.mixins import TenantViewSetMixin
from apps.core.permissions import HasCapability, IsTenantAdmin
from .models import Stock, StockMovement, Transfer, TransferItem, InventoryAdjustment, StockLoss
from .serializers import (
    StockSerializer,
    StockMovementSerializer,
    TransferListSerializer,
    TransferDetailSerializer,
    TransferCreateSerializer,
    TransferUpdateStatusSerializer,
    TransferApproveSerializer,
    InventoryAdjustmentSerializer,
    InventoryAdjustmentCreateSerializer,
    InventoryAdjustmentApproveSerializer,
    StockLossSerializer,
    StockLossCreateSerializer,
    StockLossApproveSerializer
)


# ============ Stock Views ============

class StockListView(generics.ListAPIView):
    """
    List all stock records.
    """
    serializer_class = StockSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['branch', 'product__category']
    search_fields = ['product__name', 'product__sku']
    ordering_fields = ['quantity', 'product__name']

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Stock.objects.all()
        if user.tenant:
            queryset = Stock.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return Stock.objects.none()


class StockMovementListView(generics.ListAPIView):
    """
    List all stock movements.
    """
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['branch', 'product', 'movement_type']
    search_fields = ['reference', 'notes']
    ordering_fields = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return StockMovement.objects.all()
        if user.tenant:
            queryset = StockMovement.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return StockMovement.objects.none()


class StockLowStockView(generics.ListAPIView):
    """
    List products with low stock (below min_stock threshold).
    """
    serializer_class = StockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Stock.objects.filter(
                quantity__lte=F('product__min_stock'),
                product__min_stock__gt=0
            )
        if user.tenant:
            queryset = Stock.objects.filter(
                tenant=user.tenant,
                is_deleted=False,
                quantity__lte=F('product__min_stock'),
                product__min_stock__gt=0
            )
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return Stock.objects.none()


# ============ Transfer Views ============

class TransferListCreateView(generics.ListCreateAPIView):
    """
    List all transfers or create a new transfer request.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['from_branch', 'to_branch', 'status']
    search_fields = ['transfer_number', 'notes']
    ordering_fields = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TransferCreateSerializer
        return TransferListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Transfer.objects.all()
        if user.tenant:
            queryset = Transfer.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                # User can only see transfers involving their branch
                queryset = queryset.filter(
                    Q(from_branch=user.branch) | Q(to_branch=user.branch)
                )
            return queryset
        return Transfer.objects.none()


class TransferDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific transfer.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return TransferCreateSerializer
        return TransferDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Transfer.objects.all()
        if user.tenant:
            queryset = Transfer.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(
                    Q(from_branch=user.branch) | Q(to_branch=user.branch)
                )
            return queryset
        return Transfer.objects.none()

    def perform_destroy(self, instance):
        # Only allow deletion if status is requested or draft
        if instance.status not in ['requested']:
            raise serializers.ValidationError("Only requested transfers can be deleted.")
        instance.is_deleted = True
        instance.save()


class TransferApproveView(APIView):
    """
    Approve or reject a transfer request.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            transfer = Transfer.objects.get(pk=pk)
        except Transfer.DoesNotExist:
            return Response({'error': 'Transfer not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permission
        user = request.user
        if not user.is_platform_admin and not user.is_tenant_admin:
            if transfer.tenant != user.tenant:
                return Response({'error': 'You do not have permission'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = TransferApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        approved = serializer.validated_data['approved']
        
        if transfer.status != 'requested':
            return Response({
                'error': f'Cannot approve transfer with status {transfer.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if approved:
            transfer.status = 'approved'
            transfer.approved_by = user
            transfer.approved_at = timezone.now()
            message = 'Transfer approved successfully'
        else:
            transfer.status = 'cancelled'
            message = 'Transfer rejected'
        
        transfer.save()
        
        return Response({
            'message': message,
            'transfer': TransferDetailSerializer(transfer).data
        })


class TransferDispatchView(APIView):
    """
    Dispatch a transfer (decrease stock from source branch).
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            transfer = Transfer.objects.get(pk=pk)
        except Transfer.DoesNotExist:
            return Response({'error': 'Transfer not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permission
        user = request.user
        if not user.is_platform_admin and not user.is_tenant_admin:
            if transfer.tenant != user.tenant:
                return Response({'error': 'You do not have permission'}, status=status.HTTP_403_FORBIDDEN)
        
        if transfer.status != 'approved':
            return Response({
                'error': f'Cannot dispatch transfer with status {transfer.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Process each item - decrease stock from source branch
        for item in transfer.items.all():
            try:
                stock = Stock.objects.get(
                    tenant=transfer.tenant,
                    branch=transfer.from_branch,
                    product=item.product
                )
            except Stock.DoesNotExist:
                return Response({
                    'error': f'Product {item.product.name} not found in source branch stock'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if stock.quantity < item.quantity:
                return Response({
                    'error': f'Insufficient stock for {item.product.name}. Available: {stock.quantity}, Required: {item.quantity}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Decrease stock
            stock.quantity -= item.quantity
            stock.save()
            
            # Create stock movement (out)
            StockMovement.objects.create(
                tenant=transfer.tenant,
                branch=transfer.from_branch,
                product=item.product,
                quantity=item.quantity,
                movement_type='transfer_out',
                unit_cost=item.unit_cost,
                total_cost=item.total_cost,
                reference=transfer.transfer_number,
                notes=f"Transfer out to {transfer.to_branch.name}",
                created_by=user
            )
        
        transfer.status = 'dispatched'
        transfer.dispatched_by = user
        transfer.dispatched_at = timezone.now()
        transfer.save()
        
        return Response({
            'message': 'Transfer dispatched successfully',
            'transfer': TransferDetailSerializer(transfer).data
        })


class TransferReceiveView(APIView):
    """
    Receive a transfer (increase stock at destination branch).
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            transfer = Transfer.objects.get(pk=pk)
        except Transfer.DoesNotExist:
            return Response({'error': 'Transfer not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permission
        user = request.user
        if not user.is_platform_admin and not user.is_tenant_admin:
            if transfer.tenant != user.tenant:
                return Response({'error': 'You do not have permission'}, status=status.HTTP_403_FORBIDDEN)
        
        if transfer.status != 'dispatched':
            return Response({
                'error': f'Cannot receive transfer with status {transfer.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Process each item - increase stock at destination branch
        for item in transfer.items.all():
            # Get or create stock record for destination branch
            stock, created = Stock.objects.get_or_create(
                tenant=transfer.tenant,
                branch=transfer.to_branch,
                product=item.product,
                defaults={'quantity': 0, 'average_cost': 0}
            )
            
            # Update average cost
            if stock.quantity > 0:
                # Weighted average cost
                total_value = (stock.quantity * stock.average_cost) + (item.quantity * item.unit_cost)
                total_quantity = stock.quantity + item.quantity
                stock.average_cost = total_value / total_quantity
            else:
                stock.average_cost = item.unit_cost
            
            # Increase stock
            stock.quantity += item.quantity
            stock.save()
            
            # Update received quantity on transfer item
            item.received_quantity = item.quantity
            item.save()
            
            # Create stock movement (in)
            StockMovement.objects.create(
                tenant=transfer.tenant,
                branch=transfer.to_branch,
                product=item.product,
                quantity=item.quantity,
                movement_type='transfer_in',
                unit_cost=item.unit_cost,
                total_cost=item.total_cost,
                reference=transfer.transfer_number,
                notes=f"Transfer in from {transfer.from_branch.name}",
                created_by=user
            )
        
        transfer.status = 'received'
        transfer.received_by = user
        transfer.received_at = timezone.now()
        transfer.save()
        
        return Response({
            'message': 'Transfer received successfully',
            'transfer': TransferDetailSerializer(transfer).data
        })


# ============ Inventory Adjustment Views ============

class InventoryAdjustmentListCreateView(generics.ListCreateAPIView):
    """
    List all inventory adjustments or create a new adjustment request.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['branch', 'product', 'adjustment_type', 'is_approved']
    search_fields = ['reason', 'product__name']
    ordering_fields = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InventoryAdjustmentCreateSerializer
        return InventoryAdjustmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return InventoryAdjustment.objects.all()
        if user.tenant:
            queryset = InventoryAdjustment.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return InventoryAdjustment.objects.none()

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        
        # Get current stock
        try:
            stock = Stock.objects.get(
                tenant=user.tenant,
                branch=serializer.validated_data['branch'],
                product=serializer.validated_data['product']
            )
            old_quantity = stock.quantity
        except Stock.DoesNotExist:
            old_quantity = 0
            # Create stock record if it doesn't exist
            stock = Stock.objects.create(
                tenant=user.tenant,
                branch=serializer.validated_data['branch'],
                product=serializer.validated_data['product'],
                quantity=0,
                average_cost=0
            )
        
        # Calculate new quantity
        if serializer.validated_data['adjustment_type'] == 'increase':
            new_quantity = old_quantity + serializer.validated_data['quantity']
        else:
            new_quantity = old_quantity - serializer.validated_data['quantity']
            if new_quantity < 0:
                raise serializers.ValidationError("Resulting quantity cannot be negative.")
        
        # Save adjustment with auto-approval
        adjustment = serializer.save(
            tenant=user.tenant,
            old_quantity=old_quantity,
            new_quantity=new_quantity,
            created_by=user,
            is_approved=True,  # Auto-approve
            approved_by=user,
            approved_at=timezone.now()
        )
        
        # Update stock immediately since auto-approved
        stock.quantity = new_quantity
        stock.save()
        
        # Create stock movement
        StockMovement.objects.create(
            tenant=user.tenant,
            branch=serializer.validated_data['branch'],
            product=serializer.validated_data['product'],
            quantity=serializer.validated_data['quantity'],
            movement_type='adjustment',
            reference=f"ADJ-{adjustment.id}",
            notes=f"Inventory adjustment: {adjustment.reason}",
            created_by=user
        )

class InventoryAdjustmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve or delete a specific inventory adjustment.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InventoryAdjustmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return InventoryAdjustment.objects.all()
        if user.tenant:
            queryset = InventoryAdjustment.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return InventoryAdjustment.objects.none()

    def perform_destroy(self, instance):
        # Only allow deletion if not approved
        if instance.is_approved:
            raise serializers.ValidationError("Cannot delete approved adjustments.")
        instance.is_deleted = True
        instance.save()


class InventoryAdjustmentApproveView(APIView):
    """
    Approve or reject an inventory adjustment.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            adjustment = InventoryAdjustment.objects.get(pk=pk)
        except InventoryAdjustment.DoesNotExist:
            return Response({'error': 'Adjustment not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permission
        user = request.user
        if not user.is_platform_admin and not user.is_tenant_admin:
            if adjustment.tenant != user.tenant:
                return Response({'error': 'You do not have permission'}, status=status.HTTP_403_FORBIDDEN)
        
        if adjustment.is_approved:
            return Response({'error': 'Adjustment already approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = InventoryAdjustmentApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        approve = serializer.validated_data['approve']
        
        if approve:
            # Get or create stock record
            stock, created = Stock.objects.get_or_create(
                tenant=adjustment.tenant,
                branch=adjustment.branch,
                product=adjustment.product,
                defaults={'quantity': 0, 'average_cost': 0}
            )
            
            # Update stock
            stock.quantity = adjustment.new_quantity
            stock.save()
            
            # Create stock movement
            StockMovement.objects.create(
                tenant=adjustment.tenant,
                branch=adjustment.branch,
                product=adjustment.product,
                quantity=adjustment.quantity,
                movement_type='adjustment',
                reference=f"ADJ-{adjustment.id}",
                notes=f"Inventory adjustment: {adjustment.reason}",
                created_by=user
            )
            
            adjustment.is_approved = True
            adjustment.approved_by = user
            adjustment.approved_at = timezone.now()
            adjustment.save()
            
            message = 'Adjustment approved and stock updated'
        else:
            adjustment.is_deleted = True
            adjustment.save()
            message = 'Adjustment rejected'
        
        return Response({
            'message': message,
            'adjustment': InventoryAdjustmentSerializer(adjustment).data
        })


# ============ Stock Loss Views ============

class StockLossListCreateView(generics.ListCreateAPIView):
    """
    List all stock losses or create a new loss record.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['branch', 'product', 'loss_type', 'is_approved']
    search_fields = ['reason', 'notes', 'product__name']
    ordering_fields = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StockLossCreateSerializer
        return StockLossSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return StockLoss.objects.all()
        if user.tenant:
            queryset = StockLoss.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return StockLoss.objects.none()

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        
        # Get product cost
        try:
            stock = Stock.objects.get(
                tenant=user.tenant,
                branch=serializer.validated_data['branch'],
                product=serializer.validated_data['product']
            )
            unit_cost = stock.average_cost
        except Stock.DoesNotExist:
            unit_cost = serializer.validated_data['product'].purchase_price
        
        total_cost = serializer.validated_data['quantity'] * unit_cost
        
        serializer.save(
            tenant=user.tenant,
            unit_cost=unit_cost,
            total_cost=total_cost,
            created_by=user,
            is_approved=False
        )


class StockLossDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve or delete a specific stock loss.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StockLossSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return StockLoss.objects.all()
        if user.tenant:
            queryset = StockLoss.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return StockLoss.objects.none()

    def perform_destroy(self, instance):
        # Only allow deletion if not approved
        if instance.is_approved:
            raise serializers.ValidationError("Cannot delete approved losses.")
        instance.is_deleted = True
        instance.save()


class StockLossApproveView(APIView):
    """
    Approve or reject a stock loss.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            loss = StockLoss.objects.get(pk=pk)
        except StockLoss.DoesNotExist:
            return Response({'error': 'Stock loss not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permission
        user = request.user
        if not user.is_platform_admin and not user.is_tenant_admin:
            if loss.tenant != user.tenant:
                return Response({'error': 'You do not have permission'}, status=status.HTTP_403_FORBIDDEN)
        
        if loss.is_approved:
            return Response({'error': 'Loss already approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = StockLossApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        approve = serializer.validated_data['approve']
        
        if approve:
            # Get stock record
            try:
                stock = Stock.objects.get(
                    tenant=loss.tenant,
                    branch=loss.branch,
                    product=loss.product
                )
            except Stock.DoesNotExist:
                return Response({
                    'error': f'Product {loss.product.name} not found in stock'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if stock.quantity < loss.quantity:
                return Response({
                    'error': f'Insufficient stock for {loss.product.name}. Available: {stock.quantity}, Loss: {loss.quantity}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Decrease stock
            stock.quantity -= loss.quantity
            stock.save()
            
            # Create stock movement
            StockMovement.objects.create(
                tenant=loss.tenant,
                branch=loss.branch,
                product=loss.product,
                quantity=loss.quantity,
                movement_type='loss',
                unit_cost=loss.unit_cost,
                total_cost=loss.total_cost,
                reference=f"LOSS-{loss.id}",
                notes=f"Stock loss: {loss.get_loss_type_display()} - {loss.reason}",
                created_by=user
            )
            
            loss.is_approved = True
            loss.approved_by = user
            loss.approved_at = timezone.now()
            loss.save()
            
            message = 'Loss approved and stock updated'
        else:
            loss.is_deleted = True
            loss.save()
            message = 'Loss rejected'
        
        return Response({
            'message': message,
            'loss': StockLossSerializer(loss).data
        })