import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.models import BaseModel
from apps.tenants.models import Tenant
from apps.branches.models import Branch


class Category(BaseModel):
    """
    Product category with hierarchical structure (parent-child).
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255, null=True, blank=True)
    name_fr = models.CharField(max_length=255, null=True, blank=True)
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='children'
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'categories'
        ordering = ['order', 'name']
        unique_together = [['tenant', 'name']]

    def __str__(self):
        return self.name

    def get_full_path(self):
        """Get the full category path (e.g., Electronics > Phones > Smartphones)"""
        if self.parent:
            return f"{self.parent.get_full_path()} > {self.name}"
        return self.name


class Brand(BaseModel):
    """
    Product brand/manufacturer.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='brands')
    name = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255, null=True, blank=True)
    name_fr = models.CharField(max_length=255, null=True, blank=True)
    logo = models.ImageField(upload_to='brands/', null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'brands'
        ordering = ['name']
        unique_together = [['tenant', 'name']]

    def __str__(self):
        return self.name


class Unit(BaseModel):
    """
    Measurement unit (piece, kg, box, dozen, etc.)
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='units')
    name = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100, null=True, blank=True)
    name_fr = models.CharField(max_length=100, null=True, blank=True)
    abbreviation = models.CharField(max_length=10)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'units'
        ordering = ['name']
        unique_together = [['tenant', 'name']]

    def __str__(self):
        return f"{self.name} ({self.abbreviation})"


class Product(BaseModel):
    """
    Core product catalog with pricing and stock tracking.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='products')
    
    # Basic info
    name = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255, null=True, blank=True)
    name_fr = models.CharField(max_length=255, null=True, blank=True)
    sku = models.CharField(max_length=100, help_text="Unique product code/SKU")
    barcode = models.CharField(max_length=100, blank=True, help_text="Barcode/QR code")
    
    # Categorization
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, related_name='products')
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, related_name='products')
    
    # Pricing (in base currency)
    purchase_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    sale_price = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    min_price = models.DecimalField(max_digits=15, decimal_places=2, default=0, 
                                   help_text="Minimum allowed sale price (for promotions)")
    
    # Additional info
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_stockable = models.BooleanField(default=True, help_text="Does this product track inventory?")
    
    # Stock thresholds
    min_stock = models.IntegerField(default=0, help_text="Minimum stock level alert")
    max_stock = models.IntegerField(default=0, help_text="Maximum stock level")

    class Meta:
        db_table = 'products'
        ordering = ['name']
        unique_together = [['tenant', 'sku']]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    def get_current_stock(self):
        """Get current stock quantity for this product across all branches"""
        # Use the related_name 'stock' from the Stock model
        from apps.inventory.models import Stock
        return Stock.objects.filter(product=self).aggregate(total=models.Sum('quantity'))['total'] or 0
    
    def get_branch_stock(self, branch):
        """Get stock quantity for a specific branch"""
        from apps.inventory.models import Stock
        try:
            stock = Stock.objects.get(product=self, branch=branch)
            return stock.quantity
        except Stock.DoesNotExist:
            return 0