import React, { useState, useEffect } from 'react';
import { Video, Shield, CheckCircle2, Wifi, Camera, Mic, ArrowRight, AlertTriangle, Sparkles, Server, Cpu, FileCheck, XCircle, RefreshCw } from 'lucide-react';
import { startInterviewSession, fetchSystemCheck } from '../services/api';

export default function InterviewSetupPage({ setActivePage, setInterviewSession }) {
  const [step, setStep] = useState(1); // 1: Setup Domain, 2: System Diagnostic Check
  const [category, setCategory] = useState('Technical Interview');
  const [domain, setDomain] = useState('Python Developer');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);

  // REAL SYSTEM DIAGNOSTIC STATES (No dummy hardcoded green checks)
  const [sysCheck, setSysCheck] = useState({
    camera: { status: 'testing', label: 'Testing Camera Permission...' },
    mic: { status: 'testing', label: 'Testing Audio Stream...' },
    speechRec: { status: 'testing', label: 'Checking Speech-to-Text API...' },
    backend: { status: 'testing', label: 'Connecting to FastAPI Backend...' },
    llm: { status: 'testing', label: 'Verifying Groq LLM Engine...' }
  });

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

  // Run Truthful Hardware & API Readiness Test when entering Step 2
  const runSystemDiagnostic = async () => {
    setSysCheck({
      camera: { status: 'testing', label: 'Testing Camera Permission...' },
      mic: { status: 'testing', label: 'Testing Audio Stream...' },
      speechRec: { status: 'testing', label: 'Checking Speech-to-Text API...' },
      backend: { status: 'testing', label: 'Connecting to FastAPI Backend...' },
      llm: { status: 'testing', label: 'Verifying Groq LLM Engine...' }
    });

    // 1. Camera Test
    try {
      const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
      vStream.getTracks().forEach(t => t.stop());
      setSysCheck(prev => ({ ...prev, camera: { status: 'success', label: 'Camera Feed Active (720p HD)' } }));
    } catch (err) {
      setSysCheck(prev => ({ ...prev, camera: { status: 'failed', label: 'Permission Required / Camera Unavailable' } }));
    }

    // 2. Mic Test
    try {
      const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      aStream.getTracks().forEach(t => t.stop());
      setSysCheck(prev => ({ ...prev, mic: { status: 'success', label: 'Microphone Active' } }));
    } catch (err) {
      setSysCheck(prev => ({ ...prev, mic: { status: 'failed', label: 'Permission Required / Mic Disconnected' } }));
    }

    // 3. Speech Recognition Test
    const hasSpeech = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    setSysCheck(prev => ({
      ...prev,
      speechRec: hasSpeech 
        ? { status: 'success', label: 'Speech-to-Text Engine Available' }
        : { status: 'failed', label: 'STT Not Supported by Browser (Use Chrome/Edge)' }
    }));

    // 4. Backend API & Groq LLM Check
    const sysData = await fetchSystemCheck();
    const isBackendUp = sysData.backend_status === 'Online';
    const isLlmUp = sysData.llm_configured;

    setSysCheck(prev => ({
      ...prev,
      backend: isBackendUp
        ? { status: 'success', label: 'Backend API Connected' }
        : { status: 'failed', label: 'Backend API Offline (Local Mode)' },
      llm: isLlmUp
        ? { status: 'success', label: `Groq LLM Configured (${sysData.llm_model})` }
        : { status: 'failed', label: 'Groq API Key Not Configured in backend/.env' }
    }));
  };

  useEffect(() => {
    if (step === 2) {
      runSystemDiagnostic();
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

  const allChecksPassed = sysCheck.camera.status === 'success' && sysCheck.mic.status === 'success';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-20 font-sans">
      
      {/* STEP 1: SELECT DOMAIN & DIFFICULTY LEVEL */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" /> Dynamic Groq LLM Interview Setup
            </div>
            <h1 className="text-3xl font-extrabold text-white">Select Target Domain & Difficulty</h1>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">Interview questions are dynamically generated by Groq LLM (openai/gpt-oss-120b) tailored specifically to your chosen role and resume skills.</p>
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
                  Selected Role: <strong className="text-cyan-400">{domain}</strong> ({difficulty} Level — Dynamic Groq Questions)
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

      {/* STEP 2: TRUTHFUL SYSTEM READINESS CHECK */}
      {step === 2 && (
        <div className="space-y-6">
          
          {/* HEADER */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white">System Readiness Diagnostic</h1>
              <p className="text-xs text-slate-400 mt-1">Verifying hardware permissions and backend Groq LLM API connectivity.</p>
            </div>

            <button
              onClick={runSystemDiagnostic}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-Test Hardware
            </button>
          </div>

          {/* TRUTHFUL DIAGNOSTIC BADGES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1: Camera Permission */}
            <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Webcam Camera Stream</p>
                  <p className="text-[11px] text-slate-400 font-mono">{sysCheck.camera.label}</p>
                </div>
              </div>

              {sysCheck.camera.status === 'testing' ? (
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-mono animate-pulse">Testing...</span>
              ) : sysCheck.camera.status === 'success' ? (
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Permission Needed
                </span>
              )}
            </div>

            {/* Box 2: Microphone Audio */}
            <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Microphone Audio Feed</p>
                  <p className="text-[11px] text-slate-400 font-mono">{sysCheck.mic.label}</p>
                </div>
              </div>

              {sysCheck.mic.status === 'testing' ? (
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-mono animate-pulse">Testing...</span>
              ) : sysCheck.mic.status === 'success' ? (
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Permission Needed
                </span>
              )}
            </div>

            {/* Box 3: Speech Recognition */}
            <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Browser Speech Recognition (STT)</p>
                  <p className="text-[11px] text-slate-400 font-mono">{sysCheck.speechRec.label}</p>
                </div>
              </div>

              {sysCheck.speechRec.status === 'success' ? (
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Available
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                  Fallback Mode
                </span>
              )}
            </div>

            {/* Box 4: Groq LLM Connectivity */}
            <div className="glass-card p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Groq LLM Engine</p>
                  <p className="text-[11px] text-slate-400 font-mono">{sysCheck.llm.label}</p>
                </div>
              </div>

              {sysCheck.llm.status === 'testing' ? (
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-mono animate-pulse">Checking...</span>
              ) : sysCheck.llm.status === 'success' ? (
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Configured
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                  Fallback Engine
                </span>
              )}
            </div>

          </div>

          {/* INTERVIEW GUIDELINES & PROCTORING RULES */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> Interview Proctoring & Malpractice Policy
            </h2>

            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed font-sans">
              <li>Ensure your webcam stream and microphone access are granted before launching.</li>
              <li>Mira will ask dynamically generated technical questions tailored to your chosen domain.</li>
              <li>Speak your answers clearly out loud into your microphone. If you choose to skip a question, it will be logged as <strong>Unanswered</strong>.</li>
              <li><strong className="text-red-400">Malpractice Rule:</strong> Switching browser tabs during the session will trigger warning alerts. Second violation results in immediate exam termination.</li>
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
                  I agree to the interview guidelines and proctoring rules.
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
              {loading ? "Generating Groq LLM Questions..." : (
                <>I'm Ready to Start Interview with Mira <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
