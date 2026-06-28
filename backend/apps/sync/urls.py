from django.urls import path
from .views import (
    PullSyncView,
    PushSyncView,
    SyncStatusView,
    SyncLogListView,
    PendingOperationListView,
    PendingOperationDetailView
)

urlpatterns = [
    # Sync endpoints
    path('sync/pull/', PullSyncView.as_view(), name='sync-pull'),
    path('sync/push/', PushSyncView.as_view(), name='sync-push'),
    path('sync/status/', SyncStatusView.as_view(), name='sync-status'),
    
    # Sync logs
    path('sync/logs/', SyncLogListView.as_view(), name='sync-logs'),
    
    # Pending operations
    path('sync/pending/', PendingOperationListView.as_view(), name='pending-operations'),
    path('sync/pending/<uuid:pk>/', PendingOperationDetailView.as_view(), name='pending-operation-detail'),
]