import api, { getApiErrorMessage } from './api.js';
import { endpoints } from './endpoints.js';
import { API_BASE_URL } from '../config.js';

const MIME_EXTENSION_MAP = {
  'audio/webm': '.webm',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
};

function resolveAudioExtension(blob) {
  const mime = blob?.type || '';
  return MIME_EXTENSION_MAP[mime] || '.webm';
}

export async function submitVoiceAnswer({ sessionId, audioBlob }) {
  const extension = resolveAudioExtension(audioBlob);
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('file', audioBlob, `candidate_answer${extension}`);

  const response = await api.post(endpoints.voice.interview, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}

export function createVoiceStreamSocket(sessionId) {
  const base = API_BASE_URL.replace(/^http/i, (scheme) =>
    scheme.toLowerCase() === 'https' ? 'wss' : 'ws'
  ).replace(/\/$/, '');
  return new WebSocket(`${base}/voice/stream/${encodeURIComponent(sessionId)}`);
}

/**
 * Resolve a playable audio URL from a voice response.
 */
export function resolveAudioUrl(response) {
  if (!response?.audio_url) return null;
  const url = response.audio_url;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

/**
 * Play AI question audio from a voice response.
 */
export function playAiAudio(response) {
  const url = resolveAudioUrl(response);
  if (!url) return null;

  const audio = new Audio(url);
  audio.play().catch(() => {
    // Autoplay may be blocked; user can still read the question text.
  });
  return audio;
}

export { getApiErrorMessage };
