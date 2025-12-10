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
              <div className="log-left">
                <div>{formatTimestamp(log.timestamp)}</div>
                {log.snapshot_path ? (
                  <img
                    src={log.snapshot_path}
                    alt="Violation snapshot"
                    style={{
                      width: "140px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                ) : (
                  <span>No snapshot</span>
                )}
              </div>
              <div className="log-right">
                <p>Type: {log.class}</p>
                <p>Wet/Dry: {log.wet_dry}</p>
                <p>Confidence: {(log.confidence * 100).toFixed(1)}%</p>
                <p>{log.is_violation ? "Violation" : "OK"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Logs