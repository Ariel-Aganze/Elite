from django.db import models
from apps.core.models import BaseModel
from apps.tenants.models import Tenant

class Branch(BaseModel):
    """
    A branch/depot/store belonging to a tenant.
    """
    BRANCH_TYPE_CHOICES = [
        ('central', 'Dépôt Central'),
        ('shop', 'Boutique'),
        ('agency', 'Agence'),
        ('pos', 'Point de Vente'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    branch_type = models.CharField(max_length=20, choices=BRANCH_TYPE_CHOICES, default='shop')
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    manager = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'branches'
        unique_together = [['tenant', 'code']]
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"