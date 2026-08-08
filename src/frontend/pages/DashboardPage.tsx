import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ScoreCard } from '../components/common/ScoreCard';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { assessmentService } from '../services/assessmentService';
import { AssessmentResult } from '../../types';
import {
  Sparkles,
  Play,
  FileText,
  CheckCircle2,
  Clock,
  Award,
  ArrowUpRight,
  Target,
  Code2,
  TrendingUp,
  AlertTriangle,
  Flame,
  Star
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [assessments, setAssessments] = useState<AssessmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const saved = await assessmentService.getAllAssessmentsAsync();
        setAssessments(saved);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleLoadDemoData = () => {
    const seeded = assessmentService.seedDemoData();
    setAssessments(seeded);
  };

  // Compute metrics dynamically from stored assessments
  const totalInterviews = assessments.length;
  const averageScore = totalInterviews > 0
    ? Math.round(assessments.reduce((sum, a) => sum + (a.overallScore || 0), 0) / totalInterviews)
    : 0;

  const latestScore = totalInterviews > 0 ? assessments[0].overallScore : 0;
  const bestScore = totalInterviews > 0 ? Math.max(...assessments.map((a) => a.overallScore || 0)) : 0;

  // Weakest category computation
  let weakestCategory = 'N/A';
  let lowestCategoryAvg = 100;

  if (totalInterviews > 0) {
    const commAvg = Math.round(assessments.reduce((sum, a) => sum + (a.categoryScores?.communication?.score ?? 70), 0) / totalInterviews);
    const confAvg = Math.round(assessments.reduce((sum, a) => sum + (a.categoryScores?.confidence?.score ?? 70), 0) / totalInterviews);
    const techAvg = Math.round(assessments.reduce((sum, a) => sum + (a.categoryScores?.technicalRelevance?.score ?? 70), 0) / totalInterviews);
    const profAvg = Math.round(assessments.reduce((sum, a) => sum + (a.categoryScores?.professionalism?.score ?? 70), 0) / totalInterviews);

    const categories = [
      { name: 'Communication', score: commAvg },
      { name: 'Confidence', score: confAvg },
      { name: 'Technical Relevance', score: techAvg },
      { name: 'Professionalism', score: profAvg },
    ];

    categories.forEach((cat) => {
      if (cat.score < lowestCategoryAvg) {
        lowestCategoryAvg = cat.score;
        weakestCategory = cat.name;
      }
    });
  }

  // Domain readiness percentages
  const techScoreAvg = totalInterviews > 0
    ? Math.round(assessments.reduce((s, a) => s + (a.categoryScores?.technicalRelevance?.score ?? a.metrics?.technicalDepth ?? 0), 0) / totalInterviews)
    : 0;
  const commScoreAvg = totalInterviews > 0
    ? Math.round(assessments.reduce((s, a) => s + (a.categoryScores?.communication?.score ?? a.metrics?.communication ?? 0), 0) / totalInterviews)
    : 0;
  const confScoreAvg = totalInterviews > 0
    ? Math.round(assessments.reduce((s, a) => s + (a.categoryScores?.confidence?.score ?? a.metrics?.confidence ?? 0), 0) / totalInterviews)
    : 0;
  const profScoreAvg = totalInterviews > 0
    ? Math.round(assessments.reduce((s, a) => s + (a.categoryScores?.professionalism?.score ?? 0), 0) / totalInterviews)
    : 0;

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Target Domain: Software Engineering</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Candidate Performance Dashboard</h1>
            <p className="text-slate-300 text-xs lg:text-sm leading-relaxed">
              {totalInterviews > 0 ? (
                <>Your average readiness score across <strong>{totalInterviews} session(s)</strong> is <strong className="text-emerald-400">{averageScore}%</strong>. Latest session scored <strong className="text-indigo-300">{latestScore}%</strong>.</>
              ) : (
                <>No completed interview assessments recorded yet. Click below to launch your first adaptive AI mock session.</>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/interview/setup">
              <Button variant="primary" size="md" icon={<Play className="h-4 w-4" />}>
                Start AI Mock Session
              </Button>
            </Link>
            <Link to="/resume">
              <Button variant="secondary" size="md" icon={<FileText className="h-4 w-4" />}>
                Resume Analysis
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ScoreCard
          title="Total Interviews"
          value={totalInterviews}
          subtitle="Completed mock sessions"
          icon={<Target className="h-5 w-5" />}
          highlightColor="indigo"
        />
        <ScoreCard
          title="Average Score"
          value={totalInterviews > 0 ? `${averageScore}%` : '0%'}
          subtitle="Overall mean performance"
          icon={<Award className="h-5 w-5" />}
          highlightColor="emerald"
        />
        <ScoreCard
          title="Latest Score"
          value={totalInterviews > 0 ? `${latestScore}%` : 'N/A'}
          subtitle="Most recent session"
          icon={<TrendingUp className="h-5 w-5" />}
          highlightColor="blue"
        />
        <ScoreCard
          title="Best Score"
          value={totalInterviews > 0 ? `${bestScore}%` : 'N/A'}
          subtitle="All-time high score"
          icon={<Star className="h-5 w-5" />}
          highlightColor="amber"
        />
        <ScoreCard
          title="Weakest Category"
          value={weakestCategory}
          subtitle={lowestCategoryAvg < 100 ? `Avg: ${lowestCategoryAvg}%` : 'No weak points'}
          icon={<AlertTriangle className="h-5 w-5" />}
          highlightColor="rose"
        />
      </div>

      {/* Main Grid Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Interviews & Category Readiness */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Recent Mock Assessments"
            subtitle="Detailed scorecards and candidate evaluation reports"
            action={
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleLoadDemoData}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  Load Sample Demo Data
                </button>
                <Link to="/history" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  <span>View All History</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            }
          >
            {assessments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {assessments.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                        <Badge variant={item.type.toLowerCase() as any}>{item.type}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{item.durationMinutes} minutes</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">{item.overallScore}%</div>
                        <div className={`text-[10px] font-semibold ${item.overallScore >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {item.overallScore >= 70 ? 'Passed' : 'Needs Practice'}
                        </div>
                      </div>
                      <Link to="/interview/result">
                        <Button variant="outline" size="sm">
                          Scorecard
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 space-y-3">
                <p>No mock interview sessions completed yet.</p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={handleLoadDemoData} icon={<Sparkles className="h-4 w-4 text-indigo-600" />}>
                    Load Sample Demo Data
                  </Button>
                  <Link to="/interview/setup">
                    <Button variant="primary" size="sm" icon={<Play className="h-4 w-4" />}>
                      Take Your First Assessment
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>

          {/* Assessment Domain Breakdown */}
          <Card title="Candidate Competency Breakdown" subtitle="Mean performance calculated from stored assessments">
            <div className="space-y-4">
              <ProgressBar label="Technical Relevance (30% Weight)" value={techScoreAvg} color="indigo" />
              <ProgressBar label="Communication Depth (30% Weight)" value={commScoreAvg} color="emerald" />
              <ProgressBar label="Answer Confidence (25% Weight)" value={confScoreAvg} color="blue" />
              <ProgressBar label="Professionalism (15% Weight)" value={profScoreAvg} color="amber" />
            </div>
          </Card>
        </div>

        {/* Right Column: AI Insights & Quick Start */}
        <div className="space-y-6">
          <Card
            title="AI Evaluation Coaching"
            subtitle="Targeted feedback derived from recent answers"
            headerClassName="bg-slate-50/50"
          >
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-indigo-900">
                  <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Strengthen Technical Relevance</span>
                </div>
                <p className="text-indigo-800 leading-relaxed text-[11px]">
                  Include explicit framework terms (e.g. state management, caching, indexing) in technical responses to maximize relevance scores.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-100 text-emerald-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>STAR Methodology</span>
                </div>
                <p className="text-emerald-800 leading-relaxed text-[11px]">
                  Ensure behavioral answers follow Situation-Task-Action-Result format with quantified results.
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Start Module */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-2xl p-6 shadow-md space-y-4">
            <div className="p-2.5 bg-white/10 rounded-xl w-fit">
              <Code2 className="h-6 w-6 text-indigo-200" />
            </div>
            <div>
              <h3 className="text-base font-bold">Ready for Another Mock?</h3>
              <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                Practice Technical, HR, Behavioral, or Aptitude interviews with real-time scoring.
              </p>
            </div>
            <Link to="/interview/setup" className="block">
              <Button variant="secondary" className="w-full bg-white text-indigo-900 hover:bg-indigo-50 border-none font-bold">
                Configure New Interview
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
