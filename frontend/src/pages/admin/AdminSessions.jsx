import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../services/api';

export default function AdminSessions({ navigate }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | completed | active

  useEffect(() => {
    api.getHistory()
      .then(setHistory)
      .catch(err => { if (err.message.includes('401')) navigate('auth'); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter(s => filter === 'all' || s.status === filter);

  const statusColor = s => s === 'completed' ? 'text-primary' : s === 'active' ? 'text-secondary-container animate-pulse' : 'text-error';
  const statusLabel = s => s === 'completed' ? 'Analyzed' : s === 'active' ? 'Live Interviewing' : 'Connection Issue';

  /** Get candidate initials from name or email */
  const getInitials = (s) => {
    const name = s.candidate_name || s.candidate_email || 'C';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  /** Derive candidate display name */
  const getCandidateName = (s) => {
    if (s.candidate_name) return s.candidate_name;
    if (s.candidate_email) {
      // Turn "alice.smith@gmail.com" → "Alice Smith"
      const local = s.candidate_email.split('@')[0];
      return local.split(/[._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return 'Candidate';
  };

  return (
    <Layout navigate={navigate} active="admin-sessions">
      <div className="flex flex-col px-gutter pt-8 pb-12 min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="font-mono-label text-mono-label text-primary uppercase tracking-[0.3em] block mb-1">Session Analytics</span>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tighter">Global Session Feed</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-surface-container-low/40 p-1.5 rounded-full border border-white/5">
            {['all', 'active', 'completed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full font-mono-label text-mono-label uppercase text-[11px] transition-all ${
                  filter === f ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl rounded-3xl p-8 border border-white/5 flex-1">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-headline-md text-headline-md text-on-surface">Live Session Activity</h2>
            <span className="font-mono-label text-mono-label text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full">
              {filtered.length} Sessions Found
            </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 pb-3 border-b border-outline-variant/10">
            <span className="col-span-4 font-mono-label text-mono-label text-on-surface-variant uppercase text-[11px]">Candidate / Name</span>
            <span className="col-span-2 font-mono-label text-mono-label text-on-surface-variant uppercase text-[11px]">Domain</span>
            <span className="col-span-2 font-mono-label text-mono-label text-on-surface-variant uppercase text-[11px]">Status</span>
            <span className="col-span-2 font-mono-label text-mono-label text-on-surface-variant uppercase text-[11px]">Date</span>
            <span className="col-span-2 font-mono-label text-mono-label text-on-surface-variant uppercase text-[11px]">Action</span>
          </div>

          {/* Table Body */}
          <div className="space-y-2 mt-4">
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-3 h-3 rounded-full bg-primary animate-ping" /></div>
            ) : filtered.length === 0 ? (
              <p className="font-body-md text-on-surface-variant text-center py-12">No sessions match the current filter.</p>
            ) : (
              filtered.map(s => {
                const displayName = getCandidateName(s);
                const initials    = getInitials(s);
                const photoUrl    = s.candidate_photo_url || null;

                return (
                  <div key={s.id} className="grid grid-cols-12 gap-4 items-center p-4 bg-surface-container-high/20 rounded-2xl border border-outline-variant/5 hover:border-primary/20 transition-all hover:bg-surface-container-high/40">

                    {/* Candidate Name + Photo */}
                    <div className="col-span-4 flex items-center gap-3">
                      {/* Profile photo or initials avatar */}
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={displayName}
                          className="w-10 h-10 rounded-xl object-cover border border-outline-variant/20 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center font-bold text-on-primary-container text-sm flex-shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md text-on-surface truncate">{displayName}</span>
                        <span className="font-mono-label text-mono-label text-on-surface-variant/50 text-[10px] truncate">{s.candidate_email}</span>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <span className="font-mono-label text-mono-label bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded-lg text-[10px] uppercase truncate inline-block max-w-full">
                        {s.interview_type}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.status === 'completed' ? 'bg-primary' : 'bg-error'}`} />
                      <span className={`font-label-md text-label-md ${statusColor(s.status)} text-sm`}>{statusLabel(s.status)}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="font-mono-label text-mono-label text-on-surface-variant/50 text-[11px] uppercase">
                        {new Date(s.started_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="col-span-2">
                      {s.status === 'completed' ? (
                        <button onClick={() => navigate(`report?sid=${s.id}`)} className="font-label-md text-label-md text-primary hover:underline flex items-center gap-1">
                          View Report <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      ) : (
                        <span className="font-mono-label text-mono-label text-on-surface-variant/30 text-[10px] uppercase">Processing</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
