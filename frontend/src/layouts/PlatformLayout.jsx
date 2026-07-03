import React, { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Bell,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PlatformLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

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

  const navItems = [
    {
      path: '/platform/dashboard',
      label: 'Tableau de Bord',
      icon: LayoutDashboard,
    },
    {
      path: '/platform/tenants',
      label: 'Entreprises',
      icon: Building2,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed height full viewport */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-72 bg-primary-950 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-primary-800 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-white font-semibold text-lg">Elite RDC</span>
            </div>
            <button
              className="lg:hidden text-primary-300 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    active
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}

            <div className="pt-4 mt-4 border-t border-primary-800">
              <span className="text-xs font-medium text-primary-400 uppercase tracking-wider px-3">
                Administration
              </span>
              <Link
                to="/platform/settings"
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors mt-1 ${
                  isActive('/platform/settings')
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                }`}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Paramètres</span>
              </Link>
            </div>
          </nav>

          {/* User Profile - Fixed at bottom */}
          <div className="border-t border-primary-800 px-4 py-4 flex-shrink-0">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center justify-between w-full text-left hover:bg-primary-800 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {user?.username || 'Admin'}
                  </p>
                  <p className="text-xs text-primary-300">
                    Platform Admin
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-primary-300 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {userMenuOpen && (
              <div className="mt-2 space-y-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-primary-200 hover:bg-primary-800 rounded-lg transition-colors"
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
                Plateforme de Gestion
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <button className="text-gray-400 hover:text-gray-600 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
              </button>
              
              <div className="hidden md:flex items-center space-x-3">
                <div className="h-6 w-px bg-gray-200"></div>
                <span className="text-sm text-gray-600">
                  {user?.username || 'Admin'}
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

export default PlatformLayout