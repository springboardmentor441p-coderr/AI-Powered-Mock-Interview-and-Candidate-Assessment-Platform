'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { 
  Trophy, 
  TrendingUp, 
  Clock, 
  Flame, 
  Mic,
  ArrowUpRight,
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Award,
  ExternalLink,
  Zap,
  Play
} from 'lucide-react';

export const MetricsOverview: React.FC<{ onQuickStart?: () => void }> = () => {
  const { user, reports } = useApp();

  // Filter reports to ensure strictly authenticated user identity
  const userReports = React.useMemo(() => {
    if (!user) return [];
    return reports.filter(r => r.candidateEmail?.toLowerCase() === user.email?.toLowerCase() || user.role === 'recruiter' || user.role === 'admin');
  }, [reports, user]);

  const totalSessions = userReports.length;
  const latestReport = totalSessions > 0 ? userReports[0] : null;

  const avgScore = totalSessions > 0
    ? Math.round(userReports.reduce((acc, r) => acc + r.overallScore, 0) / totalSessions)
    : 0;

  const bestScore = totalSessions > 0
    ? Math.max(...userReports.map(r => r.overallScore))
    : 0;

  const communicationScore = totalSessions > 0
    ? Math.round(userReports.reduce((acc, r) => acc + r.categoryScores.communicationSkills, 0) / totalSessions)
    : 0;

  const confidenceScore = totalSessions > 0
    ? Math.round(userReports.reduce((acc, r) => acc + r.categoryScores.bodyLanguage, 0) / totalSessions)
    : 0;

  const technicalScore = totalSessions > 0
    ? Math.round(userReports.reduce((acc, r) => acc + r.categoryScores.technicalKnowledge, 0) / totalSessions)
    : 0;

  const deliveryScore = totalSessions > 0
    ? Math.round(userReports.reduce((acc, r) => acc + r.categoryScores.deliveryAndPacing, 0) / totalSessions)
    : 0;

  // Chronologically sorted reports for line trend chart
  const sortedReports = [...userReports].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const chartPoints = sortedReports.slice(-6);

  // SVG Chart path calculation
  const svgWidth = 500;
  const svgHeight = 150;
  const paddingX = 40;
  const paddingY = 20;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = 110;

  const pointsCoordinates = chartPoints.map((rpt, idx) => {
    const x = chartPoints.length > 1
      ? paddingX + (idx / (chartPoints.length - 1)) * chartWidth
      : svgWidth / 2;
    
    const y = paddingY + chartHeight - (rpt.overallScore / 100) * chartHeight;
    return { x, y, score: rpt.overallScore, date: rpt.createdAt };
  });

  const pathD = pointsCoordinates.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Dynamic focus areas based on lowest scores or standard targets
  const focusAreas: string[] = [];
  if (totalSessions === 0) {
    focusAreas.push('INITIAL_VOICE_SCREENING', 'RESUME_UPLOAD_PARSING', 'TECHNICAL_BEHAVIORAL_PRACTICE');
  } else {
    if (technicalScore < 75) focusAreas.push('TECHNICAL_RELEVANCE');
    if (confidenceScore < 75) focusAreas.push('CONFIDENCE_BUILDING');
    if (communicationScore < 75) focusAreas.push('COMMUNICATION_FLUENCY');
    if (deliveryScore < 75) focusAreas.push('PACING_AND_DELIVERY');
    if (focusAreas.length === 0) focusAreas.push('ADVANCED_SYSTEM_DESIGN', 'LEADERSHIP_BEHAVIORAL');
  }

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* Studio Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#059669] text-[11px] font-bold border border-emerald-200 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Studio Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'Candidate'}
          </h1>
          <p className="text-xs text-slate-500">
            Real-time evaluation insights derived entirely from your candidate interview performance and speech analysis.
          </p>
        </div>

        <Link
          href="/resume"
          className="px-6 py-3 rounded-2xl bg-[#059669] hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
        >
          <Mic className="w-4 h-4 fill-white" />
          <span>Start new interview</span>
        </Link>
      </div>

      {/* LATEST COMPLETED INTERVIEW SPOTLIGHT CARD */}
      {latestReport ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-emerald-500/30 shadow-enterprise-md space-y-6 ring-4 ring-emerald-500/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#059669] text-[11px] font-bold border border-emerald-200">
                <Zap className="w-3.5 h-3.5 fill-[#059669]" />
                <span>MOST RECENT INTERVIEW EVALUATION</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {latestReport.config.title}
              </h2>
              <p className="text-xs text-slate-500">
                {latestReport.config.track} Track · {latestReport.config.difficulty} difficulty · Evaluated {new Date(latestReport.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-3xl font-extrabold text-[#059669] block leading-none">
                  {latestReport.overallScore}%
                </span>
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                  {latestReport.readinessRating}
                </span>
              </div>

              <Link
                href={`/report/${latestReport.id}`}
                className="px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>View Full Report</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Category Breakdown Score Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-xl font-extrabold text-slate-900">{latestReport.categoryScores.technicalKnowledge}%</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">TECHNICAL</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-xl font-extrabold text-slate-900">{latestReport.categoryScores.communicationSkills}%</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">COMMUNICATION</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-xl font-extrabold text-slate-900">{latestReport.categoryScores.behavioralSkills}%</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">PROBLEM SOLVING</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-xl font-extrabold text-slate-900">{latestReport.categoryScores.bodyLanguage}%</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">CONFIDENCE</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-xl font-extrabold text-slate-900">{latestReport.categoryScores.deliveryAndPacing}%</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">PACING & DELIVERY</span>
            </div>
          </div>

          {/* Interview Key Insights Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <h4 className="font-extrabold text-[#059669] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Interview Strengths</span>
              </h4>
              <ul className="space-y-1 text-slate-700">
                {latestReport.strengths.slice(0, 2).map((s, idx) => (
                  <li key={idx}>• {s}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <h4 className="font-extrabold text-amber-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Targeted Improvement Plan</span>
              </h4>
              <ul className="space-y-1 text-slate-700">
                {latestReport.recommendedImprovements.slice(0, 2).map((imp, idx) => (
                  <li key={idx}>• {imp}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-extrabold text-slate-900">No Interview Sessions Yet</h3>
            <p className="text-xs text-slate-500">
              Upload your resume and launch your first AI mock interview to analyze technical accuracy, communication fluency, and speech metrics.
            </p>
          </div>
          <div>
            <Link
              href="/resume"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Launch First AI Interview</span>
            </Link>
          </div>
        </div>
      )}

      {/* Grid: Overall Signal + Score Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Overall Signal Card */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-enterprise-md space-y-6">
          <h3 className="text-sm font-extrabold text-slate-900">Overall signal</h3>
          
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={avgScore >= 75 ? '#059669' : avgScore >= 55 ? '#eab308' : '#e11d48'}
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * avgScore) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{avgScore}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Score</span>
              </div>
            </div>
          </div>

          {/* 4 Stat Boxes Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-xl font-extrabold text-slate-900">{totalSessions}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Sessions</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-xl font-extrabold text-slate-900">{bestScore}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Best Score</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-xl font-extrabold text-slate-900">{communicationScore}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Communication</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="block text-xl font-extrabold text-slate-900">{confidenceScore}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Confidence</span>
            </div>
          </div>
        </div>

        {/* Score Trend Card */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-enterprise-md flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#059669]" />
              <span>Score trend ({chartPoints.length} sessions)</span>
            </h3>
            {latestReport && (
              <Link href={`/report/${latestReport.id}`} className="text-xs font-bold text-slate-500 hover:text-[#059669] flex items-center gap-1">
                <span>View Latest Report</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* SVG Line Chart */}
          <div className="h-48 w-full pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
              <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <text x="0" y="24" className="text-[10px] fill-slate-400 font-mono">100</text>

              <line x1="0" y1="60" x2="500" y2="60" stroke="#f1f5f9" strokeWidth="1" />
              <text x="0" y="64" className="text-[10px] fill-slate-400 font-mono">75</text>

              <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <text x="0" y="104" className="text-[10px] fill-slate-400 font-mono">50</text>

              <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" strokeWidth="1" />
              <text x="0" y="144" className="text-[10px] fill-slate-400 font-mono">25</text>

              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3"
                />
              )}

              {pointsCoordinates.map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="5" fill="#059669" />
                  <text x={pt.x - 10} y={pt.y - 10} className="text-[10px] fill-slate-700 font-bold font-mono">
                    {pt.score}%
                  </text>
                  <text x={pt.x - 20} y="160" className="text-[9px] fill-slate-400 font-mono">
                    {new Date(pt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

      </div>

      {/* Bottom Card: Where to Focus Next */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Target className="w-4 h-4 text-[#059669]" />
          <span>Where to focus next</span>
        </h3>
        <div className="flex flex-wrap gap-2 pt-1">
          {focusAreas.map((area, i) => (
            <span key={i} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-[#059669] text-xs font-bold border border-emerald-200 uppercase">
              {area}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};
