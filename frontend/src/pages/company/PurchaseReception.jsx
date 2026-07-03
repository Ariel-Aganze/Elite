import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Minus,
  Loader2,
  Package,
  CheckCircle,
  AlertCircle,
  Truck,
  Calendar,
  Building2,
  DollarSign,
  ClipboardList,
} from 'lucide-react'
import toast from 'react-hot-toast'

const PurchaseReception = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [purchaseOrder, setPurchaseOrder] = useState(null)
  const [receptionItems, setReceptionItems] = useState([])
  const [errors, setErrors] = useState({})
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchPurchaseOrder()
  }, [id])

  const fetchPurchaseOrder = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/purchases/${id}/`)
      const data = response.data
      setPurchaseOrder(data)

      // Initialize reception items with ordered quantities
      if (data.items) {
        setReceptionItems(data.items.map(item => ({
          purchase_item_id: item.id,
          product_id: item.product,
          product_name: item.product_name,
          product_sku: item.product_sku,
          ordered_quantity: item.quantity,
          received_quantity: 0,
          damaged_quantity: 0,
          accepted_quantity: 0,
          unit_cost: item.final_unit_cost || item.unit_price || 0,
        })))
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de la commande')
      navigate('/app/purchases')
    } finally {
      setLoading(false)
    }
  }

  const updateReceptionItem = (index, field, value) => {
    const newItems = [...receptionItems]
    const numValue = parseInt(value) || 0
    
    if (field === 'received_quantity') {
      newItems[index].received_quantity = Math.min(numValue, newItems[index].ordered_quantity)
      newItems[index].damaged_quantity = 0
      newItems[index].accepted_quantity = newItems[index].received_quantity
    } else if (field === 'damaged_quantity') {
      newItems[index].damaged_quantity = Math.min(numValue, newItems[index].received_quantity)
      newItems[index].accepted_quantity = newItems[index].received_quantity - newItems[index].damaged_quantity
    }
    
    setReceptionItems(newItems)
  }

  const validate = () => {
    const newErrors = {}
    let hasItems = false
    
    for (const item of receptionItems) {
      if (item.received_quantity > 0) {
        hasItems = true
        break
      }
    }
    
    if (!hasItems) {
      newErrors.items = 'Au moins un produit doit être réceptionné'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const data = {
        purchase_order_id: id,
        notes: notes,
        items: receptionItems
          .filter(item => item.received_quantity > 0)
          .map(item => ({
            purchase_item_id: item.purchase_item_id,
            quantity_received: item.received_quantity,
            quantity_damaged: item.damaged_quantity || 0,
          })),
      }

      await api.post('/purchases/receive/', data)
      toast.success('Réception effectuée avec succès ! Stock mis à jour.')
      navigate('/app/purchases')
    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data)
        toast.error(error.response.data.error || 'Erreur lors de la réception')
      } else {
        toast.error('Erreur de connexion')
      }
    } finally {
      setSaving(false)
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

  const getTotalAccepted = () => {
    return receptionItems.reduce((sum, item) => sum + (item.accepted_quantity || 0), 0)
  }

  const getTotalReceived = () => {
    return receptionItems.reduce((sum, item) => sum + (item.received_quantity || 0), 0)
  }

  const getTotalDamaged = () => {
    return receptionItems.reduce((sum, item) => sum + (item.damaged_quantity || 0), 0)
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

  if (!purchaseOrder) {
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

  // Check if already received
  if (purchaseOrder.status === 'received') {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Commande déjà réceptionnée</h3>
        <p className="text-gray-500">Cette commande a déjà été réceptionnée.</p>
        <button
          onClick={() => navigate('/app/purchases')}
          className="mt-4 btn-primary"
        >
          Retour aux achats
        </button>
      </div>
    )
  }

  if (purchaseOrder.status === 'cancelled') {
    return (
      <div className="text-center py-12">
        <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Commande annulée</h3>
        <p className="text-gray-500">Cette commande a été annulée et ne peut pas être réceptionnée.</p>
        <button
          onClick={() => navigate('/app/purchases')}
          className="mt-4 btn-primary"
        >
          Retour aux achats
        </button>
      </div>
    )
  }

  const canReceive = purchaseOrder.status === 'ordered' || purchaseOrder.status === 'in_transit'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/purchases')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Réception de Commande</h2>
            <p className="text-gray-500">
              {purchaseOrder.order_number} - {purchaseOrder.supplier_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            purchaseOrder.status === 'in_transit' ? 'bg-amber-100 text-amber-800' :
            purchaseOrder.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {purchaseOrder.status === 'in_transit' ? 'En Transit' :
             purchaseOrder.status === 'ordered' ? 'Commandé' : purchaseOrder.status}
          </span>
        </div>
      </div>

      {/* Order Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Fournisseur</p>
          <p className="font-medium text-gray-900">{purchaseOrder.supplier_name}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Succursale</p>
          <p className="font-medium text-gray-900">{purchaseOrder.branch_name}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Date commande</p>
          <p className="font-medium text-gray-900">{formatDate(purchaseOrder.order_date)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="font-semibold text-primary-600">{formatCurrency(purchaseOrder.total_amount)}</p>
        </div>
      </div>

      {/* Reception Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Package className="w-5 h-5 text-primary-600" />
                <span>Produits à réceptionner</span>
              </h3>
              {!canReceive && (
                <p className="text-sm text-amber-600 mt-1">
                  Cette commande ne peut pas être réceptionnée (statut: {purchaseOrder.status})
                </p>
              )}
            </div>
            {canReceive && (
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-500">Total reçu: <span className="font-medium text-gray-900">{getTotalReceived()}</span></span>
                <span className="text-gray-500">Endommagés: <span className="font-medium text-red-600">{getTotalDamaged()}</span></span>
                <span className="text-gray-500">Acceptés: <span className="font-medium text-green-600">{getTotalAccepted()}</span></span>
              </div>
            )}
          </div>

          <div className="p-4">
            {errors.items && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-700">{errors.items}</span>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commandé
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reçu
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Endommagé
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accepté
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coût Unité
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {receptionItems.map((item, index) => (
                    <tr key={item.purchase_item_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-sm text-gray-500">{item.product_sku}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-900">
                        {item.ordered_quantity}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {canReceive ? (
                          <input
                            type="number"
                            value={item.received_quantity || ''}
                            onChange={(e) => updateReceptionItem(index, 'received_quantity', e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                            min="0"
                            max={item.ordered_quantity}
                          />
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {canReceive && item.received_quantity > 0 ? (
                          <input
                            type="number"
                            value={item.damaged_quantity || ''}
                            onChange={(e) => updateReceptionItem(index, 'damaged_quantity', e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                            min="0"
                            max={item.received_quantity}
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-green-600">
                        {item.accepted_quantity || 0}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(item.unit_cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-right font-medium text-gray-700">
                      Total accepté
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-green-600">
                      {getTotalAccepted()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field"
            rows="3"
            placeholder="Notes sur la réception..."
            disabled={!canReceive}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/app/purchases')}
            className="btn-secondary flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Annuler</span>
          </button>
          {canReceive && (
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{saving ? 'Réception en cours...' : 'Réceptionner'}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default PurchaseReception