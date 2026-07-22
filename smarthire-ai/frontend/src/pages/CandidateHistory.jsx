import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Award, BarChart3, Loader2, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, Cell,
} from 'recharts';


export default function CandidateHistory() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [skillData, setSkillData] = useState(null);
  const [weakAreas, setWeakAreas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    Promise.all([
      api.get(`/analytics/candidate/${user.id}`),
      api.get(`/analytics/candidate/${user.id}/skills`),
      api.get(`/analytics/candidate/${user.id}/weak-areas`),
    ])
      .then(([analyticsRes, skillsRes, weakRes]) => {
        setReports(analyticsRes.data.reports || []);
        setSessions(analyticsRes.data.sessions || []);
        setSkillData(skillsRes.data);
        setWeakAreas(weakRes.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to fetch history'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-indigo-400">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-rose-400">
        {error}
      </div>
    );
  }

  // Format data for trend chart
  const chartData = reports.map((r, index) => ({
    name: `#${index + 1}`,
    score: Math.round(r.overallScore),
    date: new Date(r.createdAt).toLocaleDateString(),
  }));

  // Skill radar chart data
  const skillRadarData = skillData ? [
    { subject: 'Communication', score: skillData.avgCommunication },
    { subject: 'Confidence', score: skillData.avgConfidence },
    { subject: 'Technical', score: skillData.avgTechnical },
    { subject: 'Professionalism', score: skillData.avgProfessionalism },
  ] : [];

  // Score distribution for bar chart
  const distributionData = reports.length > 0
    ? [
      { range: '90-100', count: reports.filter((r) => r.overallScore >= 90).length, fill: '#34d399' },
      { range: '75-89', count: reports.filter((r) => r.overallScore >= 75 && r.overallScore < 90).length, fill: '#60a5fa' },
      { range: '60-74', count: reports.filter((r) => r.overallScore >= 60 && r.overallScore < 75).length, fill: '#fbbf24' },
      { range: '40-59', count: reports.filter((r) => r.overallScore >= 40 && r.overallScore < 60).length, fill: '#f97316' },
      { range: '<40', count: reports.filter((r) => r.overallScore < 40).length, fill: '#f43f5e' },
    ]
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold gradient-text">
            Interview History
          </h1>
          <p className="text-slate-400 mt-1">Track your progress over time</p>
        </motion.div>

        {reports.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-400">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>You haven't completed any interviews yet.</p>
            <Link to="/dashboard" className="mt-4 inline-block text-indigo-400 hover:underline">
              Start your first mock interview
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Row 1: Trend Chart + Skill Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Trend */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-6"
              >
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <BarChart3 className="text-indigo-400" /> Performance Trend
                </h2>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#818cf8" 
                        strokeWidth={3}
                        dot={{ fill: '#818cf8', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#fff', stroke: '#818cf8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Skill Radar */}
              {skillData && skillData.sessionCount > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6"
                >
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Target className="text-emerald-400" /> Average Skill Profile
                  </h2>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={skillRadarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 100]} stroke="#475569" tick={{ fill: '#64748b' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                          itemStyle={{ color: '#34d399' }}
                        />
                        <Radar dataKey="score" stroke="#34d399" fill="#34d399" fillOpacity={0.25} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Row 2: Score Distribution + Weak Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <BarChart3 className="text-cyan-400" /> Score Distribution
                </h2>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={distributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="range" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis allowDecimals={false} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {distributionData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Weak Areas + Recommendations */}
              {weakAreas && (weakAreas.weakAreas.length > 0 || weakAreas.recommendations.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6"
                >
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <AlertTriangle className="text-amber-400" /> Areas to Improve
                  </h2>

                  {weakAreas.weakAreas.length > 0 && (
                    <div className="space-y-3 mb-6">
                      {weakAreas.weakAreas.map((wa, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
                            {wa.score}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{wa.area}</p>
                            <p className="text-xs text-slate-400">Avg score across recent sessions</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {weakAreas.recommendations.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <Lightbulb size={12} className="text-cyan-400" /> Recommendations
                      </p>
                      <ul className="space-y-2">
                        {weakAreas.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-cyan-500/30">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Row 3: Recent Reports List */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Award className="text-emerald-400" /> All Interview Reports
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.slice().reverse().map((report) => (
                  <Link 
                    key={report._id} 
                    to={`/report/${report.sessionId}`}
                    className="block bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/50 hover:border-indigo-500/30 rounded-xl p-5 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-3xl font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {Math.round(report.overallScore)}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-700/50 text-slate-300 font-mono">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-emerald-400 mb-1.5">{report.rating}</p>
                    <div className="flex gap-2 text-[10px] text-slate-500">
                      <span>C:{Math.round(report.communicationScore)}</span>
                      <span>·</span>
                      <span>Cf:{Math.round(report.confidenceScore)}</span>
                      <span>·</span>
                      <span>T:{Math.round(report.technicalScore)}</span>
                      <span>·</span>
                      <span>P:{Math.round(report.professionalismScore)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
