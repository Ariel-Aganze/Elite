import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from apps.tenants.models import Tenant
from apps.branches.models import Branch

class User(AbstractUser):
    """
    Custom User model for multi-tenant SaaS.
    Permissions are stored as a JSON list of capability keys.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    phone = models.CharField(max_length=30, blank=True)

    is_tenant_admin = models.BooleanField(default=False)
    is_platform_admin = models.BooleanField(default=False)

    # Flexible permissions: list of capability keys
    permissions = models.JSONField(default=list, blank=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']

    def __str__(self):
        tenant_name = self.tenant.name if self.tenant else 'Platform'
        return f"{self.username} ({tenant_name})"

    def has_perm(self, perm_key):
        """
        Check if the user has a specific capability.
        Platform admins and tenant admins always return True.
        """
        if self.is_platform_admin or self.is_tenant_admin:
            return True
        return perm_key in self.permissions