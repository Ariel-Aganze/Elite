import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Printer,
  FileText,
  Users,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Receipt,
  Download,
  CreditCard,
} from 'lucide-react'
import toast from 'react-hot-toast'

const InvoiceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState(null)
  const [sale, setSale] = useState(null)

  useEffect(() => {
    fetchInvoice()
  }, [id])

  const fetchInvoice = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/invoices/${id}/`)
      const data = response.data
      setInvoice(data)
      
      // Fetch associated sale if exists
      if (data.sale) {
        const saleRes = await api.get(`/sales/${data.sale}/`)
        setSale(saleRes.data)
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de la facture')
      navigate('/app/invoices')
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
      paid: { label: 'Payée', className: 'bg-green-100 text-green-800' },
      partially_paid: { label: 'Partiellement payée', className: 'bg-amber-100 text-amber-800' },
      overdue: { label: 'En retard', className: 'bg-red-100 text-red-800' },
      sent: { label: 'Envoyée', className: 'bg-blue-100 text-blue-800' },
      draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
    }
    const badge = badges[status] || badges.draft
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement de la facture...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Facture non trouvée</h3>
        <button
          onClick={() => navigate('/app/invoices')}
          className="mt-4 btn-primary"
        >
          Retour aux factures
        </button>
      </div>
    )
  }

  const outstanding = (invoice.total_amount || 0) - (invoice.paid_amount || 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/invoices')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Facture {invoice.invoice_number}
            </h2>
            <p className="text-gray-500">
              {formatDate(invoice.invoice_date)}
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
          <button
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-500">Statut:</span>
          {getStatusBadge(invoice.status)}
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <div>
            <span className="text-gray-500">Total:</span>
            <span className="ml-2 font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</span>
          </div>
          <div>
            <span className="text-gray-500">Payé:</span>
            <span className="ml-2 font-bold text-green-600">{formatCurrency(invoice.paid_amount)}</span>
          </div>
          <div>
            <span className="text-gray-500">Solde:</span>
            <span className={`ml-2 font-bold ${outstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {formatCurrency(outstanding)}
            </span>
          </div>
          {invoice.is_overdue && (
            <div className="flex items-center space-x-1 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">En retard</span>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Branch Info */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{invoice.customer_name || '—'}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Succursale</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{invoice.branch_name || '—'}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date d'échéance</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{formatDate(invoice.due_date)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">N° Vente</p>
                <div className="flex items-center space-x-2 mt-1">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{sale?.sale_number || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          {sale?.items && sale.items.length > 0 && (
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Produits</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produit
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qté
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prix Unité
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sale.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2">
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-900">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-right font-medium text-gray-700">
                        Total
                      </td>
                      <td className="px-4 py-2 text-right font-bold text-primary-600">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-600">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Status */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">État du Paiement</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total</span>
                <span className="font-medium text-gray-900">{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Payé</span>
                <span className="font-medium text-green-600">{formatCurrency(invoice.paid_amount)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Solde</span>
                <span className={`font-bold ${outstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {formatCurrency(outstanding)}
                </span>
              </div>
              {outstanding > 0 && (
                <button
                  onClick={() => navigate(`/app/payments/new?invoice=${invoice.id}`)}
                  className="w-full btn-primary flex items-center justify-center space-x-2 mt-2 py-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Enregistrer un paiement</span>
                </button>
              )}
            </div>
          </div>

          {/* Payments History */}
          {sale?.payments && sale.payments.length > 0 && (
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-primary-600" />
                <span>Historique des paiements</span>
              </h3>
              <div className="space-y-3">
                {sale.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-500">{payment.payment_method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatDate(payment.payment_date)}</p>
                      <span className="text-xs text-gray-400">{payment.payment_number}</span>
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

export default InvoiceDetail