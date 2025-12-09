import { useSecureData } from '../hooks/useSecureData'
import { sanitizeInput } from '../utils/security'

const Billing = () => {
  // Environment variables
  const BACKEND_URL = import.meta.env.VITE_API_URL
  
  // Use secure data fetching
  const { data: rawBillingData, loading, error } = useSecureData(`${BACKEND_URL}/billing`, {
    pollInterval: 30000,
    minInterval: 5000,
    retryAttempts: 2
  })

  // Sanitize and validate billing data
  const billingData = {
    total_items: Math.max(0, parseInt(rawBillingData?.total_items) || 0),
    incorrect_items: Math.max(0, parseInt(rawBillingData?.incorrect_items) || 0),
    total_penalty: Math.max(0, parseFloat(rawBillingData?.total_penalty) || 0),
    currency: sanitizeInput(rawBillingData?.currency || 'INR')
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

  const accuracyRate = billingData.total_items > 0 
    ? ((billingData.total_items - billingData.incorrect_items) / billingData.total_items * 100).toFixed(1)
    : 100

  return (
    <div>
      <h1 className="page-title">💰 Billing Information</h1>
      
      <div className="billing-stats">
        <div className="card stat-card total">
          <div className="stat-number">{billingData.total_items}</div>
          <div className="stat-label">Total Items Detected</div>
        </div>
        
        <div className="card stat-card incorrect">
          <div className="stat-number">{billingData.incorrect_items}</div>
          <div className="stat-label">Incorrect Disposals</div>
        </div>
        
        <div className="card stat-card penalty">
          <div className="stat-number">₹{billingData.total_penalty}</div>
          <div className="stat-label">Total Penalty ({billingData.currency})</div>
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>📈 Summary</h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '2rem',
          textAlign: 'center'
        }}>
          <div>
            <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Accuracy Rate</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2ed573' }}>
              {accuracyRate}%
            </p>
          </div>
          
          <div>
            <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Penalty per Violation</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              ₹10 {billingData.currency}
            </p>
          </div>
          
          <div>
            <h3 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Status</h3>
            <p style={{ 
              fontSize: '1.2rem', 
              fontWeight: 'bold',
              color: billingData.incorrect_items > 0 ? '#ff4757' : '#2ed573'
            }}>
              {billingData.incorrect_items > 0 ? '⚠️ Penalties Applied' : '✅ No Penalties'}
            </p>
          </div>
        </div>
      </div>
      
      {billingData.incorrect_items > 0 && (
        <div className="card" style={{ 
          marginTop: '1.5rem', 
          background: 'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
          color: '#333'
        }}>
          <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>⚠️ Penalty Notice</h3>
          <p style={{ textAlign: 'center', fontSize: '1.1rem' }}>
            You have been charged ₹{billingData.total_penalty} for {billingData.incorrect_items} incorrect waste disposal{billingData.incorrect_items > 1 ? 's' : ''}.
            Please ensure proper waste segregation to avoid future penalties.
          </p>
        </div>
      )}
    </div>
  )
}

export default Billing