import React, { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Bell,
  Store,
  Building2,
  BarChart3,
  Warehouse,
  CreditCard,
  TrendingUp,
  UserCog,
  Briefcase,
  ClipboardList,
  Tag,
  Layers,
  Ruler,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const CompanyLayout = () => {
  const { user, logout, hasPermission, hasAnyPermission } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState({})

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }))
  }

  // Navigation items with permission requirements
  const navItems = [
    {
      path: '/app/dashboard',
      label: 'Tableau de Bord',
      icon: LayoutDashboard,
      permission: 'reports_view',
    },
    {
      path: '/app/sales',
      label: 'Ventes',
      icon: ShoppingCart,
      permission: 'sales_view',
    },
    {
      label: 'Produits',
      icon: Package,
      permission: 'products_manage',
      isDropdown: true,
      key: 'products',
      children: [
        {
          path: '/app/products',
          label: 'Liste des Produits',
          permission: 'products_manage',
        },
        {
          path: '/app/categories',
          label: 'Catégories',
          permission: 'products_manage',
        },
        {
          path: '/app/brands',
          label: 'Marques',
          permission: 'products_manage',
        },
        {
          path: '/app/units',
          label: 'Unités',
          permission: 'products_manage',
        },
      ]
    },
    {
      path: '/app/customers',
      label: 'Clients',
      icon: Users,
      permission: 'customers_manage',
    },
    {
      path: '/app/suppliers',
      label: 'Fournisseurs',
      icon: Truck,
      permission: 'suppliers_manage',
    },
    {
      path: '/app/purchases',
      label: 'Achats',
      icon: ClipboardList,
      permission: 'purchases_view',
    },
    {
      path: '/app/stock',
      label: 'Stock',
      icon: Store,
      permission: 'stock_view',
    },
    {
      path: '/app/transfers',
      label: 'Transferts',
      icon: Warehouse,
      permission: 'transfers_view',
    },
    {
      path: '/app/invoices',
      label: 'Factures',
      icon: FileText,
      permission: 'sales_view',
    },
    {
      path: '/app/expenses',
      label: 'Dépenses',
      icon: DollarSign,
      permission: 'expenses_view',
    },
    {
      path: '/app/reports',
      label: 'Rapports',
      icon: BarChart3,
      permission: 'reports_view',
    },
  ]

  // Admin items with permission requirements
  const adminItems = [
    {
      path: '/app/users',
      label: 'Utilisateurs',
      icon: UserCog,
      permission: 'users_manage',
    },
    {
      path: '/app/branches',
      label: 'Succursales',
      icon: Building2,
      permission: 'branches_manage',
    },
    {
      path: '/app/settings',
      label: 'Paramètres',
      icon: Settings,
      permission: 'users_manage',
    },
  ]

  const hasAdminAccess = hasAnyPermission(['users_manage', 'branches_manage'])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <div>
                <span className="text-gray-900 font-semibold text-lg">Elite RDC</span>
                <p className="text-xs text-gray-500">{user?.tenant_name || 'Company'}</p>
              </div>
            </div>
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              if (item.isDropdown) {
                // Check if user has permission for any child
                const hasChildAccess = item.children.some(child => 
                  hasPermission(child.permission)
                )
                if (!hasChildAccess) return null
                
                const isExpanded = expandedMenus[item.key]
                const hasActiveChild = item.children.some(child => isActive(child.path))
                
                return (
                  <div key={item.key}>
                    <button
                      onClick={() => toggleMenu(item.key)}
                      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors ${
                        hasActiveChild
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => {
                          if (!hasPermission(child.permission)) return null
                          const active = isActive(child.path)
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                active
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                              }`}
                            >
                              <ChevronRight className="w-3 h-3 flex-shrink-0" />
                              <span className="text-sm">{child.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              
              if (!hasPermission(item.permission)) return null
              
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}

            {hasAdminAccess && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3">
                  Administration
                </span>
                {adminItems.map((item) => {
                  if (!hasPermission(item.permission)) return null
                  const Icon = item.icon
                  const active = isActive(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors mt-1 ${
                        active
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </nav>

          {/* User Profile */}
          <div className="border-t border-gray-200 px-4 py-4">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center justify-between w-full text-left hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.is_tenant_admin ? 'Admin' : 'Utilisateur'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {user?.permissions?.length || 0} permissions
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {userMenuOpen && (
              <div className="mt-2 space-y-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center space-x-4">
              <button
                className="lg:hidden text-gray-500 hover:text-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
                {user?.tenant_name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              {hasPermission('sales_create') && (
                <button
                  onClick={() => navigate('/app/sales/new')}
                  className="btn-primary text-sm px-3 py-1.5 flex items-center space-x-1"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">Nouvelle Vente</span>
                </button>
              )}
              
              <button className="text-gray-400 hover:text-gray-600 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
              </button>
              
              <div className="hidden md:flex items-center space-x-3">
                <div className="h-6 w-px bg-gray-200"></div>
                <span className="text-sm text-gray-600">
                  {user?.username || 'User'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default CompanyLayout