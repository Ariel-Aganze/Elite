from rest_framework import serializers
from .models import Category, Brand, Unit, Product

class CategorySerializer(serializers.ModelSerializer):
    full_path = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'name_en', 'name_fr', 'parent', 'full_path',
            'description', 'is_active', 'order', 'children_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']

    def get_full_path(self, obj):
        return obj.get_full_path()
    
    def get_children_count(self, obj):
        return obj.children.filter(is_active=True).count()


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'name_en', 'name_fr', 'logo', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ['id', 'name', 'name_en', 'name_fr', 'abbreviation', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    stock_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'name_en', 'name_fr', 'sku', 'barcode',
            'category', 'category_name', 'brand', 'brand_name',
            'unit', 'unit_name', 'purchase_price', 'sale_price', 'min_price',
            'is_active', 'is_stockable', 'min_stock', 'max_stock',
            'stock_quantity', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']

    def get_stock_quantity(self, obj):
        return obj.get_current_stock()


class ProductDetailSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)
    brand_detail = BrandSerializer(source='brand', read_only=True)
    unit_detail = UnitSerializer(source='unit', read_only=True)
    stock_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'name_en', 'name_fr', 'sku', 'barcode',
            'category', 'category_detail', 'brand', 'brand_detail',
            'unit', 'unit_detail', 'purchase_price', 'sale_price', 'min_price',
            'description', 'image', 'is_active', 'is_stockable',
            'min_stock', 'max_stock', 'stock_quantity',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']

    def get_stock_quantity(self, obj):
        return obj.get_current_stock()


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'name', 'name_en', 'name_fr', 'sku', 'barcode',
            'category', 'brand', 'unit',
            'purchase_price', 'sale_price', 'min_price',
            'description', 'image', 'is_active', 'is_stockable',
            'min_stock', 'max_stock'
        ]