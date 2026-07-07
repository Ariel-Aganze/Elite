from decimal import Decimal
from django.db.models import Sum
from rest_framework import serializers
from .models import Supplier, Customer

class SupplierSerializer(serializers.ModelSerializer):
    outstanding_balance = serializers.SerializerMethodField()
    total_purchases = serializers.SerializerMethodField()
    total_paid = serializers.SerializerMethodField()
    
    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'phone', 'email', 'address', 'country', 'city',
            'contact_person', 'contact_phone', 'tax_id', 'is_active',
            'total_purchases', 'total_paid', 'outstanding_balance', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']

    def get_outstanding_balance(self, obj):
        return obj.get_outstanding_balance()
    
    def get_total_purchases(self, obj):
        return obj.get_total_purchases()
    
    def get_total_paid(self, obj):
        return obj.get_total_paid()


class CustomerSerializer(serializers.ModelSerializer):
    outstanding_balance = serializers.SerializerMethodField()
    total_sales = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'phone', 'email', 'address', 'city',
            'gender', 'birth_date', 'is_active',
            'outstanding_balance', 'total_sales', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']

    def get_outstanding_balance(self, obj):
        return obj.get_outstanding_balance()
    
    def get_total_sales(self, obj):
        return obj.get_total_sales()