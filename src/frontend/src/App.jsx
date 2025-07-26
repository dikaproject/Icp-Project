import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ICPProvider } from './contexts/ICPContext.jsx'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import QRGenerator from './pages/QRGenerator.jsx'
import PaymentScanner from './pages/PaymentScanner.jsx'
import TransactionHistory from './pages/TransactionHistory.jsx'
import TopUp from './pages/TopUp.jsx'
import ClaimQRIS from './pages/ClaimQRIS.jsx'
import NetworkStats from './pages/NetworkStats.jsx'
import About from './pages/About.jsx'
import NetworkDashboard from './pages/Network.jsx'
import Landing from './pages/Landing.jsx'

function App() {
  return (
    <ICPProvider>
      <Router>
        <Routes>
          {/* Landing page route */}
            <Route path="/" element={<Landing />} />
            
            {/* About page route */}
            <Route path="/about" element={<About />} />
            
            {/* Network page route */}
            <Route path="/network" element={<NetworkDashboard />} />
            
            {/* External routes (no layout) */}
            <Route path="/qris/:topupId" element={<ClaimQRIS />} />
          
          {/* Routes dengan Layout */}
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/generate" element={<QRGenerator />} />
                <Route path="/scan" element={<PaymentScanner />} />
                <Route path="/history" element={<TransactionHistory />} />
                <Route path="/topup" element={<TopUp />} />
                <Route path="/network" element={<NetworkStats />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </ICPProvider>
  )
}

export default App
