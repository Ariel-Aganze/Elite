from django.contrib import admin
from .models import PurchaseOrder, PurchaseItem, PurchaseReception, PurchaseReceptionItem

class PurchaseItemInline(admin.TabularInline):
    model = PurchaseItem
    extra = 1
    fields = ('product', 'quantity', 'unit_price', 'total_price')

class PurchaseReceptionItemInline(admin.TabularInline):
    model = PurchaseReceptionItem
    extra = 1
    fields = ('purchase_item', 'product', 'quantity_received', 'quantity_damaged', 'unit_cost')

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'supplier', 'branch', 'total_amount', 'status', 'order_date')
    list_filter = ('status', 'branch', 'supplier', 'order_date')
    search_fields = ('order_number', 'supplier__name', 'notes')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')
    inlines = [PurchaseItemInline]
    fieldsets = (
        ('Order Info', {'fields': ('tenant', 'branch', 'supplier', 'order_number', 'order_date', 'expected_delivery_date')}),
        ('Financials', {'fields': ('subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'paid_amount')}),
        ('Landed Costs', {'fields': ('transport_cost', 'customs_cost', 'handling_cost', 'other_costs', 'landed_cost_total')}),
        ('Status', {'fields': ('status', 'received_by', 'received_at')}),
        ('Additional', {'fields': ('currency', 'exchange_rate', 'notes')}),
        ('System', {'fields': ('id', 'created_at', 'updated_at', 'sync_version')}),
    )

@admin.register(PurchaseReception)
class PurchaseReceptionAdmin(admin.ModelAdmin):
    list_display = ('reception_number', 'purchase_order', 'branch', 'reception_date')
    list_filter = ('branch', 'reception_date')
    search_fields = ('reception_number', 'purchase_order__order_number')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')
    inlines = [PurchaseReceptionItemInline]