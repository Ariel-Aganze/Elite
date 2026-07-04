import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  Globe,
  ArrowRight,
} from 'lucide-react'
import { FaFacebook, FaTwitter, FaLinkedin, FaYoutube, FaWhatsapp } from 'react-icons/fa'

const Contact = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [formStatus, setFormStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormStatus(null)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Success
    setFormStatus({
      type: 'success',
      message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
    })
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    setIsSubmitting(false)
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      details: 'contact@elite.cd',
      description: 'Nous répondons sous 24h',
    },
    {
      icon: Phone,
      title: 'Téléphone',
      details: '+243 812 345 678',
      description: 'Lun-Ven, 8h - 18h',
    },
    {
      icon: MapPin,
      title: 'Adresse',
      details: 'Kinshasa, RDC',
      description: 'Gombe, Avenue de la République',
    },
  ]

  const officeHours = [
    { day: 'Lundi - Vendredi', hours: '8h00 - 18h00' },
    { day: 'Samedi', hours: '9h00 - 13h00' },
    { day: 'Dimanche', hours: 'Fermé' },
  ]

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* ========== HEADER / NAVBAR ========== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Elite RDC</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Accueil
              </Link>
              <Link to="/features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Fonctionnalités
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Tarifs
              </Link>
              <Link to="/contact" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Contact
              </Link>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Connexion
              </Link>
              <Link to="/register" className="btn-primary text-sm px-5 py-2.5">
                Commencer
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-4 py-4 space-y-3">
            <Link to="/" className="block text-sm font-medium text-gray-600 hover:text-gray-900">
              Accueil
            </Link>
            <Link to="/features" className="block text-sm font-medium text-gray-600 hover:text-gray-900">
              Fonctionnalités
            </Link>
            <Link to="/pricing" className="block text-sm font-medium text-gray-600 hover:text-gray-900">
              Tarifs
            </Link>
            <Link to="/contact" className="block text-sm font-medium text-primary-600 hover:text-primary-700">
              Contact
            </Link>
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <Link to="/login" className="block text-sm font-medium text-gray-600 hover:text-gray-900">
                Connexion
              </Link>
              <Link to="/register" className="block w-full btn-primary text-center">
                Commencer
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ========== HERO SECTION ========== */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-primary-600 rounded-full mr-2"></span>
            Contact
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Nous sommes là pour vous aider
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Une question sur nos services ? Besoin d'un devis personnalisé ? Notre équipe est à votre écoute.
          </p>
        </div>
      </section>

      {/* ========== CONTACT SECTION ========== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Contact Form - 3 columns */}
            <div className="lg:col-span-3">
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Envoyez-nous un message</h2>
                <p className="text-gray-500 mb-6">
                  Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
                </p>

                {formStatus && (
                  <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
                    formStatus.type === 'success' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {formStatus.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <p className={`text-sm ${
                      formStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formStatus.message}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom complet <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Jean M."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="jean@entreprise.cd"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="+243 812 345 678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sujet <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner un sujet</option>
                        <option value="Informations">Demande d'informations</option>
                        <option value="Devis">Demande de devis</option>
                        <option value="Support">Support technique</option>
                        <option value="Partnership">Partenariat</option>
                        <option value="Other">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="5"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Décrivez votre demande en détail..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    <span>{isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Info - 2 columns */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Cards */}
              <div className="space-y-4">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon
                  return (
                    <div key={index} className="bg-white rounded-xl p-6 border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{info.title}</h3>
                          <p className="text-primary-600 font-medium">{info.details}</p>
                          <p className="text-sm text-gray-500">{info.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Office Hours */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <span>Horaires d'ouverture</span>
                </h3>
                <div className="space-y-2">
                  {officeHours.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.day}</span>
                      <span className={`font-medium ${item.hours === 'Fermé' ? 'text-red-500' : 'text-gray-900'}`}>
                        {item.hours}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Suivez-nous</h3>
                <div className="flex space-x-4">
                  <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors text-gray-600">
                    <FaFacebook className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-[#1DA1F2] hover:text-white transition-colors text-gray-600">
                    <FaTwitter className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-colors text-gray-600">
                    <FaLinkedin className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-[#FF0000] hover:text-white transition-colors text-gray-600">
                    <FaYoutube className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors text-gray-600">
                    <FaWhatsapp className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Prêt à transformer votre entreprise ?
          </h2>
          <p className="mt-4 text-xl text-primary-100">
            Rejoignez des centaines d'entreprises qui utilisent déjà Elite RDC.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register" 
              className="bg-white text-primary-700 hover:bg-gray-50 font-semibold px-8 py-3.5 rounded-lg transition-colors flex items-center space-x-2"
            >
              <span>Commencer l'essai gratuit</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/contact" 
              className="text-white border border-white/30 hover:bg-white/10 px-8 py-3.5 rounded-lg transition-colors"
            >
              Nous contacter
            </Link>
          </div>
          <p className="mt-4 text-sm text-primary-200">Sans carte de crédit • 14 jours d'essai</p>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="text-xl font-bold text-white">Elite RDC</span>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                La plateforme de gestion commerciale pour les entreprises en RDC.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Produit</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">Accueil</Link></li>
                <li><Link to="/features" className="hover:text-white transition-colors">Fonctionnalités</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Entreprise</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">À propos</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; 2026 Elite RDC. Tous droits réservés.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">YouTube</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Contact