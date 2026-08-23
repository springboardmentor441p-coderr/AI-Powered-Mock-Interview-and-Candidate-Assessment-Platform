import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Video,
  FileText,
  Sparkles,
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Target,
  BarChart3,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useApp } from '../context/AppContext';

export const Dashboard = () => {
  const {
    user,
    candidate,
    resumeData,
    interviewHistory,
    assessmentHistory = []
  } = useApp();

  const [chartMetric, setChartMetric] = useState('all'); // 'all', 'overall', 'technical', 'behavioral'

  // Filter interview history per active candidate
  const candidateEmail = candidate?.email?.toLowerCase() || '';
  const userInterviews = (interviewHistory || []).filter(item => {
    if (!item) return false;
    if (candidateEmail && item.userEmail) {
      return item.userEmail.toLowerCase() === candidateEmail;
    }
    return true;
  });

  const totalInterviews = userInterviews.length;
  const avgInterviewScore = totalInterviews > 0
    ? Math.round(userInterviews.reduce((acc, item) => acc + (item.scorePct || 0), 0) / totalInterviews)
    : 0;

  const totalAssessments = assessmentHistory.length;
  const avgAssessmentScore = totalAssessments > 0
    ? Math.round(assessmentHistory.reduce((acc, item) => acc + (item.scorePct || 0), 0) / totalAssessments)
    : 0;

  // Prepare chronological performance chart data (oldest to newest)
  const chartData = [...userInterviews].reverse().map((item, index) => ({
    session: item.role || `Session ${index + 1}`,
    shortTitle: (item.role || `Session ${index + 1}`).replace(' Software Engineer', ' SDE').replace(' Candidate', ''),
    date: item.date,
    overallScore: item.scorePct,
    techScore: item.techScore || item.scorePct,
    behavioralScore: item.behavioralScore || Math.max(item.scorePct - 3, 0),
    company: item.company || 'Enterprise'
  }));

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-700/80 p-3 rounded-xl shadow-2xl space-y-1.5 text-xs font-mono">
          <div className="font-bold text-white flex items-center justify-between gap-4 pb-1 border-b border-slate-800">
            <span>{data.session}</span>
            <span className="text-cyan-400 text-[10px] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
              {data.date}
            </span>
          </div>
          <div className="space-y-1 text-[11px]">
            <p className="flex justify-between items-center text-cyan-300">
              <span>Overall Score:</span>
              <strong className="font-bold">{data.overallScore}%</strong>
            </p>
            <p className="flex justify-between items-center text-indigo-300">
              <span>Technical Score:</span>
              <strong className="font-bold">{data.techScore}%</strong>
            </p>
            <p className="flex justify-between items-center text-emerald-300">
              <span>Behavioral Score:</span>
              <strong className="font-bold">{data.behavioralScore}%</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Top Welcome Bar */}
      <div className="glass-card rounded-2xl p-6 border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <img
            src={candidate?.avatar || user?.avatar}
            alt={candidate?.name || 'User'}
            className="w-16 h-16 rounded-2xl border-2 border-cyan-400 object-cover shadow-lg shadow-cyan-500/20"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Welcome {candidate?.name || 'Candidate'}! 👋
              </h1>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-3 h-3" /> Candidate Persona Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Target Role: <strong className="text-cyan-300 font-semibold">{candidate?.targetRole || '(Upload resume to parse target role)'}</strong>
              {resumeData.skills && resumeData.skills.length > 0 && (
                <span className="text-slate-400 ml-1">({resumeData.skills.join(' • ')})</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Metric Boxes Section (Decreased size) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Box 1: Total Interviews Taken */}
        <div className="glass-card p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between space-y-3 group shadow-md hover:shadow-cyan-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
              Interviews
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Video className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {totalInterviews}
            </div>
            <h3 className="text-xs font-bold text-slate-300">
              Total Interviews Taken
            </h3>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-cyan-400">
            <span className="flex items-center gap-1 text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> AI Mock Sessions
            </span>
            <span className="bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/30">
              {totalInterviews > 0 ? 'Completed' : 'No Sessions'}
            </span>
          </div>
        </div>

        {/* Box 2: Interview Avg Score */}
        <div className="glass-card p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between space-y-3 group shadow-md hover:shadow-emerald-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
              Avg Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {avgInterviewScore}%
            </div>
            <h3 className="text-xs font-bold text-slate-300">
              Interview Avg Score
            </h3>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-emerald-400">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> {totalInterviews > 0 ? '+4.5% Growth' : 'Pending'}
            </span>
            <span className="bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
              {totalInterviews > 0 ? (avgInterviewScore > 75 ? 'High Level' : 'Moderate') : 'Not Evaluated'}
            </span>
          </div>
        </div>

        {/* Box 3: Assessments Taken */}
        <div className="glass-card p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between space-y-3 group shadow-md hover:shadow-purple-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
              Assessments
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-2xl font-black text-purple-400 font-mono tracking-tight">
              {totalAssessments}
            </div>
            <h3 className="text-xs font-bold text-slate-300">
              Assessments Taken
            </h3>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-purple-400">
            <span className="flex items-center gap-1 text-slate-400">
              <Zap className="w-3 h-3 text-purple-400" /> Skill Audits
            </span>
            <span className="bg-purple-950 px-1.5 py-0.5 rounded border border-purple-500/30">
              {totalAssessments > 0 ? 'Evaluated' : 'No Audits'}
            </span>
          </div>
        </div>

        {/* Box 4: Assessment Score */}
        <div className="glass-card p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between space-y-3 group shadow-md hover:shadow-amber-500/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
              Skill Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Target className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
              {avgAssessmentScore}%
            </div>
            <h3 className="text-xs font-bold text-slate-300">
              Assessment Score
            </h3>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-amber-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Verified Rating
            </span>
            <span className="bg-amber-950 px-1.5 py-0.5 rounded border border-amber-500/30">
              {totalAssessments > 0 ? 'Top 10%' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Chart of All Interviews Section */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
                <BarChart3 className="w-5 h-5 text-cyan-400" /> Performance Chart of All Interviews
              </h2>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-500/30 hidden sm:inline-block">
                Chronological Trend
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Tracking overall score, technical mastery, and behavioral ratings across all interview sessions.
            </p>
          </div>

          {/* Metric Selector Toggles */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setChartMetric('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                chartMetric === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Metrics
            </button>
            <button
              onClick={() => setChartMetric('overall')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                chartMetric === 'overall'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overall Score
            </button>
            <button
              onClick={() => setChartMetric('technical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                chartMetric === 'technical'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Technical
            </button>
            <button
              onClick={() => setChartMetric('behavioral')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                chartMetric === 'behavioral'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Behavioral
            </button>
          </div>
        </div>

        {/* Recharts Area Chart Container */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorTech" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorBehavioral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="shortTitle"
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                domain={[50, 100]}
                stroke="#64748B"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
                tickFormatter={(val) => `${val}%`}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
              />

              {(chartMetric === 'all' || chartMetric === 'overall') && (
                <Area
                  type="monotone"
                  dataKey="overallScore"
                  name="Overall Score (%)"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorOverall)"
                  dot={{ r: 5, fill: '#06B6D4', stroke: '#0F172A', strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                />
              )}

              {(chartMetric === 'all' || chartMetric === 'technical') && (
                <Area
                  type="monotone"
                  dataKey="techScore"
                  name="Technical Score (%)"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTech)"
                  dot={{ r: 4, fill: '#6366F1' }}
                />
              )}

              {(chartMetric === 'all' || chartMetric === 'behavioral') && (
                <Area
                  type="monotone"
                  dataKey="behavioralScore"
                  name="Behavioral Score (%)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorBehavioral)"
                  dot={{ r: 4, fill: '#10B981' }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Chart Summary Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Highest Score</span>
              <span className="text-sm font-bold text-white font-mono">
                {interviewHistory.length ? `${Math.max(...interviewHistory.map(i => i.scorePct))}%` : 'N/A'} (Target Enterprise)
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Performance Trend</span>
              <span className="text-sm font-bold text-indigo-300 font-mono">Upward +16% overall</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Target Role Readiness</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">Ready for Top Tier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
