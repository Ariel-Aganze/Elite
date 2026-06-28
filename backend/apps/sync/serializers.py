from rest_framework import serializers
from .models import SyncLog, PendingOperation


class SyncLogSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = SyncLog
        fields = [
            'id', 'tenant', 'tenant_name', 'branch', 'branch_name',
            'user', 'username', 'sync_type', 'status',
            'client_version', 'device_id', 'device_name',
            'records_pulled', 'records_pushed', 'records_failed',
            'started_at', 'completed_at',
            'error_message'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PendingOperationSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = PendingOperation
        fields = [
            'id', 'tenant', 'branch', 'branch_name',
            'user', 'username', 'operation_type',
            'operation_id', 'client_mutation_id', 'data',
            'status', 'created_at_local', 'processed_at',
            'error_message', 'attempt_count', 'server_response'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PullSyncRequestSerializer(serializers.Serializer):
    last_sync_timestamp = serializers.DateTimeField(required=True)
    branch_id = serializers.CharField(required=False, allow_null=True)
    models = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="List of models to pull, e.g., ['product', 'customer', 'stock']"
    )


class PullSyncResponseSerializer(serializers.Serializer):
    last_sync_timestamp = serializers.DateTimeField()
    data = serializers.DictField()
    deleted_ids = serializers.DictField()


class PushSyncRequestSerializer(serializers.Serializer):
    operations = serializers.ListField(
        child=serializers.DictField()
    )
    last_sync_timestamp = serializers.DateTimeField(required=False)


class PushSyncResponseSerializer(serializers.Serializer):
    successful = serializers.ListField()
    failed = serializers.ListField()
    conflicts = serializers.ListField()