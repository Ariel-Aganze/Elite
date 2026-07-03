import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Users,
  Store,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Package,
  DollarSign,
  Calendar,
} from 'lucide-react'
import { tenantsApi } from '../../api/client'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await tenantsApi.dashboard()
        setStats(response.data)
        setLoading(false)
      } catch (error) {
        toast.error('Erreur lors du chargement du tableau de bord')
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Aucune donnée disponible</h3>
        <p className="text-gray-500">Le tableau de bord est vide pour le moment.</p>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Entreprises',
      value: stats.total_tenants,
      icon: Building2,
      color: 'bg-primary-100 text-primary-600',
    },
    {
      label: 'Entreprises Actives',
      value: stats.active_tenants,
      icon: CheckCircle,
      color: 'bg-success-100 text-success-600',
    },
    {
      label: 'En Attente',
      value: stats.pending_tenants,
      icon: Clock,
      color: 'bg-warning-100 text-warning-600',
    },
    {
      label: 'Expirées',
      value: stats.expired_tenants,
      icon: AlertCircle,
      color: 'bg-danger-100 text-danger-600',
    },
    {
      label: 'Expiration Prochaine',
      value: stats.expiring_soon,
      icon: Calendar,
      color: 'bg-warning-100 text-warning-600',
    },
    {
      label: 'Utilisateurs Total',
      value: stats.total_users,
      icon: Users,
      color: 'bg-primary-100 text-primary-600',
    },
    {
      label: 'Succursales',
      value: stats.total_branches,
      icon: Store,
      color: 'bg-primary-100 text-primary-600',
    },
    {
      label: 'Nouvelles Inscriptions',
      value: stats.recent_signups,
      icon: Activity,
      color: 'bg-success-100 text-success-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tableau de Bord</h2>
          <p className="text-gray-500">Vue d'ensemble de la plateforme</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="w-4 h-4" />
          <span>Dernière mise à jour: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-xl shadow-card border border-gray-100 p-6 hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité Récente</h3>
        <div className="text-center py-8 text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-2" />
          <p>Les activités récentes apparaîtront ici</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard