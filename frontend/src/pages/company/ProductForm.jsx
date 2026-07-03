import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Save,
  X,
  Package,
  Tag,
  DollarSign,
  Box,
  AlertCircle,
  Loader2,
  CheckCircle,
  Image,
  Plus,
} from 'lucide-react'
import toast from 'react-hot-toast'

const ProductForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [units, setUnits] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    name_fr: '',
    sku: '',
    barcode: '',
    category: '',
    brand: '',
    unit: '',
    purchase_price: '',
    sale_price: '',
    min_price: '',
    description: '',
    is_active: true,
    is_stockable: true,
    min_stock: '',
    max_stock: '',
  })
  const [errors, setErrors] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const isEdit = !!id

  useEffect(() => {
    fetchFormData()
    if (isEdit) {
      fetchProduct()
    }
  }, [id])

  const fetchFormData = async () => {
    try {
      const [categoriesRes, brandsRes, unitsRes] = await Promise.all([
        api.get('/categories/?is_active=true'),
        api.get('/brands/?is_active=true'),
        api.get('/units/?is_active=true'),
      ])
      setCategories(categoriesRes.data.results || categoriesRes.data || [])
      setBrands(brandsRes.data.results || brandsRes.data || [])
      setUnits(unitsRes.data.results || unitsRes.data || [])
    } catch (error) {
      toast.error('Erreur lors du chargement des données')
    }
  }

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/products/${id}/`)
      const data = response.data
      setFormData({
        name: data.name || '',
        name_en: data.name_en || '',
        name_fr: data.name_fr || '',
        sku: data.sku || '',
        barcode: data.barcode || '',
        category: data.category || '',
        brand: data.brand || '',
        unit: data.unit || '',
        purchase_price: data.purchase_price || '',
        sale_price: data.sale_price || '',
        min_price: data.min_price || '',
        description: data.description || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
        is_stockable: data.is_stockable !== undefined ? data.is_stockable : true,
        min_stock: data.min_stock || '',
        max_stock: data.max_stock || '',
      })
      if (data.image) {
        setImagePreview(data.image)
      }
    } catch (error) {
      toast.error('Erreur lors du chargement du produit')
      navigate('/app/products')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    })
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis'
    if (!formData.sku.trim()) newErrors.sku = 'Le SKU est requis'
    if (!formData.purchase_price) newErrors.purchase_price = 'Le prix d\'achat est requis'
    if (!formData.sale_price) newErrors.sale_price = 'Le prix de vente est requis'
    if (formData.min_stock && parseInt(formData.min_stock) < 0) {
      newErrors.min_stock = 'Le stock minimum doit être positif'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const submitData = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        min_price: parseFloat(formData.min_price) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        max_stock: parseInt(formData.max_stock) || 0,
      }

      let response
      if (isEdit) {
        response = await api.put(`/products/${id}/`, submitData)
        toast.success('Produit mis à jour avec succès')
      } else {
        response = await api.post('/products/', submitData)
        toast.success('Produit créé avec succès')
      }

      // Upload image if provided
      if (imageFile && response.data) {
        const formDataImage = new FormData()
        formDataImage.append('image', imageFile)
        await api.patch(`/products/${response.data.id}/upload-image/`, formDataImage, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      navigate('/app/products')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement du produit...</p>
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
            onClick={() => navigate('/app/products')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Modifier le Produit' : 'Nouveau Produit'}
            </h2>
            <p className="text-gray-500">
              {isEdit ? 'Modifiez les informations du produit' : 'Ajoutez un nouveau produit au catalogue'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Package className="w-5 h-5 text-primary-600" />
                <span>Informations Générales</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du produit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Ex: Ciment Lafarge 50kg"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    className={`input-field ${errors.sku ? 'border-red-500' : ''}`}
                    placeholder="Ex: CM-LAF-50"
                  />
                  {errors.sku && (
                    <p className="mt-1 text-sm text-red-600">{errors.sku}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code-barres
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ex: 1234567890123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom en Anglais
                  </label>
                  <input
                    type="text"
                    name="name_en"
                    value={formData.name_en}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ex: Lafarge Cement 50kg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="input-field"
                    rows="3"
                    placeholder="Description du produit..."
                  />
                </div>
              </div>
            </div>

            {/* Categorization */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Tag className="w-5 h-5 text-primary-600" />
                <span>Catégorisation</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marque
                  </label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Sélectionner une marque</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unité
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Sélectionner une unité</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-primary-600" />
                <span>Tarification</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix d'achat <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="purchase_price"
                      value={formData.purchase_price}
                      onChange={handleChange}
                      step="0.01"
                      className={`input-field pl-8 ${errors.purchase_price ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.purchase_price && (
                    <p className="mt-1 text-sm text-red-600">{errors.purchase_price}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix de vente <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="sale_price"
                      value={formData.sale_price}
                      onChange={handleChange}
                      step="0.01"
                      className={`input-field pl-8 ${errors.sale_price ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.sale_price && (
                    <p className="mt-1 text-sm text-red-600">{errors.sale_price}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix minimum autorisé
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="min_price"
                      value={formData.min_price}
                      onChange={handleChange}
                      step="0.01"
                      className="input-field pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Settings */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Box className="w-5 h-5 text-primary-600" />
                <span>Gestion du Stock</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock minimum
                  </label>
                  <input
                    type="number"
                    name="min_stock"
                    value={formData.min_stock}
                    onChange={handleChange}
                    className={`input-field ${errors.min_stock ? 'border-red-500' : ''}`}
                    placeholder="0"
                  />
                  {errors.min_stock && (
                    <p className="mt-1 text-sm text-red-600">{errors.min_stock}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock maximum
                  </label>
                  <input
                    type="number"
                    name="max_stock"
                    value={formData.max_stock}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center space-x-4 pt-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="is_stockable"
                      checked={formData.is_stockable}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Gérer le stock</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Image className="w-5 h-5 text-primary-600" />
                <span>Image du produit</span>
              </h3>

              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors cursor-pointer">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null)
                          setImageFile(null)
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-8">
                      <Image className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Cliquez pour télécharger</p>
                      <p className="text-xs text-gray-400">PNG, JPG jusqu'à 5MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                </div>
                <label
                  htmlFor="image-upload"
                  className="w-full btn-secondary inline-flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{imagePreview ? 'Changer l\'image' : 'Télécharger une image'}</span>
                </label>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut</h3>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Produit actif</span>
                </label>
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
                  <span>{saving ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer le produit'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/app/products')}
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

export default ProductForm