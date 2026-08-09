'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  ShieldAlert, 
  ShieldCheck, 
  Radio, 
  Bot,
  Send,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Loader2,
  Brain,
  Activity,
  Award
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { SAMPLE_QUESTION_BANK } from '../../../data/mockData';
import { evaluateInterview, CandidateRawInput } from '../../../utils/evaluationEngine';
import { Question, ProctoringEvent } from '../../../types';

export default function InterviewStudioPage() {
  const router = useRouter();
  const { user, activeResume, activeConfig, addReport, resetInterviewSession } = useApp();

  // Enforce resume upload validation guard - strictly requires a fresh activeResume for current session
  useEffect(() => {
    const hasActiveResume = Boolean(activeResume);
    if (!hasActiveResume) {
      router.replace('/resume');
    }
  }, [activeResume, router]);

  // Questions for active track
  const track = activeConfig?.track || 'Technical';
  const trackQuestions: Question[] = SAMPLE_QUESTION_BANK.filter(q => q.track === track);
  const questionsToUse = trackQuestions.length > 0 ? trackQuestions : SAMPLE_QUESTION_BANK;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentQuestion = questionsToUse[currentQuestionIndex] || questionsToUse[0];

  const [seconds, setSeconds] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [gazeWarning, setGazeWarning] = useState(false);

  // Live Vision Assessment Scores
  const [eyeContact, setEyeContact] = useState(88);
  const [attention, setAttention] = useState(85);
  const [engagement, setEngagement] = useState(82);

  // Candidate Answers Storage
  const [candidateResponseText, setCandidateResponseText] = useState('');
  const [savedInputs, setSavedInputs] = useState<CandidateRawInput[]>([]);
  const [proctoringEvents, setProctoringEvents] = useState<ProctoringEvent[]>([]);

  // Post-Interview Evaluation Overlay State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalStep, setEvalStep] = useState(1);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Live Session Timer
  useEffect(() => {
    if (isEvaluating) return;
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isEvaluating]);

  // Alternate AI Speaking vs Candidate Listening state
  useEffect(() => {
    if (isEvaluating) return;
    const toggleSpeaking = setInterval(() => {
      setIsSpeaking(prev => !prev);
    }, 7000);
    return () => clearInterval(toggleSpeaking);
  }, [isEvaluating]);

  // Simulate occasional gaze warning for realistic proctoring behavior
  useEffect(() => {
    if (isEvaluating) return;
    const warningTimer = setTimeout(() => {
      if (activeConfig?.enableProctoring) {
        setGazeWarning(true);
        setProctoringEvents(prev => [
          ...prev,
          {
            id: `proc-${Date.now()}`,
            timestamp: formatTimer(seconds),
            type: 'LOOKING_AWAY',
            severity: 'warning',
            message: 'Candidate looked away from screen during question delivery.'
          }
        ]);

        setTimeout(() => setGazeWarning(false), 4000);
      }
    }, 15000);

    return () => clearTimeout(warningTimer);
  }, [activeConfig, seconds, isEvaluating]);

  // Access user webcam for live video feed
  useEffect(() => {
    if (cameraOn && navigator.mediaDevices?.getUserMedia && !isEvaluating) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Webcam permission denied or unavailable:', err);
        });
    } else if ((!cameraOn || isEvaluating) && videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      videoRef.current.srcObject = null;
    }
  }, [cameraOn, isEvaluating]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleNextQuestion = () => {
    const inputEntry: CandidateRawInput = {
      question: currentQuestion,
      candidateResponseText: candidateResponseText.trim() || 'No explicit verbal answer provided.',
      audioDurationSeconds: 45,
      speechMetrics: {
        wpm: candidateResponseText.split(/\s+/).length > 20 ? 140 : 100,
        eyeContactPercent: eyeContact,
        confidenceScore: 78
      }
    };

    const updatedInputs = [...savedInputs, inputEntry];
    setSavedInputs(updatedInputs);
    setCandidateResponseText('');

    if (currentQuestionIndex + 1 < questionsToUse.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishInterview(updatedInputs);
    }
  };

  const finishInterview = (inputs: CandidateRawInput[]) => {
    setIsEvaluating(true);

    const finalConfig = activeConfig || {
      id: 'cfg-default',
      title: 'Technical AI Interview Screening',
      track: 'Technical',
      experienceLevel: '3-5 Years',
      difficulty: 'Hard',
      durationMinutes: 30,
      persona: {
        id: 'alex-tech',
        name: 'Alex Vance',
        role: 'Principal Engineer & Tech Lead',
        avatar: '',
        description: '',
        accentColor: '#059669',
        voiceGender: 'male',
        tone: 'analytical'
      },
      preferredLanguage: 'English',
      enableProctoring: true
    };

    const candidateName = user?.name || 'Candidate User';
    const candidateEmail = user?.email || 'candidate@intervio.ai';

    const newReport = evaluateInterview(
      finalConfig,
      inputs,
      proctoringEvents,
      candidateName,
      candidateEmail
    );

    addReport(newReport);
    resetInterviewSession();

    // Smooth step progress animation before auto-redirection to Dashboard
    setTimeout(() => setEvalStep(2), 600);
    setTimeout(() => setEvalStep(3), 1200);
    setTimeout(() => setEvalStep(4), 1800);
    setTimeout(() => {
      router.push('/dashboard');
    }, 2400);
  };

  const handleEndInterview = () => {
    const currentInput: CandidateRawInput = {
      question: currentQuestion,
      candidateResponseText: candidateResponseText.trim() || 'Software engineer with fullstack experience and strong focus on scalable architecture.',
      audioDurationSeconds: seconds > 0 ? seconds : 30,
      speechMetrics: {
        wpm: 135,
        eyeContactPercent: eyeContact,
        confidenceScore: 78
      }
    };

    const inputsToProcess = savedInputs.length > 0 ? [...savedInputs, currentInput] : [currentInput];
    finishInterview(inputsToProcess);
  };

  if (isEvaluating) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 select-none">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 p-8 rounded-3xl shadow-2xl text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <Brain className="w-10 h-10 text-[#059669] animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              AI EVALUATION ENGINE IN PROGRESS
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Processing Interview Session
            </h2>
            <p className="text-xs text-slate-400">
              Generating candidate-specific evaluation metrics & hiring insights...
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-3 text-xs text-left pt-2">
            <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
              evalStep >= 1 ? 'bg-slate-700/70 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${evalStep >= 1 ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>1. Transcribing audio & speech-to-text transcript</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
              evalStep >= 2 ? 'bg-slate-700/70 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              {evalStep >= 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <Loader2 className="w-4 h-4 animate-spin text-slate-500 shrink-0" />}
              <span>2. Evaluating technical knowledge & concept accuracy</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
              evalStep >= 3 ? 'bg-slate-700/70 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              {evalStep >= 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <Loader2 className="w-4 h-4 animate-spin text-slate-500 shrink-0" />}
              <span>3. Analyzing WPM pacing & communication clarity</span>
            </div>

            <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
              evalStep >= 4 ? 'bg-slate-700/70 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              {evalStep >= 4 ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <Loader2 className="w-4 h-4 animate-spin text-slate-500 shrink-0" />}
              <span>4. Synthesizing Dashboard Insights & Redirecting...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 text-slate-900 select-none">
      
      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#059669] flex items-center justify-center text-white shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <span className="text-lg font-extrabold text-slate-900 tracking-tight">
            Inter<span className="text-[#059669]">Vio</span> Studio
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full">
            Question {currentQuestionIndex + 1} of {questionsToUse.length}
          </span>
          {/* ON AIR Timer Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-mono font-extrabold shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span>ON AIR · {formatTimer(seconds)}</span>
          </div>
        </div>
      </header>

      {/* Main Canvas: AI Orb & Face Assessment Box */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-4">
        
        {/* Left Info Box */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md space-y-2">
            <span className="text-[10px] font-bold text-[#059669] uppercase tracking-wider block">
              {activeConfig?.track || 'TECHNICAL'} TRACK
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
              {activeConfig?.title || 'Technical Interview Session'}
            </h3>
            <p className="text-xs text-slate-500">
              Persona: {activeConfig?.persona.name || 'Alex Vance'}
            </p>
          </div>
        </div>

        {/* Center AI Orb Visualizer Container */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center text-center space-y-4">
          <div className={`relative w-44 h-44 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${
            isSpeaking ? 'bg-emerald-100/60 ring-8 ring-emerald-400/40' : 'bg-slate-100/60 ring-8 ring-slate-300/40'
          }`}>
            <div className={`w-32 h-32 rounded-full flex items-center justify-center text-white shadow-lg transition-colors ${
              isSpeaking ? 'bg-[#059669]' : 'bg-slate-700'
            }`}>
              <Radio className="w-12 h-12 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-extrabold tracking-widest text-slate-700 uppercase block">
              {isSpeaking ? 'AI INTERVIEWER SPEAKING' : 'LISTENING TO CANDIDATE'}
            </span>
            <div className="flex items-center justify-center gap-1">
              <span className="w-1 h-3 rounded bg-[#059669] animate-bounce" />
              <span className="w-1 h-5 rounded bg-[#059669] animate-bounce delay-75" />
              <span className="w-1 h-2 rounded bg-[#059669] animate-bounce delay-150" />
            </div>
          </div>
        </div>

        {/* Right Vision Proctoring Card */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-enterprise-md space-y-4 max-w-sm mx-auto w-full">
          
          {/* Webcam Box */}
          <div className="relative aspect-video rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center shadow-inner">
            {cameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="text-center text-slate-400 space-y-2">
                <VideoOff className="w-8 h-8 mx-auto" />
                <span className="text-xs font-bold block">CAM OFF</span>
              </div>
            )}

            <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-sm">
              ON SCREEN
            </div>
          </div>

          {/* Live Metrics */}
          <div className="space-y-2.5 text-xs font-bold">
            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>EYE CONTACT</span>
                <span>{eyeContact}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#059669] h-full rounded-full" style={{ width: `${eyeContact}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 mb-1">
                <span>ATTENTION</span>
                <span>{attention}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#059669] h-full rounded-full" style={{ width: `${attention}%` }} />
              </div>
            </div>
          </div>

          {/* Gaze Warning Box */}
          {gazeWarning && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1 shadow-sm">
              <div className="flex items-center gap-1.5 font-extrabold text-rose-600">
                <ShieldAlert className="w-4 h-4" />
                <span>LOOK FORWARD</span>
              </div>
              <p className="text-[11px] text-rose-800">
                Keep your gaze on the screen to ensure valid proctoring verification.
              </p>
            </div>
          )}

          <div className="text-center pt-1 text-[10px] font-mono font-bold text-slate-400">
            VISION PROCTORING ENGINE · ACTIVE
          </div>
        </div>

      </main>

      {/* Bottom Container: Interactive Question Box & Control Bar */}
      <footer className="max-w-4xl mx-auto w-full space-y-4">
        
        {/* Active Question & Response Box */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              INTERVIEW QUESTION ({currentQuestionIndex + 1}/{questionsToUse.length})
            </span>
            <span className="text-[10px] font-bold text-[#059669] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
              {currentQuestion.topic}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm">
            {currentQuestion.text}
          </div>

          {/* Response Textarea Input */}
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-bold text-slate-600 block">
              Your Verbal / Written Answer:
            </label>
            <textarea
              value={candidateResponseText}
              onChange={(e) => setCandidateResponseText(e.target.value)}
              placeholder="Type or speak your answer here... (e.g. Walk through technical architecture, concepts, trade-offs, and examples)"
              rows={3}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#059669] transition-all"
            />
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                isMuted ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4 text-red-600" /> : <Mic className="w-4 h-4 text-slate-600" />}
              <span>{isMuted ? 'Muted' : 'Mute Mic'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCameraOn(!cameraOn)}
              className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                !cameraOn ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              {cameraOn ? <Video className="w-4 h-4 text-slate-600" /> : <VideoOff className="w-4 h-4 text-red-600" />}
              <span>{cameraOn ? 'Cam On' : 'Cam Off'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleNextQuestion}
              className="px-5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#059669] border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5 transition-all"
            >
              <span>{currentQuestionIndex + 1 < questionsToUse.length ? 'Next Question' : 'Evaluate & Complete'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleEndInterview}
              className="px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End & Submit</span>
            </button>
          </div>
        </div>

      </footer>

    </div>
  );
}
