import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Menu,
  X,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Smartphone,
  Building2,
  Cloud,
  Shield,
  Zap,
  Users,
  TrendingUp,
  DollarSign,
  Globe,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
} from 'lucide-react'

const Homepage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Smooth scroll for anchor links
  const handleNavClick = (e, targetId) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

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
              <Link to="/" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Accueil
              </Link>
              <Link to="/features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Fonctionnalités
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
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
            <Link to="/" className="block text-sm font-medium text-primary-600 hover:text-primary-700">
              Accueil
            </Link>
            <Link to="/features" className="block text-sm font-medium text-gray-600 hover:text-gray-900">
              Fonctionnalités
            </Link>
            <Link to="/pricing"
              className="block text-sm font-medium text-gray-600 hover:text-gray-900"
              onClick={(e) => handleNavClick(e, 'pricing')}
            >
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
      <section id="hero" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-primary-600 rounded-full mr-2"></span>
                ERP pour entreprises en RDC
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Gérez votre entreprise{' '}
                <span className="text-primary-600">même sans internet</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-lg leading-relaxed">
                La plateforme de gestion commerciale multi-succursales conçue pour les entreprises en RDC. 
                Ventes, stocks, achats, comptabilité OHADA — tout en un seul endroit.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link 
                  to="/register" 
                  className="btn-primary text-base px-8 py-3.5 flex items-center space-x-2"
                >
                  <span>Commencer gratuitement</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link 
                  to="/features" 
                  className="text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1"
                >
                  <span>En savoir plus</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <p className="mt-4 text-sm text-gray-400">Sans carte de crédit • Essai 14 jours</p>
            </div>

            {/* Right Column - Hero Image / Dashboard Preview */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-gray-400 ml-2">Tableau de bord</span>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Ventes Aujourd'hui</p>
                      <p className="text-2xl font-bold text-gray-900">$3,240</p>
                      <p className="text-xs text-green-600">+5.4% vs hier</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Ventes du Mois</p>
                      <p className="text-2xl font-bold text-gray-900">$48,600</p>
                      <p className="text-xs text-green-600">+9.1% vs mois</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Stock Disponible</p>
                      <p className="text-2xl font-bold text-gray-900">142</p>
                      <p className="text-xs text-gray-400">articles en boutique</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Clients Actifs</p>
                      <p className="text-2xl font-bold text-gray-900">38</p>
                      <p className="text-xs text-gray-400">ce mois</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-2">Top Produit</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Ciment Lafarge 50kg</p>
                        <p className="text-xs text-gray-400">1,284 unités</p>
                      </div>
                      <p className="font-bold text-primary-600">$38,520</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg px-4 py-3 border border-gray-200 hidden lg:block">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Offline-Ready</p>
                    <p className="text-xs text-gray-500">Fonctionne sans internet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TRUST / LOGO BAR ========== */}
      <section className="py-8 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 mb-4">Utilisé par des entreprises de confiance en RDC</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
            <span className="text-gray-400 font-bold text-lg">Entreprise A</span>
            <span className="text-gray-400 font-bold text-lg">Distributeur B</span>
            <span className="text-gray-400 font-bold text-lg">Constructeur C</span>
            <span className="text-gray-400 font-bold text-lg">Fournisseur D</span>
            <span className="text-gray-400 font-bold text-lg">Agence E</span>
          </div>
        </div>
      </section>

      {/* ========== FEATURES SECTION ========== */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Tout ce dont vous avez besoin pour gérer votre entreprise
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Une solution complète pour les entreprises multi-succursales en RDC
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Multi-Succursales</h3>
              <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                Gérez plusieurs dépôts, boutiques et agences depuis une plateforme unique.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Cloud className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Offline-First</h3>
              <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                Travaillez sans connexion internet. Synchronisation automatique dès la connexion rétablie.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Application Mobile</h3>
              <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                Vendez et gérez votre stock depuis votre téléphone, même hors ligne.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Reporting & Analytics</h3>
              <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                Tableaux de bord en temps réel pour suivre vos performances.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Comptabilité OHADA</h3>
              <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                Conforme au SYSCOHADA. Génération automatique des états financiers.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Assistant WhatsApp</h3>
              <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                Gérez vos opérations via WhatsApp avec Nuru, votre assistant IA.
              </p>
            </div>
          </div>

          {/* View All Features Link */}
          <div className="text-center mt-12">
            <Link 
              to="/features" 
              className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <span>Explorer toutes les fonctionnalités</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========== BENEFITS / STATS SECTION ========== */}
      <section id="stats" className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-white">500+</p>
              <p className="mt-2 text-primary-100 text-sm">Entreprises clientes</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">2,400+</p>
              <p className="mt-2 text-primary-100 text-sm">Succursales gérées</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">50k+</p>
              <p className="mt-2 text-primary-100 text-sm">Transactions par mois</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">99.9%</p>
              <p className="mt-2 text-primary-100 text-sm">Disponibilité</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== BENEFITS DETAIL SECTION ========== */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Une solution pensée pour les entreprises en RDC
              </h2>
              <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                Elite RDC est le premier ERP conçu spécifiquement pour les entreprises congolaises, 
                avec des fonctionnalités adaptées aux réalités locales.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Gestion multi-succursales</p>
                    <p className="text-sm text-gray-500">Centralisez toutes vos agences et dépôts</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Offline-First</p>
                    <p className="text-sm text-gray-500">Travaillez même en zone de faible couverture</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Comptabilité OHADA</p>
                    <p className="text-sm text-gray-500">Conforme aux normes SYSCOHADA</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Assistant WhatsApp</p>
                    <p className="text-sm text-gray-500">Gérez vos opérations depuis votre messagerie</p>
                  </div>
                </div>
              </div>

              <Link 
                to="/register" 
                className="mt-8 btn-primary inline-flex items-center space-x-2 px-8 py-3.5"
              >
                <span>Commencer l'essai gratuit</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">-40%</p>
                <p className="text-sm text-gray-500">Réduction des coûts opérationnels</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">+65%</p>
                <p className="text-sm text-gray-500">Productivité des équipes</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">+30%</p>
                <p className="text-sm text-gray-500">Augmentation des ventes</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <Globe className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">100%</p>
                <p className="text-sm text-gray-500">Conforme OHADA</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PRICING SECTION ========== */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Des tarifs adaptés à votre activité
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choisissez le plan qui correspond à vos besoins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Plan Starter */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900">Starter</h3>
              <p className="mt-2 text-gray-500 text-sm">Pour les petites entreprises</p>
              <p className="mt-6 text-4xl font-bold text-gray-900">$49</p>
              <p className="text-sm text-gray-400">/ mois</p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">1 succursale</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">5 utilisateurs</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Ventes & Stock</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Application mobile</span>
                </li>
              </ul>
              <Link 
                to="/register" 
                className="mt-8 w-full btn-secondary inline-flex items-center justify-center py-2.5"
              >
                Commencer
              </Link>
            </div>

            {/* Plan Pro - Featured */}
            <div className="bg-white rounded-2xl border-2 border-primary-600 p-8 relative hover:shadow-lg transition-shadow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                Populaire
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
              <p className="mt-2 text-gray-500 text-sm">Pour les entreprises en croissance</p>
              <p className="mt-6 text-4xl font-bold text-gray-900">$99</p>
              <p className="text-sm text-gray-400">/ mois</p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">5 succursales</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">20 utilisateurs</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Ventes, Stock, Achats</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Application mobile</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Offline-First</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Assistant WhatsApp</span>
                </li>
              </ul>
              <Link 
                to="/register" 
                className="mt-8 w-full btn-primary inline-flex items-center justify-center py-2.5"
              >
                Commencer
              </Link>
            </div>

            {/* Plan Enterprise */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900">Enterprise</h3>
              <p className="mt-2 text-gray-500 text-sm">Pour les grandes organisations</p>
              <p className="mt-6 text-4xl font-bold text-gray-900">Sur mesure</p>
              <p className="text-sm text-gray-400">Nous contacter</p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Succursales illimitées</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Utilisateurs illimités</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Comptabilité OHADA</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">Support dédié 24/7</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">API sur mesure</span>
                </li>
              </ul>
              <Link to="/contact" 
                className="mt-8 w-full btn-secondary inline-flex items-center justify-center py-2.5"
                onClick={(e) => handleNavClick(e, 'contact')}
              >
                Nous contacter
              </Link>
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
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
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

export default Homepage