import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../services/api';

export default function History({ navigate }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHistory()
      .then(setHistory)
      .catch(err => { if (err.message?.includes('401')) navigate('auth'); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout navigate={navigate} active="history">
      <div className="flex flex-col px-gutter pt-8 pb-12 min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="font-mono-label text-mono-label text-primary uppercase tracking-[0.3em] block mb-1">Session Archives</span>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tighter">Your History</h1>
          </div>
          <button onClick={() => navigate('interview-setup')} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Session
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex-1 bg-surface-container-low/40 rounded-3xl p-12 text-center border border-white/5 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-4">inbox</span>
            <p className="font-body-md text-on-surface-variant mb-4">No sessions yet. Start your first AI interview.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {history.map(s => (
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
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-mono-label text-mono-label text-on-surface-variant/50">{new Date(s.started_at).toLocaleDateString()}</span>
                  {s.status === 'completed' && (
                    <button onClick={() => navigate(`report?sid=${s.id}`)} className="font-label-md text-label-md text-primary hover:underline flex items-center gap-1">
                      View Report <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
