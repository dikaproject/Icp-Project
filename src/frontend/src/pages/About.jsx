import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Wallet, 
  QrCode, 
  Globe, 
  Shield, 
  Zap, 
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  Smartphone,
  CreditCard,
  TrendingUp,
  Lock,
  Send,
  Sparkles,
  Calendar,
  Monitor,
  Search,
  DollarSign,
  Banknote,
  RefreshCw,
  Link2,
  Eye,
  Building2,
  Download,
  Code,
  Database,
  Layers,
  Clock,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Flag,
  BarChart3,
  Palette,
  ArrowLeft,
  CheckCircle2,
  Leaf,
  Target,
  Lightbulb,
  Heart
} from 'lucide-react'

const About = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const overviewSections = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Project Overview",
      content: "Arta Wallet is a revolutionary decentralized payment gateway built on Internet Computer Protocol (ICP) that transforms how people send and receive money globally. Named after the Sanskrit word \"Artha\" meaning wealth and prosperity, Arta Wallet embodies our vision of bringing financial prosperity to everyone, everywhere, without the barriers imposed by traditional banking systems."
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: "Technical Innovation", 
      content: "The current MVP version showcases groundbreaking technical capabilities built entirely on Internet Computer Protocol. Our application demonstrates true Web3 architecture by hosting everything on-chain - from Rust-based smart contracts to React frontend interface, with real-time exchange rate integration using ICP's HTTPS outcall functionality."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Current Capabilities",
      content: "Arta Wallet provides a complete payment experience with streamlined registration, intuitive dashboard, QR code generation, instant payment processing, and comprehensive transaction history. Every transaction is permanently recorded with complete transparency, creating an immutable audit trail."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Competitive Advantages",
      content: "Unlike traditional payment processors that charge substantial fees and impose geographic restrictions, Arta Wallet operates on a decentralized network with no single entity controlling payment flow. ICP's reverse gas model means users don't pay transaction fees, making micro-payments economically viable."
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Social Impact",
      content: "Designed to serve as financial infrastructure for billions excluded from traditional banking. In regions where bank ownership is low but smartphone penetration is high, Arta Wallet provides instant access to global financial services, unlocking economic opportunities worldwide."
    },
    {
      icon: <Leaf className="w-6 h-6" />,
      title: "Technical Excellence",
      content: "Security remains paramount through ICP's cryptographic foundation and consensus mechanism. Environmental considerations are addressed through ICP's energy-efficient consensus mechanism, ensuring financial inclusion doesn't come at environmental cost."
    }
  ]

  const currentFeatures = [
    {
      icon: <Users className="w-5 h-5" />,
      feature: "User Management",
      description: "Mock wallet authentication & user registration system",
      date: "Q1 2024"
    },
    {
      icon: <QrCode className="w-5 h-5" />,
      feature: "QR Generation", 
      description: "Generate payment QR codes with 30-minute expiration",
      date: "Q1 2024"
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      feature: "Multi-Currency",
      description: "Support for USD, EUR, IDR, JPY, GBP, SGD with flag icons",
      date: "Q2 2024"
    },
    {
      icon: <RefreshCw className="w-5 h-5" />,
      feature: "Exchange Rates",
      description: "Real-time rates via CoinGecko HTTPS outcalls",
      date: "Q2 2024"
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      feature: "Payment Processing",
      description: "Mock payment simulation with transaction recording", 
      date: "Q2 2024"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      feature: "Transaction History",
      description: "Complete payment history with transparency",
      date: "Q3 2024"
    },
    {
      icon: <Building2 className="w-5 h-5" />,
      feature: "Top-up System",
      description: "QRIS top-up (Indonesia), Credit Card & Web3 integration",
      date: "Q3 2024"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      feature: "Network Statistics",
      description: "Real-time payment network analytics dashboard",
      date: "Q4 2024"
    },
    {
      icon: <Palette className="w-5 h-5" />,
      feature: "Modern UI",
      description: "Responsive React frontend with Tailwind CSS",
      date: "Q4 2024"
    }
  ]

  const futureFeatures = [
    {
      icon: <Shield className="w-5 h-5" />,
      feature: "Internet Identity Integration",
      description: "Seamless authentication with ICP's native identity system",
      date: "Q1 2025",
      status: "🚧"
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      feature: "Real ICP Wallet Integration",
      description: "Support for Plug, Stoic, and other ICP wallets",
      date: "Q1 2025",
      status: "🚧"
    },
    {
      icon: <Send className="w-5 h-5" />,
      feature: "Actual ICP Transactions",
      description: "Real blockchain transactions on Internet Computer",
      date: "Q2 2025",
      status: "📅"
    },
    {
      icon: <Building2 className="w-5 h-5" />,
      feature: "Merchant Dashboard",
      description: "Complete business management interface with analytics",
      date: "Q2 2025",
      status: "📅"
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      feature: "Mobile Application",
      description: "Native mobile app with camera QR scanning",
      date: "Q3 2025",
      status: "📅"
    },
    {
      icon: <Link2 className="w-5 h-5" />,
      feature: "Payment Gateway Platform",
      description: "Gateway payment for any platform like Midtrans",
      date: "Q4 2025",
      status: "📅"
    }
  ]

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: "easeOut" }
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  return (
    <div className="min-h-screen text-white overflow-hidden relative" style={{
      backgroundColor: '#030014'
    }}>
      {/* Smooth scroll CSS */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        body {
          scroll-behavior: smooth;
        }
      `}</style>
      
      {/* Subtle animated background glow */}
      <div 
        className="fixed inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 70%)`,
          zIndex: 1
        }}
      />

      {/* Header - Same as Landing */}
      <header className="relative z-50 px-6 py-6 border-b border-slate-800/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Logo + Typography */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xl font-aeonik font-semibold text-white">Arta Wallet</span>
          </motion.div>
          
          {/* Center: Navigation Items */}
          <motion.nav 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:flex items-center space-x-8"
          >
            <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm">Home</Link>
            <Link to="/about" className="text-white transition-colors text-sm">About</Link>
            <Link to="/network" className="text-slate-400 hover:text-white transition-colors text-sm">Network</Link>
            <a 
              href="https://discord.gg/8bqp5ZWQjG" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Community
            </a>
          </motion.nav>

          {/* Right: Connect Wallet */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center space-x-4 relative"
          >
            <div className="relative group">
              <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center space-x-2">
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link 
                    to="/app/dashboard" 
                    className="flex items-center px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Link>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">
                    <Download className="w-4 h-4 mr-2" />
                    Import Wallet
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link 
              to="/" 
              className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </motion.div>

          {/* Hero Section */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="text-center mb-20"
          >
            <h1 className="text-5xl md:text-6xl font-aeonik font-normal mb-6 text-white">
              About <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Arta Wallet</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-4xl mx-auto leading-relaxed">
              Revolutionizing decentralized payments through Internet Computer Protocol. 
              Building the future of borderless financial infrastructure, one QR code at a time.
            </p>
          </motion.div>

          {/* Overview Sections */}
          <section className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="text-3xl mb-4">📖</div>
              <h2 className="text-4xl md:text-5xl font-aeonik font-normal mb-6 text-white">
                Our Vision & Mission
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                Transforming global finance through innovative blockchain technology and user-centric design
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {overviewSections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-8 hover:bg-slate-800/30 transition-all duration-300 group"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white mr-4 group-hover:scale-110 transition-transform">
                      {section.icon}
                    </div>
                    <h3 className="text-xl font-aeonik font-semibold text-white">
                      {section.title}
                    </h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {section.content}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Key Features Stats */}
          <section className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-3xl p-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-3xl font-aeonik font-bold text-purple-400 mb-2">1.7B+</div>
                  <div className="text-slate-400">Unbanked People Worldwide</div>
                </div>
                <div>
                  <div className="text-3xl font-aeonik font-bold text-blue-400 mb-2">3-5%</div>
                  <div className="text-slate-400">Traditional Payment Fees</div>
                </div>
                <div>
                  <div className="text-3xl font-aeonik font-bold text-green-400 mb-2">0%</div>
                  <div className="text-slate-400">Arta Wallet Transaction Fees</div>
                </div>
                <div>
                  <div className="text-3xl font-aeonik font-bold text-yellow-400 mb-2">6</div>
                  <div className="text-slate-400">Major Currencies Supported</div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* Development Timeline */}
          <section className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="text-3xl mb-4">🕒</div>
              <h2 className="text-4xl md:text-5xl font-aeonik font-normal mb-6 text-white">
                Development Timeline
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                Our journey from concept to implementation, showcasing completed milestones and future roadmap
              </p>
            </motion.div>

            {/* Timeline - Implemented Features */}
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-0.5 w-0.5 h-full bg-gradient-to-b from-green-500 via-green-400 to-purple-500"></div>
              
              <div className="space-y-16">
                {currentFeatures.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    {/* Content */}
                    <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                      <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6 hover:bg-slate-800/30 transition-all duration-300 group">
                        <div className={`flex items-center mb-3 ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs font-medium text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                            {item.date} • Completed
                          </span>
                        </div>
                        <div className={`flex items-center mb-4 ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white mr-3 group-hover:scale-110 transition-transform">
                            {item.icon}
                          </div>
                          <h3 className="text-lg font-aeonik font-semibold text-white">
                            {item.feature}
                          </h3>
                        </div>
                        <p className="text-slate-300 text-sm">{item.description}</p>
                      </div>
                    </div>

                    {/* Timeline Dot */}
                    <div className="relative z-10 w-4 h-4 bg-green-500 rounded-full border-4 border-slate-900 shadow-lg">
                      <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                    </div>

                    {/* Spacer */}
                    <div className="w-5/12"></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Future Roadmap */}
          <section className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="text-3xl mb-4">🚀</div>
              <h2 className="text-4xl md:text-5xl font-aeonik font-normal mb-6 text-white">
                Future Roadmap
              </h2>
              <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                Upcoming features and enhancements to complete the Arta Wallet ecosystem
              </p>
            </motion.div>

            {/* Future Timeline */}
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 transform -translate-x-0.5 w-0.5 h-full bg-gradient-to-b from-purple-500 via-blue-500 to-slate-600"></div>
              
              <div className="space-y-16">
                {futureFeatures.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    {/* Content */}
                    <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                      <div className="bg-slate-900/20 backdrop-blur-sm border border-slate-700/30 rounded-xl p-6 hover:bg-slate-800/20 transition-all duration-300 group opacity-80">
                        <div className={`flex items-center mb-3 ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs font-medium text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full">
                            {item.date} • {item.status === "🚧" ? "In Progress" : "Planned"}
                          </span>
                        </div>
                        <div className={`flex items-center mb-4 ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                          <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg flex items-center justify-center text-slate-300 mr-3 group-hover:scale-110 transition-transform">
                            {item.icon}
                          </div>
                          <h3 className="text-lg font-aeonik font-semibold text-slate-300">
                            {item.feature}
                          </h3>
                        </div>
                        <p className="text-slate-400 text-sm">{item.description}</p>
                        <div className={`mt-3 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                          <span className="text-lg">{item.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Dot */}
                    <div className="relative z-10 w-4 h-4 bg-slate-600 rounded-full border-4 border-slate-900 shadow-lg">
                      <div className="absolute inset-0 bg-slate-600 rounded-full animate-pulse opacity-50"></div>
                    </div>

                    {/* Spacer */}
                    <div className="w-5/12"></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Conclusion Section */}
          <section className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-12 text-center"
            >
              <div className="text-4xl mb-6">💎</div>
              <h2 className="text-3xl font-aeonik font-semibold text-white mb-6">
                The Future of Money is Here
              </h2>
              <p className="text-lg text-slate-300 max-w-4xl mx-auto leading-relaxed mb-8">
                Arta Wallet represents more than a technological achievement; it embodies a vision of financial democratization through blockchain innovation. By combining the security and transparency of Internet Computer Protocol with intuitive user experiences, Arta Wallet makes decentralized finance accessible to mainstream users worldwide.
              </p>
              <p className="text-slate-400 max-w-3xl mx-auto leading-relaxed">
                The future of money is decentralized, borderless, and accessible to all. Arta Wallet is building that future today, one QR code at a time.
              </p>
            </motion.div>
          </section>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-aeonik font-semibold text-white mb-4">
                Ready to Experience the Future?
              </h3>
              <p className="text-slate-400 mb-6">
                Join our testing phase and help shape the future of decentralized payments
              </p>
              <Link
                to="/app/dashboard"
                className="inline-flex items-center bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
              >
                Try Arta Wallet
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Footer - Same as Landing */}
      <footer className="relative z-10 px-6 py-16 border-t border-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-xl font-aeonik font-semibold text-white">Arta Wallet</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                The future of decentralized payments. Built on Internet Computer Protocol for global financial inclusion.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#security" className="text-slate-400 hover:text-white transition-colors">Security</a></li>
                <li><a href="/app/dashboard" className="text-slate-400 hover:text-white transition-colors">Dashboard</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">About</Link></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-800/30">
            <div className="text-slate-400 text-sm mb-4 md:mb-0">
              © 2024 Arta Wallet. Built on Internet Computer Protocol. All rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default About 