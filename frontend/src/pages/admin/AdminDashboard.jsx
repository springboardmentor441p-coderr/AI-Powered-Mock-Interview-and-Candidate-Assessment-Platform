import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../services/api';

export default function AdminDashboard({ navigate }) {
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState('All');

  useEffect(() => {
    async function load() {
      try {
        const [s, c, h] = await Promise.all([api.stats(), api.getCandidates(), api.getHistory()]);
        setStats(s);
        setCandidates(c);
        setHistory(h);
      } catch (err) {
        if (err.message?.includes('401')) navigate('auth');
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const domains = ['All', ...new Set(history.map(s => s.interview_type))];
  const filtered = filterDomain === 'All' ? history : history.filter(s => s.interview_type === filterDomain);

  const statusColor = s => s === 'completed' ? 'text-primary' : s === 'active' ? 'text-secondary-container animate-pulse' : 'text-error';
  const statusLabel = s => s === 'completed' ? 'Analyzed' : s === 'active' ? 'Live Interviewing' : 'Connection Issue';

  return (
    <Layout navigate={navigate} active="admin-dashboard">
      <div className="flex flex-col px-gutter pt-8 pb-12">

        {/* KPI Row */}
        <div className="grid grid-cols-12 gap-gutter mb-12">
          {[
            { label: 'Total Interviews', value: stats?.total_sessions ?? 0, sub: '+14% this month', icon: 'bar_chart', border: 'border-l-primary' },
            { label: 'Avg Candidate Score', value: `${stats?.avg_score ?? 0}%`, sub: 'Platform average', icon: 'psychology', border: 'border-l-secondary-container' },
            { label: 'Active Sessions', value: history.filter(s => s.status === 'active').length, sub: 'Real-time sync active', icon: 'wifi_tethering', border: 'border-l-primary-fixed-dim' },
          ].map((k, i) => (
            <div key={k.label} className={`col-span-12 md:col-span-4 bg-surface-container-low/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 border-l-2 ${k.border} relative overflow-hidden group`}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="flex items-start justify-between relative">
                <div>
                  <span className="font-mono-label text-mono-label text-on-surface-variant uppercase block mb-2">{k.label}</span>
                  <span className="font-display-lg text-display-lg text-on-surface">{loading ? '—' : k.value}</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="material-symbols-outlined text-primary text-[14px]">trending_up</span>
                    <span className="font-mono-label text-mono-label text-primary">{k.sub}</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant/30 text-[40px]">{k.icon}</span>
              </div>
            </div>
          ))}

          {/* Create session button */}
          <div className="col-span-12 md:col-span-12 lg:col-span-0 hidden lg:flex items-center justify-end">
            <button onClick={() => navigate('interview-setup')} className="w-16 h-16 rounded-full bg-primary shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center text-on-primary hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-[28px]">add</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-gutter">
          {/* Partner entities / Candidates */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-surface-container-low/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline-md text-headline-md text-on-surface">Registered Candidates</h2>
                <span className="font-mono-label text-mono-label text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-lg">
                  {candidates.length} Total
                </span>
              </div>
              {loading ? (
                <div className="flex justify-center py-8"><div className="w-3 h-3 rounded-full bg-primary animate-ping" /></div>
              ) : (
                <div className="space-y-3">
                  {candidates.slice(0, 6).map((c, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-high/20 rounded-xl border border-outline-variant/10 hover:border-primary/20 transition-all cursor-pointer group">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                        {(c.name || c.email)?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-label-md text-label-md text-on-surface truncate">{c.name || 'Unknown'}</p>
                        <p className="font-mono-label text-mono-label text-on-surface-variant truncate">{c.college_name || c.email || '—'}</p>
                      </div>
                      {c.resume_name && (
                        <span className="font-mono-label text-mono-label text-primary bg-primary/10 px-2 py-0.5 rounded-full text-[10px] uppercase flex-shrink-0">Resume</span>
                      )}
                    </div>
                  ))}
                  {candidates.length === 0 && (
                    <p className="font-body-md text-on-surface-variant text-center py-8">No candidates yet.</p>
                  )}
                  <button onClick={() => navigate('admin-candidates')} className="w-full text-center font-label-md text-label-md text-primary hover:underline pt-2">
                    + View All Candidates
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Live Session Feed */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-surface-container-low/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5 h-full">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Live Session Feed</h2>
                  <p className="font-body-md text-on-surface-variant">Monitor real-time candidate interactions and AI assessment flow.</p>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 mt-4 mb-6">
                {domains.map(d => (
                  <button key={d} onClick={() => setFilterDomain(d)}
                    className={`px-4 py-2 rounded-full font-mono-label text-mono-label uppercase text-[11px] transition-all ${
                      filterDomain === d ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >{d}</button>
                ))}
              </div>

              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-2 mb-2">
                {['Candidate', 'Domain', 'Status', 'Progress'].map(h => (
                  <span key={h} className="col-span-3 font-mono-label text-mono-label text-on-surface-variant uppercase text-[10px]">{h}</span>
                ))}
              </div>

              <div className="space-y-2">
                {loading ? (
                  <div className="flex justify-center py-8"><div className="w-3 h-3 rounded-full bg-primary animate-ping" /></div>
                ) : filtered.length === 0 ? (
                  <p className="font-body-md text-on-surface-variant text-center py-8">No sessions found.</p>
                ) : (
                  filtered.slice(0, 8).map(s => (
                    <div key={s.id} className="grid grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-surface-container-high/20 transition-all">
                      <div className="col-span-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-mono-label text-mono-label text-on-surface-variant text-[11px] flex-shrink-0">
                          #{s.id}
                        </div>
                        <span className="font-label-md text-label-md text-on-surface truncate">Session {s.id}</span>
                      </div>
                      <div className="col-span-3">
                        <span className="font-mono-label text-mono-label bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded-lg text-[10px] uppercase">{s.interview_type}</span>
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'completed' ? 'bg-primary' : 'bg-error'}`} />
                        <span className={`font-label-md text-label-md ${statusColor(s.status)} text-sm`}>{statusLabel(s.status)}</span>
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        <div className="flex-1 h-0.5 bg-surface-container-highest rounded-full">
                          <div className="h-full bg-primary rounded-full" style={{ width: s.status === 'completed' ? '100%' : '50%' }} />
                        </div>
                        <span className="font-mono-label text-mono-label text-on-surface-variant text-[11px]">{s.status === 'completed' ? '100%' : '—'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer status */}
              <div className="mt-6 pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                <span className="font-mono-label text-mono-label text-on-surface-variant/50 uppercase">Network: US-EAST-1 // Status: 200 OK</span>
                <div className="flex gap-2">
                  <button onClick={() => window.location.reload()} className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                  </button>
                  <button onClick={() => navigate('admin-sessions')} className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[16px]">open_in_full</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
