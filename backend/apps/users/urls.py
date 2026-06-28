from django.urls import path, include
from .views import (
    RegisterTenantView, 
    LoginView, 
    UserListCreateView, 
    UserDetailView,
    PermissionTemplatesView
)

urlpatterns = [
    path('auth/register/', RegisterTenantView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('users/', UserListCreateView.as_view(), name='user-list'),
    path('users/<uuid:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('permissions/templates/', PermissionTemplatesView.as_view(), name='permission-templates'),
]