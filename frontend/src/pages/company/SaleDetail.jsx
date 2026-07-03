import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Printer,
  FileText,
  CreditCard,
  DollarSign,
  User,
  Calendar,
  Clock,
  Package,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Receipt,
  Smartphone,
  Banknote,
  Download,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'

const SaleDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [sale, setSale] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [payments, setPayments] = useState([])

  useEffect(() => {
    if (id) {
      fetchSaleDetail()
    } else {
      toast.error('ID de vente invalide')
      navigate('/app/sales')
    }
  }, [id])

  const fetchSaleDetail = async () => {
    setLoading(true)
    try {
      // Check if id is valid
      if (!id || id === 'undefined' || id === 'null') {
        toast.error('ID de vente invalide')
        navigate('/app/sales')
        return
      }

      const response = await api.get(`/sales/${id}/`)
      const data = response.data
      setSale(data)
      
      // If there's an invoice, fetch it
      if (data.invoice) {
        try {
          const invoiceRes = await api.get(`/invoices/${data.invoice}/`)
          setInvoice(invoiceRes.data)
        } catch (invoiceError) {
          console.error('Error fetching invoice:', invoiceError)
        }
      }
      
      // If there are payments, use them
      if (data.payments) {
        setPayments(data.payments)
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Vente non trouvée')
      } else {
        toast.error('Erreur lors du chargement des détails')
      }
      navigate('/app/sales')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0.00'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const formatDate = (date) => {
    if (!date) return '—'
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '—'
    }
  }

  const formatDateShort = (date) => {
    if (!date) return '—'
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return '—'
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      completed: { label: 'Complétée', className: 'bg-green-100 text-green-800' },
      draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
      voided: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
    }
    const badge = badges[status] || badges.draft
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: 'Espèces',
      mobile_money: 'Mobile Money',
      card: 'Carte Bancaire',
      credit: 'Crédit',
      mixed: 'Mixte',
    }
    return methods[method] || method
  }

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-4 h-4" />
      case 'mobile_money':
        return <Smartphone className="w-4 h-4" />
      case 'card':
        return <CreditCard className="w-4 h-4" />
      case 'credit':
        return <Receipt className="w-4 h-4" />
      default:
        return <DollarSign className="w-4 h-4" />
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleVoid = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette vente ? Cette action est irréversible.')) return
    
    try {
      await api.post(`/sales/${id}/void/`, { reason: 'Annulation manuelle' })
      toast.success('Vente annulée avec succès')
      fetchSaleDetail()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'annulation')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement des détails...</p>
        </div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Vente non trouvée</h3>
        <button
          onClick={() => navigate('/app/sales')}
          className="mt-4 btn-primary"
        >
          Retour aux ventes
        </button>
      </div>
    )
  }

  const outstandingBalance = (sale.total_amount || 0) - (sale.paid_amount || 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/sales')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Vente {sale.sale_number || 'N/A'}
            </h2>
            <p className="text-gray-500">
              {formatDate(sale.sale_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="btn-secondary flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
          {sale.status !== 'voided' && (
            <button
              onClick={handleVoid}
              className="btn-danger flex items-center space-x-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Annuler</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(sale.total_amount)}
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
                {formatCurrency(sale.paid_amount)}
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
              <p className="text-sm text-gray-500">Solde</p>
              <p className={`text-2xl font-bold ${outstandingBalance > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                {formatCurrency(outstandingBalance)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${outstandingBalance > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
              <Receipt className={`w-5 h-5 ${outstandingBalance > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <div className="mt-1">{getStatusBadge(sale.status)}</div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

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
                {sale.items?.length || 0} articles
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
                  {sale.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name || '—'}</p>
                          <p className="text-sm text-gray-500">{item.product_sku || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {item.quantity || 0}
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
                      {formatCurrency(sale.subtotal)}
                    </td>
                  </tr>
                  {sale.discount_amount > 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right font-medium text-gray-700">
                        Remise
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">
                        -{formatCurrency(sale.discount_amount)}
                      </td>
                    </tr>
                  )}
                  {sale.tax_amount > 0 && (
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right font-medium text-gray-700">
                        Taxe
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(sale.tax_amount)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-900">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary-600">
                      {formatCurrency(sale.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {sale.notes && (
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
              <p className="text-gray-600">{sale.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Customer & Payment Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <User className="w-4 h-4 text-primary-600" />
              <span>Client</span>
            </h3>
            {sale.customer_name ? (
              <div>
                <p className="font-medium text-gray-900">{sale.customer_name}</p>
                <p className="text-sm text-gray-500">{sale.customer_phone || '—'}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Client non renseigné</p>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-primary-600" />
              <span>Paiement</span>
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Méthode</span>
                <span className="flex items-center space-x-1 font-medium text-gray-900">
                  {getPaymentMethodIcon(sale.payment_method)}
                  <span>{getPaymentMethodLabel(sale.payment_method)}</span>
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Devise</span>
                <span className="font-medium text-gray-900">{sale.currency || 'USD'}</span>
              </div>

              {sale.paid_amount > 0 && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Montant payé</span>
                  <span className="font-medium text-green-600">{formatCurrency(sale.paid_amount)}</span>
                </div>
              )}

              {outstandingBalance > 0 && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Solde restant</span>
                  <span className="font-bold text-amber-600">{formatCurrency(outstandingBalance)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Info */}
          {invoice && (
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-primary-600" />
                <span>Facture</span>
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">N° Facture</span>
                  <span className="font-medium text-gray-900">{invoice.invoice_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Date échéance</span>
                  <span className="font-medium text-gray-900">{formatDateShort(invoice.due_date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Statut</span>
                  <span className={`text-sm font-medium ${
                    invoice.status === 'paid' ? 'text-green-600' :
                    invoice.status === 'overdue' ? 'text-red-600' :
                    'text-amber-600'
                  }`}>
                    {invoice.status === 'paid' ? 'Payée' :
                     invoice.status === 'overdue' ? 'En retard' :
                     invoice.status === 'partially_paid' ? 'Partiellement payée' :
                     'Envoyée'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payments History */}
          {payments && payments.length > 0 && (
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-primary-600" />
                <span>Paiements</span>
              </h3>
              
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-500">{payment.payment_number || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatDate(payment.payment_date)}</p>
                      <span className="text-xs text-gray-400">{getPaymentMethodLabel(payment.payment_method)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SaleDetail