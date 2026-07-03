from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'phone', 'tenant', 'branch', 
                    'is_tenant_admin', 'is_platform_admin', 'is_active', 'is_staff', 'is_superuser')
    list_filter = ('tenant', 'is_tenant_admin', 'is_platform_admin', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email', 'phone', 'first_name', 'last_name')
    readonly_fields = ('id', 'date_joined', 'last_login')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email', 'phone')}),
        ('Tenant & Branch', {'fields': ('tenant', 'branch')}),
        ('Permissions', {'fields': (
            'is_tenant_admin', 
            'is_platform_admin', 
            'permissions', 
            'is_active', 
            'is_staff', 
            'is_superuser', 
            'groups', 
            'user_permissions'
        )}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
        ('System', {'fields': ('id',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'phone', 'password1', 'password2', 'tenant', 'branch'),
        }),
    )

    filter_horizontal = ('groups', 'user_permissions')