import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Minus,
  Trash2,
  Search,
  Loader2,
  Building2,
  Package,
  ArrowRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

const TransferForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [branches, setBranches] = useState([])
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [formData, setFormData] = useState({
    from_branch: '',
    to_branch: '',
    notes: '',
  })
  const [items, setItems] = useState([])
  const [errors, setErrors] = useState({})
  const [stockInfo, setStockInfo] = useState({})
  const [loadingStock, setLoadingStock] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Fetch stock when source branch changes
  useEffect(() => {
    if (formData.from_branch) {
      fetchAllStock()
    }
  }, [formData.from_branch])

  const fetchInitialData = async () => {
    try {
      const [branchesRes, productsRes] = await Promise.all([
        api.get('/branches/?is_active=true'),
        api.get('/products/?is_active=true'),
      ])
      setBranches(branchesRes.data.results || branchesRes.data || [])
      setProducts(productsRes.data.results || productsRes.data || [])
      
      if (branchesRes.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          from_branch: branchesRes.data[0]?.id || '',
          to_branch: branchesRes.data[1]?.id || '',
        }))
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données')
    }
  }

  const fetchAllStock = async () => {
    if (!formData.from_branch) return
    
    setLoadingStock(true)
    try {
      const response = await api.get(`/stock/?branch=${formData.from_branch}`)
      const stocks = response.data.results || response.data || []
      
      const stockMap = {}
      stocks.forEach(s => {
        const productId = s.product || s.product_id
        if (productId) {
          stockMap[productId] = {
            quantity: s.quantity || 0,
            average_cost: s.average_cost || 0,
          }
        }
      })
      setStockInfo(stockMap)
      
      // Update existing items with current stock info
      setItems(prevItems => 
        prevItems.map(item => {
          const stock = stockMap[item.product_id] || { quantity: 0 }
          return {
            ...item,
            current_stock: stock.quantity,
            max_quantity: stock.quantity,
          }
        })
      )
    } catch (error) {
      console.error('Error fetching stock:', error)
      toast.error('Erreur lors du chargement du stock')
    } finally {
      setLoadingStock(false)
    }
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    if (value.length < 2) {
      setSearchResults([])
      return
    }
    const results = products.filter(p => 
      p.name.toLowerCase().includes(value.toLowerCase()) ||
      p.sku.toLowerCase().includes(value.toLowerCase())
    )
    const existingIds = items.map(i => i.product_id)
    const filtered = results.filter(p => !existingIds.includes(p.id))
    setSearchResults(filtered.slice(0, 10))
  }

  const addItem = (product) => {
    const stock = stockInfo[product.id] || { quantity: 0 }
    const currentStock = stock.quantity || 0
    
    if (currentStock === 0) {
      toast.error(`Le produit "${product.name}" n'a pas de stock disponible`)
      return
    }
    
    setItems([...items, {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      quantity: 1,
      max_quantity: currentStock,
      current_stock: currentStock,
    }])
    setSearchTerm('')
    setSearchResults([])
    toast.success(`"${product.name}" ajouté au transfert`)
  }

  const updateItemQuantity = (index, newQuantity) => {
    const item = items[index]
    const maxStock = item.current_stock || 0
    // Ensure quantity is between 1 and max stock
    const validatedQuantity = Math.min(Math.max(1, newQuantity), maxStock)
    
    const newItems = [...items]
    newItems[index].quantity = validatedQuantity
    setItems(newItems)
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.from_branch) newErrors.from_branch = 'La source est requise'
    if (!formData.to_branch) newErrors.to_branch = 'La destination est requise'
    if (formData.from_branch === formData.to_branch) {
      newErrors.to_branch = 'La source et la destination doivent être différentes'
    }
    if (items.length === 0) newErrors.items = 'Ajoutez au moins un produit'
    
    for (const item of items) {
      if (item.quantity > (item.current_stock || 0)) {
        newErrors[`item_${item.product_id}`] = `Stock insuffisant pour ${item.product_name}`
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const data = {
        from_branch: formData.from_branch,
        to_branch: formData.to_branch,
        notes: formData.notes,
        items: items.map(item => ({
          product: item.product_id,
          quantity: item.quantity,
        })),
      }

      await api.post('/transfers/', data)
      toast.success('Transfert créé avec succès')
      navigate('/app/transfers')
    } catch (error) {
      if (error.response?.data) {
        const errorData = error.response.data
        if (typeof errorData === 'object') {
          const messages = []
          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              messages.push(`${key}: ${errorData[key].join(', ')}`)
            } else {
              messages.push(`${key}: ${errorData[key]}`)
            }
          })
          toast.error(messages.join('. '))
        } else {
          toast.error(errorData || 'Erreur lors de la création')
        }
      } else {
        toast.error('Erreur de connexion')
      }
    } finally {
      setSaving(false)
    }
  }

  const getBranchName = (id) => {
    const branch = branches.find(b => b.id === id)
    return branch ? branch.name : ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/transfers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nouveau Transfert</h2>
            <p className="text-gray-500">Transférer du stock entre succursales</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Branches */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                <span>Succursales</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.from_branch}
                    onChange={(e) => setFormData({ ...formData, from_branch: e.target.value })}
                    className={`input-field ${errors.from_branch ? 'border-red-500' : ''}`}
                  >
                    <option value="">Sélectionner la source</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {errors.from_branch && (
                    <p className="mt-1 text-sm text-red-600">{errors.from_branch}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.to_branch}
                    onChange={(e) => setFormData({ ...formData, to_branch: e.target.value })}
                    className={`input-field ${errors.to_branch ? 'border-red-500' : ''}`}
                  >
                    <option value="">Sélectionner la destination</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {errors.to_branch && (
                    <p className="mt-1 text-sm text-red-600">{errors.to_branch}</p>
                  )}
                </div>
              </div>

              {formData.from_branch && formData.to_branch && formData.from_branch !== formData.to_branch && (
                <div className="mt-3 flex items-center justify-center text-sm text-gray-500">
                  <span className="font-medium">{getBranchName(formData.from_branch)}</span>
                  <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />
                  <span className="font-medium">{getBranchName(formData.to_branch)}</span>
                </div>
              )}
            </div>

            {/* Products */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Package className="w-5 h-5 text-primary-600" />
                <span>Produits</span>
                <span className="text-sm text-gray-500">({items.length} articles)</span>
              </h3>

              {/* Search Product */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un produit à transférer..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-dropdown max-h-48 overflow-y-auto z-10">
                    {searchResults.map((product) => {
                      const stock = stockInfo[product.id] || { quantity: 0 }
                      return (
                        <button
                          key={product.id}
                          onClick={() => addItem(product)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.sku}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Stock: {stock.quantity || 0}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {loadingStock && (
                <div className="text-center py-4 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  <p className="text-sm mt-2">Chargement du stock...</p>
                </div>
              )}

              {errors.items && (
                <p className="mb-4 text-sm text-red-600">{errors.items}</p>
              )}

              {/* Items List */}
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                  <Package className="w-12 h-12 mx-auto mb-2" />
                  <p>Aucun produit à transférer</p>
                  <p className="text-sm">Recherchez et ajoutez des produits</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                        <p className="text-sm text-gray-500">{item.product_sku}</p>
                        <p className="text-xs text-gray-400">Stock disponible: {item.current_stock || 0}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(index, item.quantity - 1)}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4 text-gray-500" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                            min="1"
                            max={item.current_stock || 0}
                          />
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(index, item.quantity + 1)}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={item.quantity >= (item.current_stock || 0)}
                          >
                            <Plus className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                        {errors[`item_${item.product_id}`] && (
                          <p className="text-xs text-red-600">{errors[`item_${item.product_id}`]}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 hover:bg-red-100 rounded text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="Raison du transfert, instructions spéciales..."
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Source</span>
                  <span className="font-medium text-gray-900">{getBranchName(formData.from_branch) || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Destination</span>
                  <span className="font-medium text-gray-900">{getBranchName(formData.to_branch) || '—'}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Total articles</span>
                  <span className="font-bold text-gray-900">{items.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Quantité totale</span>
                  <span className="font-bold text-gray-900">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Processus de transfert</p>
                    <p className="text-xs text-blue-700 mt-1">
                      1. Demande de transfert<br />
                      2. Approbation par responsable<br />
                      3. Expédition (déstockage source)<br />
                      4. Réception (approvisionnement destination)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={saving || items.length === 0}
                  className="w-full btn-primary flex items-center justify-center space-x-2 py-2.5"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>{saving ? 'Création...' : 'Demander le transfert'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/app/transfers')}
                  className="w-full btn-secondary flex items-center justify-center space-x-2 py-2.5"
                >
                  <X className="w-4 h-4" />
                  <span>Annuler</span>
                </button>
              </div>
              {items.length === 0 && (
                <p className="mt-2 text-xs text-gray-400 text-center">Ajoutez au moins un produit</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default TransferForm