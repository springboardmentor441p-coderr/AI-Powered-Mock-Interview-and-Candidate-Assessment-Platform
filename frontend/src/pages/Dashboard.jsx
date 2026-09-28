import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../services/api';

export default function Dashboard({ navigate }) {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [weakAreas, setWeakAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const raw = localStorage.getItem('nexiq_user');
  const user = raw ? JSON.parse(raw) : {};
  const firstName = user.full_name?.split(' ')[0] || 'Candidate';

  useEffect(() => {
    async function load() {
      try {
        const [s, h, w, sched] = await Promise.all([
          api.stats(), 
          api.getHistory(), 
          api.weakAreas(),
          api.getScheduledSessions()
        ]);
        setStats(s);
        setHistory(h.slice(0, 6));
        setWeakAreas(w.slice(0, 4));
        setScheduled(sched);
      } catch (err) {
        if (err.message?.includes('401')) navigate('auth');
      } finally { setLoading(false); }
    }
    load();
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout navigate={navigate} active="dashboard">
      <div className="flex flex-col w-full px-gutter pt-8 pb-12">

        {/* Greeting */}
        <div className="relative flex flex-col md:flex-row items-end justify-between mb-12">
          <div className="flex flex-col">
            <span className="font-mono-label text-mono-label text-primary uppercase tracking-[0.3em] mb-2">Operational Status: Optimal</span>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tighter">
              Welcome back, <span className="text-primary-container">{firstName}</span>.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mt-2">
              {stats?.total_sessions > 0
                ? `You have completed ${stats.total_sessions} sessions. Your best score is ${stats.best_score}/100.`
                : `Your neural sync is at 94%. We've identified 3 key optimization paths for your upcoming session with Amazon Robotics.`}
            </p>
          </div>

          {/* Streak */}
          <div className="mt-8 md:mt-0 flex items-center gap-6 bg-surface-container-high/30 backdrop-blur-md p-6 rounded-2xl shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
              <span className="font-mono-label text-mono-label text-on-surface-variant block uppercase">Daily Streak</span>
              <div className="flex items-baseline gap-2">
                <span className="font-display-lg text-display-lg text-primary">{stats?.total_sessions > 0 ? stats.streak : 12}</span>
                <span className="font-headline-md text-headline-md text-on-surface-variant/50">DAYS</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary animate-pulse">
              <span className="material-symbols-outlined text-[32px]">local_fire_department</span>
            </div>
          </div>
        </div>

        {/* Main Bento Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-gutter mb-gutter">
              {/* Performance Analytics */}
              <div className="col-span-12 lg:col-span-8 bg-surface-container-low/40 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl relative border border-white/5 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Cognitive Load &amp; Response Accuracy</h2>
                    <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mt-1">Last 7 Sessions</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="font-mono-label text-mono-label text-primary">Accuracy</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-secondary-container/10 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-secondary-container" />
                      <span className="font-mono-label text-mono-label text-secondary-container">Confidence</span>
                    </div>
                  </div>
                </div>

                {/* SVG chart */}
                <div className="w-full h-48 relative mt-4">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200">
                    <defs>
                      <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgba(0,240,255,0.3)" />
                        <stop offset="100%" stopColor="rgba(0,240,255,0)" />
                      </linearGradient>
                    </defs>
                    <line stroke="rgba(59,73,75,0.3)" strokeWidth="1" x1="0" x2="800" y1="50" y2="50" />
                    <line stroke="rgba(59,73,75,0.3)" strokeWidth="1" x1="0" x2="800" y1="100" y2="100" />
                    <line stroke="rgba(59,73,75,0.3)" strokeWidth="1" x1="0" x2="800" y1="150" y2="150" />
                    <path d="M0,150 Q100,120 200,130 T400,60 T600,80 T800,40" fill="none" stroke="rgba(0,240,255,1)" strokeWidth="3" />
                    <path d="M0,150 Q100,120 200,130 T400,60 T600,80 T800,40 V200 H0 Z" fill="url(#chartGrad)" />
                    <path d="M0,180 Q100,160 200,140 T400,110 T600,90 T800,70" fill="none" stroke="rgba(207,92,255,0.8)" strokeDasharray="6,4" strokeWidth="2" />
                    <circle className="animate-bounce" cx="400" cy="60" r="6" fill="white" />
                    <circle cx="400" cy="60" r="12" fill="rgba(0,240,255,0.3)" />
                  </svg>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-4 mt-8 pt-8 border-t border-outline-variant/10">
                  {[
                    { label: 'Avg Score', value: stats?.total_sessions > 0 ? `${stats.avg_score}%` : '88%' },
                    { label: 'Fluency', value: stats?.total_sessions > 0 ? (stats.avg_score > 80 ? 'Elite' : 'Good') : 'Elite' },
                    { label: 'Stamina', value: stats?.total_sessions > 0 ? (stats.total_sessions > 5 ? 'High' : 'Normal') : 'High' },
                  ].map(m => (
                    <div key={m.label}>
                      <span className="font-mono-label text-mono-label text-on-surface-variant block mb-1">{m.label}</span>
                      <span className="font-headline-md text-headline-md text-on-surface">{m.value}</span>
                    </div>
                  ))}
                  <div className="text-right">
                    <button onClick={() => navigate('history')} className="font-label-md text-label-md text-primary-container hover:underline flex items-center justify-end gap-1 ml-auto mt-2">
                      Deep Analysis <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Scheduled Session Card */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-gutter">
                
                {scheduled.length > 0 ? scheduled.map(s => {
                  const startTime = new Date(s.scheduled_start + "Z");
                  const diffMs = startTime - now;
                  const windowOpen = diffMs <= 10 * 60 * 1000;
                  const expired = now > new Date(startTime.getTime() + (s.duration_minutes + 5) * 60000);
                  
                  return (
                    <div key={s.id} className="bg-surface-container-low/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h2 className="font-headline-md text-headline-md text-on-surface">Upcoming Interview</h2>
                        <span className="font-mono-label text-mono-label text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">Scheduled</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="flex flex-col items-center bg-surface-container-high rounded-xl p-3 min-w-[56px] text-center">
                          <span className="font-mono-label text-mono-label text-primary uppercase">{startTime.toLocaleDateString([], { month: 'short' })}</span>
                          <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface leading-none">
                            {startTime.getDate()}
                          </span>
                        </div>
                        <div>
                          <p className="font-label-lg text-on-surface font-bold">{s.company_name}</p>
                          <p className="font-body-md text-on-surface-variant">{s.job_title}</p>
                          <p className="font-mono-label text-mono-label text-on-surface-variant uppercase mt-1">
                            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {s.duration_minutes}m
                          </p>
                        </div>
                      </div>
                      <button
                        disabled={!windowOpen || expired}
                        onClick={() => navigate(`live-interview?sid=${s.id}`)}
                        className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                          (windowOpen && !expired) 
                            ? 'bg-primary text-on-primary shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-[1.01]' 
                            : 'bg-surface-container-highest text-on-surface-variant opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {expired ? 'Expired' : (windowOpen ? 'Join Now' : 'Join Window Closed')}
                        <span className="material-symbols-outlined">bolt</span>
                      </button>
                    </div>
                  );
                }) : (
                  <div className="bg-surface-container-low/40 backdrop-blur-2xl rounded-3xl p-8 border border-white/5 flex flex-col gap-4 text-center">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-2">event_available</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">No Upcoming Interviews</h2>
                    <p className="text-on-surface-variant font-body-md">You have no scheduled interviews at this time.</p>
                  </div>
                )}

                {/* Weak areas */}
                <div className="bg-surface-container-low/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/5 flex-1">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-4">Skill Matrix</h2>
                  <div className="space-y-4">
                    {(weakAreas.length > 0 ? weakAreas : [
                      { area: 'System Design', avg_score: 92 },
                      { area: 'Algorithms', avg_score: 85 },
                      { area: 'Behavioral', avg_score: 78 }
                    ]).map(w => (
                      <div key={w.area}>
                        <div className="flex justify-between mb-1">
                          <span className="font-label-md text-label-md text-on-surface">{w.area}</span>
                          <span className="font-mono-label text-mono-label text-primary">{w.avg_score}%</span>
                        </div>
                        <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary-container" style={{ width: `${w.avg_score}%`, transition: 'width 1s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Session History */}
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Recent Simulations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                {history.length === 0 ? (
                  <div className="col-span-3 bg-surface-container-low/40 rounded-3xl p-12 text-center border border-white/5">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-4">inbox</span>
                    <p className="font-body-md text-on-surface-variant mb-4">No sessions yet. Start your first AI interview.</p>
                    <button onClick={() => navigate('interview-setup')} className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:scale-[1.02] transition-all">
                      Start Simulation
                    </button>
                  </div>
                ) : (
                  history.map(s => (
                    <div key={s.id} className="bg-surface-container-low/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 hover:border-primary/20 transition-all group cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-[20px]">videocam</span>
                        </div>
                        <span className={`font-mono-label text-mono-label px-2 py-1 rounded-full text-[10px] uppercase ${s.status === 'completed' ? 'bg-primary/10 text-primary' : 'bg-secondary-container/20 text-secondary-container'}`}>
                          {s.status}
                        </span>
                      </div>
                      <h3 className="font-label-md text-label-md text-on-surface font-bold mb-1">{s.interview_type}</h3>
                      <p className="font-mono-label text-mono-label text-on-surface-variant mb-4">{s.domain}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono-label text-mono-label text-on-surface-variant/50">{new Date(s.started_at).toLocaleDateString()}</span>
                        {s.status === 'completed' && (
                          <button onClick={() => navigate(`report?sid=${s.id}`)} className="font-label-md text-label-md text-primary hover:underline flex items-center gap-1">
                            View Report <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
