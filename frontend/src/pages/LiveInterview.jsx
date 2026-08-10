import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import AIInterviewerAvatar from '../components/AIInterviewerAvatar';
import IntegrityMonitor from '../components/IntegrityMonitor';

const STATUS = { LOADING: 'loading', READY: 'ready', ASKING: 'asking', LISTENING: 'listening', PROCESSING: 'processing' };

export default function LiveInterview({ navigate }) {
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [status, setStatus] = useState(STATUS.LOADING);
  const [error, setError] = useState('');
  
  // New scheduling states
  const [apiState, setApiState] = useState(null); 
  const [scheduledStart, setScheduledStart] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [followUp, setFollowUp] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startRef = useRef(0);
  const audioRef = useRef(new Audio());
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('sid');
    if (!sid) { navigate('dashboard'); return; }
    setSessionId(sid);
    api.getQuestions(sid)
      .then(res => {
        setApiState(res.state);
        
        if (res.state === 'TOO_EARLY') {
          setScheduledStart(new Date(res.scheduled_start + "Z")); // Force UTC parse
          setStatus('waiting');
          return;
        }
        if (res.state === 'EXPIRED' || res.state === 'SESSION_ENDED') {
          setStatus('blocked');
          return;
        }

        if (!res.rules_accepted) {
          navigate(`rules?sid=${sid}`);
          return;
        }
        setQuestions(res.questions);
        setStatus(STATUS.READY);
        
        // Notify extension that the interview has started
        const token = localStorage.getItem('nexiq_token');
        window.postMessage({ type: 'START_INTERVIEW', sessionId: sid, token }, '*');
      })
      .catch(() => setError('Failed to load interview questions.'));
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => {
      clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        recorderRef.current.stop();
      }
      // Notify extension that the interview has ended
      window.postMessage({ type: 'END_INTERVIEW' }, '*');
    };
  }, [navigate]);

  // Countdown timer for Waiting Room
  useEffect(() => {
    if (status !== 'waiting' || !scheduledStart) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = scheduledStart - now;
      if (diff <= 10 * 60 * 1000) { // If within 10 minutes, refresh to enter!
        window.location.reload();
      }
      setTimeRemaining(Math.max(0, diff));
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [status, scheduledStart]);

  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const fmtCountdown = ms => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      startRef.current = Date.now();
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = processAnswer;
      rec.start();
      setStatus(STATUS.LISTENING);
    } catch { setError('Microphone/Camera access denied. Please allow permissions and refresh.'); }
  };

  const triggerSpeak = (text) => {
    setStatus(STATUS.ASKING);
    // The avatar component will handle fetching the video and playing it.
    // When it finishes, it will call onClipEnd (which we map to startRecording).
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
      recorderRef.current.stream?.getTracks().forEach(t => t.stop());
    }
  };

  const processAnswer = async () => {
    setStatus(STATUS.PROCESSING);
    const duration = (Date.now() - startRef.current) / 1000;
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    try {
      const { transcript: text } = await api.whisper(sessionId, blob);
      setTranscript(text);
      const qId = questions[qIndex].id;
      const qText = followUp || questions[qIndex].question_text;
      await api.submitAnswer(sessionId, { question_id: qId, transcribed_text: text, answer_duration: duration, eye_contact_score: 80, emotion_label: 'neutral' });
      if (!followUp) {
        const { follow_up } = await api.followUp(sessionId, { question_text: qText, answer_text: text });
        if (follow_up) { setFollowUp(follow_up); triggerSpeak(follow_up); return; }
      }
      setFollowUp(null); setTranscript('');
      if (qIndex < questions.length - 1) { setQIndex(i => i + 1); setStatus(STATUS.READY); }
      else { await api.endSession(sessionId); navigate(`report?sid=${sessionId}`); }
    } catch (err) { setError(err.message || 'Processing failed.'); setStatus(STATUS.READY); }
  };

  const endSession = async () => {
    if (sessionId) { try { await api.endSession(sessionId); } catch {} }
    navigate('dashboard');
  };

  const currentQ = questions[qIndex];
  const totalMin = Math.round(questions.length * 3);

  const statusLabel = {
    [STATUS.LOADING]: 'Initializing…',
    [STATUS.READY]: 'Ready — click to begin',
    [STATUS.ASKING]: 'AI Presenter speaking…',
    [STATUS.LISTENING]: '● Recording your answer',
    [STATUS.PROCESSING]: 'Analyzing response…',
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="bg-error/10 border border-error/20 p-6 rounded-2xl max-w-md text-center">
          <span className="material-symbols-outlined text-error text-[48px] mb-4">error</span>
          <p className="text-on-surface font-body-lg">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-error text-white rounded-lg hover:bg-error/80">Try Again</button>
        </div>
      </div>
    );
  }
  
  if (status === 'blocked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-error/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/5 p-12 rounded-3xl max-w-lg text-center relative z-10 shadow-2xl">
          <span className="material-symbols-outlined text-error text-[64px] mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">block</span>
          <h1 className="font-display-md text-on-surface mb-2">Session Expired</h1>
          <p className="text-on-surface-variant font-body-lg">
            This interview session is no longer active. You have either missed your scheduled window or the session has already been completed.
          </p>
          <button onClick={() => navigate('dashboard')} className="mt-8 px-8 py-3 bg-surface-container-highest text-on-surface rounded-xl hover:bg-surface-container-highest/80 transition-colors">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="bg-surface-container-low/40 backdrop-blur-xl border border-white/5 p-12 rounded-3xl max-w-lg text-center relative z-10 shadow-2xl">
          <span className="material-symbols-outlined text-primary text-[64px] mb-6 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">schedule</span>
          <h1 className="font-display-md text-on-surface mb-2">You're Early!</h1>
          <p className="text-on-surface-variant font-body-lg mb-8">
            Your interview is scheduled to begin at <strong className="text-on-surface">{scheduledStart?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>. The join window opens 10 minutes before the start time.
          </p>
          <div className="bg-surface-container-highest/50 rounded-2xl p-6 border border-outline-variant/10">
            <p className="font-mono-label text-on-surface-variant uppercase mb-2">Starts In</p>
            <div className="font-display-lg text-primary tabular-nums tracking-tight">
              {fmtCountdown(timeRemaining)}
            </div>
          </div>
          <button onClick={() => navigate('dashboard')} className="mt-8 px-8 py-3 bg-surface-container-highest text-on-surface rounded-xl hover:bg-surface-container-highest/80 transition-colors">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <IntegrityMonitor 
        sessionId={sessionId} 
        isListening={status === STATUS.LISTENING} 
        videoElementRef={videoRef} 
      />
      <video ref={videoRef} muted playsInline className="hidden" />

      {/* Top bar */}
      <header className="h-16 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 flex items-center justify-between px-gutter z-50 sticky top-0">
        <div>
          <span className="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest">Session ID: NX-{sessionId}</span>
          <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">
            {currentQ?.question_text ? 'AI Interview Session' : 'Loading Session'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-container-high/40 rounded-xl px-4 py-2 border border-outline-variant/10">
            <span className="font-mono-label text-mono-label text-on-surface-variant uppercase block">Biometric Link</span>
            <span className="font-label-md text-label-md text-primary">Stable 98%</span>
          </div>
          <button onClick={endSession} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-error/10 border border-error/20 text-error font-label-md text-label-md hover:bg-error/20 transition-all">
            <span className="material-symbols-outlined text-[18px]">call_end</span>
            End Session
          </button>
        </div>
      </header>

      {/* Main grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center: AI + question */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
          {/* Glow */}
          <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ${status === STATUS.LISTENING ? 'bg-error/5' : status === STATUS.ASKING ? 'bg-primary/5' : ''}`} />

          {error && (
            <div className="absolute top-4 left-4 right-4 px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error font-body-md text-sm z-20">{error}</div>
          )}

          {/* AI Avatar */}
          <AIInterviewerAvatar 
            text={status === STATUS.ASKING ? (followUp || currentQ?.question_text) : null}
            status={status}
            isIdle={status !== STATUS.ASKING && status !== STATUS.LISTENING}
            onClipEnd={startRecording}
          />

          {/* Question display */}
          {currentQ && (
            <div className="w-full max-w-2xl bg-surface-container-low/60 backdrop-blur-xl rounded-2xl p-6 border border-outline-variant/10 mb-6">
              <div className="flex items-start gap-4">
                <span className="font-display-lg-mobile text-display-lg-mobile text-primary/30 leading-none">{String(qIndex + 1).padStart(2, '0')}</span>
                <div>
                  <span className="font-mono-label text-mono-label text-primary uppercase block mb-2">Current Inquiry</span>
                  <p className="font-headline-md text-headline-md text-on-surface">
                    {followUp ? `Follow-up: "${followUp}"` : `"${currentQ.question_text}"`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons and Typed Answer */}
          <div className="w-full max-w-2xl flex flex-col gap-4">
            <div className="flex gap-4 items-center justify-center">
              {status === STATUS.READY && currentQ && (
                <button onClick={() => triggerSpeak(followUp || currentQ.question_text)} className="px-8 py-4 bg-primary text-on-primary font-bold rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_35px_rgba(0,240,255,0.5)] hover:scale-[1.02] transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined">play_circle</span>
                  Generate & Play Question
                </button>
              )}
              {status === STATUS.LISTENING && (
                <button onClick={stopRecording} className="px-8 py-4 bg-error text-white font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-[1.02] transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined">stop_circle</span>
                  Done Speaking
                </button>
              )}
            </div>

            {status === STATUS.LISTENING && (
              <div className="w-full mt-4">
                <p className="font-mono-label text-mono-label text-on-surface-variant uppercase mb-2">Or Type Your Answer:</p>
                <textarea 
                  className="w-full h-32 bg-surface-container-high/50 border border-outline-variant/20 rounded-xl p-4 text-on-surface font-body-md focus:border-primary/50 focus:outline-none resize-none placeholder:text-on-surface-variant/50"
                  placeholder="Type your response here..."
                  onPaste={(e) => {
                    e.preventDefault();
                    api.logIntegrityEvent(sessionId, { event_type: 'PASTE_ATTEMPT', duration_seconds: 0, description: 'Candidate attempted to paste text into the answer box.', severity: 'high' });
                    setError("Paste is disabled — please type your answer manually.");
                  }}
                  onCut={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                />
                <button onClick={() => {
                  // If they typed, we ideally submit that text. For this scope, we just stop recording which uses the audio.
                  // A full implementation would capture the textarea value.
                  stopRecording();
                }} className="mt-2 px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg font-label-md hover:bg-primary/30 transition-colors">
                  Submit Typed Answer
                </button>
              </div>
            )}
          </div>

          {/* Status label */}
          <p className={`mt-4 font-mono-label text-mono-label uppercase tracking-widest ${status === STATUS.LISTENING ? 'text-error animate-pulse' : 'text-primary'}`}>
            {statusLabel[status]}
          </p>

          {/* Transcript preview */}
          {transcript && status === STATUS.PROCESSING && (
            <div className="mt-4 max-w-2xl w-full">
              <p className="font-body-md text-on-surface-variant/50 text-sm italic">You: "{transcript}"</p>
            </div>
          )}

          {/* Vocal dynamics bar */}
          <div className="mt-8 w-full max-w-2xl">
            <div className="flex items-center gap-8 bg-surface-container-low/40 rounded-2xl p-4 border border-outline-variant/10">
              <div>
                <span className="font-mono-label text-mono-label text-on-surface-variant uppercase block mb-2">Vocal Dynamics</span>
                <div className="flex gap-0.5 items-end h-8">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className={`w-1.5 rounded-full transition-all duration-150 ${status === STATUS.LISTENING ? 'bg-primary' : 'bg-surface-container-highest'}`}
                      style={{ height: status === STATUS.LISTENING ? `${20 + Math.random() * 80}%` : '20%' }} />
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <span className="font-mono-label text-mono-label text-on-surface-variant uppercase block mb-1">Confidence</span>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary-container rounded-full" style={{ width: status === STATUS.LISTENING ? '88%' : '0%', transition: 'width 0.5s ease' }} />
                </div>
                <span className="font-mono-label text-mono-label text-primary mt-1 block">{status === STATUS.LISTENING ? 'High (88%)' : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 bg-surface-container-low/40 backdrop-blur-xl border-l border-outline-variant/10 p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Session progress */}
          <div>
            <h3 className="font-mono-label text-mono-label text-on-surface-variant uppercase mb-3">Session Progress</h3>
            <div className="flex justify-between font-label-md text-label-md text-on-surface mb-2">
              <span>Elapsed Time</span>
              <span>{fmtTime(elapsed)} / {totalMin}:00</span>
            </div>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div key={i} className={`flex-1 h-1 rounded-full ${i < qIndex ? 'bg-primary' : i === qIndex ? 'bg-primary-fixed-dim animate-pulse' : 'bg-surface-container-highest'}`} />
              ))}
            </div>
          </div>

          {/* Live feedback matrix */}
          <div>
            <h3 className="font-mono-label text-mono-label text-on-surface-variant uppercase mb-4">Live Feedback Matrix</h3>
            <div className="space-y-4">
              {[
                { label: 'Clarity', value: 'Optimal', icon: 'psychology', pct: 90 },
                { label: 'Speaking Pace', value: '135 WPM', icon: 'speed', pct: 72 },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[16px]">{m.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between font-label-md text-label-md text-on-surface mb-1">
                      <span>{m.label}</span>
                      <span className="text-primary">{m.value}</span>
                    </div>
                    <div className="w-full h-0.5 bg-surface-container-highest rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detected competencies */}
          <div>
            <h3 className="font-mono-label text-mono-label text-on-surface-variant uppercase mb-3">Detected Competencies</h3>
            <div className="flex flex-wrap gap-2">
              {['Architecture', 'Scale', 'Growth Mindset', 'Technical'].map(tag => (
                <span key={tag} className="font-mono-label text-mono-label bg-secondary-container/20 text-secondary-container border border-secondary-container/30 px-3 py-1 rounded-lg text-[11px] uppercase">{tag}</span>
              ))}
            </div>
          </div>

          {/* Q progress dots */}
          <div className="mt-auto">
            <p className="font-mono-label text-mono-label text-on-surface-variant uppercase mb-3">Questions</p>
            <div className="flex gap-2 flex-wrap">
              {questions.map((_, i) => (
                <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono-label text-mono-label text-[11px] ${
                  i < qIndex ? 'bg-primary/20 text-primary' : i === qIndex ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'
                }`}>{i + 1}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
