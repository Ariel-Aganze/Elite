from django.contrib import admin
from .models import SyncLog, PendingOperation

@admin.register(SyncLog)
class SyncLogAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'branch', 'user', 'sync_type', 'status', 'started_at')
    list_filter = ('tenant', 'sync_type', 'status')
    search_fields = ('device_id', 'device_name', 'error_message')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')

@admin.register(PendingOperation)
class PendingOperationAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'branch', 'operation_type', 'status', 'client_mutation_id', 'created_at_local')
    list_filter = ('tenant', 'branch', 'operation_type', 'status')
    search_fields = ('client_mutation_id', 'error_message')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')