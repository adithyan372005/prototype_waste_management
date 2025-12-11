import { useState } from 'react'
import { useSecureData } from '../hooks/useSecureData'
import { sanitizeInput } from '../utils/security'

const Billing = () => {
  const [open, setOpen] = useState(false)
  
  // Environment variables
  const BACKEND_URL = import.meta.env.VITE_API_URL
  
  // Use secure data fetching
  const { data: rawBillingData, loading, error } = useSecureData(`${BACKEND_URL}/billing`, {
    pollInterval: 30000,
    minInterval: 5000,
    retryAttempts: 2
  })

  // Sanitize and validate billing data using new API structure
  const billingData = {
    base_fee: Math.max(0, parseInt(rawBillingData?.base_fee) || 1350),
    violation_count: Math.max(0, parseInt(rawBillingData?.violation_count) || 0),
    penalty_per_violation: Math.max(0, parseInt(rawBillingData?.penalty_per_violation) || 50),
    penalty_total: Math.max(0, parseInt(rawBillingData?.penalty_total) || 0),
    total_bill: Math.max(0, parseInt(rawBillingData?.total_bill) || 1350)
  }

  if (loading) {
    return (
      <div>
        <h1 className="page-title">💰 Billing Information</h1>
        <div className="loading">Loading billing data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="page-title">💰 Billing Information</h1>
        <div className="error">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">💰 Billing Information</h1>
      
      <div className="billing-stats">
        <div className="card stat-card total">
          <div className="stat-number">₹{billingData.base_fee}</div>
          <div className="stat-label">Base Monthly Fee</div>
        </div>
        
        <div className="card stat-card incorrect">
          <div className="stat-number">{billingData.violation_count}</div>
          <div className="stat-label">Total Violations</div>
        </div>
        
        <div className="card stat-card penalty">
          <div className="stat-number">₹{billingData.penalty_total}</div>
          <div className="stat-label">Total Penalties</div>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>📊 Monthly Bill Summary</h2>
        
        <div style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
          <p><strong>Total Bill: ₹{billingData.total_bill}</strong></p>
        </div>
        
        <button 
          onClick={() => setOpen(true)}
          style={{
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          View Monthly Bill
        </button>
      </div>
      
      {billingData.violation_count > 0 && (
        <div className="card" style={{ 
          marginTop: '1.5rem', 
          background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
          color: '#333'
        }}>
          <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>⚠️ Penalty Notice</h3>
          <p style={{ textAlign: 'center', fontSize: '1.1rem' }}>
            You have been charged ₹{billingData.penalty_total} for {billingData.violation_count} incorrect waste disposal{billingData.violation_count > 1 ? 's' : ''}.
            Please ensure proper waste segregation to avoid future penalties.
          </p>
        </div>
      )}

      {open && billingData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Monthly Bill Summary</h2>
            <div style={{ lineHeight: '1.8', fontSize: '1.1rem' }}>
              <p><strong>Base Fee:</strong> ₹{billingData.base_fee}</p>
              <p><strong>Violations:</strong> {billingData.violation_count}</p>
              <p><strong>Penalty per violation:</strong> ₹{billingData.penalty_per_violation}</p>
              <p><strong>Total Penalties:</strong> ₹{billingData.penalty_total}</p>
              <hr style={{ margin: '1rem 0' }} />
              <p style={{ fontSize: '1.3rem' }}><strong>Total Bill: ₹{billingData.total_bill}</strong></p>
            </div>
            <button 
              onClick={() => setOpen(false)}
              style={{
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer',
                marginTop: '1.5rem',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Billing