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

const preparedSpeech = new Map();

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
export async function playAiAudio(response) {
  const url = resolveAudioUrl(response);
  if (!url) return;

  const audio = new Audio(url);
  await new Promise((resolve) => {
    audio.addEventListener('ended', resolve, { once: true });
    audio.addEventListener('error', resolve, { once: true });
    audio.play().catch(() => {
      // Autoplay may be blocked; user can still read the question text.
      resolve();
    });
  });
}

function speakWithBrowserVoice(text) {
  if (!text || !('speechSynthesis' in window)) return Promise.resolve();

  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.addEventListener('end', resolve, { once: true });
    utterance.addEventListener('error', resolve, { once: true });
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Begin TTS generation early and share the same promise with later playback.
 */
export function prepareAiText(text) {
  const cleanText = text?.trim();
  if (!cleanText) return Promise.resolve(null);
  if (preparedSpeech.has(cleanText)) return preparedSpeech.get(cleanText);

  const preparation = (async () => {
    const formData = new FormData();
    formData.append('text', cleanText);
    const response = await api.post(endpoints.voice.testTts, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  })().catch((error) => {
    preparedSpeech.delete(cleanText);
    throw error;
  });

  preparedSpeech.set(cleanText, preparation);
  return preparation;
}

/**
 * Synthesize and play interviewer text that does not already have an audio URL.
 * The browser voice is a fallback when Deepgram or media autoplay is unavailable.
 */
export async function playAiText(text) {
  if (!text) return;

  try {
    const audioUrl = await prepareAiText(text);
    const audio = new Audio(audioUrl);

    const cleanup = () => {
      URL.revokeObjectURL(audioUrl);
      preparedSpeech.delete(text.trim());
    };
    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });

    try {
      await audio.play();
      await new Promise((resolve) => {
        audio.addEventListener('ended', resolve, { once: true });
        audio.addEventListener('error', resolve, { once: true });
      });
    } catch {
      cleanup();
      await speakWithBrowserVoice(text);
    }
  } catch {
    await speakWithBrowserVoice(text);
  }
}

export { getApiErrorMessage };
