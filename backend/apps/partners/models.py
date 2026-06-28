import uuid
from django.db import models
from apps.core.models import BaseModel
from apps.tenants.models import Tenant

class Supplier(BaseModel):
    """
    Supplier/Vendor management.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='suppliers')
    
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    
    tax_id = models.CharField(max_length=50, blank=True, help_text="Tax identification number")
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'suppliers'
        ordering = ['name']
        unique_together = [['tenant', 'name']]

    def __str__(self):
        return self.name

    def get_outstanding_balance(self):
        """Get total amount owed to this supplier"""
        return self.purchases.aggregate(
            total=models.Sum('total_amount') - models.Sum('paid_amount')
        )['total'] or 0


class Customer(BaseModel):
    """
    Customer/Client management.
    """
    GENDER_CHOICES = [
        ('male', 'Masculin'),
        ('female', 'Féminin'),
        ('other', 'Autre'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='customers')
    
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'customers'
        ordering = ['name']
        unique_together = [['tenant', 'phone']]

    def __str__(self):
        return self.name

    def get_outstanding_balance(self):
        """Get total amount owed by this customer"""
        return self.sales.aggregate(
            total=models.Sum('total_amount') - models.Sum('paid_amount')
        )['total'] or 0