import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useEffect } from 'react'
import LiveView from './pages/LiveView'
import Logs from './pages/Logs'
import Billing from './pages/Billing'
import { setSecurityHeaders } from './utils/security'
import './App.css'

function App() {
  useEffect(() => {
    // Set security headers on app initialization
    setSecurityHeaders()
    
    // Set up global error handling
    const handleGlobalError = (event) => {
      console.error('Global error caught:', event.error)
      // In production, you might want to send this to an error reporting service
    }
    
    window.addEventListener('error', handleGlobalError)
    
    // Clean up
    return () => {
      window.removeEventListener('error', handleGlobalError)
    }
  }, [])

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-title">🗂️ Waste Detection System</h1>
            <div className="nav-links">
              <Link to="/live" className="nav-link">📹 Live View</Link>
              <Link to="/logs" className="nav-link">📊 Logs</Link>
              <Link to="/billing" className="nav-link">💰 Billing</Link>
            </div>
          </div>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LiveView />} />
            <Route path="/live" element={<LiveView />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/billing" element={<Billing />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App