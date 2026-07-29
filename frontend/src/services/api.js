import axios from 'axios';
import { API_BASE_URL } from '../config.js';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

/**
 * Extract a user-friendly error message from an Axios error.
 */
export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;

  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. The server may be busy — please try again.';
  }

  if (!error.response) {
    return 'Unable to reach the backend. Ensure the FastAPI server is running.';
  }

  const { status, data } = error.response;
  const detail = data?.detail;

  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join('; ');
  }

  if (status === 404) return 'Session not found or expired. Please start a new interview.';
  if (status === 409) return 'This interview has already been completed.';
  if (status === 413) return 'File is too large. Please upload a smaller file.';
  if (status === 415) return 'Unsupported file format.';
  if (status === 502) return 'AI service temporarily unavailable. Please try again.';
  if (status === 503) return 'Voice service is not configured. Use text mode or check backend settings.';

  return fallback;
}

export default api;
