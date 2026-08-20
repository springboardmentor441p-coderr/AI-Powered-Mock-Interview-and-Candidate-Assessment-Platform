import { useEffect, useRef, useState } from 'react';

export default function NovaAvatar({
  textToSpeak = '',
  onSpeakingChange,
}) {
  const mountedRef = useRef(true);
  const lastSpokenTextRef = useRef('');
  const speakingCallbackRef = useRef(onSpeakingChange);
  const utteranceRef = useRef(null);
  const speechWatchdogRef = useRef(null);

  const [status, setStatus] = useState('ready');

  useEffect(() => {
    speakingCallbackRef.current = onSpeakingChange;
  }, [onSpeakingChange]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      window.speechSynthesis?.cancel();
      if (speechWatchdogRef.current) {
        window.clearTimeout(speechWatchdogRef.current);
        speechWatchdogRef.current = null;
      }
      utteranceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const text = textToSpeak?.trim();

    if (!text || lastSpokenTextRef.current === text) {
      return undefined;
    }

    lastSpokenTextRef.current = text;

    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance === 'undefined') {
      setStatus('ready');
      speakingCallbackRef.current?.(false);
      return undefined;
    }

    let cancelled = false;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.94;
    utteranceRef.current = utterance;

    const finishSpeaking = () => {
      if (cancelled || !mountedRef.current) return;

      utteranceRef.current = null;
      if (speechWatchdogRef.current) {
        window.clearTimeout(speechWatchdogRef.current);
        speechWatchdogRef.current = null;
      }
      setStatus('ready');
      speakingCallbackRef.current?.(false);
    };

    utterance.onstart = () => {
      if (cancelled || !mountedRef.current) return;

      setStatus('speaking');
      speakingCallbackRef.current?.(true);
    };

    utterance.onend = finishSpeaking;
    utterance.onerror = finishSpeaking;

    window.speechSynthesis.cancel();

    try {
      window.speechSynthesis.speak(utterance);

      const maxSpeechMs = Math.min(30000, Math.max(8000, text.length * 80));
      speechWatchdogRef.current = window.setTimeout(finishSpeaking, maxSpeechMs);
    } catch {
      finishSpeaking();
    }

    return () => {
      cancelled = true;
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null;
      }
      if (speechWatchdogRef.current) {
        window.clearTimeout(speechWatchdogRef.current);
        speechWatchdogRef.current = null;
      }
    };
  }, [textToSpeak]);

  return (
    <div className={`nova-avatar nova-avatar-${status}`} aria-label="Nova AI interviewer">
      <div className="nova-avatar-message">
        <div className="nova-presence">
          <div className="nova-orbital">
            <div className="nova-core">✦</div>
          </div>
        </div>
      </div>
    </div>
  );
}
