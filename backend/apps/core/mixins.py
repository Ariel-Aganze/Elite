from rest_framework.exceptions import PermissionDenied

class TenantViewSetMixin:
    """
    Mixin to automatically filter querysets by the current user's tenant.
    Also enforces branch-level restriction if the user has a branch assigned.
    """
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Platform admins bypass all tenant restrictions
        if getattr(user, 'is_platform_admin', False):
            return queryset

        # Tenant filtering
        if hasattr(user, 'tenant') and user.tenant:
            queryset = queryset.filter(tenant=user.tenant)
        else:
            return queryset.none()

        # Branch-level filtering for non-tenant-admins
        if not getattr(user, 'is_tenant_admin', False):
            if hasattr(user, 'branch') and user.branch:
                if hasattr(queryset.model, 'branch'):
                    queryset = queryset.filter(branch=user.branch)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_platform_admin:
            # Platform admin must explicitly provide tenant
            tenant = self.request.data.get('tenant')
            if tenant:
                serializer.save(tenant_id=tenant)
            else:
                raise PermissionDenied("Platform admin must specify a tenant.")
        else:
            if not user.tenant:
                raise PermissionDenied("You do not belong to any company.")
            serializer.save(tenant=user.tenant)