import axios from 'axios'

// Secure API client configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// Request interceptor for security headers
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching sensitive data
    config.params = {
      ...config.params,
      _t: Date.now()
    }
    
    // Add CSRF token if available (for future implementation)
    const csrfToken = sessionStorage.getItem('csrf-token')
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Log security-related errors
    if (error.response?.status === 403) {
      console.warn('Access forbidden - potential security issue')
    }
    
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded - too many requests')
    }
    
    // Don't expose detailed error messages in production
    if (import.meta.env.PROD) {
      const sanitizedError = new Error('An error occurred while processing your request')
      sanitizedError.status = error.response?.status
      return Promise.reject(sanitizedError)
    }
    
    return Promise.reject(error)
  }
)

export default apiClient