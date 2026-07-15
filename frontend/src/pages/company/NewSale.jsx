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
  Grid3x3,
  List,
  Barcode,
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
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [customerSearchResults, setCustomerSearchResults] = useState([])
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountReceived, setAmountReceived] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '', city: '' })
  const [customerErrors, setCustomerErrors] = useState({})
  const [viewMode, setViewMode] = useState('grid')
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const searchInputRef = useRef(null)
  const barcodeInputRef = useRef(null)
  const customerSearchRef = useRef(null)

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch customers and products on load
  useEffect(() => {
    fetchCustomers()
    fetchProducts()
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    }, 500)
  }, [])

  // Handle customer search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (customerSearchTerm.length >= 2) {
        searchCustomers(customerSearchTerm)
      } else if (customerSearchTerm.length === 0) {
        setCustomerSearchResults([])
        setShowCustomerDropdown(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [customerSearchTerm])

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers/?is_active=true')
      setCustomers(response.data.results || response.data || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const searchCustomers = async (search) => {
    setLoadingCustomers(true)
    try {
      const response = await api.get(`/customers/?search=${encodeURIComponent(search)}&is_active=true`)
      const results = response.data.results || response.data || []
      setCustomerSearchResults(results)
      setShowCustomerDropdown(results.length > 0)
    } catch (error) {
      console.error('Error searching customers:', error)
      toast.error('Erreur lors de la recherche de clients')
    } finally {
      setLoadingCustomers(false)
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

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer)
    setShowCustomerDropdown(false)
    setCustomerSearchTerm('')
    setCustomerSearchResults([])
  }

  const addToCart = (product) => {
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
    setSelectedProductId(null)
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
    
    if (paymentMethod === 'cash') {
      const received = parseFloat(amountReceived)
      if (isNaN(received) || received < total) {
        toast.error(`Montant insuffisant. Total: $${total.toFixed(2)}`)
        return
      }
    }

    setIsSubmitting(true)
    try {
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
      
      if (response.data && response.data.id) {
        toast.success('Vente effectuée avec succès !')
        navigate(`/app/sales/${response.data.id}`)
      } else if (response.data && response.data.sale_id) {
        toast.success('Vente effectuée avec succès !')
        navigate(`/app/sales/${response.data.sale_id}`)
      } else {
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

  // Filter products with stock > 0 for quick selection
  const availableProducts = products.filter(p => (p.stock_quantity || 0) > 0)

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4 flex-shrink-0">
        <div className="flex items-center space-x-2 md:space-x-4">
          <button
            onClick={() => navigate('/app/sales')}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-gray-900">Nouvelle Vente</h2>
            <p className="text-xs md:text-sm text-gray-500 hidden sm:block">Point de vente (POS)</p>
          </div>
        </div>
        <button className="btn-secondary flex items-center space-x-1 md:space-x-2 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2">
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Imprimer</span>
        </button>
      </div>

      {/* Mobile: Toggle between Products and Cart */}
      <div className="flex md:hidden gap-2 mb-3 flex-shrink-0">
        <button
          onClick={() => setViewMode('products')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            viewMode === 'products' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Produits
        </button>
        <button
          onClick={() => setViewMode('cart')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            viewMode === 'cart' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Panier ({cart.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 flex-1 min-h-0">
        {/* Left: Product Selection */}
        <div className={`lg:col-span-2 flex flex-col space-y-3 md:space-y-4 min-h-0 ${
          isMobile && viewMode === 'cart' ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Search and Barcode */}
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher un produit..."
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="relative flex-1 sm:flex-none sm:w-48">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Code-barres..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleBarcodeSearch(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Vue grille"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Vue liste"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-dropdown max-h-40 overflow-y-auto flex-shrink-0">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0 text-sm"
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">Stock: {product.stock_quantity || 0}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-primary-600">${product.sale_price}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick Product Grid */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 flex-1 overflow-hidden flex flex-col">
            <div className="p-2 md:p-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <span className="text-sm md:text-base font-semibold text-gray-900">Produits disponibles</span>
              <span className="text-xs md:text-sm text-gray-500">{availableProducts.length} articles</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 md:p-3">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {availableProducts.slice(0, isMobile ? 8 : 20).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="p-2 md:p-3 bg-gray-50 hover:bg-primary-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-all text-left"
                    >
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-1 md:mb-2 mx-auto">
                        <Package className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
                      </div>
                      <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-[10px] md:text-xs text-gray-500 truncate">{product.sku}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] md:text-xs text-gray-400">Stock: {product.stock_quantity || 0}</span>
                        <span className="text-xs md:text-sm font-bold text-primary-600">${product.sale_price}</span>
                      </div>
                    </button>
                  ))}
                  {availableProducts.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Aucun produit disponible</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {availableProducts.slice(0, isMobile ? 15 : 30).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="w-full px-2 md:px-3 py-1.5 md:py-2 hover:bg-gray-50 rounded-lg flex items-center justify-between border border-transparent hover:border-gray-200 transition-all text-sm"
                    >
                      <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-3 h-3 md:w-4 md:h-4 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-[10px] md:text-xs text-gray-500 truncate">{product.sku}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0 ml-2">
                        <span className="text-[10px] md:text-xs text-gray-400 hidden sm:inline">Stock: {product.stock_quantity || 0}</span>
                        <span className="text-xs md:text-sm font-bold text-primary-600">${product.sale_price}</span>
                      </div>
                    </button>
                  ))}
                  {availableProducts.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Aucun produit disponible</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Customer & Payment */}
        <div className={`lg:col-span-1 flex flex-col space-y-3 md:space-y-4 ${
          isMobile && viewMode === 'products' ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Customer Selection */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-3 md:p-4">
            <h3 className="text-xs md:text-sm font-semibold text-gray-700 mb-2 md:mb-3 flex items-center space-x-2">
              <User className="w-4 h-4 text-primary-600" />
              <span>Client</span>
            </h3>
            
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-2 bg-primary-50 rounded-lg border border-primary-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedCustomer.name}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedCustomer.phone}</p>
                  {selectedCustomer.email && (
                    <p className="text-[10px] text-gray-400 truncate hidden sm:block">{selectedCustomer.email}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 hover:bg-primary-200 rounded text-primary-600 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={customerSearchRef}
                      type="text"
                      placeholder="Rechercher un client..."
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      onFocus={() => {
                        if (customerSearchResults.length > 0) {
                          setShowCustomerDropdown(true)
                        }
                      }}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                  </div>
                  {loadingCustomers && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  )}
                  
                  {/* Customer Dropdown */}
                  {showCustomerDropdown && customerSearchResults.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-dropdown max-h-40 overflow-y-auto">
                      {customerSearchResults.map((customer) => (
                        <button
                          key={customer.id}
                          onClick={() => selectCustomer(customer)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0 text-sm"
                        >
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.phone}</p>
                          </div>
                          {customer.city && (
                            <span className="text-xs text-gray-400 flex-shrink-0">{customer.city}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* No Results Message */}
                  {customerSearchTerm.length >= 2 && !loadingCustomers && customerSearchResults.length === 0 && !showCustomerDropdown && (
                    <div className="mt-1 text-xs text-gray-500">
                      Aucun client trouvé. 
                      <button 
                        onClick={() => setShowNewCustomerModal(true)}
                        className="text-primary-600 hover:text-primary-700 font-medium ml-1"
                      >
                        Créer un client
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowNewCustomerModal(true)}
                  className="w-full btn-secondary flex items-center justify-center space-x-2 text-xs md:text-sm py-1.5 md:py-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Nouveau client</span>
                </button>
              </div>
            )}
          </div>

          {/* Cart Summary */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-3 md:p-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2 md:mb-3 flex-shrink-0">
              <h3 className="text-xs md:text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-primary-600" />
                <span>Panier</span>
                <span className="text-xs text-gray-400">({cart.length})</span>
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Vider le panier ?')) setCart([])
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Vider
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {cart.length === 0 ? (
                <div className="text-center py-4 md:py-6 text-gray-400">
                  <ShoppingCart className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
                  <p className="text-xs md:text-sm">Panier vide</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex-1 min-w-0 mr-1 md:mr-2">
                      <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-[10px] md:text-xs text-gray-500">${item.sale_price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-1 md:space-x-2">
                      <button
                        onClick={() => updateCartItem(item.id, item.quantity - 1)}
                        className="p-0.5 hover:bg-gray-200 rounded"
                      >
                        <Minus className="w-3 h-3 text-gray-500" />
                      </button>
                      <span className="w-5 md:w-6 text-center text-xs md:text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItem(item.id, item.quantity + 1)}
                        className="p-0.5 hover:bg-gray-200 rounded"
                      >
                        <Plus className="w-3 h-3 text-gray-500" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-0.5 hover:bg-red-100 rounded text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-2 md:pt-3 border-t border-gray-200 flex-shrink-0 space-y-1">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-500">Sous-total</span>
                  <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm md:text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">${total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-3 md:p-4">
            <h3 className="text-xs md:text-sm font-semibold text-gray-700 mb-2 md:mb-3 flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-primary-600" />
              <span>Paiement</span>
            </h3>

            <div className="space-y-2 md:space-y-3">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Mode de paiement
                </label>
                <div className="grid grid-cols-2 gap-1 md:gap-2">
                  {['cash', 'mobile_money', 'card', 'credit'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`px-2 py-1 md:py-1.5 text-[10px] md:text-xs font-medium rounded-lg border transition-colors ${
                        paymentMethod === method
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {method === 'cash' && <DollarSign className="w-3 h-3 inline mr-1" />}
                      {method === 'mobile_money' && <Smartphone className="w-3 h-3 inline mr-1" />}
                      {method === 'card' && <CreditCard className="w-3 h-3 inline mr-1" />}
                      {method === 'credit' && <Receipt className="w-3 h-3 inline mr-1" />}
                      {method === 'cash' && 'Espèces'}
                      {method === 'mobile_money' && 'MoMo'}
                      {method === 'card' && 'Carte'}
                      {method === 'credit' && 'Crédit'}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod !== 'credit' && (
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    Montant reçu
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="w-full pl-8 pr-4 py-1.5 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'cash' && amountReceived && parseFloat(amountReceived) > 0 && (
                <div className="flex justify-between p-1.5 md:p-2 bg-green-50 rounded-lg border border-green-200 text-xs md:text-sm">
                  <span className="font-medium text-gray-700">Monnaie</span>
                  <span className="font-bold text-green-600">${change.toFixed(2)}</span>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={isSubmitting || cart.length === 0 || !selectedCustomer}
                className="w-full btn-primary flex items-center justify-center space-x-2 py-2 md:py-2.5 text-xs md:text-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>
                  {isSubmitting ? 'Traitement...' : `Valider $${total.toFixed(2)}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto p-4 md:p-6 max-h-[90vh] overflow-y-auto">
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

              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button
                  onClick={handleCreateCustomer}
                  className="w-full sm:flex-1 btn-primary flex items-center justify-center space-x-2 py-2.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Créer le client</span>
                </button>
                <button
                  onClick={() => setShowNewCustomerModal(false)}
                  className="w-full sm:flex-1 btn-secondary py-2.5"
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