import React, { useState, useRef, useEffect } from 'react'
import { useICP } from '../contexts/ICPContext'
import { 
  LogIn,
  LogOut,
  User,
  Menu,
  ChevronDown,
  Settings,
  HelpCircle,
  Copy,
  Check,
  X
} from 'lucide-react'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  const { isAuthenticated, principal, login, logout, isLoading } = useICP()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      await logout()
      setIsDropdownOpen(false)
    } else {
      await login()
    }
  }

  const copyPrincipal = async () => {
    if (principal) {
      await navigator.clipboard.writeText(principal.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatPrincipal = (principal) => {
    const str = principal?.toString()
    return str ? `${str.slice(0, 8)}...${str.slice(-8)}` : ''
  }

  return (
  <div className="min-h-screen bg-[#181A20] flex">
    {/* Mobile Menu Overlay */}
    {isMobileMenuOpen && (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
        onClick={() => setIsMobileMenuOpen(false)} 
      />
    )}

    {/* Sidebar */}
    <div className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300`}>
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        isMobile={true}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
      />
    </div>

    {/* Main Content */}
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="bg-[#1A1D23] border-b border-[#23253B] backdrop-blur-xl relative z-30">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Mobile Menu Button & Title */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-3 text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#222334] rounded-2xl transition-all duration-200"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-[#F5F6FA] font-bold text-xl">Arta Wallet Dashboard</h1>
                <p className="text-[#B3B3C2] text-sm">Decentralized Payment System</p>
              </div>
            </div>
            
            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <div className="flex items-center space-x-3 px-6 py-3 bg-[#222334] border border-[#23253B] rounded-2xl">
                  <div className="w-5 h-5 border-2 border-[#885FFF] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-[#B3B3C2] hidden sm:inline font-medium">Connecting...</span>
                </div>
              ) : isAuthenticated ? (
                <div className="relative z-50" ref={dropdownRef}>
                  {/* User Dropdown Button */}
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-3 px-6 py-3 bg-[#222334] hover:bg-[#262840] border border-[#23253B] hover:border-[#885FFF]/50 rounded-2xl transition-all duration-200 group relative z-50"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-[#F5F6FA]">Connected</p>
                      <p className="text-xs text-[#B3B3C2] font-mono">
                        {formatPrincipal(principal)}
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-[#B3B3C2] group-hover:text-[#F5F6FA] transition-all duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <>
                      {/* Backdrop for dropdown */}
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                      
                      {/* Dropdown Content */}
                      <div className="absolute right-0 mt-3 w-80 bg-[#222334] border border-[#23253B] rounded-3xl shadow-2xl shadow-black/40 z-50 backdrop-blur-xl">
                        {/* User Info */}
                        <div className="p-6 border-b border-[#23253B]">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/25">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-base font-bold text-[#F5F6FA]">Wallet Connected</p>
                              <p className="text-sm text-[#B3B3C2]">Internet Computer</p>
                            </div>
                            <button
                              onClick={() => setIsDropdownOpen(false)}
                              className="p-2 text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#262840] rounded-xl transition-all duration-200"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {/* Principal ID */}
                          <div className="mt-4 p-4 bg-[#181A20] rounded-2xl border border-[#23253B]">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[#B3B3C2] font-semibold mb-2">Principal ID</p>
                                <p className="text-sm text-[#F5F6FA] font-mono break-all leading-relaxed">
                                  {principal?.toString()}
                                </p>
                              </div>
                              <button
                                onClick={copyPrincipal}
                                className="ml-3 p-3 text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#262840] rounded-xl transition-all duration-200 flex-shrink-0"
                                title="Copy Principal ID"
                              >
                                {copied ? (
                                  <Check className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-4">
                          
                          <button onClick={() => window.open("https://discord.gg/8bqp5ZWQjG", "_blank")} className="w-full flex items-center space-x-4 px-4 py-4 text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#262840] rounded-2xl transition-all duration-200 group">
                            <div className="w-10 h-10 bg-[#262840] group-hover:bg-[#363850] rounded-2xl flex items-center justify-center transition-all duration-200">
                              <HelpCircle className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold">Help & Support</p>
                              <p className="text-xs opacity-75">Get assistance</p>
                            </div>
                          </button>
                          
                          <div className="border-t border-[#23253B] my-4"></div>
                          
                          <button
                            onClick={handleAuthAction}
                            className="w-full flex items-center space-x-4 px-4 py-4 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl transition-all duration-200 group"
                          >
                            <div className="w-10 h-10 bg-rose-500/10 group-hover:bg-rose-500/20 rounded-2xl flex items-center justify-center transition-all duration-200">
                              <LogOut className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold">Disconnect Wallet</p>
                              <p className="text-xs opacity-75">Sign out securely</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleAuthAction}
                  className="group relative overflow-hidden bg-gradient-to-r from-[#885FFF] to-[#59C1FF] text-white rounded-2xl py-3 px-6 font-semibold shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center space-x-3">
                    <LogIn className="h-5 w-5" />
                    <span>Connect Wallet</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - TAMBAHKAN INI */}
      <main className="flex-1 bg-[#181A20] overflow-auto relative z-10">
        {children}
      </main>
    </div>
  </div>
)
}

export default Layout