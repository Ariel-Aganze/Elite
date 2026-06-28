from django.db import models
from django.core.validators import MinValueValidator
from apps.core.models import BaseModel
from apps.tenants.models import Tenant
from apps.branches.models import Branch
from apps.users.models import User


class ExpenseCategory(BaseModel):
    """
    Expense categories for classification.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='expense_categories')
    name = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255, null=True, blank=True)
    name_fr = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'expense_categories'
        ordering = ['name']
        unique_together = [['tenant', 'name']]

    def __str__(self):
        return self.name


class Expense(BaseModel):
    """
    Operational expenses recorded per branch.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='expenses')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='expenses')
    category = models.ForeignKey(ExpenseCategory, on_delete=models.SET_NULL, null=True, related_name='expenses')
    
    # Expense details
    expense_number = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    expense_date = models.DateField(auto_now_add=True)
    
    # Description
    description = models.TextField()
    notes = models.TextField(blank=True)
    
    # Currency
    currency = models.CharField(max_length=3, default='USD')
    exchange_rate = models.DecimalField(max_digits=15, decimal_places=4, default=1.0)
    
    # Status
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='approved_expenses')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Created by
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='expenses_created')
    
    # Receipt
    receipt = models.FileField(upload_to='expenses/receipts/', null=True, blank=True)
    
    class Meta:
        db_table = 'expenses'
        ordering = ['-expense_date']

    def __str__(self):
        return f"EXP-{self.expense_number} - {self.amount}"

    def save(self, *args, **kwargs):
        if not self.expense_number:
            from datetime import datetime
            import random
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            random_num = random.randint(1000, 9999)
            self.expense_number = f"EXP-{timestamp}-{random_num}"
        super().save(*args, **kwargs)