from rest_framework import generics, filters, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Q, Sum
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime
import random
from decimal import Decimal

from apps.core.mixins import TenantViewSetMixin
from apps.core.permissions import HasCapability, IsTenantAdmin
from apps.inventory.models import Stock, StockMovement  # We'll create inventory app later
from .models import PurchaseOrder, PurchaseItem, PurchaseReception, PurchaseReceptionItem
from .serializers import (
    PurchaseOrderListSerializer,
    PurchaseOrderDetailSerializer,
    PurchaseOrderCreateSerializer,
    PurchaseOrderUpdateStatusSerializer,
    PurchaseReceptionSerializer,
    PurchaseReceptionCreateSerializer
)

# ============ Purchase Order Views ============

class PurchaseOrderListCreateView(generics.ListCreateAPIView):
    """
    List all purchase orders or create a new purchase order.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'supplier', 'branch']
    search_fields = ['order_number', 'supplier__name', 'notes']
    ordering_fields = ['order_date', 'total_amount', 'status']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PurchaseOrderCreateSerializer
        return PurchaseOrderListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return PurchaseOrder.objects.all()
        if user.tenant:
            queryset = PurchaseOrder.objects.filter(tenant=user.tenant, is_deleted=False)
            # If user has a branch, only show purchase orders for their branch
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return PurchaseOrder.objects.none()


class PurchaseOrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific purchase order.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return PurchaseOrderCreateSerializer
        return PurchaseOrderDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return PurchaseOrder.objects.all()
        if user.tenant:
            queryset = PurchaseOrder.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return PurchaseOrder.objects.none()

    def perform_destroy(self, instance):
        # Only allow deletion if status is draft
        if instance.status not in ['draft']:
            raise serializers.ValidationError("Only draft orders can be deleted.")
        instance.is_deleted = True
        instance.save()


class PurchaseOrderUpdateStatusView(APIView):
    """
    Update the status of a purchase order.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            purchase_order = PurchaseOrder.objects.get(pk=pk)
        except PurchaseOrder.DoesNotExist:
            return Response({'error': 'Purchase order not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permission
        user = request.user
        if not user.is_platform_admin and not user.is_tenant_admin:
            if purchase_order.tenant != user.tenant:
                return Response({'error': 'You do not have permission'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = PurchaseOrderUpdateStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['status']
        
        # Validate status transitions
        allowed_transitions = {
            'draft': ['ordered', 'cancelled'],
            'ordered': ['in_transit', 'cancelled'],
            'in_transit': ['received', 'cancelled'],
            'received': [],  # No further transitions from received
            'cancelled': [],  # No further transitions from cancelled
        }
        
        if new_status not in allowed_transitions.get(purchase_order.status, []):
            return Response({
                'error': f'Cannot transition from {purchase_order.status} to {new_status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        purchase_order.status = new_status
        
        # If status is received, mark as received
        if new_status == 'received':
            purchase_order.received_by = request.user
            from django.utils import timezone
            purchase_order.received_at = timezone.now()
        
        purchase_order.save()
        
        return Response({
            'message': f'Purchase order status updated to {new_status}',
            'purchase_order': PurchaseOrderDetailSerializer(purchase_order).data
        })


# ============ Purchase Reception Views ============

class PurchaseReceptionView(APIView):
    """
    Receive goods against a purchase order.
    This will update stock and create stock movements.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = PurchaseReceptionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        purchase_order_id = data['purchase_order_id']
        items_data = data['items']
        notes = data.get('notes', '')
        
        # Get purchase order
        try:
            purchase_order = PurchaseOrder.objects.get(pk=purchase_order_id)
        except PurchaseOrder.DoesNotExist:
            return Response({'error': 'Purchase order not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permission
        user = request.user
        if not user.is_platform_admin and not user.is_tenant_admin:
            if purchase_order.tenant != user.tenant:
                return Response({'error': 'You do not have permission'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check status
        if purchase_order.status != 'in_transit' and purchase_order.status != 'ordered':
            return Response({
                'error': f'Cannot receive purchase order with status {purchase_order.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate reception number
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        reception_number = f"REC-{timestamp}-{random_num}"
        
        # Create reception record
        reception = PurchaseReception.objects.create(
            purchase_order=purchase_order,
            branch=purchase_order.branch,
            reception_number=reception_number,
            received_by=user,
            notes=notes
        )
        
        # Process each item
        for item_data in items_data:
            purchase_item_id = item_data['purchase_item_id']
            quantity_received = item_data['quantity_received']
            quantity_damaged = item_data.get('quantity_damaged', 0)
            
            # Get purchase item
            try:
                purchase_item = PurchaseItem.objects.get(pk=purchase_item_id)
            except PurchaseItem.DoesNotExist:
                return Response({
                    'error': f'Purchase item {purchase_item_id} not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Validate quantity
            if quantity_received > purchase_item.quantity:
                return Response({
                    'error': f'Cannot receive more than ordered quantity for {purchase_item.product.name}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update received quantity on purchase item
            purchase_item.received_quantity += quantity_received
            purchase_item.save()
            
            # Calculate unit cost including landed costs
            unit_cost = purchase_item.final_unit_cost
            
            # Create reception item
            reception_item = PurchaseReceptionItem.objects.create(
                reception=reception,
                purchase_item=purchase_item,
                product=purchase_item.product,
                quantity_received=quantity_received,
                quantity_damaged=quantity_damaged,
                unit_cost=unit_cost
            )
            
            # Update stock for accepted quantity
            quantity_accepted = quantity_received - quantity_damaged
            
            if quantity_accepted > 0:
                # Get or create stock record
                stock, created = Stock.objects.get_or_create(
                    tenant=purchase_order.tenant,
                    branch=purchase_order.branch,
                    product=purchase_item.product,
                    defaults={'quantity': 0}
                )
                
                # Update quantity
                stock.quantity += quantity_accepted
                stock.save()
                
                # Create stock movement
                StockMovement.objects.create(
                    tenant=purchase_order.tenant,
                    branch=purchase_order.branch,
                    product=purchase_item.product,
                    quantity=quantity_accepted,
                    movement_type='in',
                    reference=f"PO-{purchase_order.order_number}",
                    unit_cost=unit_cost,
                    total_cost=unit_cost * quantity_accepted,
                    created_by=user,
                    notes=f"Reception from purchase order {purchase_order.order_number}"
                )
        
        # Update purchase order status to received
        purchase_order.status = 'received'
        purchase_order.received_by = user
        from django.utils import timezone
        purchase_order.received_at = timezone.now()
        purchase_order.save()
        
        return Response({
            'message': 'Purchase order received successfully',
            'reception': PurchaseReceptionSerializer(reception).data
        }, status=status.HTTP_201_CREATED)


class PurchaseReceptionListView(generics.ListAPIView):
    """
    List all purchase receptions.
    """
    serializer_class = PurchaseReceptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['branch', 'purchase_order']
    ordering_fields = ['reception_date']

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return PurchaseReception.objects.all()
        if user.tenant:
            queryset = PurchaseReception.objects.filter(
                purchase_order__tenant=user.tenant,
                is_deleted=False
            )
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return PurchaseReception.objects.none()


class PurchaseReceptionDetailView(generics.RetrieveAPIView):
    """
    Retrieve a specific purchase reception.
    """
    serializer_class = PurchaseReceptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return PurchaseReception.objects.all()
        if user.tenant:
            queryset = PurchaseReception.objects.filter(
                purchase_order__tenant=user.tenant,
                is_deleted=False
            )
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return PurchaseReception.objects.none()