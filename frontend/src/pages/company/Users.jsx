import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  Users,
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
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Clock,
  AlertCircle,
  UserCog,
} from 'lucide-react'
import toast from 'react-hot-toast'

const UsersList = () => {  // Renamed component to UsersList
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [branches, setBranches] = useState([])
  const [branchFilter, setBranchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [permissionTemplates, setPermissionTemplates] = useState([])

  useEffect(() => {
    fetchBranches()
    fetchUsers()
    fetchPermissions()
  }, [currentPage, search, branchFilter, statusFilter])

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches/?is_active=true')
      setBranches(response.data.results || response.data || [])
    } catch (error) {
      console.error('Error fetching branches:', error)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/permissions/templates/')
      setPermissionTemplates(response.data.templates || [])
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        search: search || undefined,
        branch: branchFilter || undefined,
        is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      }
      const response = await api.get('/users/', { params })
      setUsers(response.data.results || response.data || [])
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 50))
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) return
    try {
      await api.delete(`/users/${id}/`)
      toast.success('Utilisateur désactivé')
      fetchUsers()
    } catch (error) {
      toast.error('Erreur lors de la désactivation')
    }
  }

  const handleActivate = async (id, activate) => {
    try {
      await api.patch(`/users/${id}/`, { is_active: activate })
      toast.success(activate ? 'Utilisateur activé' : 'Utilisateur désactivé')
      fetchUsers()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getBranchName = (id) => {
    const branch = branches.find(b => b.id === id)
    return branch ? branch.name : 'Toutes'
  }

  const getPermissionCount = (permissions) => {
    if (!permissions) return 0
    return permissions.length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des utilisateurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Utilisateurs</h2>
          <p className="text-gray-500">Gestion des utilisateurs et permissions</p>
        </div>
        <button
          onClick={() => navigate('/app/users/new')}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Utilisateur</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
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
            {(branchFilter || statusFilter) && (
              <button
                onClick={() => {
                  setBranchFilter('')
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

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun utilisateur</h3>
            <p className="text-gray-500">Commencez par créer des utilisateurs.</p>
            <button
              onClick={() => navigate('/app/users/new')}
              className="mt-4 btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvel Utilisateur</span>
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Succursale
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inscrit le
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
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.username}</p>
                            <p className="text-sm text-gray-500">{user.first_name || user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getBranchName(user.branch)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {getPermissionCount(user.permissions)} permissions
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.is_tenant_admin ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Admin
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(user.date_joined)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.is_active ? (
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
                            onClick={() => navigate(`/app/users/${user.id}/edit`)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.is_active ? (
                            <button
                              onClick={() => handleActivate(user.id, false)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Désactiver"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(user.id, true)}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Activer"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {!user.is_tenant_admin && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

export default UsersList