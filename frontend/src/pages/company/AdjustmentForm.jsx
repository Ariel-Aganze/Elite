import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Save,
  X,
  Package,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  CheckCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

const AdjustmentForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const productId = searchParams.get('product')
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [branches, setBranches] = useState([])
  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState({
    branch: '',
    product: productId || '',
    adjustment_type: 'increase',
    quantity: '',
    reason: '',
  })
  const [errors, setErrors] = useState({})
  const [currentStock, setCurrentStock] = useState(null)

  useEffect(() => {
    fetchBranches()
    fetchProducts()
    if (productId) {
      // Set product in form data when productId is provided
      setFormData(prev => ({ ...prev, product: productId }))
    }
  }, [productId])

  // Fetch current stock when branch or product changes
  useEffect(() => {
    if (formData.branch && formData.product) {
      fetchCurrentStock()
    }
  }, [formData.branch, formData.product])

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches/?is_active=true')
      const data = response.data.results || response.data || []
      setBranches(data)
      if (data.length > 0 && !formData.branch) {
        setFormData(prev => ({ ...prev, branch: data[0].id }))
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/?is_active=true')
      const data = response.data.results || response.data || []
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCurrentStock = async () => {
    if (!formData.product || !formData.branch) return
    try {
      const response = await api.get(`/stock/?product=${formData.product}&branch=${formData.branch}`)
      const data = response.data.results || response.data || []
      setCurrentStock(data.length > 0 ? data[0] : null)
    } catch (error) {
      console.error('Error fetching current stock:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.branch) newErrors.branch = 'La succursale est requise'
    if (!formData.product) newErrors.product = 'Le produit est requis'
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'La quantité doit être positive'
    }
    if (!formData.reason.trim()) newErrors.reason = 'La raison est requise'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const data = {
        branch: formData.branch,
        product: formData.product,
        adjustment_type: formData.adjustment_type,
        quantity: parseInt(formData.quantity),
        reason: formData.reason,
      }
      
      const response = await api.post('/adjustments/', data)
      
      toast.success('Ajustement de stock effectué avec succès !')
      navigate('/app/stock')
    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data)
        toast.error('Erreur lors de l\'enregistrement')
      } else {
        toast.error('Erreur de connexion')
      }
    } finally {
      setSaving(false)
    }
  }

  const selectedProduct = products.find(p => p.id === formData.product)
  const stockQuantity = currentStock?.quantity || 0
  const newQuantity = formData.adjustment_type === 'increase' 
    ? stockQuantity + (parseInt(formData.quantity) || 0)
    : stockQuantity - (parseInt(formData.quantity) || 0)

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
            onClick={() => navigate('/app/stock')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Ajustement de Stock</h2>
            <p className="text-gray-500">Correction manuelle des quantités en stock</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Package className="w-5 h-5 text-primary-600" />
                <span>Informations</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Succursale <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className={`input-field ${errors.branch ? 'border-red-500' : ''}`}
                  >
                    <option value="">Sélectionner une succursale</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {errors.branch && (
                    <p className="mt-1 text-sm text-red-600">{errors.branch}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produit <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                    className={`input-field ${errors.product ? 'border-red-500' : ''}`}
                  >
                    <option value="">Sélectionner un produit</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                  {errors.product && (
                    <p className="mt-1 text-sm text-red-600">{errors.product}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type d'ajustement <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, adjustment_type: 'increase' })}
                      className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                        formData.adjustment_type === 'increase'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Augmenter
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, adjustment_type: 'decrease' })}
                      className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                        formData.adjustment_type === 'decrease'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Minus className="w-4 h-4 inline mr-1" />
                      Diminuer
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className={`input-field ${errors.quantity ? 'border-red-500' : ''}`}
                    placeholder="Ex: 10"
                    min="1"
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raison de l'ajustement <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    className={`input-field ${errors.reason ? 'border-red-500' : ''}`}
                    rows="2"
                    placeholder="Ex: Inventaire physique, correction d'erreur..."
                  />
                  {errors.reason && (
                    <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Stock Info */}
            {selectedProduct && formData.branch && (
              <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Stock Actuel</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Produit</span>
                    <span className="font-medium text-gray-900">{selectedProduct.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Quantité en stock</span>
                    <span className="text-xl font-bold text-gray-900">{stockQuantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Nouvelle quantité</span>
                    <span className={`text-xl font-bold ${
                      formData.adjustment_type === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {newQuantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500">Type</span>
                    <span className={`text-sm font-medium ${
                      formData.adjustment_type === 'increase' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formData.adjustment_type === 'increase' ? 'Augmentation' : 'Diminution'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full btn-primary flex items-center justify-center space-x-2 py-2.5"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>{saving ? 'Enregistrement...' : 'Valider l\'ajustement'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/app/stock')}
                  className="w-full btn-secondary flex items-center justify-center space-x-2 py-2.5"
                >
                  <X className="w-4 h-4" />
                  <span>Annuler</span>
                </button>
              </div>

              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-green-700">
                    L'ajustement sera appliqué immédiatement au stock.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AdjustmentForm