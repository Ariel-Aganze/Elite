from django.urls import path
from .views import (
    StockListView,
    StockMovementListView,
    StockLowStockView,
    TransferListCreateView,
    TransferDetailView,
    TransferApproveView,
    TransferDispatchView,
    TransferReceiveView,
    InventoryAdjustmentListCreateView,
    InventoryAdjustmentDetailView,
    InventoryAdjustmentApproveView,
    StockLossListCreateView,
    StockLossDetailView,
    StockLossApproveView
)

urlpatterns = [
    # Stock
    path('stock/', StockListView.as_view(), name='stock-list'),
    path('stock/movements/', StockMovementListView.as_view(), name='stock-movement-list'),
    path('stock/low-stock/', StockLowStockView.as_view(), name='stock-low-stock'),
    
    # Transfers
    path('transfers/', TransferListCreateView.as_view(), name='transfer-list'),
    path('transfers/<uuid:pk>/', TransferDetailView.as_view(), name='transfer-detail'),
    path('transfers/<uuid:pk>/approve/', TransferApproveView.as_view(), name='transfer-approve'),
    path('transfers/<uuid:pk>/dispatch/', TransferDispatchView.as_view(), name='transfer-dispatch'),
    path('transfers/<uuid:pk>/receive/', TransferReceiveView.as_view(), name='transfer-receive'),
    
    # Inventory Adjustments
    path('adjustments/', InventoryAdjustmentListCreateView.as_view(), name='adjustment-list'),
    path('adjustments/<uuid:pk>/', InventoryAdjustmentDetailView.as_view(), name='adjustment-detail'),
    path('adjustments/<uuid:pk>/approve/', InventoryAdjustmentApproveView.as_view(), name='adjustment-approve'),
    
    # Stock Losses
    path('losses/', StockLossListCreateView.as_view(), name='loss-list'),
    path('losses/<uuid:pk>/', StockLossDetailView.as_view(), name='loss-detail'),
    path('losses/<uuid:pk>/approve/', StockLossApproveView.as_view(), name='loss-approve'),
]