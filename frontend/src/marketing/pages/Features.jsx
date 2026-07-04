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
  Warehouse,
  ShoppingCart,
  FileText,
  CreditCard,
  Truck,
  Package,
  Layers,
  Award,
  Settings,
  Bot,
  Database,
  RefreshCw,
  Lock,
  Eye,
  Printer,
} from 'lucide-react'

const Features = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = (e, targetId) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  const features = [
    {
      icon: Building2,
      title: 'Gestion Multi-Succursales',
      description: 'Gérez plusieurs dépôts, boutiques et agences depuis une seule plateforme. Visualisez les performances de chaque succursale en temps réel.',
      benefits: [
        'Centralisation des données',
        'Comparaison des performances',
        'Gestion des stocks par succursale',
        'Transferts entre dépôts'
      ]
    },
    {
      icon: Cloud,
      title: 'Offline-First',
      description: 'Travaillez sans connexion internet. L\'application mobile fonctionne hors ligne et synchronise automatiquement les données lorsque la connexion est rétablie.',
      benefits: [
        'Opérations ininterrompues',
        'Synchronisation automatique',
        'Pas de perte de données',
        'Idéal pour les zones à faible couverture'
      ]
    },
    {
      icon: Smartphone,
      title: 'Application Mobile',
      description: 'Vendez, encaissez et gérez votre stock depuis votre téléphone. L\'application mobile offre toutes les fonctionnalités essentielles, même hors ligne.',
      benefits: [
        'Ventes et paiements',
        'Consultation du stock',
        'Enregistrement des dépenses',
        'Validation des réceptions'
      ]
    },
    {
      icon: Shield,
      title: 'Comptabilité OHADA',
      description: 'Conforme au SYSCOHADA. Génération automatique des états financiers à partir des opérations commerciales. Sans ressaisie.',
      benefits: [
        'Plan comptable OHADA',
        'Génération automatique des écritures',
        'Journaux, Grand Livre, Balance',
        'Compte de résultat et Bilan'
      ]
    },
    {
      icon: Bot,
      title: 'Assistant WhatsApp - Nuru',
      description: 'Gérez vos opérations via WhatsApp. Vendez, vérifiez les stocks, consultez les soldes clients et obtenez des rapports instantanés.',
      benefits: [
        'Ventes par WhatsApp',
        'Consultation des stocks',
        'Suivi des clients',
        'Résumés quotidiens'
      ]
    },
    {
      icon: BarChart3,
      title: 'Reporting & Analytics',
      description: 'Des tableaux de bord en temps réel avec des indicateurs clés pour piloter votre entreprise. Visualisez les performances par produit, succursale et période.',
      benefits: [
        'Tableaux de bord personnalisables',
        'Indicateurs de performance',
        'Rapports exportables',
        'Analyse de rentabilité'
      ]
    },
    {
      icon: Warehouse,
      title: 'Gestion des Stocks',
      description: 'Suivez vos stocks en temps réel avec des alertes de rupture. Gérez les inventaires, les transferts et les ajustements.',
      benefits: [
        'Stock en temps réel',
        'Alertes de rupture',
        'Transferts entre succursales',
        'Ajustements et inventaires'
      ]
    },
    {
      icon: ShoppingCart,
      title: 'Ventes & Point de Vente',
      description: 'Un système de vente complet avec gestion des paiements, facturation et suivi des clients. Plusieurs modes de paiement disponibles.',
      benefits: [
        'Point de vente (POS)',
        'Multiples modes de paiement',
        'Facturation automatique',
        'Suivi des créances'
      ]
    },
    {
      icon: Truck,
      title: 'Achats & Approvisionnement',
      description: 'Gérez vos commandes fournisseurs de A à Z. Suivez les réceptions, calculez les coûts réels et gérez les dettes fournisseurs.',
      benefits: [
        'Commandes fournisseurs',
        'Suivi des réceptions',
        'Calcul des coûts réels',
        'Gestion des dettes'
      ]
    },
    {
      icon: Users,
      title: 'Gestion des Clients & Fournisseurs',
      description: 'Centralisez toutes les informations de vos partenaires commerciaux. Suivez les historiques d\'achat et les soldes.',
      benefits: [
        'Historiques complets',
        'Suivi des soldes',
        'Gestion des créances',
        'Relations clients'
      ]
    },
    {
      icon: DollarSign,
      title: 'Caisse & Dépenses',
      description: 'Suivez les mouvements financiers de chaque succursale. Gérez les dépenses opérationnelles et les encaissements.',
      benefits: [
        'Suivi de caisse',
        'Gestion des dépenses',
        'Historique des transactions',
        'Contrôle financier'
      ]
    },
    {
      icon: Lock,
      title: 'Sécurité & Permissions',
      description: 'Un système de permissions granulaire qui permet de contrôler l\'accès aux fonctionnalités selon le rôle de chaque utilisateur.',
      benefits: [
        'Permissions granulaires',
        'Contrôle d\'accès',
        'Journal d\'activité',
        'Sécurité renforcée'
      ]
    }
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
              <Link to="/features" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Fonctionnalités
              </Link>
              <Link to="/pricing"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                onClick={(e) => handleNavClick(e, 'pricing')}
              >
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
            <Link to="/features" className="block text-sm font-medium text-primary-600 hover:text-primary-700">
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
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-primary-600 rounded-full mr-2"></span>
            Fonctionnalités
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Tout ce dont vous avez besoin pour gérer votre entreprise
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Une suite complète de fonctionnalités conçues pour les entreprises multi-succursales en RDC
          </p>
        </div>
      </section>

      {/* ========== FEATURES GRID ========== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-lg transition-shadow group">
                  <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary-100 transition-colors">
                    <Icon className="w-7 h-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-600">
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

export default Features