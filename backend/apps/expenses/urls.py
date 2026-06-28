from django.urls import path
from .views import (
    ExpenseCategoryListCreateView,
    ExpenseCategoryDetailView,
    ExpenseListCreateView,
    ExpenseDetailView,
    ExpenseApproveView
)

urlpatterns = [
    # Expense Categories
    path('expense-categories/', ExpenseCategoryListCreateView.as_view(), name='expense-category-list'),
    path('expense-categories/<uuid:pk>/', ExpenseCategoryDetailView.as_view(), name='expense-category-detail'),
    
    # Expenses
    path('expenses/', ExpenseListCreateView.as_view(), name='expense-list'),
    path('expenses/<uuid:pk>/', ExpenseDetailView.as_view(), name='expense-detail'),
    path('expenses/<uuid:pk>/approve/', ExpenseApproveView.as_view(), name='expense-approve'),
]