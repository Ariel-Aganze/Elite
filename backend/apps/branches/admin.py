from django.contrib import admin
from .models import Branch

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'tenant', 'city', 'branch_type', 'is_active')
    list_filter = ('tenant', 'branch_type', 'is_active')
    search_fields = ('name', 'code', 'city')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')