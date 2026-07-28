import React from 'react';
import { BarChart3, TrendingUp, Award, Zap, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useApp } from '../context/AppContext';

export const PerformanceDashboard = () => {
  const { interviewResult } = useApp();

  // Radar Data for Multi-Metric Breakdown
  const radarData = [
    { subject: 'Technical', A: 91, fullMark: 100 },
    { subject: 'Communication', A: 87.5, fullMark: 100 },
    { subject: 'Confidence', A: 86, fullMark: 100 },
    { subject: 'Professionalism', A: 94, fullMark: 100 },
    { subject: 'Problem Solving', A: 89, fullMark: 100 },
    { subject: 'Eye Contact', A: 87.5, fullMark: 100 },
    { subject: 'Voice Quality', A: 85, fullMark: 100 },
  ];

  // Historical Score Progress Trend
  const trendData = [
    { session: 'Session 1', score: 76, match: 72 },
    { session: 'Session 2', score: 81, match: 78 },
    { session: 'Session 3', score: 84, match: 82 },
    { session: 'Session 4', score: 88.5, match: 86.5 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Phase 12: Candidate Performance Dashboard
        </h1>
        <p className="text-xs text-slate-400 font-mono">Skill progress trends, vision telemetry metrics & score evolution</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart: Multi-Metric Assessment */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Multi-Metric Competency Radar
            </h2>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
              Live Evaluation
            </span>
          </div>

          <div className="w-full h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar name="Candidate" dataKey="A" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart: Score Progression Trend */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Score Progression History
            </h2>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
              +12.5% Growth
            </span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="session" stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis domain={[60, 100]} stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="#06B6D4" strokeWidth={3} dot={{ r: 5 }} />
                <Line type="monotone" dataKey="match" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Skill Gap Matrix */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
          Extracted Skill Gap Matrix & Improvement Recommendations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30">
            <span className="text-xs font-bold text-emerald-400 block mb-1">Mastered Skills</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['React', 'TypeScript', 'FastAPI', 'Python', 'System Design'].map((s, i) => (
                <span key={i} className="bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2.5 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30">
            <span className="text-xs font-bold text-amber-400 block mb-1">In Progress Skills</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['PostgreSQL Connection Pools', 'Redis Pub/Sub'].map((s, i) => (
                <span key={i} className="bg-amber-950 text-amber-300 border border-amber-500/30 text-[10px] font-mono px-2.5 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/30">
            <span className="text-xs font-bold text-purple-400 block mb-1">Target Growth Areas</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['Kafka Event Streaming', 'Partition Group Balancing'].map((s, i) => (
                <span key={i} className="bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] font-mono px-2.5 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
