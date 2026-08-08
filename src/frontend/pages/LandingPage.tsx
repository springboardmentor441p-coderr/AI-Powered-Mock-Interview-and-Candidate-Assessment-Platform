import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Bot, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Code2, Users, Brain, Cpu, BarChart2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight">SmartHire <span className="text-indigo-400">AI</span></span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Candidate Assessment</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-indigo-400 transition-colors">Assessment Domains</a>
          <a href="#how-it-works" className="hover:text-indigo-400 transition-colors">How It Works</a>
          <a href="#resume" className="hover:text-indigo-400 transition-colors">Resume ATS Matcher</a>
          <a href="#analytics" className="hover:text-indigo-400 transition-colors">AI Radar Metrics</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
              Candidate Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 max-w-7xl mx-auto text-center space-y-8 overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>Next-Gen AI Mock Interview Platform for High-Growth Tech Roles</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
          Master Technical, HR & Behavioral Interviews with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-sky-400">AI-Powered Assessment</span>
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
          Simulate real-world engineering and leadership interviews. Receive instant multi-dimensional scorecards, technical depth analysis, and personalized coaching tailored to your target job profile.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/interview/setup">
            <Button variant="primary" size="lg" icon={<Sparkles className="h-5 w-5" />}>
              Start AI Mock Session
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="lg" className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700">
              Explore Demo Dashboard
            </Button>
          </Link>
        </div>

        {/* Hero Assessment Card Mockup */}
        <div className="mt-12 p-1 bg-gradient-to-r from-indigo-500/30 via-violet-500/20 to-sky-500/30 rounded-3xl max-w-5xl mx-auto shadow-2xl">
          <div className="bg-slate-900 rounded-[22px] border border-slate-800 p-6 md:p-8 text-left grid md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Live Assessment State</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">Active Session</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                <div className="text-xs text-indigo-300 font-semibold">Question 02 / 05 • Technical Depth</div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  "Explain how optimistic UI updates improve user perception and how you rollback state during REST API failures."
                </p>
              </div>
            </div>

            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Real-Time Evaluation Engine</span>
                <span className="text-xs font-bold text-indigo-400">Score: 89/100</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Technical Accuracy</div>
                  <div className="text-sm font-bold text-slate-100 mt-1">92%</div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2"><div className="bg-indigo-500 h-full w-[92%] rounded-full" /></div>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Communication Clarity</div>
                  <div className="text-sm font-bold text-slate-100 mt-1">86%</div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2"><div className="bg-emerald-400 h-full w-[86%] rounded-full" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Domain Cards Section */}
      <section id="features" className="px-6 py-16 max-w-7xl mx-auto space-y-12 border-t border-slate-800">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-white">4 Specialized Interview Assessment Domains</h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto">
            Comprehensive preparation covering technical domain expertise, HR cultural alignment, STAR behavioral scenarios, and cognitive aptitude.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-4 hover:border-indigo-500/50 transition-all">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit">
              <Code2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Technical Interview</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              System architecture, data structures, algorithm speed, code refactoring, and framework best practices.
            </p>
          </div>

          <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-4 hover:border-emerald-500/50 transition-all">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">HR & Cultural Fit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Career progression narratives, salary negotiation, work style expectations, and company culture alignment.
            </p>
          </div>

          <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-4 hover:border-amber-500/50 transition-all">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-fit">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Behavioral STAR</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Situation-Task-Action-Result methodology evaluation, conflict resolution, and cross-team leadership.
            </p>
          </div>

          <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-4 hover:border-sky-500/50 transition-all">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl w-fit">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Aptitude & Logic</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analytical problem solving, numerical reasoning, SLAs under load, and system trade-off logic.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500 space-y-3">
        <div className="flex justify-center gap-6 text-slate-400">
          <Link to="/login" className="hover:text-white">Login</Link>
          <Link to="/signup" className="hover:text-white">Sign Up</Link>
          <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link to="/resume" className="hover:text-white">Resume Analyzer</Link>
          <Link to="/analytics" className="hover:text-white">Analytics</Link>
        </div>
        <p>© 2026 SmartHire AI Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};
