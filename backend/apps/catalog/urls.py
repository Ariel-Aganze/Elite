from django.urls import path
from .views import (
    CategoryListCreateView, CategoryDetailView,
    BrandListCreateView, BrandDetailView,
    UnitListCreateView, UnitDetailView,
    ProductListCreateView, ProductDetailView, ProductStockView
)

urlpatterns = [
    # Categories
    path('categories/', CategoryListCreateView.as_view(), name='category-list'),
    path('categories/<uuid:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    
    # Brands
    path('brands/', BrandListCreateView.as_view(), name='brand-list'),
    path('brands/<uuid:pk>/', BrandDetailView.as_view(), name='brand-detail'),
    
    # Units
    path('units/', UnitListCreateView.as_view(), name='unit-list'),
    path('units/<uuid:pk>/', UnitDetailView.as_view(), name='unit-detail'),
    
    # Products
    path('products/', ProductListCreateView.as_view(), name='product-list'),
    path('products/<uuid:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/<uuid:pk>/stock/', ProductStockView.as_view(), name='product-stock'),
]