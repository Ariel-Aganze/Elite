from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from apps.core.models import BaseModel
from apps.tenants.models import Tenant
from apps.branches.models import Branch
from apps.catalog.models import Product
from apps.partners.models import Customer
from apps.users.models import User
from apps.inventory.models import Stock, StockMovement


class Sale(BaseModel):
    """
    Sales transaction record.
    """
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Espèces'),
        ('mobile_money', 'Mobile Money'),
        ('card', 'Carte Bancaire'),
        ('credit', 'Crédit'),
        ('mixed', 'Mixte'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('completed', 'Complétée'),
        ('voided', 'Annulée'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='sales')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='sales')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales')
    
    # Sale identification
    sale_number = models.CharField(max_length=100, unique=True)
    sale_date = models.DateTimeField(auto_now_add=True)
    
    # Financials
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Payment details
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    payment_details = models.JSONField(default=dict, blank=True, help_text="Store payment method specific details")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Currency
    currency = models.CharField(max_length=3, default='USD')
    exchange_rate = models.DecimalField(max_digits=15, decimal_places=4, default=1.0)
    
    # Additional info
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sales_created')
    voided_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales_voided')
    voided_at = models.DateTimeField(null=True, blank=True)
    void_reason = models.TextField(blank=True)
    
    class Meta:
        db_table = 'sales'
        ordering = ['-sale_date']

    def __str__(self):
        return f"SA-{self.sale_number} - {self.customer.name if self.customer else 'Walk-in'}"

    def get_outstanding_balance(self):
        """Get remaining amount to pay"""
        return self.total_amount - self.paid_amount

    def is_fully_paid(self):
        """Check if sale is fully paid"""
        return self.paid_amount >= self.total_amount

    def save(self, *args, **kwargs):
        # If paid_amount >= total_amount, consider it fully paid
        if self.paid_amount >= self.total_amount and self.status == 'completed':
            # Could trigger invoice status update if needed
            pass
        super().save(*args, **kwargs)


class SaleItem(BaseModel):
    """
    Individual items in a sale.
    """
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sale_items')
    
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=15, decimal_places=2)
    total_price = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Cost information (for profit calculation)
    unit_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Discount per item
    discount_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    class Meta:
        db_table = 'sale_items'
        ordering = ['id']

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    def calculate_profit(self):
        """Calculate profit for this item"""
        return self.total_price - self.total_cost


class Invoice(BaseModel):
    """
    Invoice generated from a sale.
    """
    INVOICE_STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('sent', 'Envoyée'),
        ('partially_paid', 'Partiellement Payée'),
        ('paid', 'Payée'),
        ('overdue', 'En Retard'),
        ('cancelled', 'Annulée'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='invoices')
    sale = models.OneToOneField(Sale, on_delete=models.CASCADE, related_name='invoice')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='invoices')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, related_name='invoices')
    
    # Invoice identification
    invoice_number = models.CharField(max_length=100, unique=True)
    invoice_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    
    # Financials
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=20, choices=INVOICE_STATUS_CHOICES, default='draft')
    
    # Additional info
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'invoices'
        ordering = ['-invoice_date']

    def __str__(self):
        return f"INV-{self.invoice_number}"

    def get_outstanding_balance(self):
        """Get remaining amount to pay"""
        return self.total_amount - self.paid_amount

    def is_overdue(self):
        """Check if invoice is overdue"""
        if self.status in ['paid', 'cancelled']:
            return False
        return timezone.now().date() > self.due_date

    def save(self, *args, **kwargs):
        # Auto-update status based on payment
        if self.paid_amount >= self.total_amount:
            self.status = 'paid'
        elif self.paid_amount > 0:
            self.status = 'partially_paid'
        elif self.is_overdue():
            self.status = 'overdue'
        super().save(*args, **kwargs)


class Payment(BaseModel):
    """
    Payment received against a sale/invoice.
    """
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Espèces'),
        ('mobile_money', 'Mobile Money'),
        ('card', 'Carte Bancaire'),
        ('credit', 'Crédit'),
        ('bank_transfer', 'Virement Bancaire'),
        ('check', 'Chèque'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='payments')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='payments')
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='payments')
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, related_name='payments')
    
    # Payment details
    payment_number = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    
    # Payment reference (transaction ID, check number, etc.)
    reference = models.CharField(max_length=100, blank=True)
    
    # Additional info
    notes = models.TextField(blank=True)
    received_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='payments_received')
    
    class Meta:
        db_table = 'payments'
        ordering = ['-payment_date']

    def __str__(self):
        return f"PAY-{self.payment_number} - {self.amount}"


class CashRegister(BaseModel):
    """
    Cash register balance per branch.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='cash_registers')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='cash_registers')
    
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    opening_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    # Currency
    currency = models.CharField(max_length=3, default='USD')
    
    # Opening and closing
    opening_date = models.DateField(auto_now_add=True)
    closing_date = models.DateField(null=True, blank=True)
    closing_balance = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    is_closed = models.BooleanField(default=False)
    
    # Last reconciliation
    last_reconciled_at = models.DateTimeField(null=True, blank=True)
    last_reconciled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reconciled_registers')
    
    class Meta:
        db_table = 'cash_registers'
        unique_together = [['tenant', 'branch', 'currency']]
        ordering = ['-opening_date']

    def __str__(self):
        return f"{self.branch.name} - {self.currency}: {self.balance}"

    def add_transaction(self, amount, transaction_type='in'):
        """Add a transaction to the register"""
        if transaction_type == 'in':
            self.balance += amount
        else:
            self.balance -= amount
        self.save()


class CashRegisterTransaction(BaseModel):
    """
    Individual transaction in a cash register.
    """
    TRANSACTION_TYPES = [
        ('sale', 'Vente'),
        ('payment', 'Paiement'),
        ('expense', 'Dépense'),
        ('adjustment', 'Ajustement'),
        ('deposit', 'Dépôt'),
        ('withdrawal', 'Retrait'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='register_transactions')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='register_transactions')
    register = models.ForeignKey(CashRegister, on_delete=models.CASCADE, related_name='transactions')
    
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Reference to source document
    reference = models.CharField(max_length=100, blank=True)
    reference_id = models.UUIDField(null=True, blank=True)
    
    # Before and after balance
    balance_before = models.DecimalField(max_digits=15, decimal_places=2)
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    
    # Additional info
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='register_transactions')
    
    class Meta:
        db_table = 'cash_register_transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.amount}"