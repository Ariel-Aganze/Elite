import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Menu,
  X,
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Building2,
  Users,
  CreditCard,
  Shield,
  Zap,
  Globe,
  Settings,
  Smartphone,
  Cloud,
} from 'lucide-react'

const Pricing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState('monthly')

  const handleNavClick = (e, targetId) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  const plans = [
    {
      name: 'Starter',
      description: 'Pour les petites entreprises',
      price: { monthly: 49, yearly: 39 },
      features: [
        '1 succursale',
        '5 utilisateurs',
        'Ventes & Stock',
        'Application mobile',
        'Support email',
        'Jusqu\'à 500 produits',
      ],
      cta: 'Commencer',
      popular: false,
      color: 'border-gray-200',
    },
    {
      name: 'Pro',
      description: 'Pour les entreprises en croissance',
      price: { monthly: 99, yearly: 79 },
      features: [
        '5 succursales',
        '20 utilisateurs',
        'Ventes, Stock, Achats',
        'Application mobile',
        'Offline-First',
        'Assistant WhatsApp',
        'Support prioritaire',
        'Jusqu\'à 5 000 produits',
      ],
      cta: 'Commencer',
      popular: true,
      color: 'border-primary-600',
    },
    {
      name: 'Enterprise',
      description: 'Pour les grandes organisations',
      price: { monthly: 'Sur mesure', yearly: 'Sur mesure' },
      features: [
        'Succursales illimitées',
        'Utilisateurs illimités',
        'Comptabilité OHADA',
        'Support dédié 24/7',
        'API sur mesure',
        'Formation sur site',
        'Personnalisation',
        'Produits illimités',
      ],
      cta: 'Nous contacter',
      popular: false,
      color: 'border-gray-200',
    },
  ]

  const allFeatures = [
    { name: 'Succursales', starter: '1', pro: '5', enterprise: '∞' },
    { name: 'Utilisateurs', starter: '5', pro: '20', enterprise: '∞' },
    { name: 'Produits', starter: '500', pro: '5 000', enterprise: '∞' },
    { name: 'Ventes', starter: '✓', pro: '✓', enterprise: '✓' },
    { name: 'Stock', starter: '✓', pro: '✓', enterprise: '✓' },
    { name: 'Achats', starter: '—', pro: '✓', enterprise: '✓' },
    { name: 'Application Mobile', starter: '✓', pro: '✓', enterprise: '✓' },
    { name: 'Offline-First', starter: '—', pro: '✓', enterprise: '✓' },
    { name: 'Assistant WhatsApp', starter: '—', pro: '✓', enterprise: '✓' },
    { name: 'Comptabilité OHADA', starter: '—', pro: '—', enterprise: '✓' },
    { name: 'Support Prioritaire', starter: '—', pro: '✓', enterprise: '✓' },
    { name: 'Support Dédié 24/7', starter: '—', pro: '—', enterprise: '✓' },
    { name: 'API sur mesure', starter: '—', pro: '—', enterprise: '✓' },
    { name: 'Formation sur site', starter: '—', pro: '—', enterprise: '✓' },
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
              <Link to="/pricing" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Tarifs
              </Link>
              <Link to="/contact"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                onClick={(e) => handleNavClick(e, 'contact')}
              >
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
            <Link to="/pricing" className="block text-sm font-medium text-primary-600 hover:text-primary-700">
              Tarifs
            </Link>
            <Link to="/contact"
              className="block text-sm font-medium text-gray-600 hover:text-gray-900"
              onClick={(e) => handleNavClick(e, 'contact')}
            >
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
            Tarifs
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Des tarifs adaptés à votre activité
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Choisissez le plan qui correspond à vos besoins. Tous les plans incluent un essai gratuit de 14 jours.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center space-x-4">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
              Mensuel
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-8 bg-gray-300 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-400'}`}>
              Annuel
              <span className="ml-1 text-xs text-green-600 font-semibold">-20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* ========== PRICING PLANS ========== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl border-2 ${
                  plan.popular ? 'border-primary-600' : 'border-gray-200'
                } p-8 hover:shadow-lg transition-shadow relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Populaire
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-gray-500 text-sm">{plan.description}</p>
                <div className="mt-6">
                  {typeof plan.price[billingCycle] === 'number' ? (
                    <>
                      <span className="text-4xl font-bold text-gray-900">
                        ${plan.price[billingCycle]}
                      </span>
                      <span className="text-gray-400 text-sm ml-1">/ mois</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900">
                      {plan.price[billingCycle]}
                    </span>
                  )}
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {plan.name === 'Enterprise' ? (
                    <Link
                      to="/contact"
                      className="w-full btn-secondary inline-flex items-center justify-center py-3"
                      onClick={(e) => handleNavClick(e, 'contact')}
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <Link
                      to="/register"
                      className={`w-full ${
                        plan.popular ? 'btn-primary' : 'btn-secondary'
                      } inline-flex items-center justify-center py-3`}
                    >
                      {plan.cta}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== COMPARISON TABLE ========== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Comparaison détaillée
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Toutes les fonctionnalités incluses dans chaque plan
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl border border-gray-200">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Fonctionnalités
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Starter
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary-600">
                    Pro
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allFeatures.map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {feature.name}
                    </td>
                    <td className="px-6 py-3 text-center text-sm text-gray-600">
                      {feature.starter}
                    </td>
                    <td className="px-6 py-3 text-center text-sm font-medium text-primary-600">
                      {feature.pro}
                    </td>
                    <td className="px-6 py-3 text-center text-sm font-medium text-gray-900">
                      {feature.enterprise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========== FAQ SECTION ========== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Questions fréquentes
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Tout ce que vous devez savoir avant de commencer
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Puis-je changer de plan à tout moment ?
              </h3>
              <p className="mt-2 text-gray-600">
                Oui, vous pouvez passer d'un plan à un autre à tout moment. Le changement est immédiat et vous serez facturé au prorata.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Que comprend l'essai gratuit ?
              </h3>
              <p className="mt-2 text-gray-600">
                L'essai gratuit de 14 jours vous donne accès à toutes les fonctionnalités du plan Pro. Aucune carte de crédit n'est requise.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Puis-je ajouter des succursales supplémentaires ?
              </h3>
              <p className="mt-2 text-gray-600">
                Oui, vous pouvez ajouter des succursales supplémentaires à tout moment. Contactez-nous pour un devis personnalisé.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Y a-t-il des frais d'installation ?
              </h3>
              <p className="mt-2 text-gray-600">
                Non, il n'y a pas de frais d'installation. Tous nos plans sont sans engagement et vous pouvez résilier à tout moment.
              </p>
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
              onClick={(e) => handleNavClick(e, 'contact')}
            >
              Demander une démo
            </Link>
          </div>
          <p className="mt-4 text-sm text-primary-200">Sans carte de crédit • 14 jours d'essai</p>
        </div>
      </section>

      {/* ========== CONTACT SECTION ========== */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Contactez-nous</h2>
            <p className="mt-4 text-lg text-gray-600">
              Une question ? Notre équipe est là pour vous répondre.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <form className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Jean M."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="jean@entreprise.cd"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea 
                    rows="4"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Votre message..."
                  />
                </div>
                <button className="w-full btn-primary py-3">
                  Envoyer
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-gray-600">contact@elite.cd</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Téléphone</p>
                  <p className="text-gray-600">+243 812 345 678</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Adresse</p>
                  <p className="text-gray-600">Kinshasa, RDC</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Disponible du lundi au vendredi, 8h à 18h.
                </p>
              </div>
            </div>
          </div>
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
                <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carrières</a></li>
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

export default Pricing