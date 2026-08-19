import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Camera, Mic, ArrowRight, Sparkles, FileText, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';
import { startInterviewSession, fetchSystemCheck } from '../services/api';

export default function InterviewSetupPage({ setActivePage, setInterviewSession }) {
  const [step, setStep] = useState(1); // 1: Setup Role & Configuration, 2: Hardware Check & Confirmation
  const [category, setCategory] = useState('Technical Interview');
  const [domain, setDomain] = useState('Python Developer');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);

  // Hardware permission states
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [checkingHardware, setCheckingHardware] = useState(true);
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

  const checkMediaPermissions = async () => {
    setCheckingHardware(true);
    let camOk = false;
    let micOk = false;

    try {
      const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
      vStream.getTracks().forEach(t => t.stop());
      camOk = true;
    } catch (e) {
      camOk = false;
    }

    try {
      const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      aStream.getTracks().forEach(t => t.stop());
      micOk = true;
    } catch (e) {
      micOk = false;
    }

    setCameraGranted(camOk);
    setMicGranted(micOk);
    setCheckingHardware(false);
  };

  useEffect(() => {
    if (step === 2) {
      checkMediaPermissions();
    }
  }, [step]);

  const handleLaunchInterview = async () => {
    setLoading(true);
    const session = await startInterviewSession({
      category,
      domain,
      difficulty,
      num_questions: numQuestions
    });

    if (session && !session.error && session.questions && session.questions.length > 0) {
      setInterviewSession({
        ...session,
        domain: session.domain || domain,
        category: session.category || category,
        difficulty: session.difficulty || difficulty,
        total_questions: session.total_questions || numQuestions,
        num_questions: session.questions ? session.questions.length : numQuestions
      });
      setLoading(false);
      setActivePage('interview-room');
    } else {
      setLoading(false);
      alert(session?.error || "Unable to start the interview. Please try again.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-20 font-sans">
      
      {/* STEP 1: CONFIGURATION SELECTOR */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" /> AI Technical Interview Configuration
            </div>
            <h1 className="text-3xl font-extrabold text-white">Configure Your AI Interview Session</h1>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">Customize your target domain, difficulty tier, and question count before starting.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Target Role Selector (5 COLS) */}
            <div className="lg:col-span-5 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> Target Technical Role
              </h2>
              <div className="space-y-2">
                {domainsList.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDomain(d)}
                    className={`w-full text-left p-3 rounded-2xl text-xs font-semibold border transition-all flex items-center justify-between ${
                      domain === d ? 'bg-indigo-600/20 border-indigo-500 text-cyan-300 shadow-lg' : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{d}</span>
                    {domain === d && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Parameters (7 COLS) */}
            <div className="lg:col-span-7 glass-card p-6 rounded-3xl border border-slate-800 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                
                {/* 1. Difficulty Tier */}
                <div className="space-y-2">
                  <h2 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">1. Difficulty Tier</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {['Easy', 'Medium', 'Hard'].map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setDifficulty(diff)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          difficulty === diff ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Number of Questions */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">2. Number of Questions</h2>
                    <span className="text-xs font-mono font-bold text-cyan-400">{numQuestions} Questions</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[3, 5, 10, 15].map((qCount) => (
                      <button
                        key={qCount}
                        onClick={() => setNumQuestions(qCount)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          numQuestions === qCount ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {qCount} Questions
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Summary Bar & Proceed Button */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono flex items-center justify-between text-slate-300">
                  <span>Selected: <strong className="text-white">{domain}</strong> ({difficulty})</span>
                  <span><strong>{numQuestions} Questions</strong></span>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 rounded-2xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-xl shadow-indigo-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Preparation & Hardware Check <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* STEP 2: PREPARATION & HARDWARE CHECK */}
      {step === 2 && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 text-center">
            <h1 className="text-2xl font-bold text-white">Interview Readiness & Hardware Check</h1>
            <p className="text-xs text-slate-400">Confirm camera and microphone access before entering the live room with Mira.</p>
          </div>

          {/* Configuration Summary Badge */}
          <div className="glass-card p-4 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 font-mono text-xs text-indigo-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-slate-400">Target Role:</span> <strong className="text-white">{domain}</strong> ({difficulty})
            </div>
            <div>
              <span className="text-slate-400">Questions:</span> <strong className="text-cyan-400">{numQuestions} Questions</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Camera Permission Box */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-xs font-bold text-white">Camera Check</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Proctoring video feed</span>
                </div>
              </div>

              {checkingHardware ? (
                <span className="text-[10px] text-slate-400 font-mono animate-pulse">Checking...</span>
              ) : cameraGranted ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
                  Permission Needed
                </span>
              )}
            </div>

            {/* Microphone Permission Box */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-bold text-white">Microphone Check</h3>
                  <span className="text-[10px] text-slate-400 font-mono">Speech-to-Text stream</span>
                </div>
              </div>

              {checkingHardware ? (
                <span className="text-[10px] text-slate-400 font-mono animate-pulse">Checking...</span>
              ) : micGranted ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
                  Permission Needed
                </span>
              )}
            </div>

          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="mt-1 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="text-xs text-slate-300 leading-relaxed font-sans">
                I agree to maintain active webcam focus and complete all {numQuestions} interview questions spoken aloud into my microphone.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-3 rounded-2xl font-bold text-xs border border-slate-800 text-slate-300 hover:text-white"
            >
              ← Back to Configuration
            </button>

            <button
              onClick={handleLaunchInterview}
              disabled={loading || !agreedToRules}
              className={`px-8 py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 ${
                agreedToRules && !loading
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-xl shadow-indigo-500/25 hover:scale-105'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loading ? "Starting AI Engine..." : <>Start AI Interview Session <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
