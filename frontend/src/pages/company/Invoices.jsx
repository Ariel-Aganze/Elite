import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  FileText,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
  Users,
  DollarSign,
  Receipt,
  Download,
  Printer,
} from 'lucide-react'
import toast from 'react-hot-toast'

const Invoices = () => {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [branches, setBranches] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    partially_paid: 0,
    overdue: 0,
    count: 0,
  })

  useEffect(() => {
    fetchBranches()
    fetchInvoices()
  }, [currentPage, search, statusFilter, branchFilter])

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches/?is_active=true')
      setBranches(response.data.results || response.data || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        search: search || undefined,
        status: statusFilter || undefined,
        branch: branchFilter || undefined,
      }
      const response = await api.get('/invoices/', { params })
      const data = response.data.results || response.data || []
      setInvoices(data)
      
      // Calculate summary
      const total = data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      const paid = data.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      const partially_paid = data.filter(inv => inv.status === 'partially_paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      const overdue = data.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      
      setSummary({
        total,
        paid,
        partially_paid,
        overdue,
        count: data.length,
      })
      
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 50))
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des factures')
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
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      paid: { label: 'Payée', className: 'badge-success' },
      partially_paid: { label: 'Partiellement payée', className: 'badge-warning' },
      overdue: { label: 'En retard', className: 'badge-danger' },
      sent: { label: 'Envoyée', className: 'badge-info' },
      draft: { label: 'Brouillon', className: 'badge-gray' },
      cancelled: { label: 'Annulée', className: 'badge-danger' },
    }
    const badge = badges[status] || badges.draft
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'partially_paid':
        return <Clock className="w-4 h-4 text-amber-500" />
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'sent':
        return <FileText className="w-4 h-4 text-blue-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  const getBranchName = (id) => {
    const branch = branches.find(b => b.id === id)
    return branch ? branch.name : '—'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des factures...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Factures</h2>
          <p className="text-gray-500">Gestion des factures et suivi des paiements</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/app/sales/new')}
            className="btn-primary flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Nouvelle Facture</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Factures</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total)}</p>
          <p className="text-xs text-gray-400">{summary.count} factures</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-green-100 p-4">
          <p className="text-sm text-gray-500">Payées</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.paid)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-amber-100 p-4">
          <p className="text-sm text-gray-500">Partiellement payées</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.partially_paid)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-red-100 p-4">
          <p className="text-sm text-gray-500">En retard</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.overdue)}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une facture..."
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
            {(statusFilter || branchFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('')
                  setBranchFilter('')
                  setCurrentPage(1)
                }}
                className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
              >
                <X className="w-3 h-3" />
                <span>Effacer</span>
              </button>
            )}
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
                <option value="paid">Payée</option>
                <option value="partially_paid">Partiellement payée</option>
                <option value="overdue">En retard</option>
                <option value="sent">Envoyée</option>
                <option value="draft">Brouillon</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Succursale:</label>
              <select
                value={branchFilter}
                onChange={(e) => {
                  setBranchFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">Toutes</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune facture</h3>
            <p className="text-gray-500">Les factures apparaîtront ici une fois les ventes effectuées.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° Facture
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Succursale
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payé
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solde
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Échéance
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
                  {invoices.map((invoice) => {
                    const outstanding = (invoice.total_amount || 0) - (invoice.paid_amount || 0)
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {invoice.invoice_number}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{invoice.customer_name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {invoice.branch_name || getBranchName(invoice.branch) || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatCurrency(invoice.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(invoice.paid_amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${outstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            {formatCurrency(outstanding)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(invoice.due_date)}
                          {invoice.is_overdue && (
                            <span className="ml-2 text-xs text-red-600">(en retard)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {getStatusIcon(invoice.status)}
                            {getStatusBadge(invoice.status)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/app/invoices/${invoice.id}`)}
                              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                              title="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Imprimer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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

export default Invoices