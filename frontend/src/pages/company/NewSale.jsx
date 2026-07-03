import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Search,
  User,
  Users,
  CreditCard,
  DollarSign,
  Smartphone,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  ShoppingCart,
  Receipt,
  Printer,
  Save,
  Package,
  Wallet,
  Banknote,
  ChevronDown,
  UserPlus,
} from 'lucide-react'
import toast from 'react-hot-toast'

const NewSale = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountReceived, setAmountReceived] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '', city: '' })
  const [customerErrors, setCustomerErrors] = useState({})
  
  const searchInputRef = useRef(null)
  const barcodeInputRef = useRef(null)

  // Fetch customers on load
  useEffect(() => {
    fetchCustomers()
    fetchProducts()
    // Focus on barcode input
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    }, 500)
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers/?is_active=true')
      setCustomers(response.data.results || response.data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/?is_active=true')
      setProducts(response.data.results || response.data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
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
      p.sku.toLowerCase().includes(value.toLowerCase()) ||
      (p.barcode && p.barcode.includes(value))
    )
    setSearchResults(results.slice(0, 10))
  }

  const handleBarcodeSearch = async (barcode) => {
    if (!barcode || barcode.length < 3) return
    try {
      const response = await api.get(`/products/?barcode=${barcode}`)
      const products = response.data.results || response.data || []
      if (products.length > 0) {
        const product = products[0]
        // Check if already in cart
        const existingItem = cart.find(item => item.id === product.id)
        if (existingItem) {
          updateCartItem(existingItem.id, existingItem.quantity + 1)
        } else {
          addToCart(product)
        }
        if (barcodeInputRef.current) {
          barcodeInputRef.current.value = ''
          barcodeInputRef.current.focus()
        }
      } else {
        toast.error('Produit non trouvé')
      }
    } catch (error) {
      toast.error('Erreur lors de la recherche')
    }
  }

  const addToCart = (product) => {
    // Check stock
    if (product.stock_quantity <= 0) {
      toast.error(`Le produit "${product.name}" est en rupture de stock`)
      return
    }
    
    setCart([...cart, {
      id: product.id,
      name: product.name,
      sku: product.sku,
      sale_price: parseFloat(product.sale_price),
      quantity: 1,
      max_quantity: product.stock_quantity || 0,
      total: parseFloat(product.sale_price),
    }])
    toast.success(`Ajouté: ${product.name}`)
    setSearchTerm('')
    setSearchResults([])
    if (searchInputRef.current) {
      searchInputRef.current.value = ''
      searchInputRef.current.focus()
    }
  }

  const updateCartItem = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id)
      return
    }
    setCart(cart.map(item => {
      if (item.id === id) {
        const quantity = Math.min(newQuantity, item.max_quantity)
        return {
          ...item,
          quantity,
          total: quantity * item.sale_price,
        }
      }
      return item
    }))
  }

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const handleCreateCustomer = async () => {
    // Validate
    const errors = {}
    if (!newCustomer.name.trim()) errors.name = 'Le nom est requis'
    if (!newCustomer.phone.trim()) errors.phone = 'Le téléphone est requis'
    if (Object.keys(errors).length > 0) {
      setCustomerErrors(errors)
      return
    }

    try {
      const response = await api.post('/customers/', newCustomer)
      toast.success('Client créé avec succès')
      setSelectedCustomer(response.data)
      setShowNewCustomerModal(false)
      setNewCustomer({ name: '', phone: '', email: '', address: '', city: '' })
      setCustomerErrors({})
      fetchCustomers()
    } catch (error) {
      toast.error('Erreur lors de la création du client')
    }
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
    const tax = 0
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  const handlePayment = async () => {
    if (cart.length === 0) {
      toast.error('Ajoutez au moins un produit')
      return
    }

    if (!selectedCustomer) {
      toast.error('Sélectionnez un client')
      return
    }

    const { subtotal, tax, total } = calculateTotals()
    
    // For cash payments, check if amount received is sufficient
    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived)
      if (isNaN(received) || received < total) {
        toast.error(`Montant insuffisant. Total: $${total.toFixed(2)}`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      // Get the first branch
      let branchId = null
      try {
        const branchesRes = await api.get('/branches/?is_active=true')
        const branches = branchesRes.data.results || branchesRes.data || []
        if (branches.length > 0) {
          branchId = branches[0].id
        }
      } catch (error) {
        console.error('Error fetching branches:', error)
      }

      const saleData = {
        customer: selectedCustomer.id,
        branch: branchId,
        payment_method: paymentMethod,
        currency: 'USD',
        exchange_rate: 1.0,
        notes: notes || '',
        items: cart.map(item => ({
          product: item.id,
          quantity: item.quantity,
          unit_price: item.sale_price,
        })),
        paid_amount: paymentMethod === 'credit' ? 0 : parseFloat(amountReceived) || total,
      }

      const response = await api.post('/sales/', saleData)
      
      // Check if response has the sale id
      if (response.data && response.data.id) {
        toast.success('Vente effectuée avec succès !')
        // Navigate to sale detail using the id from response
        navigate(`/app/sales/${response.data.id}`)
      } else if (response.data && response.data.sale_id) {
        // Some APIs might return sale_id instead of id
        toast.success('Vente effectuée avec succès !')
        navigate(`/app/sales/${response.data.sale_id}`)
      } else {
        // If no id is returned, navigate to sales list
        toast.success('Vente effectuée avec succès !')
        navigate('/app/sales')
      }
    } catch (error) {
      if (error.response?.data) {
        toast.error(error.response.data.message || 'Erreur lors de la vente')
      } else {
        toast.error('Erreur de connexion')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const { subtotal, tax, total } = calculateTotals()
  const change = paymentMethod === 'cash' && amountReceived ? 
    Math.max(0, parseFloat(amountReceived) - total) : 0

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/sales')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nouvelle Vente</h2>
            <p className="text-gray-500">Point de vente (POS)</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn-secondary flex items-center space-x-2">
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left: Product Selection */}
        <div className="lg:col-span-2 flex flex-col space-y-4 min-h-0">
          {/* Barcode Scanner Input */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scanner un code-barres..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleBarcodeSearch(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button className="btn-primary flex items-center space-x-2 px-4 py-2">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Scanner</span>
              </button>
            </div>
          </div>

          {/* Product Search */}
          <div className="relative flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher un produit (nom, SKU)..."
                onChange={(e) => {
                  handleSearch(e.target.value)
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-dropdown max-h-48 overflow-y-auto z-10">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">Stock: {product.stock_quantity || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-600">${product.sale_price}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-primary-600" />
                <span className="font-semibold text-gray-900">Panier</span>
                <span className="text-sm text-gray-500">({cart.length} articles)</span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Vider le panier ?')) setCart([])
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Vider
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2" />
                  <p>Aucun produit dans le panier</p>
                  <p className="text-sm">Scannez ou recherchez des produits</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.sku}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartItem(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Minus className="w-4 h-4 text-gray-500" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItem(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Plus className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                        <div className="text-right w-24">
                          <p className="font-semibold text-gray-900">${item.total.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">${item.sale_price.toFixed(2)}/unité</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
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

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200 flex-shrink-0">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sous-total</span>
                    <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Taxe</span>
                    <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-primary-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Customer & Payment */}
        <div className="lg:col-span-1 flex flex-col space-y-4">
          {/* Customer Selection */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <User className="w-4 h-4 text-primary-600" />
              <span>Client</span>
            </h3>
            
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-2 bg-primary-50 rounded-lg border border-primary-100">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{selectedCustomer.name}</p>
                  <p className="text-sm text-gray-500 truncate">{selectedCustomer.phone}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 hover:bg-primary-200 rounded text-primary-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
                    onChange={(e) => {
                      const search = e.target.value.toLowerCase()
                      const filtered = customers.filter(c => 
                        c.name.toLowerCase().includes(search) ||
                        c.phone.includes(search)
                      )
                      if (filtered.length > 0 && search.length > 0) {
                        // Show dropdown logic
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                <button
                  onClick={() => setShowNewCustomerModal(true)}
                  className="w-full btn-secondary flex items-center justify-center space-x-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau client</span>
                </button>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4 flex-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-primary-600" />
              <span>Paiement</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mode de paiement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['cash', 'mobile_money', 'card', 'credit'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        paymentMethod === method
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {method === 'cash' && <DollarSign className="w-4 h-4 inline mr-1" />}
                      {method === 'mobile_money' && <Smartphone className="w-4 h-4 inline mr-1" />}
                      {method === 'card' && <CreditCard className="w-4 h-4 inline mr-1" />}
                      {method === 'credit' && <Receipt className="w-4 h-4 inline mr-1" />}
                      {method === 'cash' && 'Espèces'}
                      {method === 'mobile_money' && 'Mobile Money'}
                      {method === 'card' && 'Carte'}
                      {method === 'credit' && 'Crédit'}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod !== 'credit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant reçu
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'cash' && amountReceived && parseFloat(amountReceived) > 0 && (
                <div className="flex justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-sm font-medium text-gray-700">Monnaie</span>
                  <span className="text-sm font-bold text-green-600">${change.toFixed(2)}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  rows="2"
                  placeholder="Notes sur la vente..."
                />
              </div>

              <button
                onClick={handlePayment}
                disabled={isSubmitting || cart.length === 0 || !selectedCustomer}
                className="w-full btn-primary flex items-center justify-center space-x-2 py-3 text-base"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                <span>
                  {isSubmitting ? 'Traitement...' : `Valider la vente $${total.toFixed(2)}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nouveau Client</h3>
              <button
                onClick={() => setShowNewCustomerModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className={`input-field ${customerErrors.name ? 'border-red-500' : ''}`}
                  placeholder="Ex: Jean M."
                />
                {customerErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{customerErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className={`input-field ${customerErrors.phone ? 'border-red-500' : ''}`}
                  placeholder="Ex: +243 812 345 678"
                />
                {customerErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{customerErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="input-field"
                  placeholder="Ex: jean@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville
                </label>
                <input
                  type="text"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Kinshasa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="input-field"
                  placeholder="Ex: 123 Avenue du Commerce"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleCreateCustomer}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2 py-2.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Créer le client</span>
                </button>
                <button
                  onClick={() => setShowNewCustomerModal(false)}
                  className="flex-1 btn-secondary py-2.5"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewSale