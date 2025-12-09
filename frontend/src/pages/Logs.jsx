import { useState } from 'react'
import { useSecureData } from '../hooks/useSecureData'
import { getSecureImageUrl, sanitizeInput } from '../utils/security'

const Logs = () => {
  const [imageErrors, setImageErrors] = useState(new Set())
  
  // Environment variables
  const BACKEND_URL = import.meta.env.VITE_API_URL

  // Use secure data fetching
  const { data: logs = [], loading, error } = useSecureData(`${BACKEND_URL}/logs`, {
    pollInterval: 10000,
    minInterval: 2000,
    retryAttempts: 2
  })

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return date.toLocaleString()
    } catch (error) {
      return 'Invalid date'
    }
  }

  const handleImageError = (logId) => {
    setImageErrors(prev => new Set([...prev, logId]))
  }

  const getSecureSnapshotUrl = (url) => {
    if (!url) return null
    return getSecureImageUrl(url)
  }

  if (loading) {
    return (
      <div>
        <h1 className="page-title">📊 Detection Logs</h1>
        <div className="loading">Loading logs...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="page-title">📊 Detection Logs</h1>
        <div className="error">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">📊 Detection Logs</h1>
      
      {logs.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666', fontSize: '1.1rem' }}>
            No detection logs available yet. Start the camera to see detection results.
          </p>
        </div>
      ) : (
        <div className="logs-grid">
          {logs.map((log) => (
            <div key={log.id} className="card log-item">
              <div className="log-timestamp">
                {formatTimestamp(log.timestamp)}
              </div>
              
              {log.snapshot_url && !imageErrors.has(log.id) && getSecureSnapshotUrl(log.snapshot_url) ? (
                <img 
                  src={getSecureSnapshotUrl(log.snapshot_url)} 
                  alt="Detection snapshot"
                  className="log-image"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    handleImageError(log.id)
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAzMEgzMFoiIHN0cm9rZT0iIzlBQUNENCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+'
                  }}
                />
              ) : (
                <div className="log-image" style={{ 
                  backgroundColor: '#f0f0f0', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  color: '#666'
                }}>
                  🔒 No Image
                </div>
              )}
              
              <div className="log-class">
                {log.class ? sanitizeInput(log.class.toUpperCase()) : 'Unknown'}
              </div>
              
              <div>
                <strong>Wet/Dry:</strong> {log.wet_dry ? sanitizeInput(log.wet_dry.toUpperCase()) : 'Unknown'}
              </div>
              
              <div className="log-confidence">
                <strong>Confidence:</strong> {log.confidence && typeof log.confidence === 'number' 
                  ? `${Math.min(Math.max(log.confidence * 100, 0), 100).toFixed(1)}%` 
                  : '0%'}
              </div>
              
              <div className={`violation-badge ${log.is_violation ? 'violation-true' : 'violation-false'}`}>
                {log.is_violation ? '🚨 Violation' : '✅ OK'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Logs