import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { ICPProvider } from './contexts/ICPContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import QRGenerator from './pages/QRGenerator'
import PaymentScanner from './pages/PaymentScanner'
import TransactionHistory from './pages/TransactionHistory'
import TopUp from './pages/TopUp'
import NetworkStats from './pages/NetworkStats'
import Home from './pages/Home'
import ClaimQRIS from './pages/ClaimQRIS'
import Landing from './pages/Landing'
import About from './pages/About'
import NetworkDashboard from './pages/Network'

function App() {
  return (
    <ICPProvider>
      <Router>
        <div className="min-h-screen bg-black text-white">
          <Routes>
            {/* Landing page route */}
            <Route path="/" element={<Landing />} />
            
            {/* About page route */}
            <Route path="/about" element={<About />} />
            
            {/* Network page route */}
            <Route path="/network" element={<NetworkDashboard />} />
            
            {/* External routes (no layout) */}
            <Route path="/qris/:topupId" element={<ClaimQRIS />} />
            
            {/* App routes with Layout */}
            <Route path="/app" element={<Layout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="home" element={<Home />} />
              <Route path="generate" element={<QRGenerator />} />
              <Route path="scan" element={<PaymentScanner />} />
              <Route path="history" element={<TransactionHistory />} />
              <Route path="topup" element={<TopUp />} />
              <Route path="network" element={<NetworkStats />} />
            </Route>
            
            {/* Legacy redirects */}
            <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/generate" element={<Navigate to="/app/generate" replace />} />
            <Route path="/scan" element={<Navigate to="/app/scan" replace />} />
            <Route path="/history" element={<Navigate to="/app/history" replace />} />
            <Route path="/topup" element={<Navigate to="/app/topup" replace />} />
            <Route path="/network-stats" element={<Navigate to="/app/network" replace />} />
          </Routes>
        </div>
      </Router>
    </ICPProvider>
  )
}

export default App
