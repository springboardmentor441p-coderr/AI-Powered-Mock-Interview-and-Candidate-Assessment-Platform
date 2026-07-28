import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Video, FileText, BarChart3, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, UserCheck, Play } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white selection:bg-cyan-500 selection:text-black">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-slate-900/90 border border-cyan-500/40 px-4 py-1.5 rounded-full text-xs font-semibold text-cyan-300 shadow-lg shadow-cyan-500/10 mb-8">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Autonomous Candidate AI Interview Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Practice Real Tech Interviews with <br />
            <span className="glow-gradient-text">AI Avatar & Proctored Telemetry</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your Resume and target Job Description. Our AI extracts your projects, generates technical/behavioral questions, and evaluates your answers in real-time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="glow-cyan-btn px-7 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center gap-2.5 shadow-xl cursor-pointer"
            >
              Candidate Login <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/signup"
              className="glow-violet-btn px-7 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center gap-2.5 shadow-xl cursor-pointer"
            >
              Register Candidate Profile
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">How SmartHire AI Works</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-mono">
            4 simple steps from Resume upload to meaningful feedback report.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 font-bold font-mono">
              1
            </div>
            <h3 className="text-sm font-bold text-white">Upload Resume (Required)</h3>
            <p className="text-xs text-slate-400">Upload Resume (Required) and optional Job Description. AI extracts skills, projects & experience.</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 font-bold font-mono">
              2
            </div>
            <h3 className="text-sm font-bold text-white">Setup & Face Registration</h3>
            <p className="text-xs text-slate-400">Perform Camera, Mic, Face Capture snapshot, and Environment checks.</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 font-bold font-mono">
              3
            </div>
            <h3 className="text-sm font-bold text-white">AI Mock Interview</h3>
            <p className="text-xs text-slate-400">Interactive AI Avatar asks tailored questions with real-time proctoring.</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 font-bold font-mono">
              4
            </div>
            <h3 className="text-sm font-bold text-white">Meaningful Final Report</h3>
            <p className="text-xs text-slate-400">Overall %, Resume Validation, JD Coverage, strengths, and AI recommendations.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
