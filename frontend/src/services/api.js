const BASE = 'http://localhost:8000';

function headers(formData = false) {
  const h = {};
  if (!formData) h['Content-Type'] = 'application/json';
  const token = localStorage.getItem('nexiq_token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('nexiq_token');
      localStorage.removeItem('nexiq_user');
      window.location.hash = 'auth';
    }
    let msg = `${res.status}`;
    try { const j = await res.json(); msg = j.detail || j.message || msg; } catch {}
    throw new Error(msg);
  }
  if (opts._blob) return res.blob();
  return res.json();
}

export const api = {
  // Auth
  login: (email, password) => {
    const fd = new URLSearchParams();
    fd.append('username', email);
    fd.append('password', password);
    return req('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: fd });
  },
  register: (data) => req('/auth/register', { method: 'POST', headers: headers(), body: JSON.stringify(data) }),
  me: () => req('/auth/me', { headers: headers() }),

  // Candidates
  uploadResume: (email, file) => {
    const fd = new FormData();
    fd.append('email', email);
    fd.append('file', file);
    return req('/candidates/upload', { method: 'POST', headers: headers(true), body: fd });
  },
  updateEducation: (data) => req('/candidates/update_education', { method: 'POST', headers: headers(), body: JSON.stringify(data) }),

  // Dashboard
  stats: () => req('/dashboard/stats', { headers: headers() }),
  progress: () => req('/dashboard/progress', { headers: headers() }),
  weakAreas: () => req('/dashboard/weak-areas', { headers: headers() }),
  chat: (message) => req('/dashboard/chat', { method: 'POST', headers: headers(), body: JSON.stringify({ message }) }),

  // Interview
  startSession: (data) => req('/interview/start', { method: 'POST', headers: headers(), body: JSON.stringify(data) }),
  getQuestions: (id) => req(`/interview/${id}/questions`, { headers: headers() }),
  submitAnswer: (id, payload) => req(`/interview/${id}/answer`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) }),
  logIntegrityEvent: (id, payload) => req(`/interview/${id}/integrity-events`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) }),
  acceptRules: (id) => req(`/interview/${id}/accept-rules`, { method: 'POST', headers: headers() }),
  endSession: (id) => req('/interview/end', { method: 'POST', headers: headers(), body: JSON.stringify({ session_id: id }) }),
  getReport: (id) => req(`/interview/${id}/report`, { headers: headers() }),
  downloadReport: async (id) => {
    const blob = await req(`/reports/${id}/download`, { headers: headers(), _blob: true });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  getHistory: () => req('/interview/history', { headers: headers() }),
  getScheduledSessions: () => req('/interview/candidate/scheduled', { headers: headers() }),
  followUp: (id, data) => req(`/interview/${id}/follow-up`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }),
  whisper: (id, blob) => {
    const fd = new FormData();
    fd.append('file', blob, 'audio.webm');
    return req(`/interview/${id}/whisper`, { method: 'POST', headers: headers(true), body: fd });
  },
  tts: (text) => req(`/interview/tts?text=${encodeURIComponent(text)}`, { headers: headers(), _blob: true }),
  generateAvatarClip: (data) => req('/interview/generate-avatar-clip', { method: 'POST', headers: headers(), body: JSON.stringify(data) }),

  // ── Admin endpoints ──
  getCandidates: (q) => req(`/candidates/all${q ? `?q=${encodeURIComponent(q)}` : ''}`, { headers: headers() }),
  mlStatus: () => req('/ml/status', { headers: headers() }),
  mlStats: () => req('/ml/stats', { headers: headers() }),
  mlTrain: () => req('/ml/train', { method: 'POST', headers: headers() }),
  mlExport: () => req('/ml/export-data', { headers: headers() }),
  getAdminIntegritySessions: () => req('/interview/admin/integrity-sessions', { headers: headers() }),
  getAdminIntegrityEvents: (sid) => req(`/interview/admin/integrity-events/${sid}`, { headers: headers() }),
};
