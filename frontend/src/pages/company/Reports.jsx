import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  FileText,
  Calendar,
  Download,
  Printer,
  Loader2,
  AlertCircle,
  ChevronDown,
  Filter,
  X,
  Building2,
  ShoppingCart,
  Truck,
  CreditCard,
} from 'lucide-react'
import toast from 'react-hot-toast'

const Reports = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState(null)
  const [activeTab, setActiveTab] = useState('sales')
  const [dateRange, setDateRange] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [branches, setBranches] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchBranches()
    fetchReport()
  }, [activeTab, dateRange, branchFilter])

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches/?is_active=true')
      setBranches(response.data.results || response.data || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchReport = async () => {
    setLoading(true)
    try {
      // Determine date range
      let start = startDate
      let end = endDate
      
      if (!start || !end) {
        const now = new Date()
        if (dateRange === 'today') {
          start = new Date(now.setHours(0,0,0,0)).toISOString().split('T')[0]
          end = new Date().toISOString().split('T')[0]
        } else if (dateRange === 'week') {
          const weekStart = new Date(now)
          weekStart.setDate(weekStart.getDate() - 7)
          start = weekStart.toISOString().split('T')[0]
          end = new Date().toISOString().split('T')[0]
        } else if (dateRange === 'month') {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          start = monthStart.toISOString().split('T')[0]
          end = new Date().toISOString().split('T')[0]
        } else if (dateRange === 'year') {
          const yearStart = new Date(now.getFullYear(), 0, 1)
          start = yearStart.toISOString().split('T')[0]
          end = new Date().toISOString().split('T')[0]
        }
      }

      const params = {
        start_date: start,
        end_date: end,
        branch: branchFilter || undefined,
      }

      let response
      if (activeTab === 'sales') {
        response = await api.get('/reports/sales/', { params })
      } else if (activeTab === 'stock') {
        response = await api.get('/reports/stock/', { params })
      } else if (activeTab === 'customers') {
        response = await api.get('/reports/customers/', { params })
      } else if (activeTab === 'suppliers') {
        response = await api.get('/reports/suppliers/', { params })
      } else if (activeTab === 'profitability') {
        response = await api.get('/reports/profitability/', { params })
      }

      setReportData(response.data)
    } catch (error) {
      toast.error('Erreur lors du chargement du rapport')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const tabs = [
    { id: 'sales', label: 'Ventes', icon: ShoppingCart },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'customers', label: 'Clients', icon: Users },
    { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
    { id: 'profitability', label: 'Rentabilité', icon: TrendingUp },
  ]

  const getBranchName = (id) => {
    const branch = branches.find(b => b.id === id)
    return branch ? branch.name : '—'
  }

  const handleExport = () => {
    toast.success('Export en cours...')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement du rapport...</p>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune donnée disponible</h3>
        <p className="text-gray-500">Aucune donnée trouvée pour la période sélectionnée.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rapports</h2>
          <p className="text-gray-500">Analyses et indicateurs de performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </button>
          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Période:</span>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value)
                  setStartDate('')
                  setEndDate('')
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="today">Aujourd'hui</option>
                <option value="week">7 derniers jours</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>

            {dateRange === 'custom' && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <span className="text-gray-400">à</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </>
            )}

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 text-sm"
            >
              <Filter className="w-4 h-4 text-gray-500" />
              <span>Filtres</span>
            </button>

            {branchFilter && (
              <button
                onClick={() => setBranchFilter('')}
                className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
              >
                <X className="w-3 h-3" />
                <span>Effacer</span>
              </button>
            )}

            <button
              onClick={fetchReport}
              className="btn-primary px-4 py-1.5 text-sm"
            >
              Appliquer
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Succursale:</label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="">Toutes</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Report Content */}
        <div className="p-6">
          {activeTab === 'sales' && reportData && (
            <SalesReport data={reportData} formatCurrency={formatCurrency} formatDate={formatDate} />
          )}
          {activeTab === 'stock' && reportData && (
            <StockReport data={reportData} formatCurrency={formatCurrency} />
          )}
          {activeTab === 'customers' && reportData && (
            <CustomerReport data={reportData} formatCurrency={formatCurrency} />
          )}
          {activeTab === 'suppliers' && reportData && (
            <SupplierReport data={reportData} formatCurrency={formatCurrency} />
          )}
          {activeTab === 'profitability' && reportData && (
            <ProfitabilityReport data={reportData} formatCurrency={formatCurrency} />
          )}
        </div>
      </div>
    </div>
  )
}

// ============ Sales Report Component ============
const SalesReport = ({ data, formatCurrency, formatDate }) => {
  const { summary, sales_by_day, sales_by_product, sales_by_branch, sales_by_payment } = data

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Chiffre d'affaires</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_revenue)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Bénéfice</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_profit)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Marge</p>
          <p className="text-2xl font-bold text-primary-600">{summary.margin?.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="text-2xl font-bold text-gray-900">{summary.count}</p>
        </div>
      </div>

      {/* Top Products */}
      {sales_by_product && sales_by_product.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Top Produits</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Produit</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Quantité</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">CA</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Bénéfice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales_by_product.slice(0, 10).map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{product.product__name}</td>
                    <td className="px-4 py-2 text-right">{product.total_quantity}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(product.total_revenue)}</td>
                    <td className="px-4 py-2 text-right text-green-600">{formatCurrency(product.total_profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales by Branch */}
      {sales_by_branch && sales_by_branch.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Performance par Succursale</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Succursale</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Ventes</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">CA</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Bénéfice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales_by_branch.map((branch, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{branch.branch__name}</td>
                    <td className="px-4 py-2 text-right">{branch.count}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(branch.revenue)}</td>
                    <td className="px-4 py-2 text-right text-green-600">{formatCurrency(branch.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales by Day Chart */}
      {sales_by_day && sales_by_day.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Évolution des Ventes</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-end space-x-1 h-40">
              {sales_by_day.slice(-30).map((day, index) => {
                const maxRevenue = Math.max(...sales_by_day.map(d => d.revenue || 0))
                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-600" 
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <span className="text-[10px] text-gray-400 mt-1">
                      {new Date(day.day).getDate()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ Stock Report Component ============
const StockReport = ({ data, formatCurrency }) => {
  const { summary, stock_by_product, stock_by_branch, stock_by_category } = data

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Valeur totale du stock</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_value)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Quantité totale</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_quantity}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Produits en stock</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_products}</p>
        </div>
      </div>

      {/* Stock by Product */}
      {stock_by_product && stock_by_product.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Stock par Produit</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Produit</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Quantité</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Valeur</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Coût Moyen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stock_by_product.slice(0, 20).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{item.product__name}</td>
                    <td className="px-4 py-2 text-right">{item.total_quantity}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(item.total_value)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(item.average_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock by Branch */}
      {stock_by_branch && stock_by_branch.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Stock par Succursale</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stock_by_branch.map((branch, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">{branch.branch__name}</p>
                <p className="text-sm text-gray-500">{branch.product_count} produits</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(branch.total_value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============ Customer Report Component ============
const CustomerReport = ({ data, formatCurrency }) => {
  const { summary, customers } = data

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Clients</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_customers}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Créances totales</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.total_balance)}</p>
        </div>
      </div>

      {/* Customers List */}
      {customers && customers.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Clients avec solde</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Client</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Téléphone</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Total Achats</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Solde</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500">Factures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.slice(0, 20).map((customer, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{customer.name}</td>
                    <td className="px-4 py-2 text-gray-600">{customer.phone}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(customer.total_sales)}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${customer.balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {formatCurrency(customer.balance)}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-500">{customer.invoice_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ Supplier Report Component ============
const SupplierReport = ({ data, formatCurrency }) => {
  const { summary, suppliers } = data

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Fournisseurs</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_suppliers}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Dettes totales</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.total_payable)}</p>
        </div>
      </div>

      {/* Suppliers List */}
      {suppliers && suppliers.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Fournisseurs</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Fournisseur</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Contact</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Total Achats</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Dette</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500">Commandes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {suppliers.slice(0, 20).map((supplier, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{supplier.name}</td>
                    <td className="px-4 py-2 text-gray-600">{supplier.phone}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(supplier.total_purchases)}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${supplier.payable > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {formatCurrency(supplier.payable)}
                    </td>
                    <td className="px-4 py-2 text-center text-gray-500">{supplier.purchase_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ Profitability Report Component ============
const ProfitabilityReport = ({ data, formatCurrency }) => {
  const { summary, profit_by_product, profit_by_branch } = data

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Chiffre d'affaires</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_revenue)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Coût total</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_cost)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Bénéfice</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_profit)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Marge</p>
          <p className="text-2xl font-bold text-primary-600">{summary.margin?.toFixed(1)}%</p>
        </div>
      </div>

      {/* Profit by Product */}
      {profit_by_product && profit_by_product.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Rentabilité par Produit</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Produit</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Quantité</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">CA</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Coût</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Bénéfice</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Marge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {profit_by_product.slice(0, 10).map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{product.product__name}</td>
                    <td className="px-4 py-2 text-right">{product.total_quantity}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(product.total_revenue)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(product.total_cost)}</td>
                    <td className="px-4 py-2 text-right text-green-600">{formatCurrency(product.total_profit)}</td>
                    <td className="px-4 py-2 text-right font-medium text-primary-600">{product.avg_margin?.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Profit by Branch */}
      {profit_by_branch && profit_by_branch.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Rentabilité par Succursale</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {profit_by_branch.map((branch, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">{branch.branch__name}</p>
                <p className="text-sm text-gray-500">{branch.sale_count} ventes</p>
                <p className="text-lg font-bold text-green-600 mt-1">{formatCurrency(branch.total_profit)}</p>
                <p className="text-sm text-gray-400">CA: {formatCurrency(branch.total_revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports