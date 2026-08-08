import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { CompletedInterviewSession, AssessmentResult } from '../../types';
import { interviewService } from '../services/interviewService';
import { assessmentService } from '../services/assessmentService';
import { api } from '../services/api';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  FileText,
  AlertCircle,
  LayoutDashboard,
  Award,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Cpu,
  UserCheck,
  Check,
  XCircle,
  Lightbulb,
  BookOpen,
  History,
  Info
} from 'lucide-react';

export const InterviewResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [completedSession, setCompletedSession] = useState<CompletedInterviewSession | null>(null);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const session = interviewService.getCompletedSession();
    if (session) {
      setCompletedSession(session);
      // Auto-load existing assessment if already generated for this session
      const latest = assessmentService.getLatestAssessment();
      if (latest && (latest.interviewId === session.interviewId || latest.title.includes(session.type))) {
        setAssessment(latest);
      }
    }
  }, []);

  const handleGenerateAssessment = async () => {
    if (!completedSession) return;
    setIsGenerating(true);

    try {
      // 1. Try real AI server-side evaluation via API
      const apiResult = await api.interview.submit(
        completedSession.config || {
          type: completedSession.type,
          targetRole: completedSession.domain,
          experienceLevel: completedSession.difficulty,
          questionCount: completedSession.questions?.length || 3,
          timeLimitMinutes: 25,
          topics: [completedSession.domain],
          includeCodeSnippet: true,
        },
        completedSession.answers || {},
        completedSession.questions,
        completedSession.speechData
      );

      if (apiResult) {
        await assessmentService.saveAssessment(apiResult);
        setAssessment(apiResult);
        return;
      }
    } catch (err) {
      console.warn('AI assessment API error, falling back to local evaluation:', err);
    } finally {
      // If AI did not return or erred, fall back cleanly to local rule assessment
      if (!assessment) {
        try {
          const result = assessmentService.generateAssessment(completedSession);
          setAssessment(result);
        } catch (err) {
          console.error('Error in fallback assessment:', err);
        }
      }
      setIsGenerating(false);
    }
  };

  if (!completedSession) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto border border-indigo-100">
            <FileText className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">No Completed Interview Found</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              You haven't submitted an interview session yet. Complete a mock assessment to view your results.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/interview/setup')}
              icon={<RotateCcw className="h-4 w-4" />}
            >
              Start New Interview
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              icon={<LayoutDashboard className="h-4 w-4" />}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const formattedDuration = interviewService.formatDuration(completedSession.durationSeconds);
  const startDate = new Date(completedSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endDate = new Date(completedSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Score color helper
  const getScoreBadge = (score: number) => {
    if (score >= 85) return { bg: 'bg-emerald-500', text: 'text-emerald-700', label: 'Highly Competitive' };
    if (score >= 70) return { bg: 'bg-indigo-500', text: 'text-indigo-700', label: 'Job Ready' };
    if (score >= 50) return { bg: 'bg-amber-500', text: 'text-amber-700', label: 'Developing' };
    return { bg: 'bg-rose-500', text: 'text-rose-700', label: 'Needs Practice' };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Top Navigation & Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs group shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="h-4 w-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={completedSession.type.toLowerCase() as any}>
                  {completedSession.type} Session
                </Badge>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Assessment Completed
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interview Evaluation & Scorecard</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/history">
              <Button variant="outline" size="sm" icon={<History className="h-4 w-4" />}>
                Interview History
              </Button>
            </Link>
            <Link to="/interview/setup">
              <Button variant="outline" size="sm" icon={<RotateCcw className="h-4 w-4" />}>
                Start New Session
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Banner: Session Summary & Generate Assessment CTA */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 lg:p-8 text-white space-y-6 shadow-lg border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Candidate Session Log</span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>{completedSession.type} Assessment ({completedSession.domain})</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Duration: {formattedDuration} ({startDate} - {endDate}) • Questions Answered: {completedSession.answeredCount}/{completedSession.totalQuestions}
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="shrink-0">
              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerateAssessment}
                isLoading={isGenerating}
                icon={<Sparkles className="h-5 w-5" />}
              >
                {assessment ? 'Re-Generate Assessment' : 'Generate Assessment'}
              </Button>
            </div>
          </div>

          {/* Overall Score Badge Banner (When Assessment generated) */}
          {assessment && (
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl text-center shrink-0 min-w-[90px]">
                  <span className="text-3xl font-extrabold text-white font-mono">{assessment.overallScore}</span>
                  <span className="text-[10px] text-indigo-300 uppercase block font-semibold">/ 100</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Overall Readiness Score</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white ${getScoreBadge(assessment.overallScore).bg}`}>
                      {getScoreBadge(assessment.overallScore).label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-md leading-relaxed">
                    Weighted calculation: Communication (30%) + Confidence (25%) + Technical Relevance (30%) + Professionalism (15%)
                  </p>
                </div>
              </div>

              <div className="text-right text-xs text-slate-300 flex flex-col items-end gap-1">
                {assessment.isAiEvaluated || assessment.evaluationSource === 'Gemini AI' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 font-semibold text-[11px]">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                    Gemini AI Evaluated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-[11px]">
                    <Cpu className="h-3.5 w-3.5 text-slate-400" />
                    Local Rule Engine (Fallback)
                  </span>
                )}
                <span className="text-[10px] text-slate-400">Evaluated from candidate response text</span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 1: WEIGHED CATEGORY CARDS */}
        {assessment && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                <span>Weighted Category Performance</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">4 Core Evaluation Pillars</span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Communication */}
              <Card className="bg-white hover:border-indigo-200 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight: 30%</span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-xs font-bold text-slate-900">Communication</h3>
                      <span className="text-lg font-extrabold text-indigo-600 font-mono">{assessment.categoryScores.communication.score}%</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {assessment.categoryScores.communication.explanation}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">What Affected Score:</span>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      {assessment.categoryScores.communication.factors.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-indigo-500 font-bold">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              {/* 2. Confidence */}
              <Card className="bg-white hover:border-indigo-200 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight: 25%</span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-xs font-bold text-slate-900">Confidence</h3>
                      <span className="text-lg font-extrabold text-emerald-600 font-mono">{assessment.categoryScores.confidence.score}%</span>
                    </div>
                    <div className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-bold text-emerald-700">
                      Answer-Based Confidence Estimate
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {assessment.categoryScores.confidence.explanation}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">What Affected Score:</span>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      {assessment.categoryScores.confidence.factors.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              {/* 3. Technical Relevance */}
              <Card className="bg-white hover:border-indigo-200 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight: 30%</span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-xs font-bold text-slate-900">Technical Relevance</h3>
                      <span className="text-lg font-extrabold text-blue-600 font-mono">{assessment.categoryScores.technicalRelevance.score}%</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {assessment.categoryScores.technicalRelevance.explanation}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">What Affected Score:</span>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      {assessment.categoryScores.technicalRelevance.factors.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-blue-500 font-bold">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              {/* 4. Professionalism */}
              <Card className="bg-white hover:border-indigo-200 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight: 15%</span>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-xs font-bold text-slate-900">Professionalism</h3>
                      <span className="text-lg font-extrabold text-amber-600 font-mono">{assessment.categoryScores.professionalism.score}%</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {assessment.categoryScores.professionalism.explanation}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">What Affected Score:</span>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      {assessment.categoryScores.professionalism.factors.map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* SECTION 2: STRENGTHS, WEAKNESSES, SUGGESTIONS & PRACTICE RECOMMENDATIONS */}
        {assessment && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Strengths & Weaknesses */}
            <div className="space-y-6">
              {/* Strengths Card */}
              <Card title="Candidate Strengths" subtitle="At least 2 key strengths identified from answer analysis">
                <div className="space-y-2.5">
                  {assessment.keyStrengths.map((str, idx) => (
                    <div key={idx} className="p-3 bg-emerald-50/80 border border-emerald-100 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{str}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Weaknesses Card */}
              <Card title="Areas for Growth & Weaknesses" subtitle="At least 2 key weaknesses detected from response depth">
                <div className="space-y-2.5">
                  {assessment.weaknesses.map((wk, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/80 border border-amber-100 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                      <XCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{wk}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right: Improvement Suggestions & Practice Recommendations */}
            <div className="space-y-6">
              {/* Improvement Suggestions */}
              <Card title="Actionable Improvement Suggestions" subtitle="Specific guidance to boost future assessment scores">
                <div className="space-y-2.5">
                  {assessment.improvementSuggestions.map((sug, idx) => (
                    <div key={idx} className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
                      <Lightbulb className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">{sug}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Practice Recommendations */}
              <Card title="Recommended Practice Topics" subtitle="Targeted study topics based on weak technical areas">
                <div className="space-y-2">
                  {assessment.practiceRecommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold">
                        <BookOpen className="h-4 w-4 text-slate-500" />
                        <span>{rec}</span>
                      </div>
                      <Link to="/interview/setup" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800">
                        Practice →
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* SECTION 3: QUESTION-BY-QUESTION REVIEW */}
        <Card
          title="Question-by-Question Evaluation Review"
          subtitle="Detailed breakdown of candidate answers, assigned scores, and specific improvement suggestions"
        >
          <div className="space-y-6 divide-y divide-slate-100">
            {completedSession.questions.map((q, idx) => {
              const answerText = completedSession.answers[q.id];
              const isAnswered = !!(answerText && answerText.trim().length > 0);

              // Find feedback if generated
              const fb = assessment?.questionFeedbacks?.find((f) => f.questionId === q.id);

              return (
                <div key={q.id || idx} className="pt-6 first:pt-0 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          Question 0{idx + 1} • {q.category || completedSession.type}
                        </span>
                        {fb && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${fb.score >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            Score: {fb.score}/100
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 leading-relaxed">
                        {q.questionText}
                      </h3>
                    </div>

                    <div>
                      {isAnswered ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-lg border border-emerald-200 shrink-0">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Answered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 text-[11px] font-semibold rounded-lg border border-amber-200 shrink-0">
                          <AlertCircle className="h-3 w-3 text-amber-600" />
                          Unanswered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Candidate Answer Box */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidate Response:</span>
                    {isAnswered ? (
                      <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {answerText}
                      </p>
                    ) : (
                      <p className="text-slate-400 italic">No answer was provided for this question.</p>
                    )}
                  </div>

                  {/* Question Feedback (If assessment generated) */}
                  {fb && (
                    <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs space-y-2">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">Evaluation:</span>
                        <p className="text-indigo-950 font-medium leading-relaxed">{fb.evaluation}</p>
                      </div>
                      {fb.improvementSuggestion && (
                        <div>
                          <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">Improvement Suggestion:</span>
                          <p className="text-indigo-900 leading-relaxed">{fb.improvementSuggestion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* SECTION 4: RESULT ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            icon={<LayoutDashboard className="h-4 w-4" />}
          >
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/history')}
              icon={<History className="h-4 w-4" />}
            >
              View Interview History
            </Button>

            <Button
              variant="primary"
              onClick={() => navigate('/interview/setup')}
              icon={<RotateCcw className="h-4 w-4" />}
            >
              Start New Interview
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
