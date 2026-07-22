import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
  Users, Search, ChevronRight, Loader2, Sparkles, Plus, Trash2, FileText,
  BarChart3,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';


export default function RecruiterDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('candidates');

  // Template form
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [tName, setTName] = useState('');
  const [tType, setTType] = useState('technical');
  const [tDifficulty, setTDifficulty] = useState('medium');
  const [tDomain, setTDomain] = useState('');
  const [tQuestions, setTQuestions] = useState('');
  const [tSaving, setTSaving] = useState(false);

  useEffect(() => {
    if (user && user.role === 'candidate') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  async function fetchData() {
    setLoading(true);
    try {
      const [candRes, templRes] = await Promise.all([
        api.get('/analytics/recruiter/candidates'),
        api.get('/interview/templates'),
      ]);
      setCandidates(candRes.data.candidates || []);
      setTemplates(templRes.data.templates || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTemplate(e) {
    e.preventDefault();
    if (!tName) return;
    setTSaving(true);
    try {
      const customQuestions = tQuestions
        .split('\n')
        .map((q) => q.trim())
        .filter((q) => q.length > 0);

      await api.post('/interview/template', {
        name: tName,
        type: tType,
        difficulty: tDifficulty,
        domain: tDomain || 'general',
        customQuestions,
        isPublic: true,
      });

      setShowTemplateForm(false);
      setTName('');
      setTQuestions('');
      setTDomain('');
      const { data } = await api.get('/interview/templates');
      setTemplates(data.templates || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create template');
    } finally {
      setTSaving(false);
    }
  }

  async function handleDeleteTemplate(id) {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.delete(`/interview/template/${id}`);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete template');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-emerald-400">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  const filteredCandidates = candidates.filter((c) => {
    const name = c.user?.name?.toLowerCase() || '';
    const email = c.user?.email?.toLowerCase() || '';
    const rating = c.latestReport?.rating?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q) || rating.includes(q);
  });

  // Score distribution chart data
  const scoreDistribution = [
    { range: 'Excellent', count: candidates.filter((c) => c.latestReport?.overallScore >= 90).length, fill: '#34d399' },
    { range: 'Good', count: candidates.filter((c) => c.latestReport?.overallScore >= 75 && c.latestReport?.overallScore < 90).length, fill: '#60a5fa' },
    { range: 'Average', count: candidates.filter((c) => c.latestReport?.overallScore >= 60 && c.latestReport?.overallScore < 75).length, fill: '#fbbf24' },
    { range: 'Below Avg', count: candidates.filter((c) => c.latestReport?.overallScore < 60).length, fill: '#f97316' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={20} className="text-emerald-400" />
            <h1 className="text-3xl font-bold gradient-text">Recruiter Portal</h1>
          </div>
          <p className="text-slate-400">Welcome back, {user?.name}. Manage candidates and interview templates.</p>
        </motion.div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-800 pb-4">
          {[
            { id: 'candidates', label: 'Candidates', icon: <Users size={16} /> },
            { id: 'templates', label: 'Interview Templates', icon: <FileText size={16} /> },
            { id: 'insights', label: 'Insights', icon: <BarChart3 size={16} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Candidates Tab ── */}
        {tab === 'candidates' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-800/30">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users size={20} className="text-emerald-400" /> Candidate Pipeline
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full ml-2">{candidates.length}</span>
                </h2>
                <div className="relative w-full md:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, rating..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/50 text-slate-400 uppercase tracking-wider text-xs border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">Candidate</th>
                      <th className="px-6 py-4 font-medium">Latest Score</th>
                      <th className="px-6 py-4 font-medium">Rating</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                          No candidates found.
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((c, i) => (
                        <motion.tr 
                          key={c._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-slate-800/40 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {c.user?.name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="text-slate-200 font-medium">{c.user?.name || 'Unknown'}</p>
                                <p className="text-xs text-slate-500">{c.user?.email || ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-[100px]">
                                <div 
                                  className="bg-emerald-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${Math.round(c.latestReport?.overallScore || 0)}%` }}
                                />
                              </div>
                              <span className="font-semibold text-slate-200">
                                {Math.round(c.latestReport?.overallScore || 0)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              c.latestReport?.rating === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              c.latestReport?.rating === 'Good' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              c.latestReport?.rating === 'Average' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            }`}>
                              {c.latestReport?.rating || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs">
                            {c.latestReport ? new Date(c.latestReport.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {c.latestReport && (
                              <Link 
                                to={`/report/${c.latestReport.sessionId}`}
                                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition-colors text-sm"
                              >
                                View <ChevronRight size={16} />
                              </Link>
                            )}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Templates Tab ── */}
        {tab === 'templates' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Interview Templates</h2>
              <button
                onClick={() => setShowTemplateForm(!showTemplateForm)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={16} /> New Template
              </button>
            </div>

            {/* Create Template Form */}
            {showTemplateForm && (
              <motion.form
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleCreateTemplate}
                className="glass-card p-6 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Template Name</label>
                    <input value={tName} onChange={(e) => setTName(e.target.value)} required className="input-field" placeholder="e.g. Senior React Developer" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Domain</label>
                    <input value={tDomain} onChange={(e) => setTDomain(e.target.value)} className="input-field" placeholder="e.g. Frontend Development" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Type</label>
                    <select value={tType} onChange={(e) => setTType(e.target.value)} className="input-field">
                      <option value="technical">Technical</option>
                      <option value="hr">HR</option>
                      <option value="behavioral">Behavioral</option>
                      <option value="aptitude">Aptitude</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Difficulty</label>
                    <select value={tDifficulty} onChange={(e) => setTDifficulty(e.target.value)} className="input-field">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Custom Questions (one per line, optional)</label>
                  <textarea
                    value={tQuestions}
                    onChange={(e) => setTQuestions(e.target.value)}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="What is your experience with React hooks?&#10;Explain the Virtual DOM.&#10;How do you handle state management?"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={tSaving} className="btn-primary">
                    {tSaving ? 'Creating...' : 'Create Template'}
                  </button>
                  <button type="button" onClick={() => setShowTemplateForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.length === 0 ? (
                <div className="col-span-full glass-card p-12 text-center text-slate-500">
                  No templates yet. Create one to get started.
                </div>
              ) : (
                templates.map((t) => (
                  <motion.div
                    key={t._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card-hover p-6"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-base font-semibold text-slate-200">{t.name}</h3>
                      <button
                        onClick={() => handleDeleteTemplate(t._id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase font-medium">{t.type}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase font-medium">{t.difficulty}</span>
                      {t.domain && t.domain !== 'general' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">{t.domain}</span>
                      )}
                    </div>
                    {t.customQuestions && t.customQuestions.length > 0 && (
                      <p className="text-xs text-slate-500">{t.customQuestions.length} custom questions</p>
                    )}
                    <p className="text-[10px] text-slate-600 mt-2">
                      By {t.createdBy?.name || 'Unknown'} · {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ── Insights Tab ── */}
        {tab === 'insights' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-6 text-center">
                <p className="text-3xl font-bold text-slate-100">{candidates.length}</p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Total Candidates</p>
              </div>
              <div className="glass-card p-6 text-center">
                <p className="text-3xl font-bold text-emerald-400">
                  {candidates.filter((c) => c.latestReport?.overallScore >= 75).length}
                </p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Good or Above</p>
              </div>
              <div className="glass-card p-6 text-center">
                <p className="text-3xl font-bold text-slate-100">
                  {candidates.length > 0
                    ? Math.round(candidates.reduce((s, c) => s + (c.latestReport?.overallScore || 0), 0) / candidates.length)
                    : 0}
                </p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Avg Score</p>
              </div>
              <div className="glass-card p-6 text-center">
                <p className="text-3xl font-bold text-slate-100">{templates.length}</p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Templates</p>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <BarChart3 className="text-emerald-400" /> Rating Distribution
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="range" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis allowDecimals={false} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
