const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('smarthire_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = 'Request failed';
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch (e) {}
    throw new Error(detail);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  recomputeAts: (resumeId) => request(`/resumes/${resumeId}/ats-score`, { method: 'POST' }),

  uploadResume: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/resumes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },
  listResumes: () => request('/resumes/'),

  startInterview: (payload) => request('/interviews/', { method: 'POST', body: payload }),
  listInterviews: () => request('/interviews/'),
  getInterview: (id) => request(`/interviews/${id}`),
  nextQuestion: (id) => request(`/interviews/${id}/next-question`, { method: 'POST' }),
  submitAnswer: (payload) => request('/interviews/answer', { method: 'POST', body: payload }),
  completeInterview: (id) => request(`/interviews/${id}/complete`, { method: 'POST' }),

  dashboardSummary: () => request('/dashboard/summary'),
  recruiterCandidates: () => request('/dashboard/recruiter/candidates'),

  listNotifications: () => request('/notifications/'),
  unreadCount: () => request('/notifications/unread-count'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => request('/notifications/mark-all-read', { method: 'POST' }),

  downloadReport: async (interviewId) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/interviews/${interviewId}/report`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Could not generate report');
    return res.text();
  },
};

export function saveSession(token, user) {
  localStorage.setItem('smarthire_token', token);
  localStorage.setItem('smarthire_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('smarthire_token');
  localStorage.removeItem('smarthire_user');
}

export function getSessionUser() {
  const raw = localStorage.getItem('smarthire_user');
  return raw ? JSON.parse(raw) : null;
}

export { getToken };
