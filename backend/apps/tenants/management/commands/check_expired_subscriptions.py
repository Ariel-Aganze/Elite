from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.tenants.models import Tenant

class Command(BaseCommand):
    help = 'Check for expired subscriptions and deactivate tenants'

    def handle(self, *args, **options):
        today = timezone.now().date()
        
        # Find active tenants with expired subscriptions
        expired_tenants = Tenant.objects.filter(
            is_active=True,
            subscription_status='active',
            subscription_end_date__isnull=False,
            subscription_end_date__lt=today
        )
        
        count = expired_tenants.count()
        
        if count > 0:
            self.stdout.write(f"Found {count} expired tenant(s). Deactivating...")
            for tenant in expired_tenants:
                tenant.is_active = False
                tenant.subscription_status = 'expired'
                tenant.save()
                self.stdout.write(f"  - Deactivated: {tenant.name} ({tenant.code})")
        else:
            self.stdout.write("No expired tenants found.")