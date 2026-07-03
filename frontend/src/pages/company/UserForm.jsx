import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Save,
  X,
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Key,
  UserCog,
} from 'lucide-react'
import toast from 'react-hot-toast'

const UserForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [branches, setBranches] = useState([])
  const [allPermissions, setAllPermissions] = useState([])
  const [permissionTemplates, setPermissionTemplates] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    password: '',
    branch: '',
    is_tenant_admin: false,
    permissions: [],
    is_active: true,
  })
  const [errors, setErrors] = useState({})
  const [selectedTemplate, setSelectedTemplate] = useState('')

  const isEdit = !!id

  useEffect(() => {
    fetchFormData()
    if (isEdit) {
      fetchUser()
    }
  }, [id])

  const fetchFormData = async () => {
    try {
      const [branchesRes, permissionsRes] = await Promise.all([
        api.get('/branches/?is_active=true'),
        api.get('/permissions/templates/'),
      ])
      setBranches(branchesRes.data.results || branchesRes.data || [])
      
      const permData = permissionsRes.data
      setAllPermissions(permData.all_capabilities || [])
      setPermissionTemplates(permData.templates || [])
      
      // Auto-select first branch
      if (branchesRes.data.length > 0 && !formData.branch) {
        setFormData(prev => ({ ...prev, branch: branchesRes.data[0].id }))
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données')
    }
  }

  const fetchUser = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/users/${id}/`)
      const data = response.data
      setFormData({
        username: data.username || '',
        email: data.email || '',
        phone: data.phone || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        password: '',
        branch: data.branch || '',
        is_tenant_admin: data.is_tenant_admin || false,
        permissions: data.permissions || [],
        is_active: data.is_active !== undefined ? data.is_active : true,
      })
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'utilisateur')
      navigate('/app/users')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox' && name === 'is_tenant_admin') {
      // If admin is checked, select all permissions
      if (checked) {
        const allPermKeys = allPermissions.map(p => p.key)
        setFormData({
          ...formData,
          is_tenant_admin: checked,
          permissions: allPermKeys,
        })
      } else {
        setFormData({
          ...formData,
          is_tenant_admin: checked,
          permissions: [],
        })
      }
    } else if (type === 'checkbox' && name === 'permission') {
      const permKey = value
      const currentPermissions = formData.permissions || []
      const newPermissions = currentPermissions.includes(permKey)
        ? currentPermissions.filter(p => p !== permKey)
        : [...currentPermissions, permKey]
      setFormData({
        ...formData,
        permissions: newPermissions,
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const applyTemplate = (templateName) => {
    const template = permissionTemplates.find(t => t.name === templateName)
    if (template) {
      setFormData({
        ...formData,
        permissions: template.permissions,
      })
      setSelectedTemplate(templateName)
      toast.success(`Modèle "${templateName}" appliqué`)
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.username.trim()) newErrors.username = 'Le nom d\'utilisateur est requis'
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis'
    if (!isEdit && !formData.password) newErrors.password = 'Le mot de passe est requis'
    if (!formData.branch) newErrors.branch = 'La succursale est requise'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const data = { ...formData }
      if (!data.password) delete data.password

      if (isEdit) {
        await api.put(`/users/${id}/`, data)
        toast.success('Utilisateur mis à jour avec succès')
      } else {
        await api.post('/users/', data)
        toast.success('Utilisateur créé avec succès')
      }
      navigate('/app/users')
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

  const getPermissionLabel = (key) => {
    const perm = allPermissions.find(p => p.key === key)
    return perm ? perm.label : key
  }

  const getPermissionModule = (key) => {
    const perm = allPermissions.find(p => p.key === key)
    return perm ? perm.module : ''
  }

  // Group permissions by module
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const module = perm.module || 'Autres'
    if (!acc[module]) acc[module] = []
    acc[module].push(perm)
    return acc
  }, {})

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
            onClick={() => navigate('/app/users')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Modifier l\'Utilisateur' : 'Nouvel Utilisateur'}
            </h2>
            <p className="text-gray-500">
              {isEdit ? 'Modifiez les informations et permissions' : 'Créez un nouvel utilisateur'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-primary-600" />
                <span>Informations Personnelles</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom d'utilisateur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`input-field ${errors.username ? 'border-red-500' : ''}`}
                    placeholder="john_doe"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="john@elite.cd"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Doe"
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
                    placeholder="+243 812 345 678"
                  />
                </div>
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
                {!isEdit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`input-field ${errors.password ? 'border-red-500' : ''}`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-primary-600" />
                <span>Permissions</span>
                <span className="text-sm text-gray-500">({formData.permissions?.length || 0} permissions)</span>
              </h3>

              {/* Admin Toggle */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_tenant_admin"
                    checked={formData.is_tenant_admin}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Administrateur complet</p>
                    <p className="text-sm text-gray-500">Accès à toutes les fonctionnalités et données</p>
                  </div>
                </label>
              </div>

              {/* Permission Templates */}
              {!formData.is_tenant_admin && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modèles de permissions
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {permissionTemplates.map((template) => (
                      <button
                        key={template.name}
                        type="button"
                        onClick={() => applyTemplate(template.name)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          selectedTemplate === template.name
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Permission List */}
              {!formData.is_tenant_admin && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.keys(groupedPermissions).map((module) => (
                    <div key={module}>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">{module}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {groupedPermissions[module].map((perm) => (
                          <label key={perm.key} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              name="permission"
                              value={perm.key}
                              checked={formData.permissions?.includes(perm.key) || false}
                              onChange={handleChange}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-gray-700">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                <span className="text-sm text-gray-700">Utilisateur actif</span>
              </label>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Succursale</span>
                  <span className="font-medium text-gray-900">
                    {branches.find(b => b.id === formData.branch)?.name || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Permissions</span>
                  <span className="font-medium text-gray-900">
                    {formData.is_tenant_admin ? 'Toutes' : formData.permissions?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Statut</span>
                  <span className={`font-medium ${formData.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.is_active ? 'Actif' : 'Inactif'}
                  </span>
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
                  <span>{saving ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer l\'utilisateur'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/app/users')}
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

export default UserForm