from rest_framework import serializers
from .models import Supplier, Customer

class SupplierSerializer(serializers.ModelSerializer):
    outstanding_balance = serializers.SerializerMethodField()
    
    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'phone', 'email', 'address', 'country', 'city',
            'contact_person', 'contact_phone', 'tax_id', 'is_active',
            'outstanding_balance', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']

    def get_outstanding_balance(self, obj):
        return obj.get_outstanding_balance()


class CustomerSerializer(serializers.ModelSerializer):
    outstanding_balance = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'phone', 'email', 'address', 'city',
            'gender', 'birth_date', 'is_active',
            'outstanding_balance', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'sync_version']

    def get_outstanding_balance(self, obj):
        return obj.get_outstanding_balance()