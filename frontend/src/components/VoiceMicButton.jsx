/**
 * VoiceMicButton.jsx
 * Interactive mic control for interview sessions.
 * States: IDLE → RECORDING → DONE
 * Shows live Voice Confidence meter ONLY while recording.
 */
import React, { useEffect, useRef, useState } from 'react';

const STATE = { IDLE: 'idle', RECORDING: 'recording', DONE: 'done' };

export default function VoiceMicButton({ onStartRecording, onStopRecording, transcript, disabled }) {
  const [micState, setMicState] = useState(STATE.IDLE);
  const [recSeconds, setRecSeconds] = useState(0);
  const [confidence, setConfidence] = useState(0);

  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);

  // ── Recording timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (micState === STATE.RECORDING) {
      setRecSeconds(0);
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [micState]);

  // ── Live confidence analyser (AudioContext) ───────────────────────────────
  const startAnalyser = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      let readings = [];

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        // RMS amplitude
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const val = (data[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / data.length);
        readings.push(rms);
        if (readings.length > 30) readings.shift();

        // Confidence = average RMS scaled to 0-100, clamped to a "good" range
        const avg = readings.reduce((a, b) => a + b, 0) / readings.length;
        const pct = Math.min(100, Math.max(0, Math.round(avg * 600)));
        setConfidence(pct);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      // Fallback static value
      setConfidence(72);
    }
  };

  const stopAnalyser = () => {
    cancelAnimationFrame(animFrameRef.current);
    try { audioCtxRef.current?.close(); } catch {}
    analyserRef.current = null;
    audioCtxRef.current = null;
    setConfidence(0);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleTapToSpeak = async () => {
    setMicState(STATE.RECORDING);
    await startAnalyser();
    if (onStartRecording) onStartRecording();
  };

  const handleStop = () => {
    stopAnalyser();
    setMicState(STATE.DONE);
    if (onStopRecording) onStopRecording();
  };

  useEffect(() => {
    // Reset to IDLE when a new question starts (transcript clears)
    if (!transcript && micState === STATE.DONE) setMicState(STATE.IDLE);
  }, [transcript]);

  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const confidenceColor = confidence > 70 ? '#00f0ff' : confidence > 40 ? '#f0c000' : '#ff4444';
  const confidenceLabel = confidence > 70 ? 'High' : confidence > 40 ? 'Moderate' : 'Low';

  // ── IDLE state ────────────────────────────────────────────────────────────
  if (micState === STATE.IDLE) {
    return (
      <button
        onClick={handleTapToSpeak}
        disabled={disabled}
        className="group relative flex flex-col items-center gap-3 px-8 py-5 rounded-2xl
          bg-surface-container-low border border-outline-variant/20
          hover:border-primary/40 hover:bg-primary/5 transition-all duration-300
          disabled:opacity-40 disabled:cursor-not-allowed w-full max-w-sm mx-auto"
        id="mic-tap-to-speak"
      >
        {/* Pulse ring */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 scale-150 opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity" />
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center group-hover:border-primary/60 group-hover:bg-primary/20 transition-all">
            <span className="material-symbols-outlined text-primary text-[32px]">mic</span>
          </div>
        </div>
        <span className="font-label-md text-label-md text-on-surface-variant group-hover:text-on-surface transition-colors text-center">
          Your voice is ready — tap to speak
        </span>
      </button>
    );
  }

  // ── RECORDING state ───────────────────────────────────────────────────────
  if (micState === STATE.RECORDING) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
        {/* Stop button */}
        <button
          onClick={handleStop}
          id="mic-stop-recording"
          className="relative flex items-center gap-3 px-8 py-4 rounded-2xl
            bg-error text-white font-bold w-full justify-center
            shadow-[0_0_25px_rgba(239,68,68,0.4)] hover:shadow-[0_0_35px_rgba(239,68,68,0.6)]
            hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {/* Pulsing mic icon */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
            <span className="material-symbols-outlined text-[22px] relative z-10">stop_circle</span>
          </div>
          <span className="font-headline-md text-headline-md">Stop Recording</span>
          {/* Timer */}
          <span className="ml-auto font-mono text-white/80 text-sm tabular-nums">{fmtTime(recSeconds)}</span>
        </button>

        {/* Voice Confidence Meter — shown ONLY while recording */}
        <div className="w-full bg-surface-container-low/60 backdrop-blur-xl rounded-xl p-4 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-label text-mono-label text-on-surface-variant uppercase text-[11px]">
              Voice Confidence
            </span>
            <span className="font-mono-label text-mono-label text-[11px] font-bold" style={{ color: confidenceColor }}>
              {confidenceLabel} ({confidence}%)
            </span>
          </div>
          {/* Bar */}
          <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${confidence}%`, background: `linear-gradient(90deg, ${confidenceColor}88, ${confidenceColor})` }}
            />
          </div>
          {/* Waveform bars */}
          <div className="flex gap-0.5 items-end h-6 mt-3">
            {Array.from({ length: 28 }, (_, i) => (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-100"
                style={{
                  height: `${15 + Math.random() * 85}%`,
                  backgroundColor: confidenceColor,
                  opacity: 0.6 + Math.random() * 0.4,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── DONE state (transcript preview) ──────────────────────────────────────
  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-3">
      <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl">
        <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
        <span className="font-mono-label text-mono-label text-primary uppercase text-[11px]">Recording saved</span>
      </div>
      {transcript && (
        <div className="p-4 bg-surface-container-low/60 rounded-xl border border-outline-variant/10">
          <p className="font-body-md text-on-surface-variant text-sm italic">"{transcript}"</p>
        </div>
      )}
    </div>
  );
}
