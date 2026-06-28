from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
from django.utils import timezone
from apps.tenants.models import Tenant
from apps.branches.models import Branch
from apps.core.permissions import IsTenantAdmin, IsPlatformAdmin
from .models import User
from .serializers import (
    TenantRegistrationSerializer,
    UserCreateUpdateSerializer,
    UserListSerializer
)

class RegisterTenantView(APIView):
    """
    Public endpoint for a new company to sign up.
    Creates a Tenant (inactive, pending) and its first Admin user.
    """
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        serializer = TenantRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        # Create Tenant
        tenant = Tenant.objects.create(
            name=data['company_name'],
            code=data['company_code'],
            email=data['company_email'],
            phone=data['company_phone'],
            address=data.get('company_address', ''),
            subscription_status='pending',
            is_active=False,
        )

        # Create default branch for the tenant
        branch = Branch.objects.create(
            tenant=tenant,
            name='Dépôt Principal',
            code='MAIN',
            branch_type='central',
            city='',
            is_active=True,
        )

        # Create the admin user
        admin_user = User.objects.create_user(
            username=data['admin_username'],
            email=data['admin_email'],
            password=data['admin_password'],
            phone=data['admin_phone'],
            tenant=tenant,
            branch=branch,
            is_tenant_admin=True,
            is_active=True,
        )

        return Response({
            'message': 'Company registered successfully. Awaiting activation by platform admin.',
            'tenant_id': str(tenant.id),
            'admin_id': str(admin_user.id),
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    """
    Login endpoint that returns JWT tokens.
    Checks if the tenant is active.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)

        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({
                'error': 'Your account is inactive. Please contact your administrator.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check if user's tenant is active (skip for platform admins)
        if user.tenant and not user.tenant.is_active:
            return Response({
                'error': 'Your company account is inactive. Please contact support.'
            }, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)

        # Build user data response
        user_data = {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'phone': user.phone,
            'is_tenant_admin': user.is_tenant_admin,
            'is_platform_admin': user.is_platform_admin,
            'permissions': user.permissions,
            'branch_id': str(user.branch.id) if user.branch else None,
            'branch_name': user.branch.name if user.branch else None,
        }

        if user.tenant:
            user_data['tenant_id'] = str(user.tenant.id)
            user_data['tenant_name'] = user.tenant.name
            user_data['tenant_code'] = user.tenant.code
        else:
            user_data['tenant_id'] = None
            user_data['tenant_name'] = 'Platform Admin'
            user_data['tenant_code'] = None

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': user_data,
        })

class PermissionTemplatesView(APIView):
    """
    Get the list of available permission templates and all capabilities.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # All available capabilities in the system
        all_capabilities = [
            # Administration
            {'key': 'users_manage', 'label': 'Gérer les utilisateurs', 'module': 'Administration'},
            {'key': 'branches_manage', 'label': 'Gérer les succursales', 'module': 'Administration'},
            
            # Catalog
            {'key': 'products_manage', 'label': 'Gérer les produits', 'module': 'Catalogue'},
            {'key': 'suppliers_manage', 'label': 'Gérer les fournisseurs', 'module': 'Catalogue'},
            {'key': 'customers_manage', 'label': 'Gérer les clients', 'module': 'Catalogue'},
            
            # Purchasing
            {'key': 'purchases_view', 'label': 'Voir les achats', 'module': 'Achats'},
            {'key': 'purchases_create', 'label': 'Créer des achats', 'module': 'Achats'},
            {'key': 'purchases_approve', 'label': 'Approuver les réceptions', 'module': 'Achats'},
            
            # Inventory
            {'key': 'stock_view', 'label': 'Voir le stock', 'module': 'Inventaire'},
            {'key': 'stock_adjust', 'label': 'Ajuster le stock', 'module': 'Inventaire'},
            {'key': 'transfers_view', 'label': 'Voir les transferts', 'module': 'Inventaire'},
            {'key': 'transfers_create', 'label': 'Créer des transferts', 'module': 'Inventaire'},
            {'key': 'transfers_approve', 'label': 'Approuver les transferts', 'module': 'Inventaire'},
            {'key': 'losses_manage', 'label': 'Gérer les pertes', 'module': 'Inventaire'},
            
            # Sales & Cash
            {'key': 'sales_view', 'label': 'Voir les ventes', 'module': 'Ventes'},
            {'key': 'sales_create', 'label': 'Créer des ventes', 'module': 'Ventes'},
            {'key': 'sales_void', 'label': 'Annuler des ventes', 'module': 'Ventes'},
            {'key': 'payments_collect', 'label': 'Collecter les paiements', 'module': 'Ventes'},
            {'key': 'expenses_create', 'label': 'Créer des dépenses', 'module': 'Ventes'},
            {'key': 'expenses_view', 'label': 'Voir les dépenses', 'module': 'Ventes'},
            
            # Reports
            {'key': 'reports_view', 'label': 'Voir les rapports', 'module': 'Rapports'},
            {'key': 'reports_export', 'label': 'Exporter les rapports', 'module': 'Rapports'},
        ]
        
        # Pre-defined permission templates
        templates = [
            {
                'name': 'Caissier',
                'description': 'Ventes, paiements, et consultation de stock',
                'permissions': ['sales_create', 'payments_collect', 'stock_view', 'customers_manage', 'sales_view']
            },
            {
                'name': 'Gestionnaire de Stock',
                'description': 'Gestion complète du stock et des transferts',
                'permissions': ['stock_view', 'stock_adjust', 'transfers_view', 'transfers_create', 
                              'transfers_approve', 'losses_manage', 'purchases_approve', 'purchases_view']
            },
            {
                'name': 'Comptable (Lecture seule)',
                'description': 'Consultation et export des données financières',
                'permissions': ['sales_view', 'expenses_view', 'reports_view', 'reports_export', 
                              'stock_view', 'purchases_view', 'transfers_view']
            },
            {
                'name': 'Gestionnaire Complet',
                'description': 'Toutes les permissions sauf gestion des utilisateurs et succursales',
                'permissions': [
                    'products_manage', 'suppliers_manage', 'customers_manage',
                    'purchases_view', 'purchases_create', 'purchases_approve',
                    'stock_view', 'stock_adjust', 'transfers_view', 'transfers_create', 
                    'transfers_approve', 'losses_manage',
                    'sales_view', 'sales_create', 'sales_void', 'payments_collect',
                    'expenses_create', 'expenses_view', 'reports_view', 'reports_export'
                ]
            }
        ]
        
        return Response({
            'all_capabilities': all_capabilities,
            'templates': templates
        })

class UserListCreateView(generics.ListCreateAPIView):
    """
    List all users in the tenant (filtered) and create new users.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateUpdateSerializer
        return UserListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return User.objects.all()
        if user.is_tenant_admin and user.tenant:
            return User.objects.filter(tenant=user.tenant)
        if user.tenant:
            # Non-admin users can only see themselves
            return User.objects.filter(id=user.id)
        return User.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_platform_admin:
            # Platform admin must specify tenant in request data
            tenant_id = self.request.data.get('tenant')
            if tenant_id:
                try:
                    tenant = Tenant.objects.get(id=tenant_id)
                    serializer.save(tenant=tenant)
                except Tenant.DoesNotExist:
                    raise serializers.ValidationError({"tenant": "Invalid tenant ID."})
            else:
                raise serializers.ValidationError({"tenant": "Platform admin must specify a tenant."})
        elif user.is_tenant_admin:
            serializer.save(tenant=user.tenant)
        else:
            raise permissions.PermissionDenied("You do not have permission to create users.")

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserCreateUpdateSerializer
        return UserListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_platform_admin:
            return User.objects.all()
        if user.is_tenant_admin and user.tenant:
            return User.objects.filter(tenant=user.tenant)
        if user.tenant:
            return User.objects.filter(id=user.id)
        return User.objects.none()

    def perform_update(self, serializer):
        user = self.request.user
        if user.is_platform_admin:
            # Allow platform admin to update any user
            serializer.save()
        elif user.is_tenant_admin:
            # Ensure user belongs to the same tenant
            if serializer.instance.tenant != user.tenant:
                raise permissions.PermissionDenied("You cannot update users from another company.")
            serializer.save()
        else:
            raise permissions.PermissionDenied("You do not have permission to update users.")

    def perform_destroy(self, instance):
        # Soft delete - just deactivate
        instance.is_active = False
        instance.save()