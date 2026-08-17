'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Vapi from '@vapi-ai/web';
import type { AssistantOverrides } from '@vapi-ai/web/dist/api';
import type { VoiceInterviewStartResponse, VoiceInterviewStatus, VoiceTranscriptItem } from '../lib/voiceInterview';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

function normaliseTranscript(message: unknown): VoiceTranscriptItem | null {
  if (!message || typeof message !== 'object') return null;
  const data = message as Record<string, unknown>;
  if (data.type !== 'transcript') return null;
  const role = data.role === 'assistant' ? 'assistant' : data.role === 'user' ? 'user' : null;
  const content = typeof data.transcript === 'string' ? data.transcript.trim() : '';
  if (!role || !content) return null;
  return { role, content, isFinal: data.transcriptType === 'final' };
}

export function useVapiInterview() {
  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<VoiceInterviewStatus>('idle');
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<VoiceTranscriptItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);

  useEffect(() => {
    if (!PUBLIC_KEY) {
      setError('Voice interviews are not configured. Ask an administrator to add NEXT_PUBLIC_VAPI_PUBLIC_KEY.');
      return;
    }
    const vapi = new Vapi(PUBLIC_KEY);
    vapiRef.current = vapi;
    vapi.on('call-start', () => setStatus('active'));
    vapi.on('call-end', () => { setIsAssistantSpeaking(false); setStatus('ended'); });
    vapi.on('speech-start', () => setIsAssistantSpeaking(true));
    vapi.on('speech-end', () => setIsAssistantSpeaking(false));
    vapi.on('message', (message) => {
      const item = normaliseTranscript(message);
      if (!item) return;
      setTranscript((items) => {
        const previous = items.at(-1);
        if (!item.isFinal && previous && previous.role === item.role && !previous.isFinal) return [...items.slice(0, -1), item];
        if (item.isFinal && previous && previous.role === item.role && previous.content === item.content) return [...items.slice(0, -1), item];
        return [...items, item];
      });
    });
    vapi.on('error', (event) => {
      const message = event instanceof Error ? event.message : 'The voice connection encountered an error.';
      setError(message);
      setStatus('error');
    });
    return () => { vapi.removeAllListeners(); void vapi.stop(); vapiRef.current = null; };
  }, []);

  const start = useCallback(async (session: VoiceInterviewStartResponse) => {
    const vapi = vapiRef.current;
    if (!vapi) throw new Error('Voice client is unavailable.');
    setError(null); setTranscript([]); setStatus('connecting');
    const overrides: AssistantOverrides = { variableValues: session.variableValues };
    const call = await vapi.start(session.assistantId, overrides, undefined, undefined, undefined, { roomDeleteOnUserLeaveEnabled: true });
    setCallId(call?.id ?? null);
  }, []);

  const end = useCallback(() => { setStatus('ending'); vapiRef.current?.end(); }, []);
  const toggleMute = useCallback(() => {
    const next = !isMuted;
    vapiRef.current?.setMuted(next);
    setIsMuted(next);
  }, [isMuted]);

  return { status, isAssistantSpeaking, isMuted, transcript, error, callId, start, end, toggleMute };
}
