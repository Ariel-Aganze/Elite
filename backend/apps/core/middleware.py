from django.utils.deprecation import MiddlewareMixin

class TenantMiddleware(MiddlewareMixin):
    """
    Attach the tenant to the request object for easy access in views.
    The tenant is derived from the authenticated user.
    """
    def process_request(self, request):
        if hasattr(request, 'user') and request.user.is_authenticated:
            if getattr(request.user, 'is_platform_admin', False):
                request.tenant = None
            else:
                request.tenant = getattr(request.user, 'tenant', None)
        else:
            request.tenant = None