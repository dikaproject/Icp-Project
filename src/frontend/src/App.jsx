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

function App() {
  return (
    <ICPProvider>
      <Router>
        <Routes>
          {/* Routes tanpa Layout (untuk halaman external) */}
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
