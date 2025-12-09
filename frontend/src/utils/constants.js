// Secure application constants

export const API_ENDPOINTS = {
  LIVE: '/live',
  LOGS: '/logs',
  BILLING: '/billing',
  HEALTH: '/health'
}

export const DEFAULT_TIMEOUTS = {
  API_REQUEST: 10000, // 10 seconds
  POLLING_INTERVAL: 2000, // 2 seconds
  RETRY_DELAY: 1000 // 1 second
}

export const SECURITY_SETTINGS = {
  MAX_RETRY_ATTEMPTS: 3,
  MIN_REQUEST_INTERVAL: 1000,
  SESSION_TIMEOUT: 3600000, // 1 hour
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
}

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your connection.',
  UNAUTHORIZED: 'Access denied. Please refresh the page.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_DATA: 'Invalid data received. Please refresh the page.',
  CAMERA_ERROR: 'Camera access failed. Please check permissions.',
  GENERIC_ERROR: 'An error occurred. Please try again.'
}

export const UI_CONSTANTS = {
  APP_NAME: 'Waste Detection System',
  VERSION: '1.0.0',
  THEME_COLORS: {
    PRIMARY: '#667eea',
    SECONDARY: '#764ba2',
    SUCCESS: '#2ed573',
    ERROR: '#ff4757',
    WARNING: '#ffa502'
  }
}