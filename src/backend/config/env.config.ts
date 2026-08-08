/**
 * Backend Environment Configuration & Service Placeholders
 * Note: MongoDB, JWT_SECRET, and external AI services are declared here
 * but intentionally not required yet per project initial design.
 */

export const envConfig = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration Placeholders
  mongoDb: {
    uri: process.env.MONGODB_URI || null,
    isConnected: false, // Set to true when MongoDB driver is initialized in next step
  },

  // Security & Authentication Placeholders
  auth: {
    jwtSecret: process.env.JWT_SECRET || null,
    tokenExpiresIn: '7d',
  },

  // AI Service Configuration
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || null,
  }
};
