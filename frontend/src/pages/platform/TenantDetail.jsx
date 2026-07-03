import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Building2,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Save,
  X,
  AlertCircle,
  Users,
  Store,
  CreditCard,
  DollarSign,
  Activity,
  Plus,
  Trash2,
} from 'lucide-react'
import { tenantsApi } from '../../api/client'
import toast from 'react-hot-toast'

const TenantDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [activating, setActivating] = useState(false)
  const [extending, setExtending] = useState(false)
  const [extensionDays, setExtensionDays] = useState(30)

  useEffect(() => {
    fetchTenant()
  }, [id])

  const fetchTenant = async () => {
    setLoading(true)
    try {
      const response = await tenantsApi.detail(id)
      setTenant(response.data)
      setFormData({
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone,
        address: response.data.address,
        code: response.data.code,
      })
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'entreprise')
      navigate('/platform/tenants')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      await tenantsApi.update(id, formData)
      toast.success('Informations mises à jour')
      setEditing(false)
      fetchTenant()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleActivate = async (activate) => {
    setActivating(true)
    try {
      const data = {
        is_active: activate,
        subscription_status: activate ? 'active' : 'suspended',
      }
      await tenantsApi.activate(id, data)
      toast.success(activate ? 'Entreprise activée' : 'Entreprise désactivée')
      fetchTenant()
    } catch (error) {
      toast.error('Erreur lors de l\'activation')
    } finally {
      setActivating(false)
    }
  }

  const handleExtend = async () => {
    if (extensionDays <= 0) {
      toast.error('Le nombre de jours doit être positif')
      return
    }
    setExtending(true)
    try {
      await tenantsApi.extend(id, { days: extensionDays })
      toast.success(`Abonnement prolongé de ${extensionDays} jours`)
      setExtending(false)
      fetchTenant()
    } catch (error) {
      toast.error('Erreur lors de la prolongation')
      setExtending(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: { label: 'Actif', className: 'bg-success-100 text-success-800' },
      pending: { label: 'En attente', className: 'bg-warning-100 text-warning-800' },
      expired: { label: 'Expiré', className: 'bg-danger-100 text-danger-800' },
      suspended: { label: 'Suspendu', className: 'bg-gray-100 text-gray-800' },
    }
    const badge = badges[status] || badges.pending
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Entreprise non trouvée</h3>
        <button
          onClick={() => navigate('/platform/tenants')}
          className="mt-4 btn-primary"
        >
          Retour à la liste
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/platform/tenants')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{tenant.name}</h2>
            <p className="text-gray-500">{tenant.code}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Modifier</span>
            </button>
          )}
          {tenant.is_active ? (
            <button
              onClick={() => handleActivate(false)}
              disabled={activating}
              className="btn-danger flex items-center space-x-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Désactiver</span>
            </button>
          ) : (
            <button
              onClick={() => handleActivate(true)}
              disabled={activating}
              className="btn-primary flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Activer</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Utilisateurs</p>
              <p className="text-xl font-bold text-gray-900">{tenant.user_count || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-success-100 rounded-lg">
              <Store className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Succursales</p>
              <p className="text-xl font-bold text-gray-900">{tenant.branch_count || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Calendar className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Abonnement</p>
              <p className="text-xl font-bold text-gray-900">
                {getStatusBadge(tenant.subscription_status)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expiration</p>
              <p className="text-xl font-bold text-gray-900">
                {tenant.subscription_end_date ? formatDate(tenant.subscription_end_date) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
          
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  rows="2"
                />
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={handleUpdate} className="btn-primary flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Enregistrer</span>
                </button>
                <button onClick={() => setEditing(false)} className="btn-secondary">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{tenant.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{tenant.phone}</span>
              </div>
              {tenant.address && (
                <div className="flex items-start space-x-3 text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>{tenant.address}</span>
                </div>
              )}
              <div className="flex items-center space-x-3 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Inscrit le {formatDate(tenant.created_at)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions Card */}
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prolonger l'abonnement
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(parseInt(e.target.value) || 0)}
                  className="input-field w-24"
                />
                <span className="text-sm text-gray-500">jours</span>
                <button
                  onClick={handleExtend}
                  disabled={extending}
                  className="btn-primary flex items-center space-x-1"
                >
                  {extending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Prolonger</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">Statut actuel</p>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${tenant.is_active ? 'bg-success-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium">
                  {tenant.is_active ? 'Actif' : 'Inactif'}
                </span>
                <span className="text-sm text-gray-400">•</span>
                {getStatusBadge(tenant.subscription_status)}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
                    // Delete logic
                  }
                }}
                className="text-danger-600 hover:text-danger-700 text-sm font-medium flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer l'entreprise</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TenantDetail