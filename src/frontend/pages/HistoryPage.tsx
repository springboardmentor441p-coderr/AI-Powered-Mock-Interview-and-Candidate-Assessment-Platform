import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';
import { assessmentService } from '../services/assessmentService';
import { AssessmentResult, InterviewType } from '../../types';
import {
  History,
  Search,
  Filter,
  Calendar,
  Clock,
  Award,
  ArrowUpRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await api.interview.getHistory();
        setHistory(data);
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    }
    loadHistory();
  }, []);

  const handleLoadDemo = () => {
    const seeded = assessmentService.seedDemoData();
    setHistory(seeded);
  };

  const filtered = history.filter((item) => {
    const matchesFilter = selectedFilter === 'ALL' || item.type.toUpperCase() === selectedFilter.toUpperCase();
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interview Practice History</h1>
            <p className="text-xs text-slate-500 mt-1">
              Review past mock interview logs, scores, and candidate feedback reports.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search assessment history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-semibold">
            {['ALL', 'Technical', 'Behavioral', 'HR', 'Aptitude'].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedFilter === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* History Cards / List */}
        <Card>
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-900">{item.title}</span>
                    <Badge variant={item.type.toLowerCase() as any}>{item.type}</Badge>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {item.durationMinutes} Minutes
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-slate-900">{item.overallScore}%</div>
                    <div className="text-[10px] font-semibold text-emerald-600">Passed</div>
                  </div>

                  <Link to="/interview/result">
                    <Button variant="outline" size="sm" icon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                      View Scorecard
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 space-y-3">
                <p>No matching mock interview logs found.</p>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadDemo}
                    icon={<Sparkles className="h-4 w-4 text-indigo-600" />}
                  >
                    Load Sample Demo Data
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
