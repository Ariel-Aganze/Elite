from rest_framework.permissions import BasePermission

class HasCapability(BasePermission):
    """
    Permission check for granular capabilities (stored in user.permissions JSONField).
    """
    def __init__(self, required_perm):
        self.required_perm = required_perm

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if getattr(request.user, 'is_platform_admin', False):
            return True
        if getattr(request.user, 'is_tenant_admin', False):
            return True
        return self.required_perm in request.user.permissions

class IsPlatformAdmin(BasePermission):
    """
    Allows access only to platform administrators (our internal staff).
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'is_platform_admin', False)

class IsTenantAdmin(BasePermission):
    """
    Allows access only to tenant administrators.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, 'is_tenant_admin', False)