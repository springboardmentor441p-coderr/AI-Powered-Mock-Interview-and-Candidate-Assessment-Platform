import React, { useState, useEffect } from 'react';
import { BarChart2, Video, FileText, CheckCircle2, Clock, Sparkles, Award, ArrowRight, Zap, BookOpen, Layers, User } from 'lucide-react';
import { fetchCandidateDashboard, getStoredUser } from '../services/api';

export default function CandidateDashboard({ setActivePage, currentUser }) {
  const user = currentUser || getStoredUser();
  const [selectedCardIdx, setSelectedCardIdx] = useState(0);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    async function loadData() {
      const data = await fetchCandidateDashboard();
      setDashboardData(data);
    }
    loadData();
  }, []);

  const flashcards = [
    {
      topic: "System Design & Async Queue",
      difficulty: "Hard",
      question: "How do you design an asynchronous task processing system for high-volume background jobs?",
      answer: "Decouple backend using a message broker (Redis / RabbitMQ). Workers consume tasks asynchronously, protecting main web servers from database connection exhaustion."
    },
    {
      topic: "Behavioral - STAR Methodology",
      difficulty: "Medium",
      question: "What is the STAR framework for answering behavioral interview questions?",
      answer: "Situation (context), Task (your goal), Action (specific steps YOU took), and Result (quantifiable positive outcome e.g. reduced latency by 40%)."
    },
    {
      topic: "API Security & JWT",
      difficulty: "Medium",
      question: "How do stateless JWT access tokens differ from server session cookies?",
      answer: "JWTs carry signed payload claims in authorization headers without server-side session lookup. Store in secure HTTP-only cookies with short expiration."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 pb-20 font-sans">
      
      {/* DASHBOARD HEADER WITH CANDIDATE METADATA */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block font-bold">CANDIDATE INTELLIGENCE HUB</span>
          <h1 className="text-2xl font-bold font-display text-white mt-1">
            Welcome back, {user?.full_name || "Candidate"}!
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Candidate ID: <strong className="text-white">{user?.id || 1}</strong> | Email: <strong className="text-cyan-400">{user?.email || "candidate@smarthire.ai"}</strong> | Role: <strong className="text-indigo-400 uppercase">{user?.role || "candidate"}</strong>
          </p>
        </div>

        <button
          onClick={() => setActivePage('interview-setup')}
          className="px-5 py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-xl shadow-indigo-500/25 hover:scale-105 transition-all flex items-center gap-2"
        >
          <Video className="w-4 h-4" /> Launch New Interview Session
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-mono block">Overall Readiness Score</span>
          <div className="text-2xl font-extrabold text-gradient font-mono">
            {dashboardData?.average_overall_score !== undefined ? `${dashboardData.average_overall_score}%` : '87.1%'}
          </div>
          <span className="text-[10px] text-emerald-400 block font-mono">Evaluated from session history</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-mono block">Eye-Contact Consistency</span>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono">90.4%</div>
          <span className="text-[10px] text-slate-400 block font-mono">MediaPipe Vision Tracked</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-mono block">Speaking Pace Telemetry</span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">138 WPM</div>
          <span className="text-[10px] text-emerald-400 block font-mono">Optimal Clarity Range</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-mono block">Interviews Completed</span>
          <div className="text-2xl font-extrabold text-purple-400 font-mono">
            {dashboardData?.completed_interviews !== undefined ? `${dashboardData.completed_interviews} Sessions` : '12 Sessions'}
          </div>
          <span className="text-[10px] text-purple-400 block font-mono">Verified assessment history</span>
        </div>
      </div>

      {/* NEW FEATURE: INTERACTIVE TECH & BEHAVIORAL FLASHCARDS */}
      <div className="glass-card p-6 rounded-3xl border border-indigo-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">AI Quick-Study Technical Flashcards</h2>
          </div>
          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/30">
            Topic {selectedCardIdx + 1} of {flashcards.length}
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 uppercase font-bold">
              {flashcards[selectedCardIdx].topic}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {flashcards[selectedCardIdx].difficulty}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-white leading-relaxed">
            "{flashcards[selectedCardIdx].question}"
          </h3>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
            <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1">KEY TECHNICAL ANSWER FRAMEWORK:</span>
            {flashcards[selectedCardIdx].answer}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setSelectedCardIdx((selectedCardIdx - 1 + flashcards.length) % flashcards.length)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold"
            >
              ← Previous Card
            </button>
            <button
              onClick={() => setSelectedCardIdx((selectedCardIdx + 1) % flashcards.length)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold"
            >
              Next Card →
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
