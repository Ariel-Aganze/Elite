from django.urls import path
from .views import (
    SaleListCreateView,
    SaleDetailView,
    SaleVoidView,
    PaymentListCreateView,
    PaymentDetailView,
    InvoiceListView,
    InvoiceDetailView,
    CashRegisterListView,
    CashRegisterDetailView,
    CashRegisterTransactionListView,
    CashRegisterCloseView
)

urlpatterns = [
    # Sales
    path('sales/', SaleListCreateView.as_view(), name='sale-list'),
    path('sales/<uuid:pk>/', SaleDetailView.as_view(), name='sale-detail'),
    path('sales/<uuid:pk>/void/', SaleVoidView.as_view(), name='sale-void'),
    
    # Payments
    path('payments/', PaymentListCreateView.as_view(), name='payment-list'),
    path('payments/<uuid:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
    
    # Invoices
    path('invoices/', InvoiceListView.as_view(), name='invoice-list'),
    path('invoices/<uuid:pk>/', InvoiceDetailView.as_view(), name='invoice-detail'),
    
    # Cash Register
    path('cash-register/', CashRegisterListView.as_view(), name='cash-register-list'),
    path('cash-register/<uuid:pk>/', CashRegisterDetailView.as_view(), name='cash-register-detail'),
    path('cash-register/<uuid:pk>/close/', CashRegisterCloseView.as_view(), name='cash-register-close'),
    path('cash-register/transactions/', CashRegisterTransactionListView.as_view(), name='cash-register-transactions'),
]