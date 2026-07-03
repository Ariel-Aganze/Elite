import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../api/client'
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  Store,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Plus,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'

const CompanyDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const response = await api.get('/dashboard/')
      setDashboardData(response.data)
    } catch (error) {
      toast.error('Erreur lors du chargement du tableau de bord')
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune donnée disponible</h3>
        <p className="text-gray-500">Commencez par créer des produits et des ventes.</p>
        <div className="mt-6 flex items-center justify-center space-x-4">
          <button 
            onClick={() => navigate('/app/products')}
            className="btn-primary flex items-center space-x-2"
          >
            <Package className="w-4 h-4" />
            <span>Ajouter des produits</span>
          </button>
          <button 
            onClick={() => navigate('/app/customers')}
            className="btn-secondary flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Ajouter des clients</span>
          </button>
        </div>
      </div>
    )
  }

  const { commerce, stock, finances, performance, alerts } = dashboardData

  // Stats cards
  const stats = [
    {
      label: 'Ventes Aujourd\'hui',
      value: `$${commerce.today_sales.total.toLocaleString()}`,
      subtext: `${commerce.today_sales.count} transactions`,
      icon: ShoppingCart,
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-100',
    },
    {
      label: 'Ventes du Mois',
      value: `$${commerce.month_sales.total.toLocaleString()}`,
      subtext: `${commerce.month_sales.count} transactions`,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
      borderColor: 'border-green-100',
    },
    {
      label: 'Valeur du Stock',
      value: `$${stock.total_value.toLocaleString()}`,
      subtext: `${stock.total_products_in_stock} produits en stock`,
      icon: Package,
      color: 'bg-amber-50 text-amber-600',
      borderColor: 'border-amber-100',
    },
    {
      label: 'Encours Clients',
      value: `$${finances.customer_receivables.total.toLocaleString()}`,
      subtext: `${finances.outstanding_invoices.count} factures impayées`,
      icon: DollarSign,
      color: 'bg-red-50 text-red-600',
      borderColor: 'border-red-100',
    },
    {
      label: 'Dettes Fournisseurs',
      value: `$${finances.supplier_payables.total.toLocaleString()}`,
      subtext: 'À payer',
      icon: CreditCard,
      color: 'bg-purple-50 text-purple-600',
      borderColor: 'border-purple-100',
    },
    {
      label: 'Articles en Rupture',
      value: stock.out_of_stock_items,
      subtext: `${stock.low_stock_items} en bas stock`,
      icon: AlertCircle,
      color: 'bg-orange-50 text-orange-600',
      borderColor: 'border-orange-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tableau de Bord</h2>
          <p className="text-gray-500">
            {user?.tenant_name || 'Votre entreprise'} — {new Date().toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => navigate('/app/sales/new')}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Vente</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div 
              key={index} 
              className={`bg-white rounded-xl shadow-card border ${stat.borderColor} p-6 hover:shadow-card-hover transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Alerts Section */}
      {(alerts.low_stock > 0 || alerts.overdue_invoices > 0 || alerts.pending_transfers > 0 || alerts.out_of_stock > 0) && (
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span>Alertes</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {alerts.out_of_stock > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <Package className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{alerts.out_of_stock} en rupture</p>
                  <p className="text-sm text-gray-500">Réapprovisionner</p>
                </div>
              </div>
            )}
            {alerts.low_stock > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{alerts.low_stock} bas stock</p>
                  <p className="text-sm text-gray-500">Vérifier le stock</p>
                </div>
              </div>
            )}
            {alerts.overdue_invoices > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <CreditCard className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{alerts.overdue_invoices} factures en retard</p>
                  <p className="text-sm text-gray-500">Relancer les clients</p>
                </div>
              </div>
            )}
            {alerts.pending_transfers > 0 && (
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{alerts.pending_transfers} transferts en attente</p>
                  <p className="text-sm text-gray-500">Approuver ou traiter</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Products & Branch Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Produits</h3>
            <button 
              onClick={() => navigate('/app/reports')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
            >
              <span>Voir tout</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          
          {performance.top_products && performance.top_products.length > 0 ? (
            <div className="space-y-3">
              {performance.top_products.map((product, index) => (
                <div key={product.product__id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-sm font-medium text-gray-400 w-6 flex-shrink-0">#{index + 1}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.product__name}</p>
                      <p className="text-sm text-gray-500">{product.total_quantity} unités</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-semibold text-gray-900">${product.total_revenue.toLocaleString()}</p>
                    <p className="text-sm text-green-600">+${product.total_profit.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2" />
              <p>Aucun produit vendu</p>
              <button 
                onClick={() => navigate('/app/products')}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
              >
                Ajouter des produits
              </button>
            </div>
          )}
        </div>

        {/* Branch Performance */}
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance par Succursale</h3>
            <button 
              onClick={() => navigate('/app/branches')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
            >
              <span>Voir tout</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          
          {performance.branch_performance && performance.branch_performance.length > 0 ? (
            <div className="space-y-3">
              {performance.branch_performance.map((branch) => (
                <div key={branch.branch_id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3 min-w-0">
                    <Store className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{branch.branch_name}</p>
                      <p className="text-sm text-gray-500">{branch.sales_count} ventes</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-semibold text-gray-900">${branch.sales_total.toLocaleString()}</p>
                    <p className={`text-sm ${branch.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {branch.profit >= 0 ? '+' : ''}{branch.profit.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Store className="w-12 h-12 mx-auto mb-2" />
              <p>Aucune succursale</p>
              <button 
                onClick={() => navigate('/app/branches')}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
              >
                Créer une succursale
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CompanyDashboard