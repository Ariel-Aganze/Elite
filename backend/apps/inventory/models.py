from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from apps.core.models import BaseModel
from apps.tenants.models import Tenant
from apps.branches.models import Branch
from apps.catalog.models import Product
from apps.users.models import User

class Stock(BaseModel):
    """
    Current stock level for a product at a specific branch.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='stock')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='stock')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock')  # This is the key
    
    quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    reserved_quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    # Average cost for accounting
    average_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    class Meta:
        db_table = 'stock'
        unique_together = [['tenant', 'branch', 'product']]
        ordering = ['product__name']

    def __str__(self):
        return f"{self.product.name} - {self.branch.name}: {self.quantity}"

    def get_available_quantity(self):
        """Get available quantity (not reserved)"""
        return self.quantity - self.reserved_quantity

    def get_total_value(self):
        """Get total value of stock at average cost"""
        return self.quantity * self.average_cost


class StockMovement(BaseModel):
    """
    Record of every stock movement (in, out, adjustment).
    """
    MOVEMENT_TYPES = [
        ('in', 'Entrée'),
        ('out', 'Sortie'),
        ('adjustment', 'Ajustement'),
        ('transfer_in', 'Transfert Entrant'),
        ('transfer_out', 'Transfert Sortant'),
        ('return', 'Retour'),
        ('loss', 'Perte'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='stock_movements')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='stock_movements')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements')
    
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    
    # Cost information
    unit_cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    total_cost = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    # Reference to the source document
    reference = models.CharField(max_length=100, blank=True)
    
    # Additional info
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='stock_movements')
    
    class Meta:
        db_table = 'stock_movements'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_movement_type_display()} - {self.product.name}: {self.quantity}"


class Transfer(BaseModel):
    """
    Stock transfer between branches.
    """
    TRANSFER_STATUS_CHOICES = [
        ('requested', 'Demandé'),
        ('approved', 'Approuvé'),
        ('dispatched', 'Expédié'),
        ('received', 'Réceptionné'),
        ('cancelled', 'Annulé'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='transfers')
    from_branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='transfers_out')
    to_branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='transfers_in')
    
    transfer_number = models.CharField(max_length=100, unique=True)
    transfer_date = models.DateField(auto_now_add=True)
    
    # Status
    status = models.CharField(max_length=20, choices=TRANSFER_STATUS_CHOICES, default='requested')
    
    # Notes
    notes = models.TextField(blank=True)
    
    # Approvals
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='transfer_requests')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='transfer_approvals')
    dispatched_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='transfer_dispatches')
    received_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='transfer_receptions')
    
    # Timestamps
    approved_at = models.DateTimeField(null=True, blank=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'transfers'
        ordering = ['-created_at']

    def __str__(self):
        return f"TR-{self.transfer_number} - {self.from_branch.name} to {self.to_branch.name}"

    def get_total_quantity(self):
        """Get total quantity being transferred"""
        return self.items.aggregate(total=models.Sum('quantity'))['total'] or 0


class TransferItem(BaseModel):
    """
    Individual items in a transfer.
    """
    transfer = models.ForeignKey(Transfer, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='transfer_items')
    
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    received_quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    # Cost information (for accounting)
    unit_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    class Meta:
        db_table = 'transfer_items'
        ordering = ['id']

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class InventoryAdjustment(BaseModel):
    """
    Manual inventory adjustment (count, correction).
    """
    ADJUSTMENT_TYPES = [
        ('increase', 'Augmentation'),
        ('decrease', 'Diminution'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='adjustments')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='adjustments')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='adjustments')
    
    adjustment_type = models.CharField(max_length=20, choices=ADJUSTMENT_TYPES)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    
    old_quantity = models.IntegerField()
    new_quantity = models.IntegerField()
    
    reason = models.TextField()
    
    # Approval
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approved_adjustments')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Created by
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='adjustments')
    
    class Meta:
        db_table = 'inventory_adjustments'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_adjustment_type_display()} - {self.product.name}: {self.quantity}"


class StockLoss(BaseModel):
    """
    Stock losses due to damage, theft, expiry, etc.
    """
    LOSS_TYPES = [
        ('damaged', 'Cassé/Endommagé'),
        ('lost', 'Perdu'),
        ('stolen', 'Volé'),
        ('expired', 'Expiré'),
        ('other', 'Autre'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='stock_losses')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='stock_losses')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_losses')
    
    loss_type = models.CharField(max_length=20, choices=LOSS_TYPES)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    
    # Cost information
    unit_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Details
    reason = models.TextField()
    notes = models.TextField(blank=True)
    
    # Approval
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approved_losses')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Created by
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='stock_losses')
    
    class Meta:
        db_table = 'stock_losses'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_loss_type_display()} - {self.product.name}: {self.quantity}"