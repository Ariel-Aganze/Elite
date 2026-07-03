import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Save,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  User,
  Loader2,
  Truck,
} from 'lucide-react'
import toast from 'react-hot-toast'

const SupplierForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    country: '',
    city: '',
    contact_person: '',
    contact_phone: '',
    tax_id: '',
    is_active: true,
  })
  const [errors, setErrors] = useState({})

  const isEdit = !!id

  useEffect(() => {
    if (isEdit) {
      fetchSupplier()
    }
  }, [id])

  const fetchSupplier = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/suppliers/${id}/`)
      const data = response.data
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        country: data.country || '',
        city: data.city || '',
        contact_person: data.contact_person || '',
        contact_phone: data.contact_phone || '',
        tax_id: data.tax_id || '',
        is_active: data.is_active !== undefined ? data.is_active : true,
      })
    } catch (error) {
      toast.error('Erreur lors du chargement du fournisseur')
      navigate('/app/suppliers')
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
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/suppliers/${id}/`, formData)
        toast.success('Fournisseur mis à jour avec succès')
      } else {
        await api.post('/suppliers/', formData)
        toast.success('Fournisseur créé avec succès')
      }
      navigate('/app/suppliers')
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
          <p className="text-gray-500">Chargement du fournisseur...</p>
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
            onClick={() => navigate('/app/suppliers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}
            </h2>
            <p className="text-gray-500">
              {isEdit ? 'Modifiez les informations du fournisseur' : 'Ajoutez un nouveau fournisseur'}
            </p>
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
                <Building2 className="w-5 h-5 text-primary-600" />
                <span>Informations du Fournisseur</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du fournisseur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Ex: Tech Import SARL"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="Ex: +243 812 345 678"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ex: info@techimport.cd"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° Identification Fiscale
                  </label>
                  <input
                    type="text"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ex: 1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ex: RDC"
                  />
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

            {/* Contact Person */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-primary-600" />
                <span>Personne de Contact</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du contact
                  </label>
                  <input
                    type="text"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ex: Jean M."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone du contact
                  </label>
                  <input
                    type="text"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Ex: +243 812 345 679"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                <span className="text-sm text-gray-700">Fournisseur actif</span>
              </label>
            </div>

            {/* Quick Stats (Edit Mode) */}
            {isEdit && (
              <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Informations</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Créé le</span>
                    <span className="font-medium text-gray-900">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Dernière modification</span>
                    <span className="font-medium text-gray-900">
                      {new Date().toLocaleDateString()}
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
                  <span>{saving ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer le fournisseur'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/app/suppliers')}
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

export default SupplierForm