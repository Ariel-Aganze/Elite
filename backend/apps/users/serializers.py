from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from apps.tenants.models import Tenant
from apps.branches.models import Branch
from .models import User

class TenantRegistrationSerializer(serializers.Serializer):
    # Company details
    company_name = serializers.CharField(max_length=255)
    company_code = serializers.CharField(max_length=50)
    company_email = serializers.EmailField()
    company_phone = serializers.CharField(max_length=30)
    company_address = serializers.CharField(required=False, allow_blank=True)

    # Admin user details
    admin_username = serializers.CharField(max_length=150)
    admin_email = serializers.EmailField()
    admin_password = serializers.CharField(write_only=True, validators=[validate_password])
    admin_phone = serializers.CharField(max_length=30)

    def validate_company_code(self, value):
        if Tenant.objects.filter(code=value).exists():
            raise serializers.ValidationError("This company code is already taken.")
        return value

    def validate_admin_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

class UserCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for Company Admins to create/update users within their tenant.
    """
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'password',
            'branch', 'is_tenant_admin', 'permissions', 'is_active'
        ]
        read_only_fields = ['id']

    def validate_branch(self, value):
        user = self.context['request'].user
        if value:
            if user.is_platform_admin:
                # Platform admin can assign any branch
                pass
            elif value.tenant != user.tenant:
                raise serializers.ValidationError("Branch does not belong to your company.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class UserListSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'branch', 'branch_name',
            'tenant', 'tenant_name', 'is_tenant_admin', 'permissions',
            'is_active', 'date_joined', 'last_login'
        ]