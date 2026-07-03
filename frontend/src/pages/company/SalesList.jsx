import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Loader2,
  Calendar,
  Users,
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Printer,
} from 'lucide-react'
import toast from 'react-hot-toast'

const SalesList = () => {
  const navigate = useNavigate()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchSales()
  }, [currentPage, search, statusFilter, dateFilter])

  const fetchSales = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        search: search || undefined,
        status: statusFilter || undefined,
      }
      const response = await api.get('/sales/', { params })
      setSales(response.data.results || response.data || [])
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 50))
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des ventes')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      completed: { label: 'Complétée', className: 'badge-success' },
      draft: { label: 'Brouillon', className: 'badge-gray' },
      voided: { label: 'Annulée', className: 'badge-danger' },
    }
    const badge = badges[status] || badges.draft
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const getPaymentBadge = (method) => {
    const badges = {
      cash: { label: 'Espèces', className: 'badge-info' },
      mobile_money: { label: 'Mobile Money', className: 'badge-info' },
      card: { label: 'Carte', className: 'badge-info' },
      credit: { label: 'Crédit', className: 'badge-warning' },
      mixed: { label: 'Mixte', className: 'badge-info' },
    }
    const badge = badges[method] || badges.cash
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des ventes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ventes</h2>
          <p className="text-gray-500">Historique des ventes et transactions</p>
        </div>
        <button
          onClick={() => navigate('/app/sales/new')}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Vente</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, client..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filtres</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdown */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Statut:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">Tous</option>
                <option value="completed">Complétée</option>
                <option value="draft">Brouillon</option>
                <option value="voided">Annulée</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {sales.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune vente</h3>
            <p className="text-gray-500">Commencez par effectuer votre première vente.</p>
            <button
              onClick={() => navigate('/app/sales/new')}
              className="mt-4 btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Vente</span>
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° Vente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payé
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paiement
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {sale.sale_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{sale.customer_name || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(sale.sale_date)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(sale.paid_amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getPaymentBadge(sale.payment_method)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(sale.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/app/sales/${sale.id}`)}
                          className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {currentPage} sur {totalPages}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SalesList