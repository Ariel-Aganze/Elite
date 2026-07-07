import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Printer,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Package,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
  Edit,
  Trash2,
  Send,
  Plus,
} from 'lucide-react'
import toast from 'react-hot-toast'

const PurchaseDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [purchase, setPurchase] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (id) {
      fetchPurchase()
    }
  }, [id])

  const fetchPurchase = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/purchases/${id}/`)
      setPurchase(response.data)
    } catch (error) {
      toast.error('Erreur lors du chargement de la commande')
      navigate('/app/purchases')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (status) => {
    if (!confirm(`Confirmer le changement de statut vers "${status}" ?`)) return
    
    setUpdating(true)
    try {
      await api.post(`/purchases/${id}/update-status/`, { status })
      toast.success(`Statut mis à jour: ${status}`)
      fetchPurchase()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut')
    } finally {
      setUpdating(false)
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

  const formatDateTime = (date) => {
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
      draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
      ordered: { label: 'Commandé', className: 'bg-blue-100 text-blue-800' },
      in_transit: { label: 'En Transit', className: 'bg-amber-100 text-amber-800' },
      received: { label: 'Réceptionné', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulé', className: 'bg-red-100 text-red-800' },
    }
    const badge = badges[status] || badges.draft
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-400" />
      case 'ordered':
        return <Send className="w-4 h-4 text-blue-500" />
      case 'in_transit':
        return <Truck className="w-4 h-4 text-amber-500" />
      case 'received':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getAvailableStatusTransitions = (currentStatus) => {
    const transitions = {
      draft: ['ordered', 'cancelled'],
      ordered: ['in_transit', 'cancelled'],
      in_transit: ['received', 'cancelled'],
      received: [],
      cancelled: [],
    }
    return transitions[currentStatus] || []
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement de la commande...</p>
        </div>
      </div>
    )
  }

  if (!purchase) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Commande non trouvée</h3>
        <button
          onClick={() => navigate('/app/purchases')}
          className="mt-4 btn-primary"
        >
          Retour aux achats
        </button>
      </div>
    )
  }

  const availableTransitions = getAvailableStatusTransitions(purchase.status)
  const canReceive = purchase.status === 'ordered' || purchase.status === 'in_transit'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/purchases')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Commande {purchase.order_number}
            </h2>
            <p className="text-gray-500">
              {purchase.supplier_name} — {formatDate(purchase.order_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {purchase.status === 'draft' && (
            <button
              onClick={() => navigate(`/app/purchases/${id}/edit`)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Modifier</span>
            </button>
          )}
          {canReceive && (
            <button
              onClick={() => navigate(`/app/purchases/${id}/receive`)}
              className="btn-primary flex items-center space-x-2"
            >
              <Truck className="w-4 h-4" />
              <span>Réceptionner</span>
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
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
                {getStatusIcon(purchase.status)}
                {getStatusBadge(purchase.status)}
              </div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(purchase.total_amount)}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Payé</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(purchase.paid_amount)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Articles</p>
              <p className="text-2xl font-bold text-gray-900">
                {purchase.items?.length || 0}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Package className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Transitions */}
      {availableTransitions.length > 0 && (
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary-600" />
            <span>Changer le statut</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {availableTransitions.map((status) => {
              const statusLabels = {
                ordered: 'Commander',
                in_transit: 'Marquer en transit',
                received: 'Réceptionner',
                cancelled: 'Annuler',
              }
              const statusColors = {
                ordered: 'btn-primary',
                in_transit: 'btn-warning',
                received: 'btn-success',
                cancelled: 'btn-danger',
              }
              return (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status)}
                  disabled={updating}
                  className={`${statusColors[status] || 'btn-secondary'} flex items-center space-x-2 px-4 py-2`}
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {status === 'ordered' && <Send className="w-4 h-4" />}
                      {status === 'in_transit' && <Truck className="w-4 h-4" />}
                      {status === 'received' && <CheckCircle className="w-4 h-4" />}
                      {status === 'cancelled' && <XCircle className="w-4 h-4" />}
                      <span>{statusLabels[status] || status}</span>
                    </>
                  )}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {purchase.status === 'draft' && 'La commande est en brouillon. Vous pouvez la commander ou l\'annuler.'}
            {purchase.status === 'ordered' && 'La commande a été passée. Vous pouvez la marquer comme en transit ou l\'annuler.'}
            {purchase.status === 'in_transit' && 'Les marchandises sont en transit. Vous pouvez les réceptionner ou annuler.'}
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Package className="w-5 h-5 text-primary-600" />
                <span>Produits</span>
              </h3>
              <span className="text-sm text-gray-500">
                {purchase.items?.length || 0} articles
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
                      Qté
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix Unité
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {purchase.items?.map((item) => (
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
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-medium text-gray-700">
                      Sous-total
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(purchase.subtotal)}
                    </td>
                  </tr>
                  {purchase.transport_cost > 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right font-medium text-gray-700">
                        Transport
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(purchase.transport_cost)}
                      </td>
                    </tr>
                  )}
                  {purchase.customs_cost > 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right font-medium text-gray-700">
                        Douane
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(purchase.customs_cost)}
                      </td>
                    </tr>
                  )}
                  {purchase.handling_cost > 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right font-medium text-gray-700">
                        Manutention
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(purchase.handling_cost)}
                      </td>
                    </tr>
                  )}
                  {purchase.other_costs > 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right font-medium text-gray-700">
                        Autres frais
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(purchase.other_costs)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-900">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary-600">
                      {formatCurrency(purchase.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {purchase.notes && (
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
              <p className="text-gray-600">{purchase.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          {/* Supplier Info */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-primary-600" />
              <span>Fournisseur</span>
            </h3>
            <div>
              <p className="font-medium text-gray-900">{purchase.supplier_name}</p>
              <p className="text-sm text-gray-500">Solde: {formatCurrency(purchase.outstanding_balance)}</p>
            </div>
          </div>

          {/* Branch Info */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-primary-600" />
              <span>Succursale</span>
            </h3>
            <div>
              <p className="font-medium text-gray-900">{purchase.branch_name}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-primary-600" />
              <span>Dates</span>
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Commandée le</span>
                <span className="font-medium text-gray-900">{formatDate(purchase.order_date)}</span>
              </div>
              {purchase.expected_delivery_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Livraison prévue</span>
                  <span className="font-medium text-gray-900">{formatDate(purchase.expected_delivery_date)}</span>
                </div>
              )}
              {purchase.received_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Réceptionnée le</span>
                  <span className="font-medium text-gray-900">{formatDateTime(purchase.received_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Devise */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-primary-600" />
              <span>Devise</span>
            </h3>
            <div>
              <p className="font-medium text-gray-900">{purchase.currency}</p>
              <p className="text-sm text-gray-500">Taux: {purchase.exchange_rate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PurchaseDetail