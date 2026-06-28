from rest_framework import generics, filters, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from decimal import Decimal

from apps.core.permissions import IsTenantAdmin, HasCapability
from apps.sales.models import CashRegister, CashRegisterTransaction  # Changed from apps.inventory
from .models import ExpenseCategory, Expense
from .serializers import (
    ExpenseCategorySerializer,
    ExpenseListSerializer,
    ExpenseDetailSerializer,
    ExpenseCreateSerializer,
    ExpenseApproveSerializer
)


# ============ Expense Category Views ============

class ExpenseCategoryListCreateView(generics.ListCreateAPIView):
    """
    List all expense categories or create a new category.
    """
    serializer_class = ExpenseCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'name_en', 'name_fr']

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return ExpenseCategory.objects.all()
        if user.tenant:
            return ExpenseCategory.objects.filter(tenant=user.tenant, is_deleted=False)
        return ExpenseCategory.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_platform_admin:
            tenant_id = self.request.data.get('tenant')
            if tenant_id:
                from apps.tenants.models import Tenant
                tenant = Tenant.objects.get(id=tenant_id)
                serializer.save(tenant=tenant)
            else:
                raise serializers.ValidationError("Platform admin must specify a tenant.")
        else:
            serializer.save(tenant=user.tenant)


class ExpenseCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific expense category.
    """
    serializer_class = ExpenseCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return ExpenseCategory.objects.all()
        if user.tenant:
            return ExpenseCategory.objects.filter(tenant=user.tenant, is_deleted=False)
        return ExpenseCategory.objects.none()

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


# ============ Expense Views ============

class ExpenseListCreateView(generics.ListCreateAPIView):
    """
    List all expenses or create a new expense.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['branch', 'category', 'is_approved', 'currency']
    search_fields = ['expense_number', 'description', 'notes']
    ordering_fields = ['-expense_date', 'amount']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ExpenseCreateSerializer
        return ExpenseListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Expense.objects.all()
        if user.tenant:
            queryset = Expense.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return Expense.objects.none()


class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific expense.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ExpenseCreateSerializer
        return ExpenseDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Expense.objects.all()
        if user.tenant:
            queryset = Expense.objects.filter(tenant=user.tenant, is_deleted=False)
            if not user.is_tenant_admin and user.branch:
                queryset = queryset.filter(branch=user.branch)
            return queryset
        return Expense.objects.none()

    def perform_destroy(self, instance):
        # Only allow deletion if not approved
        if instance.is_approved:
            raise serializers.ValidationError("Cannot delete approved expenses.")
        instance.is_deleted = True
        instance.save()


class ExpenseApproveView(APIView):
    """
    Approve or reject an expense.
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            expense = Expense.objects.get(pk=pk)
        except Expense.DoesNotExist:
            return Response({'error': 'Expense not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check permission
        user = request.user
        if not user.is_platform_admin and not user.is_tenant_admin:
            if expense.tenant != user.tenant:
                return Response({'error': 'You do not have permission'}, status=status.HTTP_403_FORBIDDEN)
        
        if expense.is_approved:
            return Response({'error': 'Expense already approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ExpenseApproveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        approve = serializer.validated_data['approve']
        
        if approve:
            # Update expense
            expense.is_approved = True
            expense.approved_by = user
            expense.approved_at = timezone.now()
            expense.save()
            
            # Update cash register (deduct expense)
            try:
                register = CashRegister.objects.get(
                    tenant=expense.tenant,
                    branch=expense.branch,
                    currency=expense.currency
                )
                
                balance_before = register.balance
                register.balance -= expense.amount
                register.save()
                
                # Create cash register transaction
                CashRegisterTransaction.objects.create(
                    tenant=expense.tenant,
                    branch=expense.branch,
                    register=register,
                    transaction_type='expense',
                    amount=expense.amount,
                    reference=expense.expense_number,
                    balance_before=balance_before,
                    balance_after=register.balance,
                    notes=f"Expense: {expense.description}",
                    created_by=user
                )
            except CashRegister.DoesNotExist:
                # Create cash register if it doesn't exist
                register = CashRegister.objects.create(
                    tenant=expense.tenant,
                    branch=expense.branch,
                    currency=expense.currency,
                    balance=0,
                    opening_balance=0
                )
                
                # Negative balance for expense
                CashRegisterTransaction.objects.create(
                    tenant=expense.tenant,
                    branch=expense.branch,
                    register=register,
                    transaction_type='expense',
                    amount=expense.amount,
                    reference=expense.expense_number,
                    balance_before=0,
                    balance_after=-expense.amount,
                    notes=f"Expense: {expense.description}",
                    created_by=user
                )
            
            message = 'Expense approved and cash register updated'
        else:
            expense.is_deleted = True
            expense.save()
            message = 'Expense rejected'
        
        return Response({
            'message': message,
            'expense': ExpenseDetailSerializer(expense).data
        })