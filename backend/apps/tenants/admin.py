from django.contrib import admin
from .models import Tenant

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'subscription_status', 'is_active', 'created_at')
    list_filter = ('subscription_status', 'is_active')
    search_fields = ('name', 'code', 'email')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')
    fieldsets = (
        (None, {'fields': ('name', 'code', 'email', 'phone', 'address')}),
        ('Subscription', {'fields': ('subscription_status', 'subscription_end_date', 'is_active')}),
        ('System', {'fields': ('id', 'created_at', 'updated_at', 'sync_version')}),
    )