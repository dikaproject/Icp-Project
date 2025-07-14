import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ICPProvider } from './contexts/ICPContext.jsx'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import QRGenerator from './pages/QRGenerator.jsx'
import PaymentScanner from './pages/PaymentScanner.jsx'
import TransactionHistory from './pages/TransactionHistory.jsx'

function App() {
  return (
    <ICPProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/generate" element={<QRGenerator />} />
            <Route path="/scan" element={<PaymentScanner />} />
            <Route path="/history" element={<TransactionHistory />} />
          </Routes>
        </Layout>
      </Router>
    </ICPProvider>
  )
}

export default App
