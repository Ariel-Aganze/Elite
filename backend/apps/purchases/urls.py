from django.urls import path
from .views import (
    PurchaseOrderListCreateView,
    PurchaseOrderDetailView,
    PurchaseOrderUpdateStatusView,
    PurchaseReceptionView,
    PurchaseReceptionListView,
    PurchaseReceptionDetailView
)

urlpatterns = [
    # Purchase Orders
    path('purchases/', PurchaseOrderListCreateView.as_view(), name='purchase-list'),
    path('purchases/<uuid:pk>/', PurchaseOrderDetailView.as_view(), name='purchase-detail'),
    path('purchases/<uuid:pk>/update-status/', PurchaseOrderUpdateStatusView.as_view(), name='purchase-update-status'),
    
    # Purchase Receptions
    path('purchases/receptions/', PurchaseReceptionListView.as_view(), name='reception-list'),
    path('purchases/receptions/<uuid:pk>/', PurchaseReceptionDetailView.as_view(), name='reception-detail'),
    path('purchases/receive/', PurchaseReceptionView.as_view(), name='purchase-receive'),
]