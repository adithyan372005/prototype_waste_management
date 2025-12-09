// Security utility functions

// XSS Protection - Sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Validate URL to prevent open redirect attacks
export const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url)
    // Only allow http/https protocols
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

// Check if URL is from allowed origins
export const isAllowedOrigin = (url) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:4000',
    'http://localhost:5001',
    // Add production URLs here
  ]
  
  try {
    const urlObj = new URL(url)
    return allowedOrigins.includes(urlObj.origin)
  } catch {
    return false
  }
}

// Generate secure image URL with validation
export const getSecureImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null
  }
  
  // If it's a relative URL, make it absolute with our backend
  if (imageUrl.startsWith('/')) {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${imageUrl}`
  }
  
  // Validate external URLs
  if (isValidUrl(imageUrl) && isAllowedOrigin(imageUrl)) {
    return imageUrl
  }
  
  return null
}

// Session security helpers
export const generateSessionId = () => {
  return crypto.getRandomValues(new Uint8Array(16))
    .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')
}

export const setSecureSessionData = (key, value) => {
  try {
    const data = {
      value,
      timestamp: Date.now(),
      sessionId: generateSessionId()
    }
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to set session data:', error.message)
  }
}

export const getSecureSessionData = (key, maxAge = 3600000) => { // 1 hour default
  try {
    const stored = sessionStorage.getItem(key)
    if (!stored) return null
    
    const data = JSON.parse(stored)
    
    // Check if data is expired
    if (Date.now() - data.timestamp > maxAge) {
      sessionStorage.removeItem(key)
      return null
    }
    
    return data.value
  } catch (error) {
    console.warn('Failed to get session data:', error.message)
    return null
  }
}

// Content Security Policy helpers
export const setSecurityHeaders = () => {
  // Set security-related meta tags
  const meta = document.createElement('meta')
  meta.setAttribute('http-equiv', 'Content-Security-Policy')
  meta.setAttribute('content', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: http://localhost:*; " +
    "connect-src 'self' http://localhost:*; " +
    "media-src 'self' blob:; " +
    "frame-src 'none'; " +
    "object-src 'none';"
  )
  document.head.appendChild(meta)
}