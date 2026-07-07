import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  User,
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Edit,
  Truck,
  FileText,
  CreditCard,
  Plus,
  X,
  Save,
} from 'lucide-react'
import toast from 'react-hot-toast'

const SupplierDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [supplier, setSupplier] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchSupplier()
    }
  }, [id])

  const fetchSupplier = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/suppliers/${id}/`)
      setSupplier(response.data)
      
      // Fetch purchases for this supplier
      try {
        const purchasesRes = await api.get(`/purchases/?supplier=${id}`)
        setPurchases(purchasesRes.data.results || purchasesRes.data || [])
      } catch (error) {
        console.error('Error fetching purchases:', error)
      }
    } catch (error) {
      toast.error('Erreur lors du chargement du fournisseur')
      navigate('/app/suppliers')
    } finally {
      setLoading(false)
    }
  }

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Veuillez entrer un montant valide')
      return
    }

    setSubmitting(true)
    try {
      // Get all unpaid purchases for this supplier
      const response = await api.get(`/purchases/?supplier=${id}&status=received`)
      const purchases = response.data.results || response.data || []
      
      const unpaidPurchases = purchases.filter(p => 
        p.outstanding_balance > 0
      )

      if (unpaidPurchases.length === 0) {
        toast.error('Aucune facture impayée pour ce fournisseur')
        setSubmitting(false)
        return
      }

      let remainingAmount = parseFloat(paymentAmount)
      
      // Sort by order date (oldest first)
      unpaidPurchases.sort((a, b) => new Date(a.order_date) - new Date(b.order_date))
      
      for (const purchase of unpaidPurchases) {
        if (remainingAmount <= 0) break
        
        const amountToPay = Math.min(remainingAmount, purchase.outstanding_balance)
        
        // Update the purchase paid_amount
        const updateData = {
          paid_amount: purchase.paid_amount + amountToPay
        }
        
        await api.patch(`/purchases/${purchase.id}/`, updateData)
        remainingAmount -= amountToPay
      }

      toast.success(`Paiement de ${formatCurrency(paymentAmount)} enregistré avec succès`)
      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentNote('')
      fetchSupplier()
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Erreur lors de l\'enregistrement du paiement')
    } finally {
      setSubmitting(false)
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

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return { label: 'Actif', className: 'bg-green-100 text-green-800' }
    }
    return { label: 'Inactif', className: 'bg-gray-100 text-gray-800' }
  }

  const getPayableStatus = (payable) => {
    if (payable > 0) {
      return { label: 'À payer', className: 'bg-amber-100 text-amber-800' }
    } else if (payable < 0) {
      return { label: 'Crédit', className: 'bg-green-100 text-green-800' }
    }
    return { label: 'Soldé', className: 'bg-gray-100 text-gray-800' }
  }

  const getPurchaseStatusBadge = (status) => {
    const badges = {
      draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
      ordered: { label: 'Commandé', className: 'bg-blue-100 text-blue-800' },
      in_transit: { label: 'En Transit', className: 'bg-amber-100 text-amber-800' },
      received: { label: 'Réceptionné', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulé', className: 'bg-red-100 text-red-800' },
    }
    const badge = badges[status] || badges.draft
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
          <p className="text-gray-500">Chargement du fournisseur...</p>
        </div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Fournisseur non trouvé</h3>
        <button
          onClick={() => navigate('/app/suppliers')}
          className="mt-4 btn-primary"
        >
          Retour aux fournisseurs
        </button>
      </div>
    )
  }

  const status = getStatusBadge(supplier.is_active)
  const payableStatus = getPayableStatus(supplier.outstanding_balance || 0)
  const hasPayable = supplier.outstanding_balance > 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/suppliers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{supplier.name}</h2>
            <p className="text-gray-500">
              {supplier.contact_person || 'Aucun contact'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {hasPayable && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Enregistrer un paiement</span>
            </button>
          )}
          <button
            onClick={() => navigate(`/app/suppliers/${id}/edit`)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Modifier</span>
          </button>
          <button
            onClick={() => navigate('/app/purchases/new')}
            className="btn-primary flex items-center space-x-2"
          >
            <Truck className="w-4 h-4" />
            <span>Nouvelle Commande</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Achats</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(supplier.total_purchases || 0)}
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
              <p className="text-sm text-gray-500">Dette</p>
              <p className={`text-2xl font-bold ${supplier.outstanding_balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {formatCurrency(supplier.outstanding_balance || 0)}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Statut Paiement</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${payableStatus.className}`}>
                  {payableStatus.label}
                </span>
              </div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de Contact</h3>
            <div className="space-y-3">
              {supplier.phone && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-start space-x-3 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span>{supplier.address}</span>
                </div>
              )}
              {supplier.city && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span>{supplier.city}</span>
                </div>
              )}
              {supplier.country && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span>{supplier.country}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Person */}
          {(supplier.contact_person || supplier.contact_phone) && (
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-primary-600" />
                <span>Personne de Contact</span>
              </h3>
              <div className="space-y-2">
                {supplier.contact_person && (
                  <p className="font-medium text-gray-900">{supplier.contact_person}</p>
                )}
                {supplier.contact_phone && (
                  <p className="text-sm text-gray-600">{supplier.contact_phone}</p>
                )}
              </div>
            </div>
          )}

          {/* Tax ID */}
          {supplier.tax_id && (
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Identification</h3>
              <p className="text-sm text-gray-600">N° Fiscal: <span className="font-medium text-gray-900">{supplier.tax_id}</span></p>
            </div>
          )}
        </div>

        {/* Purchase History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Truck className="w-5 h-5 text-primary-600" />
                <span>Historique des Commandes</span>
              </h3>
              <span className="text-sm text-gray-500">
                {purchases.length} commandes
              </span>
            </div>

            {purchases.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2" />
                <p>Aucune commande</p>
                <button
                  onClick={() => navigate('/app/purchases/new')}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  Créer une commande
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N° Commande
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
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Solde
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
                    {purchases.slice(0, 10).map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {purchase.order_number}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(purchase.order_date)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(purchase.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(purchase.paid_amount)}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${purchase.outstanding_balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                          {formatCurrency(purchase.outstanding_balance)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getPurchaseStatusBadge(purchase.status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate(`/app/purchases/${purchase.id}`)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-primary-600" />
                <span>Enregistrer un paiement</span>
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="text-sm text-amber-700">
                  Dette actuelle: <span className="font-bold">{formatCurrency(supplier.outstanding_balance)}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant à payer <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    max={supplier.outstanding_balance}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="2"
                  placeholder="Référence du paiement, mode de paiement..."
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={handleRecordPayment}
                  disabled={submitting || !paymentAmount}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2 py-2.5"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>{submitting ? 'Enregistrement...' : 'Enregistrer le paiement'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 btn-secondary py-2.5"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupplierDetail