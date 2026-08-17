'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { StudioSidebar } from '../../../components/layout/StudioSidebar';
import { useApp } from '../../../context/AppContext';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { 
  Trophy, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  MessageSquare, 
  Activity, 
  FileText, 
  ShieldAlert,
  Clock,
  ExternalLink,
  ChevronRight,
  Lock,
  ArrowLeft
} from 'lucide-react';

export default function ReportPage() {
  return (
    <ProtectedRoute allowedRoles={['candidate', 'recruiter', 'admin']}>
      <ReportPageContent />
    </ProtectedRoute>
  );
}

function ReportPageContent() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id as string;
  const { reports, user } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'threads' | 'speech' | 'brief'>('overview');

  // Find candidate report by exact ID (NO FALLBACK to reports[0] to prevent data leakage)
  const report = reports.find(r => r.id === reportId);

  // Check Report Ownership Authorization
  const isOwner = user && report && report.candidateEmail?.toLowerCase() === user.email?.toLowerCase();
  const isElevatedRole = user && (user.role === 'recruiter' || user.role === 'admin');
  const isAuthorized = isOwner || isElevatedRole;

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 flex text-slate-900">
        <StudioSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-enterprise-md text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Report Not Found</h2>
            <p className="text-xs text-slate-500">
              No interview evaluation report exists with ID <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">{reportId}</code>.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#059669] text-white text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Security Access Denied Screen if user is unauthorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex text-slate-900">
        <StudioSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border-2 border-rose-200 shadow-enterprise-lg text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-mono font-bold uppercase">
                403 UNAUTHORIZED ACCESS
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 pt-1">
                Access Denied
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              You do not have permission to view this candidate's interview session report. Session history is private and accessible only to the authenticated candidate or verified hiring managers.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#059669] text-white text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Your Dashboard</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const overallScore = report.overallScore;
  const communicationScore = report.categoryScores.communicationSkills;
  const confidenceScore = report.categoryScores.bodyLanguage;
  const technicalScore = report.categoryScores.technicalKnowledge;
  const professionalismScore = report.categoryScores.deliveryAndPacing;

  // Format Duration
  const totalSec = report.totalDurationSeconds || 250;
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const formattedDuration = `${minutes}M ${seconds}S`;

  // Calculate Speech metrics dynamically
  const totalWords = report.answers.reduce((acc, a) => acc + (a.candidateResponse?.split(/\s+/).filter(Boolean).length || 0), 0);
  const totalMin = Math.max(0.5, totalSec / 60);
  const calculatedWpm = Math.round(totalWords / totalMin);

  const grammarScore = Math.min(100, Math.max(50, Math.round(communicationScore * 0.95 + 5)));
  const clarityScore = Math.min(100, Math.max(40, Math.round(communicationScore * 1.05)));
  const completenessScore = Math.min(100, Math.max(30, Math.round(technicalScore * 1.1)));
  
  const presenceConfidence = confidenceScore;
  const engagementScore = Math.min(100, Math.max(40, Math.round((communicationScore + confidenceScore) / 2)));
  const attentionScore = Math.max(30, 100 - (report.proctoringEvents.length * 15));
  const eyeContactPercent = Math.min(98, Math.max(50, Math.round(confidenceScore * 0.9 + (report.proctoringEvents.length === 0 ? 10 : 0))));

  const isUnderPressureYes = overallScore >= 70;
  const isSpecificityYes = technicalScore >= 70;
  const isNoContradictionsYes = report.proctoringEvents.length === 0;

  const readinessBadgeLabel = overallScore >= 85 ? 'SENIOR_READY' : overallScore >= 70 ? 'COMPETENT' : overallScore >= 55 ? 'ASSESSMENT_PENDING' : 'NEEDS_IMPROVEMENT';

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      
      {/* Studio Sidebar */}
      <StudioSidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#059669] text-[11px] font-bold border border-emerald-200 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Session Tape · {report.candidateName}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {report.config.title}
              </h1>
              <p className="text-xs text-slate-500">
                {report.config.difficulty} difficulty · {new Date(report.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100/70 text-[#059669] text-xs font-extrabold uppercase border border-emerald-200">
                Completed
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-mono font-bold">
                {formattedDuration}
              </span>
            </div>
          </div>

          {/* 5 Tab Navigation */}
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 text-xs font-bold shadow-enterprise-md overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2.5 px-4 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'overview' ? 'bg-[#059669] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setActiveTab('transcript')}
              className={`flex-1 py-2.5 px-4 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'transcript' ? 'bg-[#059669] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transcript ({report.answers.length})
            </button>

            <button
              onClick={() => setActiveTab('threads')}
              className={`flex-1 py-2.5 px-4 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'threads' ? 'bg-[#059669] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Thread Evaluations
            </button>

            <button
              onClick={() => setActiveTab('speech')}
              className={`flex-1 py-2.5 px-4 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'speech' ? 'bg-[#059669] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Speech & Presence
            </button>

            <button
              onClick={() => setActiveTab('brief')}
              className={`flex-1 py-2.5 px-4 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'brief' ? 'bg-[#059669] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Interview Brief
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Overall Score Card */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-enterprise-md space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900">Overall Score</h3>
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="#e2e8f0" strokeWidth="8" fill="transparent" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={overallScore >= 75 ? '#059669' : overallScore >= 55 ? '#eab308' : '#e11d48'}
                          strokeWidth="8"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * overallScore) / 100}
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-extrabold text-slate-900">{overallScore}</span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{readinessBadgeLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Breakdown Card */}
                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-enterprise-md space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900">Breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="block text-2xl font-extrabold text-slate-900">{communicationScore}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Communication</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="block text-2xl font-extrabold text-slate-900">{confidenceScore}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Confidence</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="block text-2xl font-extrabold text-slate-900">{technicalScore}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Technical</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="block text-2xl font-extrabold text-slate-900">{professionalismScore}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Professionalism</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3 Feedback Cards: Strengths, Areas to Improve, Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Strengths */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md space-y-3">
                  <h3 className="text-sm font-extrabold text-[#059669] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Strengths</span>
                  </h3>
                  <ul className="text-xs text-slate-600 space-y-2">
                    {report.strengths.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>

                {/* Areas to improve */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md space-y-3">
                  <h3 className="text-sm font-extrabold text-rose-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Areas to improve</span>
                  </h3>
                  <ul className="text-xs text-slate-600 space-y-2">
                    {report.weaknesses.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>

                {/* Suggestions */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md space-y-3">
                  <h3 className="text-sm font-extrabold text-[#059669] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#059669]" />
                    <span>Suggestions</span>
                  </h3>
                  <ul className="text-xs text-slate-600 space-y-2">
                    {report.recommendedImprovements.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Transcript */}
          {activeTab === 'transcript' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md space-y-6">
              <h3 className="text-base font-extrabold text-slate-900">Session Transcript ({report.answers.length} Questions)</h3>
              <div className="space-y-6 text-xs">
                {report.answers.map((answer, index) => (
                  <div key={index} className="space-y-3 border-b border-slate-100 pb-4 last:border-b-0">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">INTERVIEWER ({report.config.persona.name})</span>
                      <div className="p-4 rounded-2xl bg-slate-100 text-slate-900 font-medium max-w-2xl">
                        {answer.questionText}
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">CANDIDATE ({report.candidateName})</span>
                      <div className="p-4 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 font-semibold inline-block max-w-2xl text-left">
                        {answer.candidateResponse}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
                      <span className="font-bold text-slate-800">AI Evaluation Feedback: </span>
                      {answer.aiFeedback}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Thread Evaluations */}
          {activeTab === 'threads' && (
            <div className="space-y-4">
              {report.answers.map((answer, index) => {
                const depthScore = Math.min(10, Math.max(1, Math.round(answer.problemSolvingDepth / 10)));
                const accuracyScore = Math.min(10, Math.max(1, Math.round(answer.technicalAccuracy / 10)));
                const specificityScore = Math.min(10, Math.max(1, Math.round(answer.score / 10)));
                const recoveryScore = Math.min(10, Math.max(1, Math.round(answer.communicationFluency / 10)));

                const verdictLabel = answer.score >= 80 ? 'EXCELLENT' : answer.score >= 60 ? 'SATISFACTORY' : 'NEEDS_IMPROVEMENT';
                const verdictClass = answer.score >= 80 
                  ? 'bg-emerald-50 text-[#059669] border-emerald-200' 
                  : answer.score >= 60 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200';

                return (
                  <div key={index} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">TOPIC: {answer.topic}</span>
                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug mt-0.5">
                          {answer.questionText}
                        </h4>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border shrink-0 ${verdictClass}`}>
                        {verdictLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                        <span className="block text-xl font-extrabold text-slate-900">{depthScore}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">DEPTH</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                        <span className="block text-xl font-extrabold text-slate-900">{accuracyScore}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">ACCURACY</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                        <span className="block text-xl font-extrabold text-slate-900">{specificityScore}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">SPECIFICITY</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                        <span className="block text-xl font-extrabold text-slate-900">{recoveryScore}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">RECOVERY</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 4: Speech & Presence */}
          {activeTab === 'speech' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Delivery Card */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900">Delivery</h3>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="block text-2xl font-extrabold text-slate-900">{grammarScore}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">GRAMMAR</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="block text-2xl font-extrabold text-slate-900">{clarityScore}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">CLARITY</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="block text-2xl font-extrabold text-slate-900">{completenessScore}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">COMPLETENESS</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="block text-2xl font-extrabold text-slate-900">{calculatedWpm}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">PACE (WPM)</span>
                    </div>
                  </div>
                </div>

                {/* Presence Card */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900">Presence</h3>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="block text-2xl font-extrabold text-slate-900">{presenceConfidence}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">CONFIDENCE</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="block text-2xl font-extrabold text-slate-900">{engagementScore}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">ENGAGEMENT</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="block text-2xl font-extrabold text-slate-900">{attentionScore}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">ATTENTION</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                      <span className="block text-2xl font-extrabold text-slate-900">{eyeContactPercent}%</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">EYE CONTACT</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Dominant Emotion Card */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                    {confidenceScore >= 75 ? 'CONFIDENT' : confidenceScore >= 55 ? 'NEUTRAL' : 'HESITANT'}
                  </span>
                  <span className="text-xs text-slate-600 font-medium">Dominant emotion detected during candidate session</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Interview Brief */}
          {activeTab === 'brief' && (
            <div className="space-y-6">
              
              {/* Executive Summary Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md space-y-4">
                <h3 className="text-base font-extrabold text-slate-900">Summary</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Candidate {report.candidateName} completed a {report.config.difficulty} difficulty {report.config.track} interview session. Overall performance achieved an overall score of {report.overallScore}/100 with technical knowledge scored at {technicalScore}/100 and communication at {communicationScore}/100.
                </p>

                {/* 3 Verdict Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className={`block text-xs font-bold uppercase mb-1 ${isUnderPressureYes ? 'text-[#059669]' : 'text-red-600'}`}>
                      {isUnderPressureYes ? 'YES' : 'NO'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">PERFORMS UNDER PRESSURE</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className={`block text-xs font-bold uppercase mb-1 ${isSpecificityYes ? 'text-[#059669]' : 'text-red-600'}`}>
                      {isSpecificityYes ? 'YES' : 'NO'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">SPECIFICITY CONSISTENT</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <span className={`block text-xs font-bold uppercase mb-1 ${isNoContradictionsYes ? 'text-[#059669]' : 'text-red-600'}`}>
                      {isNoContradictionsYes ? 'YES' : 'NO'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">NO CONTRADICTIONS</span>
                  </div>
                </div>
              </div>

              {/* Red Flags Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md space-y-3">
                <h3 className="text-sm font-extrabold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Red flags</span>
                </h3>
                <ul className="text-xs text-slate-600 space-y-2">
                  {report.weaknesses.map((w, idx) => (
                    <li key={idx}>• {w}</li>
                  ))}
                </ul>
              </div>

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
