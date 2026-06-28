import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator
from apps.core.models import BaseModel
from apps.tenants.models import Tenant
from apps.branches.models import Branch
from apps.catalog.models import Product
from apps.partners.models import Supplier

class PurchaseOrder(BaseModel):
    """
    Purchase order from a supplier.
    """
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('ordered', 'Commandé'),
        ('in_transit', 'En Transit'),
        ('received', 'Réceptionné'),
        ('cancelled', 'Annulé'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='purchases')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='purchases')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchases')
    
    # Order identification
    order_number = models.CharField(max_length=100, unique=True)
    order_date = models.DateField(auto_now_add=True)
    expected_delivery_date = models.DateField(null=True, blank=True)
    
    # Financials
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Landed costs (additional costs to get goods to warehouse)
    transport_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    customs_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    handling_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    other_costs = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    landed_cost_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Currency
    currency = models.CharField(max_length=3, default='USD')
    exchange_rate = models.DecimalField(max_digits=15, decimal_places=4, default=1.0)
    
    # Additional info
    notes = models.TextField(blank=True)
    received_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='received_purchases')
    received_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'purchase_orders'
        ordering = ['-order_date']

    def __str__(self):
        return f"PO-{self.order_number} - {self.supplier.name}"

    def get_total_landed_cost(self):
        """Calculate total landed cost including all additional fees"""
        return self.transport_cost + self.customs_cost + self.handling_cost + self.other_costs

    def get_outstanding_balance(self):
        """Get remaining amount to pay"""
        return self.total_amount - self.paid_amount

    def save(self, *args, **kwargs):
        # Calculate totals before saving
        if not self.landed_cost_total:
            self.landed_cost_total = self.get_total_landed_cost()
        super().save(*args, **kwargs)


class PurchaseItem(BaseModel):
    """
    Individual items in a purchase order.
    """
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='purchase_items')
    
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    received_quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    # Pricing
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    total_price = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Landed cost allocation (per unit)
    landed_cost_per_unit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Final cost after landed cost allocation
    final_unit_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    class Meta:
        db_table = 'purchase_items'
        ordering = ['id']

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    def save(self, *args, **kwargs):
        # Calculate total price
        if not self.total_price:
            self.total_price = self.quantity * self.unit_price
        
        # Calculate final unit cost including landed costs
        if self.quantity > 0:
            self.final_unit_cost = self.unit_price + self.landed_cost_per_unit
        
        super().save(*args, **kwargs)


class PurchaseReception(BaseModel):
    """
    Record of goods received against a purchase order.
    """
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='receptions')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='receptions')
    
    reception_number = models.CharField(max_length=100, unique=True)
    reception_date = models.DateTimeField(auto_now_add=True)
    
    # Received by
    received_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='receptions')
    
    # Notes
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'purchase_receptions'
        ordering = ['-reception_date']

    def __str__(self):
        return f"REC-{self.reception_number}"


class PurchaseReceptionItem(BaseModel):
    """
    Individual items received in a reception.
    """
    reception = models.ForeignKey(PurchaseReception, on_delete=models.CASCADE, related_name='items')
    purchase_item = models.ForeignKey(PurchaseItem, on_delete=models.CASCADE, related_name='reception_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reception_items')
    
    quantity_received = models.IntegerField(validators=[MinValueValidator(1)])
    quantity_damaged = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    quantity_accepted = models.IntegerField(validators=[MinValueValidator(0)])
    
    unit_cost = models.DecimalField(max_digits=15, decimal_places=2)
    total_cost = models.DecimalField(max_digits=15, decimal_places=2)
    
    class Meta:
        db_table = 'purchase_reception_items'
        ordering = ['id']

    def save(self, *args, **kwargs):
        # Calculate accepted quantity
        self.quantity_accepted = self.quantity_received - self.quantity_damaged
        
        # Calculate total cost
        self.total_cost = self.quantity_accepted * self.unit_cost
        
        super().save(*args, **kwargs)