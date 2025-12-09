import { useState, useEffect, useCallback } from 'react'
import apiClient from '../utils/apiClient'

// Custom hook for secure data fetching with rate limiting
export const useSecureData = (endpoint, options = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(0)
  
  const { 
    pollInterval = 0,
    minInterval = 1000, // Minimum 1 second between requests
    retryAttempts = 3,
    retryDelay = 1000
  } = options

  const fetchData = useCallback(async (attempt = 0) => {
    const now = Date.now()
    
    // Rate limiting - prevent too frequent requests
    if (now - lastFetch < minInterval) {
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get(endpoint)
      
      // Validate response data
      if (!response.data) {
        throw new Error('Invalid response data')
      }
      
      setData(response.data)
      setLastFetch(now)
      
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err.message)
      
      // Retry logic with exponential backoff
      if (attempt < retryAttempts && err.response?.status !== 403) {
        setTimeout(() => {
          fetchData(attempt + 1)
        }, retryDelay * Math.pow(2, attempt))
        return
      }
      
      setError(err.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [endpoint, lastFetch, minInterval, retryAttempts, retryDelay])

  useEffect(() => {
    fetchData()
    
    if (pollInterval > 0) {
      const interval = setInterval(fetchData, Math.max(pollInterval, minInterval))
      return () => clearInterval(interval)
    }
  }, [fetchData, pollInterval, minInterval])

  return { data, loading, error, refetch: fetchData }
}