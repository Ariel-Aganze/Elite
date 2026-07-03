import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  Truck,
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
  Building2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  AlertCircle,
  CheckCircle,
  User,
  Globe,
} from 'lucide-react'
import toast from 'react-hot-toast'

const Suppliers = () => {
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCountry, setSelectedCountry] = useState('')
  const [countries, setCountries] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchSuppliers()
  }, [currentPage, search, selectedCountry])

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        search: search || undefined,
        country: selectedCountry || undefined,
      }
      const response = await api.get('/suppliers/', { params })
      const data = response.data.results || response.data || []
      setSuppliers(data)
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 50))
      }
      
      // Extract unique countries for filter
      if (data.length > 0) {
        const uniqueCountries = [...new Set(data.map(s => s.country).filter(Boolean))]
        setCountries(uniqueCountries)
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des fournisseurs')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) return
    try {
      await api.delete(`/suppliers/${id}/`)
      toast.success('Fournisseur supprimé')
      fetchSuppliers()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const getPayableStatus = (payable) => {
    if (payable > 0) {
      return { label: 'À payer', className: 'badge-warning' }
    } else if (payable < 0) {
      return { label: 'Crédit', className: 'badge-success' }
    }
    return { label: 'Soldé', className: 'badge-gray' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des fournisseurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fournisseurs</h2>
          <p className="text-gray-500">Gestion des fournisseurs et suivi des dettes</p>
        </div>
        <button
          onClick={() => navigate('/app/suppliers/new')}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Fournisseur</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone ou email..."
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
            {selectedCountry && (
              <button
                onClick={() => {
                  setSelectedCountry('')
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
            {countries.length > 0 && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Pays:</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="">Tous</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        {suppliers.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun fournisseur</h3>
            <p className="text-gray-500">Commencez par ajouter vos fournisseurs.</p>
            <button
              onClick={() => navigate('/app/suppliers/new')}
              className="mt-4 btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un fournisseur</span>
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fournisseur
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pays
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Achats
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dette
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
                  {suppliers.map((supplier) => {
                    const payable = supplier.outstanding_balance || 0
                    const payableStatus = getPayableStatus(payable)
                    return (
                      <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{supplier.name}</p>
                              <p className="text-sm text-gray-500">{supplier.contact_person || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="w-3 h-3" />
                              <span>{supplier.phone}</span>
                            </div>
                            {supplier.email && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Mail className="w-3 h-3" />
                                <span>{supplier.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Globe className="w-3 h-3" />
                            <span>{supplier.country || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(supplier.total_purchases || 0)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${payable > 0 ? 'text-amber-600' : payable < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                            {formatCurrency(payable)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${payableStatus.className}`}>
                            {payableStatus.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/app/suppliers/${supplier.id}`)}
                              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                              title="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/app/suppliers/${supplier.id}/edit`)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(supplier.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
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

export default Suppliers