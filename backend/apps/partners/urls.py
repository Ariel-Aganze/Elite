from django.urls import path
from .views import (
    SupplierListCreateView, SupplierDetailView,
    CustomerListCreateView, CustomerDetailView
)

urlpatterns = [
    # Suppliers
    path('suppliers/', SupplierListCreateView.as_view(), name='supplier-list'),
    path('suppliers/<uuid:pk>/', SupplierDetailView.as_view(), name='supplier-detail'),
    
    # Customers
    path('customers/', CustomerListCreateView.as_view(), name='customer-list'),
    path('customers/<uuid:pk>/', CustomerDetailView.as_view(), name='customer-detail'),
]