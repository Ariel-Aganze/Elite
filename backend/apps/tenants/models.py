import uuid
from django.db import models
from apps.core.models import BaseModel

class Tenant(BaseModel):
    """
    Represents a client company (tenant) in the multi-tenant SaaS.
    """
    SUBSCRIPTION_STATUS_CHOICES = [
        ('pending', 'Pending Activation'),
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('suspended', 'Suspended'),
    ]

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True, help_text="Short unique code, e.g., ELITE-KIN")
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    address = models.TextField(blank=True)

    subscription_status = models.CharField(
        max_length=20,
        choices=SUBSCRIPTION_STATUS_CHOICES,
        default='pending'
    )
    subscription_end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=False)

    class Meta:
        db_table = 'tenants'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.code})"