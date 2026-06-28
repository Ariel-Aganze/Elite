from django.contrib import admin
from .models import Sale, SaleItem, Invoice, Payment, CashRegister, CashRegisterTransaction

class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 1
    fields = ('product', 'quantity', 'unit_price', 'total_price')

class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 1
    fields = ('amount', 'payment_method', 'reference')

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('sale_number', 'branch', 'customer', 'total_amount', 'paid_amount', 'status', 'sale_date')
    list_filter = ('branch', 'status', 'payment_method', 'sale_date')
    search_fields = ('sale_number', 'customer__name', 'notes')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')
    inlines = [SaleItemInline, PaymentInline]
    fieldsets = (
        ('Sale Info', {'fields': ('tenant', 'branch', 'customer', 'sale_number', 'sale_date')}),
        ('Financials', {'fields': ('subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'paid_amount')}),
        ('Payment', {'fields': ('payment_method', 'payment_details', 'currency', 'exchange_rate')}),
        ('Status', {'fields': ('status',)}),
        ('Additional', {'fields': ('notes', 'created_by', 'voided_by', 'voided_at', 'void_reason')}),
        ('System', {'fields': ('id', 'created_at', 'updated_at', 'sync_version')}),
    )

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'sale', 'customer', 'total_amount', 'paid_amount', 'status', 'due_date')
    list_filter = ('branch', 'status', 'invoice_date', 'due_date')
    search_fields = ('invoice_number', 'customer__name')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('payment_number', 'sale', 'amount', 'payment_method', 'payment_date')
    list_filter = ('branch', 'payment_method', 'payment_date')
    search_fields = ('payment_number', 'reference', 'notes')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')

@admin.register(CashRegister)
class CashRegisterAdmin(admin.ModelAdmin):
    list_display = ('branch', 'currency', 'balance', 'opening_balance', 'is_closed')
    list_filter = ('branch', 'currency', 'is_closed')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')

@admin.register(CashRegisterTransaction)
class CashRegisterTransactionAdmin(admin.ModelAdmin):
    list_display = ('branch', 'transaction_type', 'amount', 'balance_before', 'balance_after', 'created_at')
    list_filter = ('branch', 'transaction_type')
    search_fields = ('reference', 'notes')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')