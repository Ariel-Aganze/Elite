from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from apps.sales.models import CashRegister, CashRegisterTransaction
from .models import ExpenseCategory, Expense


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'name', 'name_en', 'name_fr', 'description', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']


class ExpenseListSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            'id', 'expense_number', 'branch', 'branch_name',
            'category', 'category_name', 'amount',
            'expense_date', 'description', 'is_approved',
            'approved_by', 'approved_by_username',
            'created_by', 'created_by_username',
            'created_at'
        ]
        read_only_fields = ['id', 'expense_number', 'created_at', 'updated_at', 'sync_version']


class ExpenseDetailSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            'id', 'expense_number', 'branch', 'branch_name',
            'category', 'category_name', 'amount',
            'expense_date', 'description', 'notes',
            'currency', 'exchange_rate',
            'is_approved', 'approved_by', 'approved_by_username',
            'approved_at', 'created_by', 'created_by_username',
            'receipt', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'expense_number', 'created_at', 'updated_at', 'sync_version']


class ExpenseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            'branch', 'category', 'amount', 'description',
            'notes', 'currency', 'exchange_rate', 'receipt'
        ]
    
    def validate(self, data):
        user = self.context['request'].user
        if data['branch'].tenant != user.tenant:
            raise serializers.ValidationError("Branch does not belong to your company.")
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        expense = Expense.objects.create(
            tenant=user.tenant,
            is_approved=False,
            created_by=user,
            **validated_data
        )
        return expense


class ExpenseApproveSerializer(serializers.Serializer):
    approve = serializers.BooleanField()