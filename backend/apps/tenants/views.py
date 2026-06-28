from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import timedelta
from apps.core.permissions import IsPlatformAdmin
from apps.users.models import User
from apps.branches.models import Branch
from .models import Tenant
from .serializers import TenantSerializer, TenantActivationSerializer, TenantDashboardSerializer

class TenantListView(generics.ListAPIView):
    """
    List all tenants with filtering options (Platform Admin only).
    """
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]

    def get_queryset(self):
        queryset = Tenant.objects.all()
        
        # Filter by subscription status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(subscription_status=status_filter)
        
        # Filter by active/inactive
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search by name or code
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(code__icontains=search) | Q(email__icontains=search)
            )
        
        return queryset.order_by('-created_at')

class TenantDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update a specific tenant (Platform Admin only).
    """
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]

class TenantActivationView(APIView):
    """
    Activate or deactivate a tenant (Platform Admin only).
    """
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]

    def post(self, request, pk):
        try:
            tenant = Tenant.objects.get(pk=pk)
        except Tenant.DoesNotExist:
            return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = TenantActivationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tenant.is_active = serializer.validated_data['is_active']
        tenant.subscription_status = serializer.validated_data['subscription_status']
        
        if serializer.validated_data.get('subscription_end_date'):
            tenant.subscription_end_date = serializer.validated_data['subscription_end_date']
        elif tenant.is_active and tenant.subscription_status == 'active':
            # If activating and no end date provided, set to 30 days from now
            tenant.subscription_end_date = timezone.now().date() + timedelta(days=30)
        
        tenant.save()

        return Response({
            'message': f'Tenant {tenant.name} has been {"activated" if tenant.is_active else "deactivated"}.',
            'tenant': TenantSerializer(tenant).data
        })

class TenantDashboardView(APIView):
    """
    Get platform-wide statistics for the admin dashboard.
    """
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]

    def get(self, request):
        total_tenants = Tenant.objects.count()
        active_tenants = Tenant.objects.filter(is_active=True).count()
        pending_tenants = Tenant.objects.filter(subscription_status='pending').count()
        expired_tenants = Tenant.objects.filter(subscription_status='expired').count()
        
        # Tenants expiring in the next 7 days
        today = timezone.now().date()
        expiring_soon = Tenant.objects.filter(
            is_active=True,
            subscription_end_date__isnull=False,
            subscription_end_date__gte=today,
            subscription_end_date__lte=today + timedelta(days=7)
        ).count()
        
        # Total users across all tenants
        total_users = User.objects.filter(tenant__isnull=False).count()
        total_branches = Branch.objects.filter(tenant__isnull=False).count()
        
        # Recent signups (last 7 days)
        recent_signups = Tenant.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        return Response({
            'total_tenants': total_tenants,
            'active_tenants': active_tenants,
            'pending_tenants': pending_tenants,
            'expired_tenants': expired_tenants,
            'expiring_soon': expiring_soon,
            'total_users': total_users,
            'total_branches': total_branches,
            'recent_signups': recent_signups,
        })

class TenantExtendSubscriptionView(APIView):
    """
    Extend a tenant's subscription by a specified number of days.
    """
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]

    def post(self, request, pk):
        try:
            tenant = Tenant.objects.get(pk=pk)
        except Tenant.DoesNotExist:
            return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)

        days = request.data.get('days', 30)
        try:
            days = int(days)
            if days <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            return Response({'error': 'Days must be a positive integer.'}, status=status.HTTP_400_BAD_REQUEST)

        if tenant.subscription_end_date:
            new_end_date = tenant.subscription_end_date + timedelta(days=days)
        else:
            new_end_date = timezone.now().date() + timedelta(days=days)

        tenant.subscription_end_date = new_end_date
        tenant.subscription_status = 'active'
        tenant.is_active = True
        tenant.save()

        return Response({
            'message': f'Subscription for {tenant.name} extended by {days} days.',
            'new_end_date': new_end_date,
            'tenant': TenantSerializer(tenant).data
        })