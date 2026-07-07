import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Package,
  Store,
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Edit,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

const StockDetail = () => {
  const { productId } = useParams()
  const [searchParams] = useSearchParams()
  const branchId = searchParams.get('branch')
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState(null)
  const [stock, setStock] = useState(null)
  const [movements, setMovements] = useState([])
  const [branchName, setBranchName] = useState('')

  useEffect(() => {
    if (productId) {
      fetchProductAndStock()
    }
  }, [productId, branchId])

  const fetchProductAndStock = async () => {
    setLoading(true)
    try {
      // Fetch product details
      const productRes = await api.get(`/products/${productId}/`)
      setProduct(productRes.data)

      // Fetch stock for this product and branch
      let stockData = null
      const stockRes = await api.get(`/stock/?product=${productId}`)
      const stocks = stockRes.data.results || stockRes.data || []
      
      if (branchId) {
        stockData = stocks.find(s => s.branch === branchId) || null
        const branchRes = await api.get(`/branches/${branchId}/`)
        setBranchName(branchRes.data.name)
      } else if (stocks.length > 0) {
        stockData = stocks[0]
        const branchRes = await api.get(`/branches/${stockData.branch}/`)
        setBranchName(branchRes.data.name)
      }
      setStock(stockData)

      // Fetch stock movements for this product
      const movementsRes = await api.get(`/stock/movements/?product=${productId}`)
      setMovements(movementsRes.data.results || movementsRes.data || [])
      
    } catch (error) {
      toast.error('Erreur lors du chargement des détails du stock')
      navigate('/app/stock')
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
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getMovementTypeLabel = (type) => {
    const types = {
      'in': 'Entrée',
      'out': 'Sortie',
      'adjustment': 'Ajustement',
      'transfer_in': 'Transfert Entrant',
      'transfer_out': 'Transfert Sortant',
      'return': 'Retour',
      'loss': 'Perte',
    }
    return types[type] || type
  }

  const getMovementTypeColor = (type) => {
    const colors = {
      'in': 'text-green-600 bg-green-100',
      'out': 'text-red-600 bg-red-100',
      'adjustment': 'text-blue-600 bg-blue-100',
      'transfer_in': 'text-green-600 bg-green-100',
      'transfer_out': 'text-orange-600 bg-orange-100',
      'return': 'text-blue-600 bg-blue-100',
      'loss': 'text-red-600 bg-red-100',
    }
    return colors[type] || 'text-gray-600 bg-gray-100'
  }

  const getStatusBadge = (quantity, minStock) => {
    if (quantity === 0) {
      return { label: 'Rupture', className: 'bg-red-100 text-red-800' }
    } else if (quantity <= minStock) {
      return { label: 'Bas stock', className: 'bg-amber-100 text-amber-800' }
    }
    return { label: 'En stock', className: 'bg-green-100 text-green-800' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des détails...</p>
        </div>
      </div>
    )
  }

  if (!product || !stock) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Stock non trouvé</h3>
        <p className="text-gray-500">Aucun stock trouvé pour ce produit dans cette succursale.</p>
        <button
          onClick={() => navigate('/app/stock')}
          className="mt-4 btn-primary"
        >
          Retour au stock
        </button>
      </div>
    )
  }

  const status = getStatusBadge(stock.quantity, product.min_stock || 0)
  const stockValue = (stock.quantity || 0) * (stock.average_cost || 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/stock')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            <p className="text-gray-500">
              {product.sku} — {branchName}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/app/adjustments/new?product=${product.id}`)}
            className="btn-primary flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Ajuster le stock</span>
          </button>
          <button
            onClick={fetchProductAndStock}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Rafraîchir</span>
          </button>
        </div>
      </div>

      {/* Product Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Quantité en stock</p>
              <p className={`text-2xl font-bold ${
                stock.quantity === 0 ? 'text-red-600' :
                stock.quantity <= (product.min_stock || 0) ? 'text-amber-600' :
                'text-gray-900'
              }`}>
                {stock.quantity || 0}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Valeur du stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stockValue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Coût moyen</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stock.average_cost)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Store className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Produit</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Nom</span>
                <span className="font-medium text-gray-900">{product.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">SKU</span>
                <span className="font-mono text-sm text-gray-900">{product.sku}</span>
              </div>
              {product.barcode && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Code-barres</span>
                  <span className="font-medium text-gray-900">{product.barcode}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Catégorie</span>
                <span className="font-medium text-gray-900">{product.category_name || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Marque</span>
                <span className="font-medium text-gray-900">{product.brand_name || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Prix de vente</span>
                <span className="font-medium text-gray-900">{formatCurrency(product.sale_price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Stock minimum</span>
                <span className="font-medium text-gray-900">{product.min_stock || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Stock maximum</span>
                <span className="font-medium text-gray-900">{product.max_stock || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Succursale</span>
                <span className="font-medium text-gray-900">{branchName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Movements */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary-600" />
                <span>Mouvements de stock</span>
              </h3>
              <span className="text-sm text-gray-500">
                {movements.length} mouvements
              </span>
            </div>

            {movements.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2" />
                <p>Aucun mouvement de stock</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantité
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coût Unité
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Référence
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {movements.slice(0, 20).map((movement) => (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementTypeColor(movement.movement_type)}`}>
                            {getMovementTypeLabel(movement.movement_type)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {movement.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(movement.unit_cost)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(movement.total_cost)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {movement.reference || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(movement.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StockDetail