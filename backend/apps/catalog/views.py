from rest_framework import generics, filters, permissions, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from apps.core.mixins import TenantViewSetMixin
from apps.core.permissions import HasCapability, IsTenantAdmin
from .models import Category, Brand, Unit, Product
from .serializers import (
    CategorySerializer, BrandSerializer, UnitSerializer,
    ProductListSerializer, ProductDetailSerializer, ProductCreateUpdateSerializer
)

# ============ Category Views ============
class CategoryListCreateView(generics.ListCreateAPIView):
    """
    List all categories or create a new category.
    """
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'parent']
    search_fields = ['name', 'name_en', 'name_fr']
    ordering_fields = ['name', 'order', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Category.objects.all()
        if user.tenant:
            return Category.objects.filter(tenant=user.tenant, is_deleted=False)
        return Category.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_platform_admin:
            tenant_id = self.request.data.get('tenant')
            if tenant_id:
                from apps.tenants.models import Tenant
                tenant = Tenant.objects.get(id=tenant_id)
                serializer.save(tenant=tenant)
            else:
                raise serializers.ValidationError("Platform admin must specify a tenant.")
        else:
            serializer.save(tenant=user.tenant)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific category.
    """
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Category.objects.all()
        if user.tenant:
            return Category.objects.filter(tenant=user.tenant, is_deleted=False)
        return Category.objects.none()

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


# ============ Brand Views ============
class BrandListCreateView(generics.ListCreateAPIView):
    """
    List all brands or create a new brand.
    """
    serializer_class = BrandSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'name_en', 'name_fr']

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Brand.objects.all()
        if user.tenant:
            return Brand.objects.filter(tenant=user.tenant, is_deleted=False)
        return Brand.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_platform_admin:
            tenant_id = self.request.data.get('tenant')
            if tenant_id:
                from apps.tenants.models import Tenant
                tenant = Tenant.objects.get(id=tenant_id)
                serializer.save(tenant=tenant)
            else:
                raise serializers.ValidationError("Platform admin must specify a tenant.")
        else:
            serializer.save(tenant=user.tenant)


class BrandDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific brand.
    """
    serializer_class = BrandSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Brand.objects.all()
        if user.tenant:
            return Brand.objects.filter(tenant=user.tenant, is_deleted=False)
        return Brand.objects.none()

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


# ============ Unit Views ============
class UnitListCreateView(generics.ListCreateAPIView):
    """
    List all units or create a new unit.
    """
    serializer_class = UnitSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'name_en', 'name_fr', 'abbreviation']

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Unit.objects.all()
        if user.tenant:
            return Unit.objects.filter(tenant=user.tenant, is_deleted=False)
        return Unit.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_platform_admin:
            tenant_id = self.request.data.get('tenant')
            if tenant_id:
                from apps.tenants.models import Tenant
                tenant = Tenant.objects.get(id=tenant_id)
                serializer.save(tenant=tenant)
            else:
                raise serializers.ValidationError("Platform admin must specify a tenant.")
        else:
            serializer.save(tenant=user.tenant)


class UnitDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific unit.
    """
    serializer_class = UnitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Unit.objects.all()
        if user.tenant:
            return Unit.objects.filter(tenant=user.tenant, is_deleted=False)
        return Unit.objects.none()

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


# ============ Product Views ============
class ProductListCreateView(generics.ListCreateAPIView):
    """
    List all products or create a new product.
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'brand', 'unit', 'is_active', 'is_stockable']
    search_fields = ['name', 'name_en', 'name_fr', 'sku', 'barcode']
    ordering_fields = ['name', 'sale_price', 'created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateUpdateSerializer
        return ProductListSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Product.objects.filter(is_deleted=False)
        
        if user.is_platform_admin:
            return queryset
        
        if user.tenant:
            queryset = queryset.filter(tenant=user.tenant)
            # If user has a specific branch, we don't filter products by branch
            # Products are global to tenant, stock is per branch
            return queryset
        
        return Product.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_platform_admin:
            tenant_id = self.request.data.get('tenant')
            if tenant_id:
                from apps.tenants.models import Tenant
                tenant = Tenant.objects.get(id=tenant_id)
                serializer.save(tenant=tenant)
            else:
                raise serializers.ValidationError("Platform admin must specify a tenant.")
        else:
            serializer.save(tenant=user.tenant)


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific product.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Product.objects.all()
        if user.tenant:
            return Product.objects.filter(tenant=user.tenant, is_deleted=False)
        return Product.objects.none()

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


class ProductStockView(generics.RetrieveAPIView):
    """
    Get stock information for a specific product across all branches.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return Product.objects.all()
        if user.tenant:
            return Product.objects.filter(tenant=user.tenant, is_deleted=False)
        return Product.objects.none()

    def get(self, request, pk):
        try:
            product = self.get_queryset().get(pk=pk)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        stock_data = []
        total_quantity = 0
        
        for stock in product.stock_set.filter(is_deleted=False):
            stock_data.append({
                'branch_id': str(stock.branch.id),
                'branch_name': stock.branch.name,
                'quantity': stock.quantity,
                'reserved_quantity': stock.reserved_quantity,
                'available_quantity': stock.quantity - stock.reserved_quantity,
            })
            total_quantity += stock.quantity

        return Response({
            'product_id': str(product.id),
            'product_name': product.name,
            'sku': product.sku,
            'total_quantity': total_quantity,
            'branch_stock': stock_data
        })