from django.contrib import admin
from .models import ExpenseCategory, Expense

@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'is_active')
    list_filter = ('tenant', 'is_active')
    search_fields = ('name', 'name_en', 'name_fr')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('expense_number', 'branch', 'category', 'amount', 'expense_date', 'is_approved')
    list_filter = ('branch', 'category', 'is_approved', 'currency')
    search_fields = ('expense_number', 'description', 'notes')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')
    fieldsets = (
        ('Expense Info', {'fields': ('tenant', 'branch', 'category', 'expense_number', 'expense_date')}),
        ('Amount', {'fields': ('amount', 'currency', 'exchange_rate')}),
        ('Details', {'fields': ('description', 'notes', 'receipt')}),
        ('Approval', {'fields': ('is_approved', 'approved_by', 'approved_at')}),
        ('Created By', {'fields': ('created_by',)}),
        ('System', {'fields': ('id', 'created_at', 'updated_at', 'sync_version')}),
    )