import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client'
import {
  ArrowLeft,
  Save,
  X,
  Loader2,
  DollarSign,
  Building2,
  Tag,
  Calendar,
  AlertCircle,
  Upload,
  FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'

const ExpenseForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState([])
  const [branches, setBranches] = useState([])
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [formData, setFormData] = useState({
    branch: '',
    category: '',
    amount: '',
    description: '',
    notes: '',
    currency: 'USD',
    exchange_rate: 1,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchFormData()
  }, [])

  const fetchFormData = async () => {
    setLoading(true)
    try {
      const [categoriesRes, branchesRes] = await Promise.all([
        api.get('/expense-categories/?is_active=true'),
        api.get('/branches/?is_active=true'),
      ])
      setCategories(categoriesRes.data.results || categoriesRes.data || [])
      setBranches(branchesRes.data.results || branchesRes.data || [])
      
      // Auto-select first branch
      if (branchesRes.data.length > 0) {
        setFormData(prev => ({ ...prev, branch: branchesRes.data[0].id }))
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setReceiptFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.branch) newErrors.branch = 'La succursale est requise'
    if (!formData.category) newErrors.category = 'La catégorie est requise'
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Le montant doit être positif'
    }
    if (!formData.description.trim()) newErrors.description = 'La description est requise'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const data = {
        branch: formData.branch,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        notes: formData.notes,
        currency: formData.currency,
        exchange_rate: parseFloat(formData.exchange_rate) || 1,
      }

      // If there's a receipt, upload it
      if (receiptFile) {
        const formDataWithFile = new FormData()
        Object.keys(data).forEach(key => {
          formDataWithFile.append(key, data[key])
        })
        formDataWithFile.append('receipt', receiptFile)
        
        await api.post('/expenses/', formDataWithFile, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post('/expenses/', data)
      }
      
      toast.success('Dépense créée avec succès')
      navigate('/app/expenses')
    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data)
        toast.error('Erreur lors de l\'enregistrement')
      } else {
        toast.error('Erreur de connexion')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/app/expenses')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nouvelle Dépense</h2>
            <p className="text-gray-500">Enregistrer une dépense opérationnelle</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-primary-600" />
                <span>Informations de la Dépense</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Succursale <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className={`input-field ${errors.branch ? 'border-red-500' : ''}`}
                  >
                    <option value="">Sélectionner une succursale</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {errors.branch && (
                    <p className="mt-1 text-sm text-red-600">{errors.branch}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`input-field ${errors.category ? 'border-red-500' : ''}`}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      className={`input-field pl-8 ${errors.amount ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Devise
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="USD">USD</option>
                    <option value="CDF">CDF</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={`input-field ${errors.description ? 'border-red-500' : ''}`}
                    placeholder="Ex: Loyer du mois de juillet"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes supplémentaires
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="input-field"
                    rows="3"
                    placeholder="Informations complémentaires..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Receipt Upload */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Upload className="w-5 h-5 text-primary-600" />
                <span>Justificatif</span>
              </h3>

              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors cursor-pointer">
                  {receiptPreview ? (
                    <div className="relative">
                      <img
                        src={receiptPreview}
                        alt="Reçu"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptPreview(null)
                          setReceiptFile(null)
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-6">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Télécharger un justificatif</p>
                      <p className="text-xs text-gray-400">PNG, JPG, PDF jusqu'à 5MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="receipt-upload"
                  />
                </div>
                <label
                  htmlFor="receipt-upload"
                  className="w-full btn-secondary inline-flex items-center justify-center space-x-2 cursor-pointer text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>{receiptPreview ? 'Changer le fichier' : 'Choisir un fichier'}</span>
                </label>
              </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Approbation requise</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Les dépenses doivent être approuvées par un responsable avant d'être validées.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full btn-primary flex items-center justify-center space-x-2 py-2.5"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>{saving ? 'Enregistrement...' : 'Créer la dépense'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/app/expenses')}
                  className="w-full btn-secondary flex items-center justify-center space-x-2 py-2.5"
                >
                  <X className="w-4 h-4" />
                  <span>Annuler</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ExpenseForm