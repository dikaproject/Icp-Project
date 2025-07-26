import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  LayoutDashboard, 
  Plus, 
  QrCode, 
  Scan, 
  History,
  ChevronLeft,
  ChevronRight,
  Wallet,
  X
} from 'lucide-react'

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobile, closeMobileMenu }) => {
  const location = useLocation()

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Top Up', path: '/topup', icon: Plus },
    { name: 'Generate QR', path: '/generate', icon: QrCode },
    { name: 'Scan Payment', path: '/scan', icon: Scan },
    { name: 'History', path: '/history', icon: History },
    { name: 'Back to Home', path: '/', icon: Home },
  ]

  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const handleLinkClick = () => {
    if (isMobile && closeMobileMenu) {
      closeMobileMenu()
    }
  }

  return (
    <div className={`h-full bg-[#1A1D23] border-r border-[#23253B] flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-72'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-[#23253B]">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#885FFF] to-[#59C1FF] rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/25">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-[#F5F6FA] font-bold text-lg">Arta Wallet</h1>
                <p className="text-[#B3B3C2] text-xs">Payment System</p>
              </div>
            </div>
          )}
          
          {/* Mobile Close Button */}
          {isMobile && (
            <button
              onClick={closeMobileMenu}
              className="lg:hidden p-2 text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#222334] rounded-xl transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          {/* Desktop Collapse Button */}
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#222334] rounded-xl transition-all duration-200"
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = isActiveRoute(item.path)
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={`group relative flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#885FFF]/20 to-[#59C1FF]/20 text-[#F5F6FA] border border-[#885FFF]/30 shadow-lg shadow-purple-500/10'
                  : 'text-[#B3B3C2] hover:text-[#F5F6FA] hover:bg-[#222334] border border-transparent'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#885FFF] to-[#59C1FF] rounded-r-full"></div>
              )}
              
              {/* Icon */}
              <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center ${
                isActive ? 'text-[#885FFF]' : 'group-hover:text-[#885FFF]'
              } transition-colors duration-200`}>
                <Icon className="w-5 h-5" />
              </div>
              
              {/* Label */}
              {!isCollapsed && (
                <span className="font-semibold truncate">{item.name}</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-[#222334] border border-[#23253B] text-[#F5F6FA] text-sm rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                  {item.name}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-[#222334] border-l border-b border-[#23253B] rotate-45"></div>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#23253B]">
        {!isCollapsed ? (
          <div className="bg-[#222334] rounded-2xl p-4 border border-[#23253B]">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <p className="text-[#F5F6FA] font-semibold text-sm">System Status</p>
                <p className="text-emerald-400 text-xs">All systems operational</p>
              </div>
            </div>
            <div className="text-xs text-[#B3B3C2]">
              Built on Internet Computer
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar