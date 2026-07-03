from django.urls import path
from .views import (
    TenantListView, 
    TenantDetailView, 
    TenantActivationView,
    TenantDashboardView,
    TenantExtendSubscriptionView,
    CurrentTenantView,  # Add this import
)

urlpatterns = [
    path('tenants/', TenantListView.as_view(), name='tenant-list'),
    path('tenants/<uuid:pk>/', TenantDetailView.as_view(), name='tenant-detail'),
    path('tenants/<uuid:pk>/activate/', TenantActivationView.as_view(), name='tenant-activate'),
    path('tenants/<uuid:pk>/extend/', TenantExtendSubscriptionView.as_view(), name='tenant-extend'),
    path('admin/dashboard/', TenantDashboardView.as_view(), name='admin-dashboard'),
    path('tenant/', CurrentTenantView.as_view(), name='current-tenant'),  # Add this route
]