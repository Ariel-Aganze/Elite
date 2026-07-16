import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Edit,
  ShoppingCart,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  Package,
  Printer,
} from 'lucide-react'
import toast from 'react-hot-toast'

const CustomerDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState(null)
  const [sales, setSales] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])

  useEffect(() => {
    if (id) {
      fetchCustomerData()
    }
  }, [id])

  const fetchCustomerData = async () => {
    setLoading(true)
    try {
      // Fetch customer details
      const customerRes = await api.get(`/customers/${id}/`)
      setCustomer(customerRes.data)

      // Fetch sales for this customer
      try {
        const salesRes = await api.get(`/sales/?customer=${id}`)
        setSales(salesRes.data.results || salesRes.data || [])
      } catch (error) {
        console.error('Error fetching sales:', error)
      }

      // Fetch invoices for this customer
      try {
        const invoicesRes = await api.get(`/invoices/?customer=${id}`)
        setInvoices(invoicesRes.data.results || invoicesRes.data || [])
      } catch (error) {
        console.error('Error fetching invoices:', error)
      }

      // Fetch payments for this customer
      try {
        const paymentsRes = await api.get(`/payments/?customer=${id}`)
        setPayments(paymentsRes.data.results || paymentsRes.data || [])
      } catch (error) {
        console.error('Error fetching payments:', error)
      }
    } catch (error) {
      toast.error('Erreur lors du chargement du client')
      navigate('/app/customers')
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
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateShort = (date) => {
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

  const getBalanceStatus = (balance) => {
    if (balance > 0) {
      return { label: 'Crédit', className: 'bg-amber-100 text-amber-800' }
    } else if (balance < 0) {
      return { label: 'Crédit', className: 'bg-green-100 text-green-800' }
    }
    return { label: 'Soldé', className: 'bg-gray-100 text-gray-800' }
  }

  const getSaleStatusBadge = (status) => {
    const badges = {
      completed: { label: 'Complétée', className: 'bg-green-100 text-green-800' },
      draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
      voided: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
    }
    const badge = badges[status] || badges.draft
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  const getInvoiceStatusBadge = (status) => {
    const badges = {
      paid: { label: 'Payée', className: 'bg-green-100 text-green-800' },
      partially_paid: { label: 'Partiel', className: 'bg-amber-100 text-amber-800' },
      overdue: { label: 'En retard', className: 'bg-red-100 text-red-800' },
      sent: { label: 'Envoyée', className: 'bg-blue-100 text-blue-800' },
      draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
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
          <p className="text-gray-500">Chargement du client...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Client non trouvé</h3>
        <button
          onClick={() => navigate('/app/customers')}
          className="mt-4 btn-primary"
        >
          Retour aux clients
        </button>
      </div>
    )
  }

  const status = getStatusBadge(customer.is_active)
  const balanceStatus = getBalanceStatus(customer.outstanding_balance || 0)
  const hasOutstanding = (customer.outstanding_balance || 0) > 0

  // Calculate totals
  const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0)
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/customers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
            <p className="text-gray-500">
              {customer.phone || 'Aucun téléphone'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {hasOutstanding && (
            <button
              onClick={() => navigate(`/app/payments/new?customer=${customer.id}`)}
              className="btn-primary flex items-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Enregistrer un paiement</span>
            </button>
          )}
          <button
            onClick={() => navigate(`/app/customers/${id}/edit`)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Modifier</span>
          </button>
          <button
            onClick={() => navigate('/app/sales/new')}
            className="btn-primary flex items-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Nouvelle Vente</span>
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
                {formatCurrency(totalSales)}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Solde</p>
              <p className={`text-2xl font-bold ${customer.outstanding_balance > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {formatCurrency(customer.outstanding_balance || 0)}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-600" />
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
              <p className="text-sm text-gray-500">Paiement</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${balanceStatus.className}`}>
                  {balanceStatus.label}
                </span>
              </div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info & Sales History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
            <div className="space-y-3">
              {customer.phone && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start space-x-3 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span>{customer.address}</span>
                </div>
              )}
              {customer.city && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span>{customer.city}</span>
                </div>
              )}
              {customer.gender && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  <span>{customer.gender === 'male' ? 'Masculin' : customer.gender === 'female' ? 'Féminin' : 'Autre'}</span>
                </div>
              )}
              {customer.birth_date && (
                <div className="flex items-center space-x-3 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Né le {formatDateShort(customer.birth_date)}</span>
                </div>
              )}
              <div className="flex items-center space-x-3 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Inscrit le {formatDateShort(customer.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Payments Summary */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-primary-600" />
              <span>Paiements</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total payé</span>
                <span className="font-medium text-gray-900">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Nombre de paiements</span>
                <span className="font-medium text-gray-900">{payments.length}</span>
              </div>
              {payments.length > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-400">Dernier paiement</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(payments[payments.length - 1]?.payment_date)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Sales & Invoices History */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sales History */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-primary-600" />
                <span>Historique des Ventes</span>
              </h3>
              <span className="text-sm text-gray-500">{sales.length} ventes</span>
            </div>

            {sales.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
                <p>Aucune vente</p>
                <button
                  onClick={() => navigate('/app/sales/new')}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  Créer une vente
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N° Vente
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
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sales.slice(0, 10).map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            {sale.sale_number}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDateShort(sale.sale_date)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(sale.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {formatCurrency(sale.paid_amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getSaleStatusBadge(sale.status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate(`/app/sales/${sale.id}`)}
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

          {/* Invoices History */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <span>Factures</span>
              </h3>
              <span className="text-sm text-gray-500">{invoices.length} factures</span>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2" />
                <p>Aucune facture</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        N° Facture
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
                    {invoices.slice(0, 10).map((invoice) => {
                      const outstanding = (invoice.total_amount || 0) - (invoice.paid_amount || 0)
                      return (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm font-medium text-gray-900">
                              {invoice.invoice_number}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDateShort(invoice.invoice_date)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatCurrency(invoice.total_amount)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {formatCurrency(invoice.paid_amount)}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${outstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            {formatCurrency(outstanding)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getInvoiceStatusBadge(invoice.status)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => navigate(`/app/invoices/${invoice.id}`)}
                              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                              Voir
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerDetail