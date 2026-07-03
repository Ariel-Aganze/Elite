import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Save,
  X,
  Building2,
  MapPin,
  Phone,
  User,
  Hash,
  Loader2,
  CheckCircle,
  AlertCircle,
  Warehouse,
  Store,
  Building,
  ShoppingBag,
} from 'lucide-react'
import toast from 'react-hot-toast'

const BranchForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    branch_type: 'shop',
    address: '',
    city: '',
    manager: '',
    phone: '',
    is_active: true,
  })
  const [errors, setErrors] = useState({})

  const isEdit = !!id

  useEffect(() => {
    if (isEdit) {
      fetchBranch()
    }
  }, [id])

  const fetchBranch = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/branches/${id}/`)
      const data = response.data
      setFormData({
        name: data.name || '',
        code: data.code || '',
        branch_type: data.branch_type || 'shop',
        address: data.address || '',
        city: data.city || '',
        manager: data.manager || '',
        phone: data.phone || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
      })
    } catch (error) {
      toast.error('Erreur lors du chargement de la succursale')
      navigate('/app/branches')
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
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis'
    if (!formData.code.trim()) newErrors.code = 'Le code est requis'
    if (formData.code && !/^[A-Z0-9-]+$/.test(formData.code.toUpperCase())) {
      newErrors.code = 'Utilisez des lettres majuscules, chiffres et tirets'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      // Ensure code is uppercase
      const data = {
        ...formData,
        code: formData.code.toUpperCase(),
      }

      if (isEdit) {
        await api.put(`/branches/${id}/`, data)
        toast.success('Succursale mise à jour avec succès')
      } else {
        await api.post('/branches/', data)
        toast.success('Succursale créée avec succès')
      }
      navigate('/app/branches')
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'central':
        return <Warehouse className="w-5 h-5" />
      case 'shop':
        return <Store className="w-5 h-5" />
      case 'agency':
        return <Building className="w-5 h-5" />
      case 'pos':
        return <ShoppingBag className="w-5 h-5" />
      default:
        return <Building2 className="w-5 h-5" />
    }
  }

  const getTypeLabel = (type) => {
    const labels = {
      central: 'Dépôt Central',
      shop: 'Boutique',
      agency: 'Agence',
      pos: 'Point de Vente',
    }
    return labels[type] || type
  }

  const typeOptions = [
    { value: 'central', label: 'Dépôt Central', icon: Warehouse },
    { value: 'shop', label: 'Boutique', icon: Store },
    { value: 'agency', label: 'Agence', icon: Building },
    { value: 'pos', label: 'Point de Vente', icon: ShoppingBag },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement de la succursale...</p>
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
            onClick={() => navigate('/app/branches')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Modifier la Succursale' : 'Nouvelle Succursale'}
            </h2>
            <p className="text-gray-500">
              {isEdit ? 'Modifiez les informations de la succursale' : 'Ajoutez une nouvelle succursale'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                <span>Informations de la Succursale</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la succursale <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Ex: Kinshasa"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className={`input-field uppercase ${errors.code ? 'border-red-500' : ''}`}
                    placeholder="Ex: KIN"
                  />
                  <p className="mt-1 text-xs text-gray-400">Code unique, lettres majuscules et tirets</p>
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="branch_type"
                    value={formData.branch_type}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ex: Kinshasa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Responsable
                  </label>
                  <input
                    type="text"
                    name="manager"
                    value={formData.manager}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ex: Jean M."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ex: +243 812 345 678"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ex: 123 Avenue du Commerce"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Type Preview */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Type de Succursale</h3>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                  {getTypeIcon(formData.branch_type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{getTypeLabel(formData.branch_type)}</p>
                  <p className="text-sm text-gray-500">
                    {formData.branch_type === 'central' && 'Entrepôt principal de l\'entreprise'}
                    {formData.branch_type === 'shop' && 'Boutique de vente au détail'}
                    {formData.branch_type === 'agency' && 'Agence commerciale'}
                    {formData.branch_type === 'pos' && 'Point de vente temporaire'}
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut</h3>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Succursale active</span>
              </label>
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
                  <span>{saving ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer la succursale'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/app/branches')}
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

export default BranchForm