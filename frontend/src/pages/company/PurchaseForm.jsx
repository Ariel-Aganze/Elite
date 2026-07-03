import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  DollarSign,
  Truck,
  Calendar,
  AlertCircle,
  CheckCircle,
  Edit,
} from 'lucide-react'
import toast from 'react-hot-toast'

const PurchaseForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [formData, setFormData] = useState({
    supplier: '',
    branch: '',
    expected_delivery_date: '',
    transport_cost: 0,
    customs_cost: 0,
    handling_cost: 0,
    other_costs: 0,
    currency: 'USD',
    exchange_rate: 1,
    notes: '',
  })
  const [items, setItems] = useState([])
  const [errors, setErrors] = useState({})
  const [branches, setBranches] = useState([])
  const [isEdit, setIsEdit] = useState(false)

  useEffect(() => {
    fetchInitialData()
    if (id) {
      setIsEdit(true)
      fetchPurchase()
    }
  }, [id])

  const fetchInitialData = async () => {
    try {
      const [suppliersRes, productsRes, branchesRes] = await Promise.all([
        api.get('/suppliers/?is_active=true'),
        api.get('/products/?is_active=true'),
        api.get('/branches/?is_active=true'),
      ])
      setSuppliers(suppliersRes.data.results || suppliersRes.data || [])
      setProducts(productsRes.data.results || productsRes.data || [])
      setBranches(branchesRes.data.results || branchesRes.data || [])
      
      if (branchesRes.data.length > 0 && !formData.branch) {
        setFormData(prev => ({ ...prev, branch: branchesRes.data[0].id }))
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données')
    }
  }

  const fetchPurchase = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/purchases/${id}/`)
      const data = response.data
      setFormData({
        supplier: data.supplier || '',
        branch: data.branch || '',
        expected_delivery_date: data.expected_delivery_date || '',
        transport_cost: data.transport_cost || 0,
        customs_cost: data.customs_cost || 0,
        handling_cost: data.handling_cost || 0,
        other_costs: data.other_costs || 0,
        currency: data.currency || 'USD',
        exchange_rate: data.exchange_rate || 1,
        notes: data.notes || '',
      })
      
      // Map items
      if (data.items) {
        setItems(data.items.map(item => ({
          id: item.id,
          product_id: item.product,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: item.quantity,
          unit_price: parseFloat(item.unit_price),
          total: parseFloat(item.total_price),
        })))
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de la commande')
      navigate('/app/purchases')
    } finally {
      setLoading(false)
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
    // Exclude already added products
    const existingIds = items.map(i => i.product_id)
    const filtered = results.filter(p => !existingIds.includes(p.id))
    setSearchResults(filtered.slice(0, 10))
  }

  const addItem = (product) => {
    setItems([...items, {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      quantity: 1,
      unit_price: parseFloat(product.purchase_price) || 0,
      total: parseFloat(product.purchase_price) || 0,
    }])
    setSearchTerm('')
    setSearchResults([])
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    if (field === 'quantity' || field === 'unit_price') {
      const numValue = parseFloat(value) || 0
      newItems[index][field] = numValue
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price
    } else {
      newItems[index][field] = value
    }
    setItems(newItems)
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0)
    const transport = parseFloat(formData.transport_cost) || 0
    const customs = parseFloat(formData.customs_cost) || 0
    const handling = parseFloat(formData.handling_cost) || 0
    const other = parseFloat(formData.other_costs) || 0
    const total = subtotal + transport + customs + handling + other
    return { subtotal, total }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.supplier) newErrors.supplier = 'Le fournisseur est requis'
    if (!formData.branch) newErrors.branch = 'La succursale est requise'
    if (items.length === 0) newErrors.items = 'Ajoutez au moins un produit'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const { subtotal, total } = calculateTotals()
      const data = {
        supplier: formData.supplier,
        branch: formData.branch,
        expected_delivery_date: formData.expected_delivery_date,
        transport_cost: parseFloat(formData.transport_cost) || 0,
        customs_cost: parseFloat(formData.customs_cost) || 0,
        handling_cost: parseFloat(formData.handling_cost) || 0,
        other_costs: parseFloat(formData.other_costs) || 0,
        currency: formData.currency,
        exchange_rate: parseFloat(formData.exchange_rate) || 1,
        notes: formData.notes,
        items: items.map(item => ({
          product: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      }

      let response
      if (isEdit) {
        response = await api.put(`/purchases/${id}/`, data)
        toast.success('Commande mise à jour avec succès')
      } else {
        response = await api.post('/purchases/', data)
        toast.success('Commande créée avec succès')
      }
      navigate('/app/purchases')
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

  const { subtotal, total } = calculateTotals()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement de la commande...</p>
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
            onClick={() => navigate('/app/purchases')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Modifier la Commande' : 'Nouvelle Commande'}
            </h2>
            <p className="text-gray-500">
              {isEdit ? 'Modifiez les informations de la commande' : 'Créez une nouvelle commande fournisseur'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier & Branch */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                <span>Informations</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fournisseur <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className={`input-field ${errors.supplier ? 'border-red-500' : ''}`}
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplier && (
                    <p className="mt-1 text-sm text-red-600">{errors.supplier}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Succursale <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
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
                    Livraison prévue
                  </label>
                  <input
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Devise
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="input-field"
                  >
                    <option value="USD">USD</option>
                    <option value="CDF">CDF</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
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
                  placeholder="Rechercher un produit à ajouter..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-dropdown max-h-48 overflow-y-auto z-10">
                    {searchResults.map((product) => (
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
                          <p className="font-semibold text-primary-600">${product.purchase_price}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {errors.items && (
                <p className="mb-4 text-sm text-red-600">{errors.items}</p>
              )}

              {/* Items List */}
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                  <Package className="w-12 h-12 mx-auto mb-2" />
                  <p>Aucun produit ajouté</p>
                  <p className="text-sm">Recherchez et ajoutez des produits</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                        <p className="text-sm text-gray-500">{item.product_sku}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                          min="1"
                        />
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                          step="0.01"
                        />
                        <span className="font-semibold text-gray-900 w-24 text-right">
                          ${item.total.toFixed(2)}
                        </span>
                        <button
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
                placeholder="Notes supplémentaires sur la commande..."
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Landed Costs */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Truck className="w-5 h-5 text-primary-600" />
                <span>Frais Annexes</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transport
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.transport_cost}
                      onChange={(e) => setFormData({ ...formData, transport_cost: e.target.value })}
                      className="input-field pl-8"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Douane
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.customs_cost}
                      onChange={(e) => setFormData({ ...formData, customs_cost: e.target.value })}
                      className="input-field pl-8"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manutention
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.handling_cost}
                      onChange={(e) => setFormData({ ...formData, handling_cost: e.target.value })}
                      className="input-field pl-8"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Autres frais
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.other_costs}
                      onChange={(e) => setFormData({ ...formData, other_costs: e.target.value })}
                      className="input-field pl-8"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Sous-total</span>
                  <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Frais annexes</span>
                  <span className="font-medium text-gray-900">
                    ${(parseFloat(formData.transport_cost) || 0 + 
                       parseFloat(formData.customs_cost) || 0 + 
                       parseFloat(formData.handling_cost) || 0 + 
                       parseFloat(formData.other_costs) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

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
                  <span>{saving ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer la commande'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/app/purchases')}
                  className="w-full btn-secondary flex items-center justify-center space-x-2 py-2.5"
                >
                  <X className="w-4 h-4" />
                  <span>Annuler</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default PurchaseForm