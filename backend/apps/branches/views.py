from rest_framework import generics, permissions
from apps.core.mixins import TenantViewSetMixin
from apps.core.permissions import IsTenantAdmin, HasCapability
from .models import Branch
from .serializers import BranchSerializer

class BranchListCreateView(generics.ListCreateAPIView):
    """
    List all branches (filtered by tenant) or create a new branch.
    """
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Branch.objects.all()
        if user.tenant:
            return Branch.objects.filter(tenant=user.tenant, is_deleted=False)
        return Branch.objects.none()

    def perform_create(self, serializer):
        if self.request.user.is_platform_admin:
            tenant_id = self.request.data.get('tenant')
            if tenant_id:
                serializer.save(tenant_id=tenant_id)
            else:
                raise serializers.ValidationError("Platform admin must specify a tenant.")
        else:
            serializer.save(tenant=self.request.user.tenant)

class BranchDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific branch.
    """
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Branch.objects.all()
        if user.tenant:
            return Branch.objects.filter(tenant=user.tenant, is_deleted=False)
        return Branch.objects.none()

    def perform_destroy(self, instance):
        # Soft delete
        instance.is_deleted = True
        instance.save()