import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute'

// Layouts
import PlatformLayout from './layouts/PlatformLayout'
import CompanyLayout from './layouts/CompanyLayout'

// Platform Admin Pages
import PlatformDashboard from './pages/platform/Dashboard'
import TenantsList from './pages/platform/TenantsList'
import TenantDetail from './pages/platform/TenantDetail'
import PlatformSettings from './pages/platform/Settings'

// Company Pages
import CompanyDashboard from './pages/company/Dashboard'
import Products from './pages/company/Products'
import ProductForm from './pages/company/ProductForm'
import Customers from './pages/company/Customers'
import CustomerForm from './pages/company/CustomerForm'
import NewSale from './pages/company/NewSale'
import SalesList from './pages/company/SalesList'
import SaleDetail from './pages/company/SaleDetail'
import Stock from './pages/company/Stock'
import AdjustmentForm from './pages/company/AdjustmentForm'
import Suppliers from './pages/company/Suppliers'
import SupplierForm from './pages/company/SupplierForm'
import Purchases from './pages/company/Purchases'
import PurchaseForm from './pages/company/PurchaseForm'
import PurchaseReception from './pages/company/PurchaseReception'
import Transfers from './pages/company/Transfers'
import TransferForm from './pages/company/TransferForm'
import Expenses from './pages/company/Expenses'
import ExpenseForm from './pages/company/ExpenseForm'
import Invoices from './pages/company/Invoices'
import InvoiceDetail from './pages/company/InvoiceDetail'
import Reports from './pages/company/Reports'
import Users from './pages/company/Users'
import UserForm from './pages/company/UserForm'
import Branches from './pages/company/Branches'
import BranchForm from './pages/company/BranchForm'
import CompanySettings from './pages/company/Settings'
import Categories from './pages/company/Categories'
import Brands from './pages/company/Brands'
import Units from './pages/company/Units'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Marketing Pages
import MarketingHomepage from './marketing/pages/Homepage'
import Features from './marketing/pages/Features'
import Pricing from './marketing/pages/Pricing'
import Contact from './marketing/pages/Contact'

// Context
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Marketing / Landing Page - Public */}
          <Route path="/" element={<MarketingHomepage />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />

          
          {/* Auth Routes - Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Platform Admin Routes */}
          <Route path="/platform" element={<PlatformLayout />}>
            <Route index element={<Navigate to="/platform/dashboard" replace />} />
            <Route path="dashboard" element={<PlatformDashboard />} />
            <Route path="tenants" element={<TenantsList />} />
            <Route path="tenants/:id" element={<TenantDetail />} />
            <Route path="settings" element={<PlatformSettings />} />
          </Route>
          
          {/* Company Routes - Protected by permissions */}
          <Route path="/app" element={<CompanyLayout />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            
            {/* Dashboard - Requires reports_view */}
            <Route 
              path="dashboard" 
              element={
                <ProtectedRoute requiredPermission="reports_view">
                  <CompanyDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Products */}
            <Route 
              path="products" 
              element={
                <ProtectedRoute requiredPermission="products_manage">
                  <Products />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="products/new" 
              element={
                <ProtectedRoute requiredPermission="products_manage">
                  <ProductForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="products/:id" 
              element={
                <ProtectedRoute requiredPermission="products_manage">
                  <ProductForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="products/:id/edit" 
              element={
                <ProtectedRoute requiredPermission="products_manage">
                  <ProductForm />
                </ProtectedRoute>
              } 
            />
            
            {/* Categories, Brands, Units */}
            <Route path="categories" element={<Categories />} />
            <Route path="brands" element={<Brands />} />
            <Route path="units" element={<Units />} />
            
            {/* Customers */}
            <Route 
              path="customers" 
              element={
                <ProtectedRoute requiredPermission="customers_manage">
                  <Customers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="customers/new" 
              element={
                <ProtectedRoute requiredPermission="customers_manage">
                  <CustomerForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="customers/:id" 
              element={
                <ProtectedRoute requiredPermission="customers_manage">
                  <CustomerForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="customers/:id/edit" 
              element={
                <ProtectedRoute requiredPermission="customers_manage">
                  <CustomerForm />
                </ProtectedRoute>
              } 
            />
            
            {/* Suppliers */}
            <Route 
              path="suppliers" 
              element={
                <ProtectedRoute requiredPermission="suppliers_manage">
                  <Suppliers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="suppliers/new" 
              element={
                <ProtectedRoute requiredPermission="suppliers_manage">
                  <SupplierForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="suppliers/:id" 
              element={
                <ProtectedRoute requiredPermission="suppliers_manage">
                  <SupplierForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="suppliers/:id/edit" 
              element={
                <ProtectedRoute requiredPermission="suppliers_manage">
                  <SupplierForm />
                </ProtectedRoute>
              } 
            />
            
            {/* Sales */}
            <Route 
              path="sales" 
              element={
                <ProtectedRoute requiredPermission="sales_view">
                  <SalesList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="sales/new" 
              element={
                <ProtectedRoute requiredPermission="sales_create">
                  <NewSale />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="sales/:id" 
              element={
                <ProtectedRoute requiredPermission="sales_view">
                  <SaleDetail />
                </ProtectedRoute>
              } 
            />
            
            {/* Stock */}
            <Route 
              path="stock" 
              element={
                <ProtectedRoute requiredPermission="stock_view">
                  <Stock />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="adjustments/new" 
              element={
                <ProtectedRoute requiredPermission="stock_adjust">
                  <AdjustmentForm />
                </ProtectedRoute>
              } 
            />
            
            {/* Purchases */}
            <Route 
              path="purchases" 
              element={
                <ProtectedRoute requiredPermission="purchases_view">
                  <Purchases />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="purchases/new" 
              element={
                <ProtectedRoute requiredPermission="purchases_create">
                  <PurchaseForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="purchases/:id" 
              element={
                <ProtectedRoute requiredPermission="purchases_view">
                  <PurchaseForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="purchases/:id/edit" 
              element={
                <ProtectedRoute requiredPermission="purchases_create">
                  <PurchaseForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="purchases/:id/receive" 
              element={
                <ProtectedRoute requiredPermission="purchases_approve">
                  <PurchaseReception />
                </ProtectedRoute>
              } 
            />
            
            {/* Transfers */}
            <Route 
              path="transfers" 
              element={
                <ProtectedRoute requiredPermission="transfers_view">
                  <Transfers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="transfers/new" 
              element={
                <ProtectedRoute requiredPermission="transfers_create">
                  <TransferForm />
                </ProtectedRoute>
              } 
            />
            
            {/* Expenses */}
            <Route 
              path="expenses" 
              element={
                <ProtectedRoute requiredPermission="expenses_view">
                  <Expenses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="expenses/new" 
              element={
                <ProtectedRoute requiredPermission="expenses_create">
                  <ExpenseForm />
                </ProtectedRoute>
              } 
            />
            
            {/* Invoices */}
            <Route 
              path="invoices" 
              element={
                <ProtectedRoute requiredPermission="sales_view">
                  <Invoices />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="invoices/:id" 
              element={
                <ProtectedRoute requiredPermission="sales_view">
                  <InvoiceDetail />
                </ProtectedRoute>
              } 
            />
            
            {/* Reports */}
            <Route 
              path="reports" 
              element={
                <ProtectedRoute requiredPermission="reports_view">
                  <Reports />
                </ProtectedRoute>
              } 
            />
            
            {/* Users - Admin only */}
            <Route 
              path="users" 
              element={
                <ProtectedRoute requiredPermission="users_manage">
                  <Users />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="users/new" 
              element={
                <ProtectedRoute requiredPermission="users_manage">
                  <UserForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="users/:id/edit" 
              element={
                <ProtectedRoute requiredPermission="users_manage">
                  <UserForm />
                </ProtectedRoute>
              } 
            />
            
            {/* Branches - Admin only */}
            <Route 
              path="branches" 
              element={
                <ProtectedRoute requiredPermission="branches_manage">
                  <Branches />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="branches/new" 
              element={
                <ProtectedRoute requiredPermission="branches_manage">
                  <BranchForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="branches/:id" 
              element={
                <ProtectedRoute requiredPermission="branches_manage">
                  <BranchForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="branches/:id/edit" 
              element={
                <ProtectedRoute requiredPermission="branches_manage">
                  <BranchForm />
                </ProtectedRoute>
              } 
            />
            
            {/* Settings - Admin only */}
            <Route 
              path="settings" 
              element={
                <ProtectedRoute requiredPermission="users_manage">
                  <CompanySettings />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          {/* Catch all - redirect to homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App