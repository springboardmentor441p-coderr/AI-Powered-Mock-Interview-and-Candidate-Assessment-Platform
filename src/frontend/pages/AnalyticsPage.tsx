import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/common/Card';
import { ScoreCard } from '../components/common/ScoreCard';
import { MetricRadarChart } from '../components/charts/MetricRadarChart';
import { ProgressBar } from '../components/common/ProgressBar';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { AnalyticsSummary } from '../../types';
import {
  BarChart3,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  PieChart,
  Activity,
  Layers,
  ArrowLeft
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await api.analytics.getSummary();
        setSummary(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      }
    }
    loadAnalytics();
  }, []);

  if (!summary) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-slate-500">Loading performance analytics...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs group shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Performance Analytics</h1>
            <p className="text-xs text-slate-500 mt-1">
              Track evaluation trends over time, identify domain weak points, and measure job readiness progression.
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <ScoreCard
            title="Readiness Status"
            value={summary.readinessLevel}
            subtitle="Targeting Senior Full Stack"
            icon={<Award className="h-5 w-5" />}
            highlightColor="indigo"
          />
          <ScoreCard
            title="Average Score"
            value={`${summary.averageScore}%`}
            subtitle="Across all practice sessions"
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{ value: '5.4%', isPositive: true }}
            highlightColor="emerald"
          />
          <ScoreCard
            title="Total Sessions"
            value={summary.totalInterviews}
            subtitle="Full mock assessments"
            icon={<Layers className="h-5 w-5" />}
            highlightColor="blue"
          />
          <ScoreCard
            title="Practice Time"
            value={`${Math.round(summary.totalPracticeTimeMinutes / 60)} Hours`}
            subtitle={`${summary.totalPracticeTimeMinutes} total minutes`}
            icon={<Clock className="h-5 w-5" />}
            highlightColor="amber"
          />
        </div>

        {/* Radar Chart & Score Progress */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Candidate Competency Radar" subtitle="Multidimensional skill distribution">
            <MetricRadarChart data={summary.radarMetrics} size={280} />
          </Card>

          <Card title="Interview Domain Breakdown" subtitle="Performance comparison across 4 pillars">
            <div className="space-y-6">
              {summary.categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">{cat.type} Interviews</span>
                    <span className="text-slate-500">{cat.count} Sessions • Avg {cat.avgScore}%</span>
                  </div>
                  <ProgressBar value={cat.avgScore} showPercentage={false} color={idx % 2 === 0 ? 'indigo' : 'emerald'} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Score Evolution Timeline */}
        <Card title="Recent Assessment Timeline" subtitle="Historical score progression over past 6 sessions">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
            {summary.recentPerformance.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="text-[10px] text-slate-400 font-semibold">{item.date}</div>
                <div className="text-xl font-extrabold text-indigo-600">{item.score}%</div>
                <Badge variant={item.category.toLowerCase() as any} size="sm">
                  {item.category}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
