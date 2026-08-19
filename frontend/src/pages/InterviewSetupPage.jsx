import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Camera, Mic, ArrowRight, Sparkles, Clock, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { startInterviewSession, fetchSystemCheck } from '../services/api';

export default function InterviewSetupPage({ setActivePage, setInterviewSession }) {
  const [step, setStep] = useState(1); // 1: Setup Role & Difficulty, 2: Interview Preparation & Hardware Check
  const [category, setCategory] = useState('Technical Interview');
  const [domain, setDomain] = useState('Python Developer');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);

  // CANDIDATE-FRIENDLY HARDWARE PERMISSION STATES (No internal dev jargon)
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

  // Human-friendly hardware check on step 2
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

  const handleProceedToPrep = () => {
    setStep(2);
  };

  const handleLaunchInterview = async () => {
    setLoading(true);
    const session = await startInterviewSession({
      category,
      domain,
      difficulty,
      num_questions: numQuestions,
      duration_seconds: 600,
      question_time_limit: 90
    });

    if (session && !session.error && session.questions && session.questions.length > 0) {
      setInterviewSession({
        ...session,
        domain: session.domain || domain,
        category: session.category || category,
        difficulty: session.difficulty || difficulty,
        num_questions: session.questions ? session.questions.length : 5,
        started_at: session.started_at || new Date().toISOString(),
        duration_seconds: session.duration_seconds || 600,
        question_time_limit: session.question_time_limit || 90
      });
      setLoading(false);
      setActivePage('interview-room');
    } else {
      setLoading(false);
      alert(session?.error || "Unable to start the interview. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-20 font-sans">
      
      {/* STEP 1: SELECT TARGET ROLE & DIFFICULTY LEVEL */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" /> AI Technical Interview Setup
            </div>
            <h1 className="text-3xl font-extrabold text-white">Select Your Target Role & Difficulty</h1>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">Mira will conduct a dynamic 5-question interview tailored specifically to your chosen role and difficulty tier.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Target Role Selector */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Target Role</h2>
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

            {/* Difficulty Tier Selector */}
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

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Selected Role:</span>
                    <span className="text-cyan-400 font-bold">{domain}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Difficulty Tier:</span>
                    <span className="text-indigo-400 font-bold">{difficulty} Level</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-slate-400">Question Format:</span>
                    <span className="text-slate-300">5 Dynamic Questions</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToPrep}
                className="w-full py-4 rounded-2xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-xl shadow-indigo-500/25 hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                Proceed to Interview Preparation <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* STEP 2: CANDIDATE INTERVIEW PREPARATION & PERMISSION STATUS */}
      {step === 2 && (
        <div className="space-y-6">
          
          {/* HEADER */}
          <div className="glass-card p-8 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white">Interview Preparation</h1>
              <p className="text-xs text-slate-400 mt-1">Review your hardware access and interview guidelines before starting with Mira.</p>
            </div>

            <button
              onClick={checkMediaPermissions}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-check Devices
            </button>
          </div>

          {/* HUMAN-FRIENDLY CAMERA & MICROPHONE PERMISSION STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Camera Permission Card */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Camera Access</p>
                  <p className="text-[11px] text-slate-400">
                    {checkingHardware 
                      ? "Checking camera permission..." 
                      : (cameraGranted ? "Camera feed active" : "Please allow camera access in browser")}
                  </p>
                </div>
              </div>

              {checkingHardware ? (
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-mono animate-pulse">Checking...</span>
              ) : cameraGranted ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-bold">
                  Permission Needed
                </span>
              )}
            </div>

            {/* Microphone Permission Card */}
            <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Microphone Access</p>
                  <p className="text-[11px] text-slate-400">
                    {checkingHardware 
                      ? "Checking microphone permission..." 
                      : (micGranted ? "Microphone active" : "Please allow microphone access in browser")}
                  </p>
                </div>
              </div>

              {checkingHardware ? (
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-mono animate-pulse">Checking...</span>
              ) : micGranted ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-bold">
                  Permission Needed
                </span>
              )}
            </div>

          </div>

          {/* PERMISSION NOTICE BANNER IF NOT GRANTED */}
          {(!cameraGranted || !micGranted) && !checkingHardware && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Please allow camera and microphone access to begin your interview.</span>
            </div>
          )}

          {/* INTERVIEW GUIDELINES */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> Interview Guidelines & Policy
            </h2>

            <ul className="text-xs text-slate-300 space-y-2.5 list-disc list-inside leading-relaxed font-sans">
              <li>Position yourself in a quiet, well-lit environment facing your camera.</li>
              <li>Mira will ask 5 dynamic technical questions based on your chosen role ({domain}) and difficulty tier.</li>
              <li>Speak your answers clearly out loud into your microphone. If you choose to skip a question, it will be recorded as <strong>Unanswered</strong>.</li>
              <li><strong className="text-red-400">Proctoring Notice:</strong> Switching browser tabs during the session will trigger warning alerts.</li>
            </ul>

            {/* AGREEMENT CHECKBOX */}
            <div className="pt-3 border-t border-slate-800">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={agreedToRules}
                  onChange={(e) => setAgreedToRules(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500" 
                />
                <span className="text-xs text-slate-200 font-medium">
                  I understand the interview guidelines and am ready to begin.
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
              ← Back to Role Selection
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
              {loading ? "Preparing Your Interview..." : (
                <>Start Interview with Mira <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
