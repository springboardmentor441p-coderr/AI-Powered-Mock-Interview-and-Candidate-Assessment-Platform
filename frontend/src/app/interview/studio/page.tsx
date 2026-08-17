'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, CheckCircle2, Loader2, Mic, MicOff, PhoneOff, Radio, RefreshCw, Video, VideoOff } from 'lucide-react';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { useApp } from '../../../context/AppContext';
import { generatePersonalizedQuestions } from '../../../utils/questionGenerator';
import { evaluateInterview, type CandidateRawInput } from '../../../utils/evaluationEngine';
import { createVoiceInterviewPayload, type VoiceInterviewStartResponse } from '../../../lib/voiceInterview';
import { useVapiInterview } from '../../../hooks/useVapiInterview';
import type { InterviewConfig } from '../../../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function InterviewStudioPage() {
  return <ProtectedRoute allowedRoles={['candidate', 'recruiter', 'admin']}><InterviewStudio /></ProtectedRoute>;
}

function InterviewStudio() {
  const router = useRouter();
  const { user, activeConfig, activeResume, addReport, resetInterviewSession } = useApp();
  const config = activeConfig ?? defaultConfig();
  const questions = useMemo(() => generatePersonalizedQuestions(activeResume, config.track), [activeResume, config.track]);
  const voice = useVapiInterview();
  const [session, setSession] = useState<VoiceInterviewStartResponse | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [cameraOn, setCameraOn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startedRef = useRef(false);

  const startSession = useCallback(async () => {
    if (startedRef.current || !user) return;
    startedRef.current = true;
    setSetupError(null);
    try {
      const token = localStorage.getItem('intervio_jwt');
      const response = await fetch(`${API_BASE_URL}/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(createVoiceInterviewPayload(config, questions, activeResume))
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to prepare the voice interview.');
      setSession(payload.data);
      await voice.start(payload.data);
    } catch (error) {
      startedRef.current = false;
      setSetupError(error instanceof Error ? error.message : 'Unable to start the voice interview.');
    }
  }, [activeResume, config, questions, user, voice]);

  useEffect(() => { void startSession(); }, [startSession]);

  useEffect(() => {
    if (voice.status !== 'active') return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [voice.status]);

  useEffect(() => {
    if (!cameraOn || !navigator.mediaDevices?.getUserMedia) return;
    let stream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((nextStream) => {
      stream = nextStream;
      if (videoRef.current) videoRef.current.srcObject = nextStream;
    }).catch(() => setCameraOn(false));
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, [cameraOn]);

  const isSubmittingRef = useRef(false);

  const completeInterview = useCallback(async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      if (session) {
        try {
          const token = localStorage.getItem('intervio_jwt');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          await fetch(`${API_BASE_URL}/interview/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ sessionId: session.sessionId }),
            signal: controller.signal
          }).catch((err) => console.warn('Interview complete API warning:', err));
          clearTimeout(timeoutId);
        } catch (apiErr) {
          console.warn('API completion request skipped or timed out:', apiErr);
        }
      }

      const answers = voice.transcript.filter((entry) => entry.role === 'user' && entry.isFinal);
      const inputs: CandidateRawInput[] = questions.map((question, index) => ({
        question,
        candidateResponseText: answers[index]?.content || '',
        audioDurationSeconds: answers[index] ? Math.max(1, Math.round(seconds / Math.max(answers.length, 1))) : 0,
        speechMetrics: {
          wpm: answers[index] ? Math.round((answers[index].content.split(/\s+/).filter(Boolean).length / Math.max(seconds / Math.max(answers.length, 1), 1)) * 60) : 0,
          eyeContactPercent: 0,
          confidenceScore: 0
        }
      }));

      const report = evaluateInterview(config, inputs, [], user?.name || 'Candidate', user?.email || '');
      await addReport({ ...report, totalDurationSeconds: seconds, videoRecordingAvailable: false });
      resetInterviewSession();
      router.push('/dashboard');
    } catch (err) {
      console.error('Error completing interview:', err);
      resetInterviewSession();
      router.push('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  }, [addReport, config, questions, resetInterviewSession, router, seconds, session, user, voice.transcript]);

  const handleEndAndSubmit = useCallback(async () => {
    voice.end();
    await completeInterview();
  }, [voice, completeInterview]);

  useEffect(() => {
    if (voice.status === 'ended') {
      void completeInterview();
    }
  }, [completeInterview, voice.status]);

  const formatTime = (value: number) => `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
  const connectionText = voice.status === 'connecting' ? 'Connecting securely…' : voice.isAssistantSpeaking ? `${config.persona.name} is speaking` : voice.status === 'active' ? 'Listening to you' : 'Preparing interview';
  const error = setupError || voice.error;

  return <div className="min-h-screen bg-slate-50 p-4 sm:p-6 text-slate-900">
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-3">
      <div className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white"><Bot className="h-5 w-5" /></div><span className="text-lg font-extrabold">Inter<span className="text-emerald-600">Vio</span> Studio</span></div>
      <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 font-mono text-xs font-bold text-red-700"><Radio className="h-3.5 w-3.5" />ON AIR · {formatTime(seconds)}</div>
    </header>

    <main className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 py-8 lg:grid-cols-12">
      <section className="space-y-4 lg:col-span-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{config.track} · {config.difficulty}</p><h1 className="mt-2 text-base font-extrabold">{config.title}</h1><p className="mt-2 text-xs leading-relaxed text-slate-500">{activeResume ? `Resume-aware interview for ${activeResume.detectedRole || 'your selected role'}.` : 'General interview mode. Questions follow your selected track.'}</p></div>
      </section>

      <section className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm lg:col-span-5">
        <div className={`flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg ${voice.isAssistantSpeaking ? 'animate-pulse' : ''}`}><Bot className="h-14 w-14" /></div>
        <h2 className="mt-6 text-xl font-extrabold">{config.persona.name}</h2><p className="mt-1 text-xs text-slate-500">{config.persona.role}</p>
        <div className="mt-5 flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><span className={`h-2 w-2 rounded-full bg-emerald-500 ${voice.status === 'active' ? 'animate-ping' : ''}`} />{connectionText}</div>
        {error && <div className="mt-5 max-w-md rounded-2xl border border-red-200 bg-red-50 p-3 text-left text-xs text-red-700"><p className="font-bold">Voice connection unavailable</p><p className="mt-1">{error}</p><button onClick={() => void startSession()} className="mt-2 inline-flex items-center gap-1 font-bold underline"><RefreshCw className="h-3 w-3" />Retry</button></div>}
      </section>

      <section className="lg:col-span-4"><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">{cameraOn ? <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover -scale-x-100" /> : <div className="flex h-full flex-col items-center justify-center text-slate-400"><VideoOff className="h-8 w-8" /><span className="mt-2 text-xs font-bold">CAMERA OFF</span></div>}<span className="absolute right-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">ON SCREEN</span></div><p className="mt-3 text-xs text-slate-500">Camera video is only used by the browser preview in this release; it is not sent to Vapi.</p></div></section>
    </main>

    <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Live transcript</p><div className="max-h-36 space-y-2 overflow-y-auto pr-1 text-xs">{voice.transcript.length === 0 ? <p className="text-slate-400">Transcript will appear here once the conversation starts.</p> : voice.transcript.slice(-6).map((entry, index) => <p key={`${entry.role}-${index}`} className={entry.role === 'assistant' ? 'text-emerald-700' : 'text-slate-700'}><span className="font-bold">{entry.role === 'assistant' ? config.persona.name : 'You'}: </span>{entry.content}</p>)}</div></section>

    <footer className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-between gap-3"><div className="flex gap-3"><button onClick={voice.toggleMute} disabled={voice.status !== 'active'} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold disabled:opacity-50">{voice.isMuted ? <MicOff className="h-4 w-4 text-red-600" /> : <Mic className="h-4 w-4" />}{voice.isMuted ? 'Unmute mic' : 'Mute mic'}</button><button onClick={() => setCameraOn((value) => !value)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold">{cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}{cameraOn ? 'Cam on' : 'Cam off'}</button></div><button onClick={handleEndAndSubmit} disabled={isSubmitting || voice.status === 'ended'} className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm disabled:opacity-50 hover:bg-red-700 transition-colors">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4" />}{isSubmitting ? 'Saving interview…' : 'End & submit'}</button></footer>
  </div>;
}

function defaultConfig(): InterviewConfig {
  return { id: 'cfg-default', title: 'Technical AI Interview Screening', track: 'Technical', experienceLevel: '3-5 Years', difficulty: 'Hard', durationMinutes: 30, persona: { id: 'alex-tech', name: 'Alex Vance', role: 'Principal Engineer & Tech Lead', avatar: '', description: '', accentColor: '#059669', voiceGender: 'male', tone: 'analytical' }, preferredLanguage: 'English', enableProctoring: true };
}

