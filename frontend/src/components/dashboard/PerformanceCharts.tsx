'use client';

import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis 
} from 'recharts';
import { TrendingUp, Radar as RadarIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PerformanceCharts: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { reports } = useApp();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute history progression line chart data from candidate reports
  const sortedReports = [...reports].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const historyData = sortedReports.map((r) => ({
    date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: r.overallScore
  }));

  // Compute skill radar chart averages from candidate reports
  const count = reports.length || 1;
  const avgTech = Math.round(reports.reduce((sum, r) => sum + r.categoryScores.technicalKnowledge, 0) / count) || 50;
  const avgProb = Math.round(reports.reduce((sum, r) => sum + r.categoryScores.behavioralSkills, 0) / count) || 50;
  const avgComm = Math.round(reports.reduce((sum, r) => sum + r.categoryScores.communicationSkills, 0) / count) || 50;
  const avgBody = Math.round(reports.reduce((sum, r) => sum + r.categoryScores.bodyLanguage, 0) / count) || 50;
  const avgPacing = Math.round(reports.reduce((sum, r) => sum + r.categoryScores.deliveryAndPacing, 0) / count) || 50;

  const radarSkillData = [
    { skill: 'Technical Knowledge', candidate: avgTech, target: 85 },
    { skill: 'Problem Solving', candidate: avgProb, target: 80 },
    { skill: 'Communication', candidate: avgComm, target: 80 },
    { skill: 'Confidence', candidate: avgBody, target: 75 },
    { skill: 'Delivery & Pacing', candidate: avgPacing, target: 85 }
  ];

  if (!mounted) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Historical Trend Line Chart */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#059669]" />
            <h3 className="text-base font-bold text-slate-900">Score Progression Trend</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">{historyData.length} Session(s)</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData.length > 0 ? historyData : [{ date: 'Today', score: 0 }]}>
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#059669"
                strokeWidth={3}
                dot={{ fill: '#059669', r: 5 }}
                activeDot={{ r: 7, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Skill Radar Chart */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RadarIcon className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">Skill Radar Breakdown</h3>
          </div>
          <span className="text-xs font-bold text-[#059669] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Vs Benchmark
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarSkillData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="skill" stroke="#475569" fontSize={10} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94A3B8" fontSize={9} />
              <Radar
                name="Candidate Score"
                dataKey="candidate"
                stroke="#059669"
                fill="#059669"
                fillOpacity={0.35}
              />
              <Radar
                name="Target Benchmark"
                dataKey="target"
                stroke="#0284C7"
                fill="#0284C7"
                fillOpacity={0.15}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
