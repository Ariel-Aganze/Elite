from rest_framework import generics, filters, permissions
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.mixins import TenantViewSetMixin
from .models import Supplier, Customer
from .serializers import SupplierSerializer, CustomerSerializer

# ============ Supplier Views ============
class SupplierListCreateView(generics.ListCreateAPIView):
    """
    List all suppliers or create a new supplier.
    """
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['country', 'is_active']
    search_fields = ['name', 'phone', 'email', 'contact_person']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Supplier.objects.all()
        if user.tenant:
            return Supplier.objects.filter(tenant=user.tenant, is_deleted=False)
        return Supplier.objects.none()

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


class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific supplier.
    """
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Supplier.objects.all()
        if user.tenant:
            return Supplier.objects.filter(tenant=user.tenant, is_deleted=False)
        return Supplier.objects.none()

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


# ============ Customer Views ============
class CustomerListCreateView(generics.ListCreateAPIView):
    """
    List all customers or create a new customer.
    """
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['gender', 'is_active', 'city']
    search_fields = ['name', 'phone', 'email']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Customer.objects.all()
        if user.tenant:
            return Customer.objects.filter(tenant=user.tenant, is_deleted=False)
        return Customer.objects.none()

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


class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific customer.
    """
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Customer.objects.all()
        if user.tenant:
            return Customer.objects.filter(tenant=user.tenant, is_deleted=False)
        return Customer.objects.none()

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()