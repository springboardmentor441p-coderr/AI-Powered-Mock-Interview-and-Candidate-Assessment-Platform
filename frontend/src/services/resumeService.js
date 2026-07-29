import api, { getApiErrorMessage } from './api.js';
import { endpoints } from './endpoints.js';
import { HEALTH_ENDPOINT } from '../config.js';

export async function parseResume(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(endpoints.resume.parse, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 240000,
  });

  return response.data;
}

export async function checkBackendHealth() {
  const response = await api.get(HEALTH_ENDPOINT);
  return response.data;
}

export { getApiErrorMessage };
