import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  Settings,
  Globe,
  DollarSign,
  Users,
  Shield,
  Mail,
  Bell,
  Save,
  AlertCircle,
  CheckCircle,
  Building2,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'

const PlatformSettings = () => {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'appearance', label: 'Apparence', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
  ]

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast.success('Paramètres enregistrés avec succès')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
          <p className="text-gray-500">Configuration de la plateforme</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center space-x-2"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations Générales</h3>
                <p className="text-sm text-gray-500 mb-4">Configuration de base de la plateforme</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de la plateforme
                    </label>
                    <input
                      type="text"
                      defaultValue="Elite RDC"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL de la plateforme
                    </label>
                    <input
                      type="text"
                      defaultValue="https://elite.cd"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email de support
                    </label>
                    <input
                      type="email"
                      defaultValue="support@elite.cd"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone de support
                    </label>
                    <input
                      type="text"
                      defaultValue="+243 812 345 678"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Devise par Défaut</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Devise principale
                    </label>
                    <select className="input-field">
                      <option value="USD">USD - Dollar Américain</option>
                      <option value="CDF">CDF - Franc Congolais</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Symbole de devise
                    </label>
                    <input
                      type="text"
                      defaultValue="$"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Langue</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Langue par défaut
                    </label>
                    <select className="input-field">
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fuseau horaire
                    </label>
                    <select className="input-field">
                      <option value="Africa/Kinshasa">Africa/Kinshasa</option>
                      <option value="Africa/Lagos">Africa/Lagos</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Apparence</h3>
                <p className="text-sm text-gray-500 mb-4">Personnalisation de l'interface</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thème
                    </label>
                    <select className="input-field">
                      <option value="light">Clair</option>
                      <option value="dark">Sombre</option>
                      <option value="system">Système</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Couleur primaire
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        defaultValue="#2563eb"
                        className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <span className="text-sm text-gray-500">#2563eb</span>
                    </div>
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
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">Nouvelles inscriptions</p>
                      <p className="text-sm text-gray-500">Notification lors d'une nouvelle entreprise</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">Expiration des abonnements</p>
                      <p className="text-sm text-gray-500">Alerte avant expiration</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">Rapports hebdomadaires</p>
                      <p className="text-sm text-gray-500">Résumé de la plateforme</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sécurité</h3>
                <p className="text-sm text-gray-500 mb-4">Configuration de la sécurité</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durée de session (minutes)
                    </label>
                    <input
                      type="number"
                      defaultValue="60"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tentatives de connexion
                    </label>
                    <input
                      type="number"
                      defaultValue="5"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">Double authentification</p>
                      <p className="text-sm text-gray-500">Renforcer la sécurité des comptes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">Journalisation des connexions</p>
                      <p className="text-sm text-gray-500">Enregistrer toutes les connexions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-gray-400" />
          <span>Informations Système</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Version</p>
            <p className="font-medium text-gray-900">v1.0.0</p>
          </div>
          <div>
            <p className="text-gray-500">Environnement</p>
            <p className="font-medium text-gray-900">Développement</p>
          </div>
          <div>
            <p className="text-gray-500">Dernière mise à jour</p>
            <p className="font-medium text-gray-900">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlatformSettings