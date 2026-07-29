import api, { getApiErrorMessage } from './api.js';
import { endpoints } from './endpoints.js';

export async function endInterview({ sessionId }) {
  const response = await api.post(endpoints.interview.end, {
    session_id: sessionId,
  });

  return response.data;
}

export { getApiErrorMessage };
