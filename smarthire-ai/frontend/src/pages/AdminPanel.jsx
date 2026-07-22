import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import {
  Users, Shield, Settings, BarChart3, Trash2, ChevronLeft, ChevronRight,
  Loader2, Search, UserCheck, Activity, Award, TrendingUp,
} from 'lucide-react';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'stats') fetchStats();
    if (tab === 'settings') fetchSettings();
  }, [tab, page, search, roleFilter]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  }

  async function fetchSettings() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/settings');
      setSettings(data.settings);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  }

  async function handleDeleteUser(userId) {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    try {
      const { data } = await api.patch('/admin/settings', settings);
      setSettings(data.settings);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: 'users', label: 'Users', icon: <Users size={16} /> },
    { id: 'stats', label: 'Analytics', icon: <BarChart3 size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield size={24} className="text-indigo-400" />
            <h1 className="text-3xl font-bold gradient-text">Admin Panel</h1>
          </div>
          <p className="text-slate-400">Manage users, monitor platform activity, and configure settings.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-800 pb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* ── Users Tab ── */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="input-field pl-9"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                className="input-field w-auto md:w-48"
              >
                <option value="">All Roles</option>
                <option value="candidate">Candidate</option>
                <option value="recruiter">Recruiter</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                      <th className="px-6 py-4 font-medium">Joined</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loading ? (
                      <tr><td colSpan="5" className="py-12 text-center text-slate-500"><Loader2 className="animate-spin mx-auto" /></td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan="5" className="py-12 text-center text-slate-500">No users found.</td></tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                                {u.name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <span className="text-slate-200 font-medium">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{u.email}</td>
                          <td className="px-6 py-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-medium capitalize focus:outline-none focus:border-indigo-500"
                            >
                              <option value="candidate">Candidate</option>
                              <option value="recruiter">Recruiter</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-between items-center px-6 py-4 border-t border-slate-800 bg-slate-800/30">
                  <span className="text-xs text-slate-500">
                    Page {pagination.page} of {pagination.pages} · {pagination.total} total users
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={page >= pagination.pages}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Analytics Tab ── */}
        {tab === 'stats' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loading ? (
              <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-400" size={32} /></div>
            ) : stats ? (
              <div className="space-y-8">
                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Users', value: stats.totalUsers, icon: <Users size={20} />, color: 'text-indigo-400 bg-indigo-400/10' },
                    { label: 'Candidates', value: stats.totalCandidates, icon: <UserCheck size={20} />, color: 'text-emerald-400 bg-emerald-400/10' },
                    { label: 'Completed Interviews', value: stats.completedSessions, icon: <Activity size={20} />, color: 'text-cyan-400 bg-cyan-400/10' },
                    { label: 'Avg Score', value: stats.avgScore, icon: <TrendingUp size={20} />, color: 'text-amber-400 bg-amber-400/10' },
                  ].map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass-card p-6"
                    >
                      <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-4`}>
                        {s.icon}
                      </div>
                      <p className="text-3xl font-bold text-slate-100 mb-1">{s.value}</p>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{s.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Rating Distribution */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Award size={20} className="text-emerald-400" /> Rating Distribution
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(stats.ratingDistribution || {}).map(([rating, count]) => {
                      const total = stats.totalReports || 1;
                      const pct = Math.round((count / total) * 100);
                      const colors = {
                        Excellent: 'bg-emerald-500',
                        Good: 'bg-blue-500',
                        Average: 'bg-amber-500',
                        'Needs Improvement': 'bg-orange-500',
                        Poor: 'bg-rose-500',
                      };
                      return (
                        <div key={rating} className="flex items-center gap-4">
                          <span className="w-40 text-sm text-slate-300 font-medium">{rating}</span>
                          <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className={`h-3 rounded-full ${colors[rating] || 'bg-slate-500'}`}
                            />
                          </div>
                          <span className="w-16 text-right text-sm text-slate-400 font-mono">{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Extra stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-card p-6 text-center">
                    <p className="text-sm text-slate-400 mb-2">Total Sessions</p>
                    <p className="text-4xl font-bold text-slate-100">{stats.totalSessions}</p>
                  </div>
                  <div className="glass-card p-6 text-center">
                    <p className="text-sm text-slate-400 mb-2">Recruiters</p>
                    <p className="text-4xl font-bold text-slate-100">{stats.totalRecruiters}</p>
                  </div>
                  <div className="glass-card p-6 text-center">
                    <p className="text-sm text-slate-400 mb-2">Admins</p>
                    <p className="text-4xl font-bold text-slate-100">{stats.totalAdmins}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* ── Settings Tab ── */}
        {tab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loading ? (
              <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-400" size={32} /></div>
            ) : settings ? (
              <div className="glass-card p-8 max-w-2xl">
                <h3 className="text-xl font-semibold mb-8 flex items-center gap-2">
                  <Settings size={20} className="text-indigo-400" /> Platform Configuration
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Platform Name</label>
                    <input
                      className="input-field"
                      value={settings.platformName || ''}
                      onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Max Questions Per Session</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className="input-field w-32"
                      value={settings.maxQuestionsPerSession || 8}
                      onChange={(e) => setSettings({ ...settings, maxQuestionsPerSession: parseInt(e.target.value) || 8 })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Default Difficulty</label>
                    <select
                      className="input-field w-48"
                      value={settings.defaultDifficulty || 'medium'}
                      onChange={(e) => setSettings({ ...settings, defaultDifficulty: e.target.value })}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Feature Toggles</p>
                    {[
                      { key: 'enableEmotionDetection', label: 'Emotion Detection' },
                      { key: 'enableEyeTracking', label: 'Eye-Contact Tracking' },
                      { key: 'enableWhisperTranscription', label: 'Whisper Transcription' },
                      { key: 'maintenanceMode', label: 'Maintenance Mode' },
                    ].map((toggle) => (
                      <label key={toggle.key} className="flex items-center justify-between py-2 cursor-pointer group">
                        <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">{toggle.label}</span>
                        <div
                          onClick={() => setSettings({ ...settings, [toggle.key]: !settings[toggle.key] })}
                          className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${
                            settings[toggle.key] ? 'bg-indigo-500' : 'bg-slate-700'
                          }`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                            settings[toggle.key] ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
                  >
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Settings'}
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </div>
    </div>
  );
}
