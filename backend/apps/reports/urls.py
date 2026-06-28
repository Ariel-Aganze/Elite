from django.urls import path
from .views import (
    DashboardSummaryView,
    SalesReportView,
    StockReportView,
    CustomerReportView,
    SupplierReportView,
    ProfitabilityReportView
)

urlpatterns = [
    # Dashboard
    path('dashboard/', DashboardSummaryView.as_view(), name='dashboard'),
    
    # Reports
    path('reports/sales/', SalesReportView.as_view(), name='sales-report'),
    path('reports/stock/', StockReportView.as_view(), name='stock-report'),
    path('reports/customers/', CustomerReportView.as_view(), name='customer-report'),
    path('reports/suppliers/', SupplierReportView.as_view(), name='supplier-report'),
    path('reports/profitability/', ProfitabilityReportView.as_view(), name='profitability-report'),
]