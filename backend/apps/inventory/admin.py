from django.contrib import admin
from .models import Stock, StockMovement, Transfer, TransferItem, InventoryAdjustment, StockLoss

class TransferItemInline(admin.TabularInline):
    model = TransferItem
    extra = 1
    fields = ('product', 'quantity', 'received_quantity', 'unit_cost')

@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('product', 'branch', 'tenant', 'quantity', 'reserved_quantity', 'average_cost')
    list_filter = ('tenant', 'branch')
    search_fields = ('product__name', 'product__sku')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'branch', 'movement_type', 'quantity', 'reference', 'created_at')
    list_filter = ('tenant', 'branch', 'movement_type')
    search_fields = ('product__name', 'reference', 'notes')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')

@admin.register(Transfer)
class TransferAdmin(admin.ModelAdmin):
    list_display = ('transfer_number', 'from_branch', 'to_branch', 'status', 'created_at')
    list_filter = ('tenant', 'from_branch', 'to_branch', 'status')
    search_fields = ('transfer_number', 'notes')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')
    inlines = [TransferItemInline]
    fieldsets = (
        ('Transfer Info', {'fields': ('tenant', 'from_branch', 'to_branch', 'transfer_number')}),
        ('Status', {'fields': ('status',)}),
        ('Approvals', {'fields': ('requested_by', 'approved_by', 'approved_at', 'dispatched_by', 'dispatched_at', 'received_by', 'received_at')}),
        ('Additional', {'fields': ('notes',)}),
        ('System', {'fields': ('id', 'created_at', 'updated_at', 'sync_version')}),
    )

@admin.register(InventoryAdjustment)
class InventoryAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('product', 'branch', 'adjustment_type', 'quantity', 'is_approved', 'created_at')
    list_filter = ('tenant', 'branch', 'adjustment_type', 'is_approved')
    search_fields = ('product__name', 'reason')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')

@admin.register(StockLoss)
class StockLossAdmin(admin.ModelAdmin):
    list_display = ('product', 'branch', 'loss_type', 'quantity', 'total_cost', 'is_approved', 'created_at')
    list_filter = ('tenant', 'branch', 'loss_type', 'is_approved')
    search_fields = ('product__name', 'reason', 'notes')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')