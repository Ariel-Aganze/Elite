import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Warehouse,
  Store,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Plus,
  Minus,
  RefreshCw,
  Edit,
} from 'lucide-react'
import toast from 'react-hot-toast'

const Stock = () => {
  const navigate = useNavigate()
  const [stockData, setStockData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedBranch, setSelectedBranch] = useState('')
  const [branches, setBranches] = useState([])
  const [filterType, setFilterType] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [summary, setSummary] = useState({
    total_quantity: 0,
    total_value: 0,
    total_products: 0,
    low_stock: 0,
    out_of_stock: 0,
  })

  useEffect(() => {
    fetchBranches()
    fetchStock()
  }, [currentPage, search, selectedBranch, filterType])

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches/?is_active=true')
      const data = response.data.results || response.data || []
      setBranches(data)
      if (data.length > 0 && !selectedBranch) {
        setSelectedBranch(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchStock = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        search: search || undefined,
        branch: selectedBranch || undefined,
      }
      
      const response = await api.get('/stock/', { params })
      let data = response.data.results || response.data || []
      
      // Apply filters
      if (filterType === 'low') {
        data = data.filter(item => {
          const minStock = item.product_min_stock || 0
          return item.quantity > 0 && item.quantity <= minStock
        })
      } else if (filterType === 'out') {
        data = data.filter(item => item.quantity === 0)
      }
      
      setStockData(data)
      
      // Calculate summary
      const totalQuantity = data.reduce((sum, item) => sum + (item.quantity || 0), 0)
      const totalValue = data.reduce((sum, item) => sum + ((item.quantity || 0) * (item.average_cost || 0)), 0)
      const totalProducts = data.filter(item => (item.quantity || 0) > 0).length
      const lowStock = data.filter(item => {
        const minStock = item.product_min_stock || 0
        return item.quantity > 0 && item.quantity <= minStock
      }).length
      const outOfStock = data.filter(item => item.quantity === 0).length
      
      setSummary({
        total_quantity: totalQuantity,
        total_value: totalValue,
        total_products: totalProducts,
        low_stock: lowStock,
        out_of_stock: outOfStock,
      })
      
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 50))
      }
    } catch (error) {
      toast.error('Erreur lors du chargement du stock')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const getStockStatus = (item) => {
    const quantity = item.quantity || 0
    const minStock = item.product_min_stock || 0
    
    if (quantity === 0) {
      return { label: 'Rupture', className: 'bg-red-100 text-red-800' }
    } else if (quantity <= minStock) {
      return { label: 'Bas stock', className: 'bg-amber-100 text-amber-800' }
    }
    return { label: 'En stock', className: 'bg-green-100 text-green-800' }
  }

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId)
    return branch ? branch.name : '—'
  }

  const handleViewStock = (productId, branchId) => {
    if (productId && branchId) {
      navigate(`/app/stock/${productId}?branch=${branchId}`)
    } else if (productId) {
      navigate(`/app/stock/${productId}`)
    } else {
      toast.error('Informations du produit non disponibles')
    }
  }

  const handleAdjustStock = (productId) => {
    if (productId) {
      navigate(`/app/adjustments/new?product=${productId}`)
    } else {
      toast.error('ID du produit non disponible')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement du stock...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stock</h2>
          <p className="text-gray-500">Gestion des stocks et inventaire</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchStock}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Rafraîchir</span>
          </button>
          <button
            onClick={() => navigate('/app/adjustments/new')}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ajustement</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Articles en stock</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_products}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Quantité totale</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_quantity}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Valeur totale</p>
          <p className="text-2xl font-bold text-primary-600">{formatCurrency(summary.total_value)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-amber-100 p-4">
          <p className="text-sm text-gray-500">Bas stock</p>
          <p className="text-2xl font-bold text-amber-600">{summary.low_stock}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-red-100 p-4">
          <p className="text-sm text-gray-500">Rupture</p>
          <p className="text-2xl font-bold text-red-600">{summary.out_of_stock}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filtres</span>
            </button>
            {filterType !== 'all' && (
              <button
                onClick={() => {
                  setFilterType('all')
                  setCurrentPage(1)
                }}
                className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
              >
                <X className="w-3 h-3" />
                <span>Effacer</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdown */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Afficher:</label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="all">Tous</option>
                <option value="low">Bas stock</option>
                <option value="out">Rupture</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {stockData.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun stock</h3>
            <p className="text-gray-500">Aucun produit trouvé dans cette succursale.</p>
            <button
              onClick={() => navigate('/app/adjustments/new')}
              className="mt-4 btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter du stock</span>
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Succursale
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coût Moyen
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valeur
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Min Stock
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stockData.map((item) => {
                    const status = getStockStatus(item)
                    const productName = item.product_name || '—'
                    const productSku = item.product_sku || '—'
                    const productId = item.product_id || item.product
                    const minStock = item.product_min_stock || 0
                    const branchName = getBranchName(item.branch)
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                              <Package className="w-4 h-4 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{productName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {productSku}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <Store className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">{branchName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${
                            item.quantity === 0 ? 'text-red-600' :
                            item.quantity <= minStock ? 'text-amber-600' :
                            'text-gray-900'
                          }`}>
                            {item.quantity || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(item.average_cost)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency((item.quantity || 0) * (item.average_cost || 0))}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">
                          {minStock}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewStock(productId, item.branch)}
                              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                              title="Voir détails du stock"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAdjustStock(productId)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Ajuster"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {currentPage} sur {totalPages}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Stock