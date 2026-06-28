from rest_framework import serializers
from .models import Tenant

class TenantSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()
    branch_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'code', 'email', 'phone', 'address',
            'subscription_status', 'subscription_end_date', 'is_active',
            'user_count', 'branch_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']
    
    def get_user_count(self, obj):
        return obj.users.filter(is_active=True).count()
    
    def get_branch_count(self, obj):
        return obj.branches.filter(is_active=True, is_deleted=False).count()

class TenantActivationSerializer(serializers.Serializer):
    is_active = serializers.BooleanField()
    subscription_status = serializers.ChoiceField(choices=Tenant.SUBSCRIPTION_STATUS_CHOICES)
    subscription_end_date = serializers.DateField(required=False)

class TenantDashboardSerializer(serializers.Serializer):
    total_tenants = serializers.IntegerField()
    active_tenants = serializers.IntegerField()
    pending_tenants = serializers.IntegerField()
    expired_tenants = serializers.IntegerField()
    expiring_soon = serializers.IntegerField()
    total_users = serializers.IntegerField()
    total_branches = serializers.IntegerField()
    recent_signups = serializers.IntegerField()