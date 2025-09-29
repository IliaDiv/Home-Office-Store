/**
 * Application configuration
 * Centralized configuration for API URLs and other environment variables
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000/api',
    endpoints: {
      health: '/health',
      test: '/test',
      register: '/register',
      login: '/login',
      chat: '/webhook/chat',
    }
  },
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const

/**
 * Helper function to get full API URL for an endpoint
 */
export const getApiUrl = (endpoint: keyof typeof config.api.endpoints): string => {
  const base = getBaseApiUrl().replace(/\/+$/, '')
  return `${base}${config.api.endpoints[endpoint]}`
}

/**
 * Helper function to get the base API URL
 */
export const getBaseApiUrl = (): string => {
  let base = config.api.baseUrl
  // Ensure base URL ends with /api for backend routes
  if (!base.endsWith('/api')) {
    base = base.replace(/\/+$/, '') + '/api'
  }
  return base
}
