from django.contrib import admin
from .models import Category, Brand, Unit, Product

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'parent', 'is_active', 'order')
    list_filter = ('tenant', 'is_active')
    search_fields = ('name', 'name_en', 'name_fr')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'is_active')
    list_filter = ('tenant', 'is_active')
    search_fields = ('name', 'name_en', 'name_fr')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('name', 'abbreviation', 'tenant', 'is_active')
    list_filter = ('tenant', 'is_active')
    search_fields = ('name', 'name_en', 'name_fr')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'tenant', 'category', 'brand', 'sale_price', 'is_active')
    list_filter = ('tenant', 'category', 'brand', 'is_active')
    search_fields = ('name', 'name_en', 'name_fr', 'sku', 'barcode')
    readonly_fields = ('id', 'created_at', 'updated_at', 'sync_version')
    fieldsets = (
        ('Basic Info', {'fields': ('tenant', 'name', 'name_en', 'name_fr', 'sku', 'barcode')}),
        ('Categorization', {'fields': ('category', 'brand', 'unit')}),
        ('Pricing', {'fields': ('purchase_price', 'sale_price', 'min_price')}),
        ('Stock', {'fields': ('is_stockable', 'min_stock', 'max_stock')}),
        ('Additional', {'fields': ('description', 'image', 'is_active')}),
        ('System', {'fields': ('id', 'created_at', 'updated_at', 'sync_version')}),
    )