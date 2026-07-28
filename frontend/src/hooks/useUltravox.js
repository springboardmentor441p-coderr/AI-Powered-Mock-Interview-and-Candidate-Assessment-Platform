/**
 * useUltravox — Real-time voice conversation hook for SmartHire AI Interview.
 *
 * Flow:
 *   1. Call initSession(questions, candidateName, role) to create an Ultravox call via backend.
 *   2. The backend returns a joinUrl; this hook joins via WebRTC using the ultravox-client SDK.
 *   3. Live agent/candidate transcripts are emitted via onTranscriptUpdate(transcript[]).
 *   4. Call endSession() to cleanly disconnect.
 */

import { useRef, useState, useCallback } from 'react';

export const useUltravox = ({ onTranscriptUpdate, onStatusChange, onCallEnded } = {}) => {
  const sessionRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | connecting | connected | ended | error
  const [transcripts, setTranscripts] = useState([]);
  const [error, setError] = useState(null);

  const updateStatus = useCallback((s) => {
    setStatus(s);
    if (onStatusChange) onStatusChange(s);
  }, [onStatusChange]);

  /**
   * Initialises an Ultravox session.
   * @param {Array}  questions       - Array of question objects with question_text
   * @param {string} candidateName   - Candidate's name for personalised greeting
   * @param {string} role            - Target role (e.g. "Software Engineer")
   * @param {string} experienceLevel - e.g. "Mid-Level"
   */
  const initSession = useCallback(async (questions = [], candidateName = 'the candidate', role = 'Software Engineer', experienceLevel = 'Mid-Level') => {
    try {
      updateStatus('connecting');
      setError(null);

      // 1. Ask backend to create the Ultravox call and get joinUrl
      const res = await fetch('http://localhost:8000/api/v1/interview/create-ultravox-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          candidate_name: candidateName,
          role,
          experience_level: experienceLevel
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create Ultravox call');
      }

      const { joinUrl } = await res.json();
      if (!joinUrl) throw new Error('No joinUrl returned from backend');

      // 2. Dynamically import ultravox-client (avoids SSR issues)
      const { UltravoxSession } = await import('ultravox-client');

      const uvSession = new UltravoxSession();
      sessionRef.current = uvSession;

      // 3. Listen for transcript updates
      uvSession.addEventListener('transcripts', () => {
        const latest = uvSession.transcripts || [];
        setTranscripts([...latest]);
        if (onTranscriptUpdate) onTranscriptUpdate([...latest]);
      });

      // 4. Listen for status changes
      uvSession.addEventListener('status', () => {
        const uvStatus = uvSession.status;
        console.log('[Ultravox] Status:', uvStatus);

        if (uvStatus === 'idle' || uvStatus === 'listening' || uvStatus === 'thinking' || uvStatus === 'speaking') {
          updateStatus('connected');
        } else if (uvStatus === 'disconnected' || uvStatus === 'disconnecting') {
          updateStatus('ended');
          if (onCallEnded) onCallEnded(uvSession.transcripts || []);
        }
      });

      // 5. Join the WebRTC call
      uvSession.joinCall(joinUrl);
      updateStatus('connected');

    } catch (err) {
      console.error('[Ultravox] Init error:', err);
      setError(err.message);
      updateStatus('error');
    }
  }, [updateStatus, onTranscriptUpdate, onCallEnded]);

  /**
   * Gracefully disconnects the Ultravox session.
   */
  const endSession = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.leaveCall();
      } catch (e) {
        console.warn('[Ultravox] leaveCall error:', e);
      }
      sessionRef.current = null;
    }
    updateStatus('ended');
  }, [updateStatus]);

  /**
   * Returns the current agent speaking status from Ultravox.
   */
  const isAgentSpeaking = useCallback(() => {
    if (!sessionRef.current) return false;
    return sessionRef.current.status === 'speaking';
  }, []);

  return {
    status,       // 'idle' | 'connecting' | 'connected' | 'ended' | 'error'
    transcripts,  // Array of { speaker: 'agent'|'user', text: string, isFinal: boolean }
    error,
    initSession,
    endSession,
    isAgentSpeaking
  };
};
