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
  Play,
  Calendar,
  Mouse,
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
  MessageSquare,
  Clock,
  Github,
  Twitter,
  Linkedin,
  Mail,
  User
} from 'lucide-react'
import { useICP } from '../contexts/ICPContext'


// Import assets with fallback
let ContainerImage, ContainerdashboardImage
try {
  ContainerImage = require('../Container.png').default || require('../Container.png')
  ContainerdashboardImage = require('../Containerdashboard.png').default || require('../Containerdashboard.png')
} catch (error) {
  // Fallback to public path
  ContainerImage = '/assets/Container.png'
  ContainerdashboardImage = '/assets/Containerartadashboard.png'
}

const Landing = () => {
  const { isAuthenticated, principal, user, showWalletModal, setShowWalletModal } = useICP() 
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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

  const features = [
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Built for speed",
      subtitle: "Decentralized and Borderless Payments",
      description: "Direct peer-to-peer transactions across the globe without banks or intermediaries."
    },
    {
      icon: <Link2 className="w-5 h-5" />,
      title: "Networked notes", 
      subtitle: "Ultra-Low to Zero Transaction Fees",
      description: "ICP's reverse gas model means users don't pay transaction fees for payments."
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: "iOS app",
      subtitle: "Real-Time Currency Conversion", 
      description: "Send payments in local fiat currencies with automatic real-time ICP conversion."
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "End-to-end encryption",
      subtitle: "Simple QR Code-Based Payments",
      description: "Scannable QR codes make crypto payments as easy as scanning a barcode."
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Calendar integration",
      subtitle: "Fully On-Chain Web3 Architecture",
      description: "Fully decentralized with backend and frontend hosted on-chain via ICP."
    },
    {
      icon: <Mouse className="w-5 h-5" />,
      title: "Publishing",
      subtitle: "Inclusive Financial Access",
      description: "Access digital payments with just a smartphone, especially for the unbanked."
    },
    {
      icon: <Monitor className="w-5 h-5" />,
      title: "Instant capture",
      subtitle: "Transparent Transaction History",
      description: "Every transaction permanently recorded on blockchain with full details."
    },
    {
      icon: <Search className="w-5 h-5" />,
      title: "Frictionless search", 
      subtitle: "Future-Ready Business Integration",
      description: "Merchant dashboards, mobile apps, and DeFi features for complete ecosystem."
    }
  ]

  const steps = [
    {
      number: "01",
      title: "Connect Your Wallet",
      description: "Link your Internet Identity or preferred crypto wallet to get started with Arta Wallet.",
      icon: <Wallet className="w-8 h-8" />
    },
    {
      number: "02", 
      title: "Generate QR Code",
      description: "Create payment QR codes for any amount in your preferred fiat currency with real-time conversion.",
      icon: <QrCode className="w-8 h-8" />
    },
    {
      number: "03",
      title: "Send & Receive",
      description: "Scan QR codes to send payments instantly or share your code to receive funds globally.",
      icon: <Send className="w-8 h-8" />
    },
    {
      number: "04",
      title: "Track Transactions",
      description: "Monitor all your payments with transparent, immutable transaction history on the blockchain.",
      icon: <Eye className="w-8 h-8" />
    }
  ]

  const techSpecs = [
    {
      icon: <Database className="w-6 h-6" />,
      title: "Internet Computer Protocol",
      description: "Built on ICP for maximum security and decentralization"
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Rust Backend",
      description: "High-performance smart contracts written in Rust"
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "React Frontend",
      description: "Modern, responsive web interface hosted on-chain"
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: "Real-time API",
      description: "Live exchange rates via HTTPS outcalls to CoinGecko"
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Freelance Designer",
      content: "Arta Wallet transformed how I receive payments from international clients. No more expensive wire transfers!",
      avatar: "SC"
    },
    {
      name: "Miguel Rodriguez", 
      role: "Small Business Owner",
      content: "Finally, a payment solution that doesn't eat into my profits with high fees. Perfect for my online store.",
      avatar: "MR"
    },
    {
      name: "Priya Sharma",
      role: "Remote Developer",
      content: "The QR code system is brilliant. My clients can pay me instantly without dealing with complex crypto addresses.",
      avatar: "PS"
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
      
      {/* Header */}
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
            <a href="/" className="text-slate-400 hover:text-white transition-colors text-sm">Home</a>
            <Link to="/about" className="text-slate-400 hover:text-white transition-colors text-sm">About</Link>
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
            {isAuthenticated ? (
              // If authenticated, show Go to Dashboard button
              <Link
                to="/dashboard"
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center space-x-2"
              >
                <Wallet className="w-4 h-4" />
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              // If not authenticated, show dropdown
              <div className="relative group">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center space-x-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                  <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Backdrop */}
                {isDropdownOpen && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)} 
                  />
                )}
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-xl z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs text-slate-400 font-medium uppercase tracking-wide border-b border-slate-700/50 mb-2">
                        Authentication
                      </div>
                      <button 
                        onClick={() => {
                          setIsDropdownOpen(false)
                          setShowWalletModal(true)
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors group text-left"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                          <Wallet className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Login</div>
                          <div className="text-xs text-slate-400">Connect existing wallet</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => {
                          setIsDropdownOpen(false)
                          setShowWalletModal(true)
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors group text-left"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Register</div>
                          <div className="text-xs text-slate-400">Create new account</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-32 pb-20">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-8"
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm backdrop-blur-sm">
            <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
            <span className="text-slate-300">Built on Internet Computer Protocol</span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-aeonik font-normal mb-6 leading-tight text-white">
            Pay better with <span className="text-white">Arta</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed mb-12">
            A decentralized payment gateway built on Internet Computer Protocol that enables global cross-border payments with automatic fiat-to-ICP conversion through QR code scanning.
          </p>
        </motion.div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-slate-400 text-sm mb-2 text-center relative z-50"
        >
          Decentralized Global Payment Gateway for the future of finance
        </motion.p>

        {/* Images Section - Moved up to overlap with text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="relative w-full mt-8"
        >
          {/* Spline 3D Asset - Replace Container.png, show only half */}
          <div className="relative z-20 w-full flex justify-center mt-16">
            <div 
              className="w-full h-auto relative overflow-visible"
              style={{
                maxWidth: 'none',
                minWidth: '100vw',
                height: '90vh', // Increased height for bigger globe
                filter: 'drop-shadow(0 0 40px rgba(147, 51, 234, 0.3))'
              }}
            >
              <iframe 
                src='https://my.spline.design/worldplanet-OxUyE8hTcWqVj8GqPELAB6z4/' 
                frameBorder='0' 
                width='100%' 
                height='100%' // Full height instead of cropping
                style={{
                  position: 'relative',
                  top: '0%',
                  transform: 'scale(2.0)', // Much bigger scale for full width coverage
                  pointerEvents: 'none', // Disable all interactions (zoom, drag, etc.)
                  userSelect: 'none', // Prevent text selection
                }}
              />
            </div>
          </div>

          {/* Containerdashboard.png - Overlapping with bottom half of Spline asset */}
          <div className="relative z-30 w-full flex justify-center">
            <img 
              src={ContainerdashboardImage} 
              alt="Dashboard Container" 
              className="w-full max-w-6xl h-auto object-contain"
              style={{
                marginTop: '-500px', // Even more overlap for the lower positioned Spline asset
                filter: 'drop-shadow(0 0 60px rgba(59, 130, 246, 0.4))'
              }}
            />
          </div>
        </motion.div>

        {/* Additional spacing for better layout */}
        <div className="h-20"></div>
      </div>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-aeonik font-normal mb-6 text-white">
              Why Choose Arta Wallet
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Revolutionary features that make decentralized payments accessible to everyone
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-lg p-4 hover:bg-slate-800/30 transition-all duration-300 group"
              >
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-purple-400 transition-colors">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-white mb-1 font-aeonik">
                  {feature.title}
                </h3>
                <h4 className="text-xs font-medium text-purple-400 mb-2">
                  {feature.subtitle}
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 px-6 py-20 bg-slate-900/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-aeonik font-normal mb-6 text-white">
              How It Works
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Four simple steps to revolutionize your payment experience with Arta Wallet
            </p>
          </motion.div>

          <motion.div
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center relative group"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <div className="text-4xl font-aeonik font-bold text-purple-400/30 mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-aeonik font-semibold mb-4 text-white">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full">
                    <ArrowRight className="w-6 h-6 text-purple-400/50 mx-auto" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section id="tech-specs" className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-aeonik font-normal mb-6 text-white">
              Technical Excellence
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Built with cutting-edge technology for maximum performance and security
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techSpecs.map((spec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6 hover:bg-slate-800/30 transition-all duration-300 group text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  {spec.icon}
                </div>
                <h3 className="text-lg font-aeonik font-semibold text-white mb-2">
                  {spec.title}
                </h3>
                <p className="text-slate-400 text-sm">
                  {spec.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="relative z-10 px-6 py-20 bg-slate-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-aeonik font-normal mb-6 text-white">
                Bank-Grade Security
              </h2>
              <p className="text-xl text-slate-400 mb-8">
                Your payments are protected by the most advanced security measures in the blockchain industry.
              </p>
              <div className="space-y-4">
                {[
                  "End-to-end encryption for all transactions",
                  "Decentralized architecture with no single point of failure", 
                  "Immutable transaction records on ICP blockchain",
                  "Multi-signature wallet support for businesses"
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="w-80 h-80 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full animate-pulse"></div>
                <div className="absolute inset-8 bg-gradient-to-r from-green-600/30 to-blue-600/30 rounded-full animate-spin-slow"></div>
                <div className="absolute inset-16 bg-slate-900/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-700/50">
                  <Shield className="w-32 h-32 text-green-400" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-aeonik font-normal mb-6 text-white">
              What Users Say
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Join thousands of users who have revolutionized their payment experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-slate-900/30 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6 hover:bg-slate-800/30 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-slate-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-slate-300 italic">"{testimonial.content}"</p>
                <div className="flex text-yellow-400 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="relative p-12 rounded-3xl overflow-hidden border border-slate-700/50"
            style={{
              backgroundImage: 'url(/assets/footerwebm.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-aeonik font-normal mb-6 text-white">
                Ready to revolutionize your{' '}
                <span className="bg-gradient-to-r from-arta-400 via-arta-500 to-arta-700 bg-clip-text text-transparent">
                  payments
                </span>
                ?
              </h2>
              <p className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
                Join the future of decentralized finance with Arta Wallet. Start sending and receiving payments globally with zero fees.
              </p>
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated ? (
                  <Link 
                    to="/dashboard" 
                    className="bg-white text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-100 transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-lg"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                ) : (
                  <button 
                    onClick={() => setShowWalletModal(true)}
                    className="bg-white text-black px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-100 transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-lg"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                )}
                <a 
                  href="#how-it-works" 
                  className="border border-white/30 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300"
                >
                  Learn More
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
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
                <li><a href="/dashboard" className="text-slate-400 hover:text-white transition-colors">Dashboard</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">About</a></li>
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

export default Landing