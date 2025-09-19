/**
 * Application configuration
 * Centralized configuration for API URLs and other environment variables
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      register: '/api/register',
      login: '/api/login',
      chat: '/api/webhook/chat',
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
  return `${config.api.baseUrl}${config.api.endpoints[endpoint]}`
}

/**
 * Helper function to get the base API URL
 */
export const getBaseApiUrl = (): string => {
  return config.api.baseUrl
}
