import { useState } from 'react'
import { useSecureData } from '../hooks/useSecureData'
import { sanitizeInput } from '../utils/security'

const LiveView = () => {
  const [imageError, setImageError] = useState(false)
  
  // Environment variables
  const BACKEND_URL = import.meta.env.VITE_API_URL
  const ML_URL = import.meta.env.VITE_ML_URL
  
  // Use secure data fetching with rate limiting
  const { data: liveData, loading, error } = useSecureData(`${BACKEND_URL}/live`, {
    pollInterval: 2000,
    minInterval: 1000,
    retryAttempts: 3
  })

  // Default data structure
  const safeData = {
    class: null,
    wet_dry: null,
    confidence: 0,
    is_violation: false,
    ...liveData
  }

  return (
    <div>
      <h1 className="page-title">📹 Live Camera Feed</h1>
      
      {error && <div className="error">{error}</div>}
      
      <div className="live-container">
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Camera Feed</h2>
          <img
            src={`${ML_URL}/video_feed`}
            alt="Camera Feed"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.target.src = "";
              console.warn('Camera feed failed to load from ML service')
            }}
          />
        </div>
        
        <div className="card status-card">
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Detection Status</h2>
          
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div>
              <div className="status-item">
                <span className="status-label">Waste Type:</span>
                <span className="status-value">
                  {safeData.class ? sanitizeInput(safeData.class.toUpperCase()) : 'None'}
                </span>
              </div>
              
              <div className="status-item">
                <span className="status-label">Wet/Dry:</span>
                <span className="status-value">
                  {safeData.wet_dry ? sanitizeInput(safeData.wet_dry.toUpperCase()) : 'None'}
                </span>
              </div>
              
              <div className="status-item">
                <span className="status-label">Confidence:</span>
                <span className="status-value">
                  {safeData.confidence && typeof safeData.confidence === 'number' 
                    ? `${Math.min(Math.max(safeData.confidence * 100, 0), 100).toFixed(1)}%` 
                    : '0%'}
                </span>
              </div>
              
              <div className="status-item">
                <span className="status-label">Violation:</span>
                <span className={`violation-badge ${safeData.is_violation ? 'violation-true' : 'violation-false'}`}>
                  {safeData.is_violation ? '🚨 VIOLATION' : '✅ OK'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LiveView