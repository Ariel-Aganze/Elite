import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Building2, User, Mail, Phone, MapPin, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { authApi } from '../../api/client'
import toast from 'react-hot-toast'

const Register = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  const password = watch('admin_password', '')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        company_name: data.company_name,
        company_code: data.company_code.toUpperCase(),
        company_email: data.company_email,
        company_phone: data.company_phone,
        company_address: data.company_address,
        admin_username: data.admin_username,
        admin_email: data.admin_email,
        admin_password: data.admin_password,
        admin_phone: data.admin_phone,
      }
      
      await authApi.register(payload)
      setSuccess(true)
      toast.success('Entreprise créée avec succès ! En attente d\'activation.')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      const message = error.response?.data?.error || 'Erreur lors de l\'inscription'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-xl shadow-card border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inscription réussie !</h2>
          <p className="text-gray-600 mb-4">
            Votre entreprise a été créée avec succès. En attente d'activation par l'administrateur.
          </p>
          <p className="text-sm text-gray-500">
            Redirection vers la page de connexion...
          </p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-primary-600 h-1.5 rounded-full animate-pulse w-full"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Créer votre entreprise
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Inscrivez votre entreprise sur la plateforme Elite RDC
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-xl shadow-card border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Company Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                <span>Informations de l'entreprise</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    {...register('company_name', { required: 'Ce champ est requis' })}
                    className={`input-field ${errors.company_name ? 'border-danger-500' : ''}`}
                    placeholder="Elite RDC SARL"
                  />
                  {errors.company_name && (
                    <p className="mt-1 text-sm text-danger-600">{errors.company_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code entreprise *
                  </label>
                  <input
                    type="text"
                    {...register('company_code', { 
                      required: 'Ce champ est requis',
                      pattern: {
                        value: /^[A-Z0-9-]+$/,
                        message: 'Utilisez des lettres majuscules, chiffres et tirets'
                      }
                    })}
                    className={`input-field uppercase ${errors.company_code ? 'border-danger-500' : ''}`}
                    placeholder="ELITE-KIN"
                  />
                  {errors.company_code && (
                    <p className="mt-1 text-sm text-danger-600">{errors.company_code.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register('company_email', { 
                      required: 'Ce champ est requis',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email invalide'
                      }
                    })}
                    className={`input-field ${errors.company_email ? 'border-danger-500' : ''}`}
                    placeholder="contact@elite.cd"
                  />
                  {errors.company_email && (
                    <p className="mt-1 text-sm text-danger-600">{errors.company_email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="text"
                    {...register('company_phone', { required: 'Ce champ est requis' })}
                    className={`input-field ${errors.company_phone ? 'border-danger-500' : ''}`}
                    placeholder="+243 812 345 678"
                  />
                  {errors.company_phone && (
                    <p className="mt-1 text-sm text-danger-600">{errors.company_phone.message}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <textarea
                    {...register('company_address')}
                    className="input-field"
                    rows="2"
                    placeholder="123 Avenue du Commerce, Kinshasa, RDC"
                  />
                </div>
              </div>
            </div>

            {/* Admin Section */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="w-5 h-5 text-primary-600" />
                <span>Administrateur de l'entreprise</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom d'utilisateur *
                  </label>
                  <input
                    type="text"
                    {...register('admin_username', { 
                      required: 'Ce champ est requis',
                      minLength: {
                        value: 3,
                        message: 'Minimum 3 caractères'
                      }
                    })}
                    className={`input-field ${errors.admin_username ? 'border-danger-500' : ''}`}
                    placeholder="john_doe"
                  />
                  {errors.admin_username && (
                    <p className="mt-1 text-sm text-danger-600">{errors.admin_username.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email administrateur *
                  </label>
                  <input
                    type="email"
                    {...register('admin_email', { 
                      required: 'Ce champ est requis',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email invalide'
                      }
                    })}
                    className={`input-field ${errors.admin_email ? 'border-danger-500' : ''}`}
                    placeholder="john@elite.cd"
                  />
                  {errors.admin_email && (
                    <p className="mt-1 text-sm text-danger-600">{errors.admin_email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone administrateur *
                  </label>
                  <input
                    type="text"
                    {...register('admin_phone', { required: 'Ce champ est requis' })}
                    className={`input-field ${errors.admin_phone ? 'border-danger-500' : ''}`}
                    placeholder="+243 812 345 679"
                  />
                  {errors.admin_phone && (
                    <p className="mt-1 text-sm text-danger-600">{errors.admin_phone.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('admin_password', { 
                        required: 'Ce champ est requis',
                        minLength: {
                          value: 8,
                          message: 'Minimum 8 caractères'
                        }
                      })}
                      className={`input-field ${errors.admin_password ? 'border-danger-500' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.admin_password && (
                    <p className="mt-1 text-sm text-danger-600">{errors.admin_password.message}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('admin_password_confirm', { 
                      required: 'Confirmez votre mot de passe',
                      validate: (value) => value === password || 'Les mots de passe ne correspondent pas'
                    })}
                    className={`input-field ${errors.admin_password_confirm ? 'border-danger-500' : ''}`}
                    placeholder="••••••••"
                  />
                  {errors.admin_password_confirm && (
                    <p className="mt-1 text-sm text-danger-600">{errors.admin_password_confirm.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Building2 className="w-5 h-5" />
                    <span>Créer l'entreprise</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Se connecter
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register