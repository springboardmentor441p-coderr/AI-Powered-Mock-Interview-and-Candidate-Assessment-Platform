/**
 * Application configuration.
 * Override VITE_API_BASE_URL in .env for deployment.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const HEALTH_ENDPOINT = '/health';
