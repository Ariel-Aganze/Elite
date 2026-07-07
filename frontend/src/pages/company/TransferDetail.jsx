import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Package,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
  User,
  Edit,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

const TransferDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [transfer, setTransfer] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (id) {
      fetchTransfer()
    }
  }, [id])

  const fetchTransfer = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/transfers/${id}/`)
      setTransfer(response.data)
    } catch (error) {
      toast.error('Erreur lors du chargement du transfert')
      navigate('/app/transfers')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm('Approuver ce transfert ?')) return
    
    setUpdating(true)
    try {
      await api.post(`/transfers/${id}/approve/`, { approved: true })
      toast.success('Transfert approuvé')
      fetchTransfer()
    } catch (error) {
      toast.error('Erreur lors de l\'approbation')
    } finally {
      setUpdating(false)
    }
  }

  const handleDispatch = async () => {
    if (!confirm('Expédier ce transfert ? Cela réduira le stock de la source.')) return
    
    setUpdating(true)
    try {
      await api.post(`/transfers/${id}/dispatch/`)
      toast.success('Transfert expédié')
      fetchTransfer()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'expédition')
    } finally {
      setUpdating(false)
    }
  }

  const handleReceive = async () => {
    if (!confirm('Réceptionner ce transfert ? Cela augmentera le stock de la destination.')) return
    
    setUpdating(true)
    try {
      await api.post(`/transfers/${id}/receive/`)
      toast.success('Transfert réceptionné')
      fetchTransfer()
    } catch (error) {
      toast.error('Erreur lors de la réception')
    } finally {
      setUpdating(false)
    }
  }

  const handleReject = async () => {
    if (!confirm('Rejeter ce transfert ?')) return
    
    setUpdating(true)
    try {
      await api.post(`/transfers/${id}/approve/`, { approved: false })
      toast.success('Transfert rejeté')
      fetchTransfer()
    } catch (error) {
      toast.error('Erreur lors du rejet')
    } finally {
      setUpdating(false)
    }
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
      requested: { label: 'Demandé', className: 'bg-amber-100 text-amber-800' },
      approved: { label: 'Approuvé', className: 'bg-blue-100 text-blue-800' },
      dispatched: { label: 'Expédié', className: 'bg-primary-100 text-primary-800' },
      received: { label: 'Réceptionné', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulé', className: 'bg-red-100 text-red-800' },
    }
    const badge = badges[status] || badges.requested
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'requested':
        return <Clock className="w-5 h-5 text-amber-500" />
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case 'dispatched':
        return <Truck className="w-5 h-5 text-primary-500" />
      case 'received':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement du transfert...</p>
        </div>
      </div>
    )
  }

  if (!transfer) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Transfert non trouvé</h3>
        <button
          onClick={() => navigate('/app/transfers')}
          className="mt-4 btn-primary"
        >
          Retour aux transferts
        </button>
      </div>
    )
  }

  const canApprove = transfer.status === 'requested'
  const canDispatch = transfer.status === 'approved'
  const canReceive = transfer.status === 'dispatched'
  const canReject = transfer.status === 'requested' || transfer.status === 'approved'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/transfers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Transfert {transfer.transfer_number}
            </h2>
            <p className="text-gray-500">
              {formatDate(transfer.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchTransfer}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Rafraîchir</span>
          </button>
        </div>
      </div>

      {/* Status & Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <div className="mt-1 flex items-center space-x-2">
                {getStatusIcon(transfer.status)}
                {getStatusBadge(transfer.status)}
              </div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Truck className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Source</p>
              <p className="text-lg font-bold text-gray-900">{transfer.from_branch_name}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Destination</p>
              <p className="text-lg font-bold text-gray-900">{transfer.to_branch_name}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Articles</p>
              <p className="text-2xl font-bold text-gray-900">{transfer.items?.length || 0}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Package className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {(canApprove || canDispatch || canReceive || canReject) && (
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary-600" />
            <span>Actions</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {canApprove && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={updating}
                  className="btn-primary flex items-center space-x-2"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  <span>Approuver</span>
                </button>
                <button
                  onClick={handleReject}
                  disabled={updating}
                  className="btn-danger flex items-center space-x-2"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  <span>Rejeter</span>
                </button>
              </>
            )}
            {canDispatch && (
              <button
                onClick={handleDispatch}
                disabled={updating}
                className="btn-primary flex items-center space-x-2"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                <span>Expédier</span>
              </button>
            )}
            {canReceive && (
              <button
                onClick={handleReceive}
                disabled={updating}
                className="btn-success flex items-center space-x-2"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                <span>Réceptionner</span>
              </button>
            )}
          </div>
          <p className="mt-3 text-sm text-gray-500">
            {transfer.status === 'requested' && 'Ce transfert est en attente d\'approbation.'}
            {transfer.status === 'approved' && 'Ce transfert a été approuvé. Vous pouvez maintenant l\'expédier.'}
            {transfer.status === 'dispatched' && 'Ce transfert a été expédié. Vous pouvez maintenant le réceptionner.'}
          </p>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Package className="w-5 h-5 text-primary-600" />
            <span>Produits transférés</span>
          </h3>
          <span className="text-sm text-gray-500">
            {transfer.items?.length || 0} articles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reçue
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transfer.items?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-500">{item.product_sku}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {item.received_quantity || 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.received_quantity >= item.quantity ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Reçu
                      </span>
                    ) : item.received_quantity > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Partiel
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <Clock className="w-3 h-3 mr-1" />
                        En attente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {transfer.notes && (
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
          <p className="text-gray-600">{transfer.notes}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-primary-600" />
          <span>Historique</span>
        </h3>
        <div className="space-y-4">
          {transfer.requested_by && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Demandé par {transfer.requested_by_username}
                </p>
                <p className="text-xs text-gray-500">{formatDate(transfer.created_at)}</p>
              </div>
            </div>
          )}
          {transfer.approved_by && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Approuvé par {transfer.approved_by_username}
                </p>
                <p className="text-xs text-gray-500">{formatDate(transfer.approved_at)}</p>
              </div>
            </div>
          )}
          {transfer.dispatched_by && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Truck className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Expédié par {transfer.dispatched_by_username}
                </p>
                <p className="text-xs text-gray-500">{formatDate(transfer.dispatched_at)}</p>
              </div>
            </div>
          )}
          {transfer.received_by && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Réceptionné par {transfer.received_by_username}
                </p>
                <p className="text-xs text-gray-500">{formatDate(transfer.received_at)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TransferDetail