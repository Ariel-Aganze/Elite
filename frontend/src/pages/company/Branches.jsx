import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Loader2,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  User,
  Store,
  Warehouse,
  ShoppingBag,
  Building,
  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

const Branches = () => {
  const navigate = useNavigate()
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    types: {},
  })

  useEffect(() => {
    fetchBranches()
  }, [currentPage, search, typeFilter, statusFilter])

  const fetchBranches = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        search: search || undefined,
        branch_type: typeFilter || undefined,
        is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      }
      const response = await api.get('/branches/', { params })
      const data = response.data.results || response.data || []
      setBranches(data)
      
      // Calculate summary
      const total = data.length
      const active = data.filter(b => b.is_active).length
      const inactive = data.filter(b => !b.is_active).length
      
      const types = {}
      data.forEach(b => {
        const type = b.branch_type || 'unknown'
        types[type] = (types[type] || 0) + 1
      })
      
      setSummary({ total, active, inactive, types })
      
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 50))
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des succursales')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette succursale ?')) return
    try {
      await api.delete(`/branches/${id}/`)
      toast.success('Succursale supprimée')
      fetchBranches()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'central':
        return <Warehouse className="w-4 h-4" />
      case 'shop':
        return <Store className="w-4 h-4" />
      case 'agency':
        return <Building className="w-4 h-4" />
      case 'pos':
        return <ShoppingBag className="w-4 h-4" />
      default:
        return <Building2 className="w-4 h-4" />
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

  const getTypeBadge = (type) => {
    const colors = {
      central: 'bg-purple-100 text-purple-800',
      shop: 'bg-blue-100 text-blue-800',
      agency: 'bg-green-100 text-green-800',
      pos: 'bg-amber-100 text-amber-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
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
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des succursales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Succursales</h2>
          <p className="text-gray-500">Gestion des succursales, dépôts et points de vente</p>
        </div>
        <button
          onClick={() => navigate('/app/branches/new')}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Succursale</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Succursales</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-green-100 p-4">
          <p className="text-sm text-gray-500">Actives</p>
          <p className="text-2xl font-bold text-green-600">{summary.active}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Inactives</p>
          <p className="text-2xl font-bold text-gray-500">{summary.inactive}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-primary-100 p-4">
          <p className="text-sm text-gray-500">Types</p>
          <p className="text-sm font-medium text-gray-900">
            {Object.entries(summary.types).map(([type, count]) => (
              <span key={type} className="inline-block mr-2">
                {getTypeLabel(type)}: {count}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une succursale..."
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
            {(typeFilter || statusFilter) && (
              <button
                onClick={() => {
                  setTypeFilter('')
                  setStatusFilter('')
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
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">Tous</option>
                <option value="central">Dépôt Central</option>
                <option value="shop">Boutique</option>
                <option value="agency">Agence</option>
                <option value="pos">Point de Vente</option>
              </select>
            </div>
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
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Branches Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {branches.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune succursale</h3>
            <p className="text-gray-500">Commencez par créer votre première succursale.</p>
            <button
              onClick={() => navigate('/app/branches/new')}
              className="mt-4 btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Succursale</span>
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Succursale
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ville
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responsable
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Créée le
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
                  {branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            {getTypeIcon(branch.branch_type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{branch.name}</p>
                            <p className="text-sm text-gray-500">{branch.address || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {branch.code}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(branch.branch_type)}`}>
                          {getTypeIcon(branch.branch_type)}
                          <span className="ml-1">{getTypeLabel(branch.branch_type)}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {branch.city || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {branch.manager || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(branch.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {branch.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/app/branches/${branch.id}`)}
                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Voir"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/app/branches/${branch.id}/edit`)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(branch.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

export default Branches