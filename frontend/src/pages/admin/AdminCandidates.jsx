import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../services/api';

export default function AdminCandidates({ navigate }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getCandidates()
      .then(setCandidates)
      .catch(err => { if (err.message.includes('401')) navigate('auth'); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = candidates.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout navigate={navigate} active="admin-candidates">
      <div className="flex flex-col px-gutter pt-8 pb-12 min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="font-mono-label text-mono-label text-primary uppercase tracking-[0.3em] block mb-1">User Controls</span>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tighter">Candidate Management</h1>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              type="text" 
              placeholder="Search candidates..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-surface-container-high/40 border border-outline-variant/20 py-2.5 pl-12 pr-4 rounded-xl text-on-surface focus:outline-none focus:border-primary transition-all font-body-md placeholder:text-on-surface-variant/40 w-64"
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-surface-container-low/40 backdrop-blur-xl rounded-3xl p-8 border border-white/5 flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface">Registered Users</h2>
            <span className="font-mono-label text-mono-label text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full">
              {candidates.length} Total
            </span>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 pb-3 border-b border-outline-variant/10">
            <span className="col-span-3 font-mono-label text-mono-label text-on-surface-variant uppercase text-[11px]">Identity</span>
            <span className="col-span-3 font-mono-label text-mono-label text-on-surface-variant uppercase text-[11px]">Email</span>
            <span className="col-span-3 font-mono-label text-mono-label text-on-surface-variant uppercase text-[11px]">Education</span>
            <span className="col-span-3 font-mono-label text-mono-label text-on-surface-variant uppercase text-[11px]">Artifacts</span>
          </div>

          {/* Table Body */}
          <div className="space-y-2 mt-4">
            {loading ? (
              <div className="flex justify-center py-12"><div className="w-3 h-3 rounded-full bg-primary animate-ping" /></div>
            ) : filtered.length === 0 ? (
              <p className="font-body-md text-on-surface-variant text-center py-12">No candidates found.</p>
            ) : (
              filtered.map((c, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 items-center p-4 bg-surface-container-high/20 rounded-2xl border border-outline-variant/5 hover:border-primary/20 transition-all hover:bg-surface-container-high/40 cursor-pointer">
                  <div className="col-span-3 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                      {(c.name || c.email)?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="font-label-md text-label-md text-on-surface truncate">{c.name || 'Unknown'}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="font-body-md text-on-surface-variant text-sm truncate block">{c.email}</span>
                  </div>
                  <div className="col-span-3 flex flex-col">
                    <span className="font-body-md text-on-surface text-sm truncate">{c.college_name || '—'}</span>
                    {(c.degree || c.graduation_year) && (
                      <span className="font-mono-label text-mono-label text-on-surface-variant/50 text-[10px] uppercase truncate">{c.degree} • {c.graduation_year}</span>
                    )}
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    {c.resume_name ? (
                      <span className="font-mono-label text-mono-label text-primary bg-primary/10 px-3 py-1 rounded-full text-[10px] uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">description</span> Resume
                      </span>
                    ) : (
                      <span className="font-mono-label text-mono-label text-on-surface-variant/40 px-3 py-1 text-[10px] uppercase">No Artifacts</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
