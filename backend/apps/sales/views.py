from rest_framework import generics, filters, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import Q, Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from decimal import Decimal

from apps.core.mixins import TenantViewSetMixin
from apps.core.permissions import HasCapability, IsTenantAdmin
from apps.inventory.models import Stock, StockMovement  # Changed from apps.stock
from .models import Sale, SaleItem, Invoice, Payment, CashRegister, CashRegisterTransaction
from .serializers import (
    SaleListSerializer,
    SaleDetailSerializer,
    SaleCreateSerializer,
    SaleVoidSerializer,
    PaymentSerializer,
    PaymentCreateSerializer,
    InvoiceSerializer,
    CashRegisterSerializer,
    CashRegisterTransactionSerializer
)


# ============ Sale Views ============

class SaleListCreateView(generics.ListCreateAPIView):
    """
    List all sales or create a new sale.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['branch', 'status', 'payment_method', 'customer']
    search_fields = ['sale_number', 'customer__name', 'notes']
    ordering_fields = ['-sale_date', 'total_amount']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SaleCreateSerializer
        return SaleListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Sale.objects.all()
        if user.tenant:
            queryset = Sale.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return Sale.objects.none()


class SaleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve a specific sale.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SaleDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Sale.objects.all()
        if user.tenant:
            queryset = Sale.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return Sale.objects.none()


class SaleVoidView(APIView):
    """
    Void a sale (reverse all transactions).
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            sale = Sale.objects.get(pk=pk)
        except Sale.DoesNotExist:
            return Response({'error': 'Sale not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permission
        user = request.user
        if not user.is_platform_admin and not user.is_tenant_admin:
            if sale.tenant != user.tenant:
                return Response({'error': 'You do not have permission'}, status=status.HTTP_403_FORBIDDEN)
        
        if sale.status == 'voided':
            return Response({'error': 'Sale already voided'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = SaleVoidSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Reverse stock
        for item in sale.items.all():
            stock = Stock.objects.get(
                tenant=sale.tenant,
                branch=sale.branch,
                product=item.product
            )
            stock.quantity += item.quantity
            stock.save()
            
            # Create stock movement (reverse)
            StockMovement.objects.create(
                tenant=sale.tenant,
                branch=sale.branch,
                product=item.product,
                quantity=item.quantity,
                movement_type='return',
                unit_cost=item.unit_cost,
                total_cost=item.total_cost,
                reference=sale.sale_number,
                notes=f"Voided sale: {sale.sale_number}",
                created_by=user
            )
        
        # Reverse cash register if payment was made
        if sale.paid_amount > 0:
            register = CashRegister.objects.get(
                tenant=sale.tenant,
                branch=sale.branch,
                currency=sale.currency
            )
            
            balance_before = register.balance
            register.balance -= sale.paid_amount
            register.save()
            
            CashRegisterTransaction.objects.create(
                tenant=sale.tenant,
                branch=sale.branch,
                register=register,
                transaction_type='adjustment',
                amount=sale.paid_amount,
                reference=sale.sale_number,
                balance_before=balance_before,
                balance_after=register.balance,
                notes=f"Voided sale: {sale.sale_number}",
                created_by=user
            )
        
        # Update sale status
        sale.status = 'voided'
        sale.voided_by = user
        sale.voided_at = timezone.now()
        sale.void_reason = serializer.validated_data['reason']
        sale.save()
        
        return Response({
            'message': 'Sale voided successfully',
            'sale': SaleDetailSerializer(sale).data
        })


# ============ Payment Views ============

class PaymentListCreateView(generics.ListCreateAPIView):
    """
    List all payments or create a new payment.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['branch', 'payment_method', 'sale', 'customer']
    search_fields = ['payment_number', 'reference', 'notes']
    ordering_fields = ['-payment_date']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PaymentCreateSerializer
        return PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Payment.objects.all()
        if user.tenant:
            queryset = Payment.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return Payment.objects.none()


class PaymentDetailView(generics.RetrieveAPIView):
    """
    Retrieve a specific payment.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Payment.objects.all()
        if user.tenant:
            queryset = Payment.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return Payment.objects.none()


# ============ Invoice Views ============

class InvoiceListView(generics.ListAPIView):
    """
    List all invoices.
    """
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['branch', 'status', 'customer']
    search_fields = ['invoice_number', 'customer__name']
    ordering_fields = ['-invoice_date', 'due_date']

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Invoice.objects.all()
        if user.tenant:
            queryset = Invoice.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return Invoice.objects.none()


class InvoiceDetailView(generics.RetrieveAPIView):
    """
    Retrieve a specific invoice.
    """
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Invoice.objects.all()
        if user.tenant:
            queryset = Invoice.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return Invoice.objects.none()


# ============ Cash Register Views ============

class CashRegisterListView(generics.ListAPIView):
    """
    List all cash registers.
    """
    serializer_class = CashRegisterSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['branch', 'currency', 'is_closed']

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return CashRegister.objects.all()
        if user.tenant:
            queryset = CashRegister.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return CashRegister.objects.none()


class CashRegisterDetailView(generics.RetrieveAPIView):
    """
    Retrieve a specific cash register.
    """
    serializer_class = CashRegisterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return CashRegister.objects.all()
        if user.tenant:
            queryset = CashRegister.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return CashRegister.objects.none()


class CashRegisterTransactionListView(generics.ListAPIView):
    """
    List all cash register transactions.
    """
    serializer_class = CashRegisterTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['branch', 'transaction_type']
    ordering_fields = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return CashRegisterTransaction.objects.all()
        if user.tenant:
            queryset = CashRegisterTransaction.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return CashRegisterTransaction.objects.none()


class CashRegisterCloseView(APIView):
    """
    Close a cash register.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            register = CashRegister.objects.get(pk=pk)
        except CashRegister.DoesNotExist:
            return Response({'error': 'Cash register not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permission
        user = request.user
        if not user.is_platform_admin and not user.is_tenant_admin:
            if register.tenant != user.tenant:
                return Response({'error': 'You do not have permission'}, status=status.HTTP_403_FORBIDDEN)
        
        if register.is_closed:
            return Response({'error': 'Cash register already closed'}, status=status.HTTP_400_BAD_REQUEST)
        
        closing_balance = request.data.get('closing_balance')
        if closing_balance is None:
            return Response({'error': 'Closing balance is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        register.closing_balance = Decimal(str(closing_balance))
        register.closing_date = timezone.now().date()
        register.is_closed = True
        register.last_reconciled_at = timezone.now()
        register.last_reconciled_by = user
        register.save()
        
        return Response({
            'message': 'Cash register closed successfully',
            'register': CashRegisterSerializer(register).data
        })