import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  Settings,
  Save,
  Globe,
  DollarSign,
  Users,
  Shield,
  Mail,
  Bell,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  X,
  User,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Package,
  Truck,
} from 'lucide-react'
import toast from 'react-hot-toast'

const CompanySettings = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    currency: 'USD',
    language: 'fr',
    timezone: 'Africa/Kinshasa',
    invoice_prefix: 'INV-',
    payment_terms: 30,
    invoice_message: 'Merci de votre confiance',
    low_stock_threshold: 10,
    stock_alerts: true,
    email_notifications: true,
    low_stock_alert: true,
    invoice_reminder: true,
    weekly_report: false,
  })
  const [errors, setErrors] = useState({})
  const [currencies, setCurrencies] = useState([
    { code: 'USD', name: 'Dollar Américain', symbol: '$' },
    { code: 'CDF', name: 'Franc Congolais', symbol: 'FC' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
  ])
  const [languages, setLanguages] = useState([
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'pt', name: 'Português' },
  ])
  const [timezones, setTimezones] = useState([
    'Africa/Kinshasa',
    'Africa/Lagos',
    'Africa/Nairobi',
    'UTC',
    'Europe/Paris',
    'America/New_York',
  ])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await api.get('/tenant/')
      const data = response.data
      setFormData(prev => ({
        ...prev,
        name: data.name || '',
        code: data.code || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
      }))
    } catch (error) {
      console.error('Error fetching settings:', error)
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
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis'
    if (formData.low_stock_threshold < 0) {
      newErrors.low_stock_threshold = 'Le seuil doit être positif'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      await api.put('/tenant/', {
        name: formData.name,
        code: formData.code,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      })
      toast.success('Paramètres enregistrés avec succès')
      setTimeout(() => {
        setSaving(false)
      }, 1000)
    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data)
        toast.error('Erreur lors de l\'enregistrement')
      } else {
        toast.error('Erreur de connexion')
      }
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'company', label: 'Entreprise', icon: Building2 },
    { id: 'invoicing', label: 'Facturation', icon: FileText },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des paramètres...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
          <p className="text-gray-500">Configuration de votre entreprise</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn-primary flex items-center space-x-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Paramètres Généraux</h3>
                  <p className="text-sm text-gray-500 mb-4">Configuration de base de l'entreprise</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Devise par défaut
                      </label>
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        className="input-field"
                      >
                        {currencies.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.code} - {curr.name} ({curr.symbol})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Langue par défaut
                      </label>
                      <select
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        className="input-field"
                      >
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fuseau horaire
                      </label>
                      <select
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleChange}
                        className="input-field"
                      >
                        {timezones.map((tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Company Settings */}
            {activeTab === 'company' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations de l'Entreprise</h3>
                  <p className="text-sm text-gray-500 mb-4">Mettez à jour les informations de votre entreprise</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de l'entreprise <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                        placeholder="Elite RDC SARL"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="ELITE-KIN"
                        disabled
                      />
                      <p className="mt-1 text-xs text-gray-400">Le code ne peut pas être modifié</p>
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
                        placeholder="contact@elite.cd"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
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
                        placeholder="123 Avenue du Commerce, Kinshasa, RDC"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Invoicing Settings */}
            {activeTab === 'invoicing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Paramètres de Facturation</h3>
                  <p className="text-sm text-gray-500 mb-4">Configuration des factures</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Préfixe des factures
                      </label>
                      <input
                        type="text"
                        name="invoice_prefix"
                        value={formData.invoice_prefix}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="INV-"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Conditions de paiement (jours)
                      </label>
                      <input
                        type="number"
                        name="payment_terms"
                        value={formData.payment_terms}
                        onChange={handleChange}
                        className="input-field"
                        min="0"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Message sur la facture
                      </label>
                      <textarea
                        name="invoice_message"
                        value={formData.invoice_message}
                        onChange={handleChange}
                        className="input-field"
                        rows="2"
                        placeholder="Merci de votre confiance"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stock Settings */}
            {activeTab === 'stock' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Paramètres de Stock</h3>
                  <p className="text-sm text-gray-500 mb-4">Configuration de la gestion des stocks</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seuil d'alerte stock bas
                      </label>
                      <input
                        type="number"
                        name="low_stock_threshold"
                        value={formData.low_stock_threshold}
                        onChange={handleChange}
                        className={`input-field ${errors.low_stock_threshold ? 'border-red-500' : ''}`}
                        min="0"
                      />
                      {errors.low_stock_threshold && (
                        <p className="mt-1 text-sm text-red-600">{errors.low_stock_threshold}</p>
                      )}
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="stock_alerts"
                          checked={formData.stock_alerts}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Activer les alertes de stock</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Notifications</h3>
                  <p className="text-sm text-gray-500 mb-4">Configuration des alertes et notifications</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">Notifications par email</p>
                        <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="email_notifications"
                          checked={formData.email_notifications}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">Alerte stock bas</p>
                        <p className="text-sm text-gray-500">Notification lorsque le stock est bas</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="low_stock_alert"
                          checked={formData.low_stock_alert}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">Rappel des factures</p>
                        <p className="text-sm text-gray-500">Rappel avant échéance des factures</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="invoice_reminder"
                          checked={formData.invoice_reminder}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">Rapport hebdomadaire</p>
                        <p className="text-sm text-gray-500">Rapport résumé chaque semaine</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="weekly_report"
                          checked={formData.weekly_report}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-gray-400" />
          <span>Informations Système</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Version</p>
            <p className="font-medium text-gray-900">v1.0.0</p>
          </div>
          <div>
            <p className="text-gray-500">Environnement</p>
            <p className="font-medium text-gray-900">{import.meta.env.MODE || 'Développement'}</p>
          </div>
          <div>
            <p className="text-gray-500">Dernière mise à jour</p>
            <p className="font-medium text-gray-900">{new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanySettings