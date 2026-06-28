from django.contrib import admin
from .models import Supplier, Customer

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'phone', 'email', 'country', 'is_active')
    list_filter = ('tenant', 'country', 'is_active')
    search_fields = ('name', 'phone', 'email', 'contact_person')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'phone', 'email', 'city', 'is_active')
    list_filter = ('tenant', 'gender', 'is_active')
    search_fields = ('name', 'phone', 'email')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')