from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

def health_check(request):
    return JsonResponse({'status': 'ok', 'message': 'Elite RDC API is running'})

urlpatterns = [
    path('', health_check, name='health'),
    path('admin/', admin.site.urls),
    # API routes - all under /api/
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.tenants.urls')),
    path('api/', include('apps.branches.urls')),
    path('api/', include('apps.catalog.urls')),
    path('api/', include('apps.partners.urls')),
    path('api/', include('apps.inventory.urls')),
    path('api/', include('apps.purchases.urls')),
    path('api/', include('apps.sales.urls')),
    path('api/', include('apps.expenses.urls')),
    path('api/', include('apps.reports.urls')),
    path('api/', include('apps.sync.urls')),
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]