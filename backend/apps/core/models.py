import uuid
from django.db import models

class BaseModel(models.Model):
    """
    Abstract base model for all tenant-scoped models.
    Provides UUID primary key, timestamps, soft delete, and sync version.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    sync_version = models.IntegerField(default=0)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if self.pk:
            self.sync_version += 1
        super().save(*args, **kwargs)