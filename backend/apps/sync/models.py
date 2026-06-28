from django.db import models
from django.core.validators import MinValueValidator
from apps.core.models import BaseModel
from apps.tenants.models import Tenant
from apps.branches.models import Branch
from apps.users.models import User


class SyncLog(BaseModel):
    """
    Log of sync operations for auditing and debugging.
    """
    SYNC_TYPES = [
        ('pull', 'Pull'),
        ('push', 'Push'),
        ('full', 'Full Sync'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='sync_logs')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, related_name='sync_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sync_logs')
    
    sync_type = models.CharField(max_length=20, choices=SYNC_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Sync details
    client_version = models.CharField(max_length=100, blank=True, help_text="Client app version")
    device_id = models.CharField(max_length=255, blank=True)
    device_name = models.CharField(max_length=255, blank=True)
    
    # Data counts
    records_pulled = models.IntegerField(default=0)
    records_pushed = models.IntegerField(default=0)
    records_failed = models.IntegerField(default=0)
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Error details
    error_message = models.TextField(blank=True)
    error_traceback = models.TextField(blank=True)
    
    class Meta:
        db_table = 'sync_logs'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.get_sync_type_display()} - {self.tenant.name} - {self.started_at}"


class PendingOperation(BaseModel):
    """
    Operations created offline that need to be pushed to the server.
    """
    OPERATION_TYPES = [
        ('sale', 'Sale'),
        ('payment', 'Payment'),
        ('expense', 'Expense'),
        ('customer', 'Customer'),
        ('supplier', 'Supplier'),
        ('product', 'Product'),
        ('stock_adjustment', 'Stock Adjustment'),
        ('transfer', 'Transfer'),
        ('purchase', 'Purchase'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='pending_operations')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='pending_operations')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='pending_operations')
    
    # Operation identification
    operation_type = models.CharField(max_length=20, choices=OPERATION_TYPES)
    operation_id = models.UUIDField(help_text="Client-generated UUID for idempotency")
    client_mutation_id = models.CharField(max_length=100, unique=True, help_text="Unique ID to prevent duplicates")
    
    # Data
    data = models.JSONField(help_text="The operation data to be processed")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Timestamps
    created_at_local = models.DateTimeField(help_text="Timestamp when created offline")
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # Error details
    error_message = models.TextField(blank=True)
    attempt_count = models.IntegerField(default=0)
    
    # Server response
    server_response = models.JSONField(null=True, blank=True)
    
    class Meta:
        db_table = 'pending_operations'
        ordering = ['created_at_local']

    def __str__(self):
        return f"{self.get_operation_type_display()} - {self.client_mutation_id}"