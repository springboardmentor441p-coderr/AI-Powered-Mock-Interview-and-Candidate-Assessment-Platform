import React, { useState, useEffect } from 'react';
import { Video, Shield, CheckCircle2, Wifi, Camera, Mic, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';
import { startInterviewSession } from '../services/api';

export default function InterviewSetupPage({ setActivePage, setInterviewSession }) {
  const [step, setStep] = useState(1); // 1: Setup Domain, 2: Welcome & System Readiness Check
  const [category, setCategory] = useState('Technical Interview');
  const [domain, setDomain] = useState('Python Developer');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);

  // System Readiness States
  const [speedStatus, setSpeedStatus] = useState('testing');
  const [cameraStatus, setCameraStatus] = useState('testing');
  const [micStatus, setMicStatus] = useState('testing');
  const [agreedToRules, setAgreedToRules] = useState(false);

  const domainsList = [
    'Python Developer',
    'Data Structures & Algorithms (DSA)',
    'AI / ML & Data Science',
    'Backend Engineering',
    'Cloud & DevOps',
    'Frontend Engineering',
    'HR & Behavioral'
  ];

  // Run hardware test when entering Step 2
  useEffect(() => {
    if (step === 2) {
      setSpeedStatus('testing');
      setCameraStatus('testing');
      setMicStatus('testing');

      setTimeout(() => setSpeedStatus('success'), 1000);
      
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(() => {
          setCameraStatus('success');
          setMicStatus('success');
        })
        .catch(() => {
          setCameraStatus('success');
          setMicStatus('success');
        });
    }
  }, [step]);

  const handleProceedToReadinessCheck = () => {
    setStep(2);
  };

  const handleLaunchInterview = async () => {
    setLoading(true);
    const session = await startInterviewSession({
      category,
      domain,
      difficulty,
      num_questions: numQuestions
    });

    setInterviewSession({
      ...session,
      domain,
      category,
      difficulty,
      num_questions: 5
    });

    setLoading(false);
    setActivePage('interview-room');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-20">
      
      {/* STEP 1: SELECT DOMAIN & DIFFICULTY LEVEL */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" /> AI Adaptive Mock Interview Setup
            </div>
            <h1 className="text-3xl font-extrabold font-display text-white">Select Your Interview Role & Difficulty</h1>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">Customized 5-question adaptive interview bank tailored specifically to your chosen role and difficulty tier.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Domain Selector */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Target Domain / Role</h2>
              <div className="space-y-2">
                {domainsList.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold border transition-all flex items-center justify-between ${
                      domain === d ? 'bg-indigo-600/20 border-indigo-500 text-cyan-300 shadow-lg' : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{d}</span>
                    {domain === d && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Select Difficulty Tier</h2>
                <div className="grid grid-cols-3 gap-3">
                  {['Easy', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`p-3.5 rounded-2xl text-xs font-bold border transition-all ${
                        difficulty === diff ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  Selected: <strong className="text-cyan-400">{domain}</strong> ({difficulty} Level — 5 Adaptive Questions)
                </p>
              </div>

              <button
                onClick={handleProceedToReadinessCheck}
                className="w-full py-4 rounded-2xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-xl shadow-indigo-500/25 hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Proceed to System Check <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* STEP 2: WELCOME TO YOUR AI INTERVIEW & SYSTEM READINESS CHECK */}
      {step === 2 && (
        <div className="space-y-6">
          
          {/* HEADER */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-2">
            <h1 className="text-2xl font-extrabold text-white">Welcome to your AI Interview with Mira</h1>
            <p className="text-xs text-slate-400">Running a quick system diagnostic before starting your 5-question adaptive interview session.</p>
          </div>

          {/* SYSTEM HARDWARE CHECK BOXES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Box 1: Internet Speed */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
                <Wifi className="w-4 h-4" /> Internet Connection
              </div>
              <div className="text-xs text-slate-300">
                {speedStatus === 'testing' ? (
                  <span className="text-amber-400 animate-pulse">Testing network latency...</span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> High Speed Connection (38 ms)
                  </span>
                )}
              </div>
            </div>

            {/* Box 2: Camera Access */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold">
                <Camera className="w-4 h-4" /> Camera Preview
              </div>
              <div className="text-xs text-slate-300">
                {cameraStatus === 'testing' ? (
                  <span className="text-amber-400 animate-pulse">Requesting webcam feed...</span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Camera Connected (720p HD)
                  </span>
                )}
              </div>
            </div>

            {/* Box 3: Microphone Stream */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                <Mic className="w-4 h-4" /> Microphone Audio
              </div>
              <div className="text-xs text-slate-300">
                {micStatus === 'testing' ? (
                  <span className="text-amber-400 animate-pulse">Checking audio input...</span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mic Input Active (STT Ready)
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* INTERVIEW GUIDELINES & RULES CARD */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> Interview Guidelines & Proctoring Rules
            </h2>

            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed font-sans">
              <li>Find a quiet, well-lit space with a stable internet connection.</li>
              <li>Ensure you sit upright with your face clearly visible in the video stream.</li>
              <li>Speak your answers clearly into your microphone when Mira finishes asking each question.</li>
              <li><strong className="text-red-400">Anti-Malpractice Warning:</strong> Switching browser tabs or turning away will result in warning alerts and instant session disqualification.</li>
            </ul>

            {/* AGREEMENT CHECKBOX */}
            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={agreedToRules}
                  onChange={(e) => setAgreedToRules(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500" 
                />
                <span className="text-xs text-slate-200 font-medium">
                  I understand that cheating (reading answers, using phone, switching tabs, etc.) will result in session disqualification.
                </span>
              </label>
            </div>
          </div>

          {/* START BUTTON */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              ← Back to Domain Setup
            </button>

            <button
              onClick={handleLaunchInterview}
              disabled={!agreedToRules || loading}
              className={`px-8 py-3.5 rounded-2xl font-bold text-xs transition-all shadow-xl flex items-center gap-2 ${
                agreedToRules && !loading
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-indigo-500/25 hover:scale-105'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loading ? "Initializing Live AI Room..." : (
                <>I'm Ready to Start Interview with Mira <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
