import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  DollarSign,
  Plus,
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
  User,
  Edit,
  Trash2,
  Receipt,
} from 'lucide-react'
import toast from 'react-hot-toast'

const Expenses = () => {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [branches, setBranches] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    count: 0,
  })

  useEffect(() => {
    fetchCategories()
    fetchBranches()
    fetchExpenses()
  }, [currentPage, search, statusFilter, categoryFilter, branchFilter])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/expense-categories/?is_active=true')
      setCategories(response.data.results || response.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches/?is_active=true')
      setBranches(response.data.results || response.data || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        search: search || undefined,
        is_approved: statusFilter === 'approved' ? true : statusFilter === 'pending' ? false : undefined,
        category: categoryFilter || undefined,
        branch: branchFilter || undefined,
      }
      const response = await api.get('/expenses/', { params })
      const data = response.data.results || response.data || []
      setExpenses(data)
      
      // Calculate summary
      const total = data.reduce((sum, e) => sum + (e.amount || 0), 0)
      const approved = data.filter(e => e.is_approved).reduce((sum, e) => sum + (e.amount || 0), 0)
      const pending = data.filter(e => !e.is_approved).reduce((sum, e) => sum + (e.amount || 0), 0)
      
      setSummary({
        total,
        approved,
        pending,
        count: data.length,
      })
      
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 50))
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des dépenses')
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

  const getStatusBadge = (isApproved) => {
    if (isApproved) {
      return { label: 'Approuvé', className: 'badge-success' }
    }
    return { label: 'En attente', className: 'badge-warning' }
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return
    try {
      await api.delete(`/expenses/${id}/`)
      toast.success('Dépense supprimée')
      fetchExpenses()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleApprove = async (id) => {
    if (!confirm('Approuver cette dépense ?')) return
    try {
      await api.post(`/expenses/${id}/approve/`, { approve: true })
      toast.success('Dépense approuvée')
      fetchExpenses()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'approbation')
    }
  }

  const getCategoryName = (id) => {
    const cat = categories.find(c => c.id === id)
    return cat ? cat.name : '—'
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
          <p className="text-gray-500">Chargement des dépenses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dépenses</h2>
          <p className="text-gray-500">Gestion des dépenses opérationnelles</p>
        </div>
        <button
          onClick={() => navigate('/app/expenses/new')}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Dépense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Dépenses</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total)}</p>
          <p className="text-xs text-gray-400">{summary.count} transactions</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-green-100 p-4">
          <p className="text-sm text-gray-500">Approuvées</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.approved)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-amber-100 p-4">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.pending)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Nombre</p>
          <p className="text-2xl font-bold text-gray-900">{summary.count}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une dépense..."
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
            {(statusFilter || categoryFilter || branchFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('')
                  setCategoryFilter('')
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
                <option value="approved">Approuvé</option>
                <option value="pending">En attente</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Catégorie:</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">Toutes</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
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

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune dépense</h3>
            <p className="text-gray-500">Commencez par enregistrer votre première dépense.</p>
            <button
              onClick={() => navigate('/app/expenses/new')}
              className="mt-4 btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Dépense</span>
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° Dépense
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Succursale
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
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
                  {expenses.map((expense) => {
                    const status = getStatusBadge(expense.is_approved)
                    return (
                      <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {expense.expense_number}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{expense.description}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">{expense.notes}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {expense.category_name || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {expense.branch_name || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(expense.expense_date)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {!expense.is_approved && (
                              <>
                                <button
                                  onClick={() => handleApprove(expense.id)}
                                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                  title="Approuver"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(expense.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
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

export default Expenses