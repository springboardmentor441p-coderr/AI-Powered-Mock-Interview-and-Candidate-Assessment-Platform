import React, { useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../services/api';

const TYPES = ['Technical', 'Behavioral', 'System Design', 'HR'];
const LEVELS = [
  { val: 'Easy', label: 'Easy', sub: 'Junior level questions' },
  { val: 'Medium', label: 'Medium', sub: 'Mid-level professional' },
  { val: 'Hard', label: 'Hard', sub: 'Senior & leadership' },
];

export default function InterviewSetup({ navigate }) {
  const [type, setType] = useState('Technical');
  const [domain, setDomain] = useState('Full Stack Web Development');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQ, setNumQ] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const start = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.startSession({ interview_type: type, domain, difficulty, num_questions: numQ });
      navigate(`live-interview?sid=${res.session_id}`);
    } catch (err) {
      setError(err.message || 'Failed to start session. Ensure backend OpenAI key is configured.');
    } finally { setLoading(false); }
  };

  return (
    <Layout navigate={navigate} active="interview-setup">
      <div className="flex flex-col px-gutter pt-8 pb-12">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <span className="font-mono-label text-mono-label text-primary uppercase tracking-[0.3em] block mb-2">Interview Configuration</span>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tighter">New Session</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => <div key={i} className={`w-8 h-1 rounded-full ${i === 0 ? 'bg-primary' : 'bg-surface-container-highest'}`} />)}
            </div>
            <span className="font-mono-label text-mono-label text-on-surface-variant">STEP 01 / 03</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error font-body-md text-sm">{error}</div>
        )}

        <form onSubmit={start} className="space-y-gutter">
          <div className="grid grid-cols-12 gap-gutter">
            {/* Left info panel */}
            <div className="col-span-12 lg:col-span-4">
              <div className="sticky top-24">
                <h2 className="font-headline-md text-headline-md text-primary mb-2">Session Parameters</h2>
                <p className="font-body-md text-on-surface-variant/70 mb-8">Configure your AI interview session. The neural engine generates tailored questions based on your selected domain and difficulty.</p>
                <div className="p-6 bg-surface-container-low rounded-xl relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                  <span className="material-symbols-outlined text-primary mb-4 block">hub</span>
                  <div className="font-label-md text-label-md text-on-surface">Neural Network Status</div>
                  <div className="font-mono-label text-mono-label text-primary-fixed-dim mt-1">LATENCY: 12ms (OPTIMAL)</div>
                </div>

                {/* Session summary */}
                <div className="mt-6 p-5 bg-surface-container-high/30 rounded-xl border border-outline-variant/10">
                  <span className="font-mono-label text-mono-label text-on-surface-variant uppercase block mb-3">Session Summary</span>
                  <div className="space-y-2">
                    {[
                      { label: 'Type', value: type },
                      { label: 'Difficulty', value: difficulty },
                      { label: 'Questions', value: numQ },
                      { label: 'Domain', value: domain.length > 20 ? domain.slice(0, 20) + '…' : domain },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between">
                        <span className="font-mono-label text-mono-label text-on-surface-variant uppercase">{r.label}</span>
                        <span className="font-label-md text-label-md text-primary">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right config */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Interview Type */}
              <div className="bg-surface-container-low p-8 rounded-2xl shadow-xl">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-6">Interview Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setType(t)}
                      className={`px-4 py-3 rounded-xl font-label-md text-label-md transition-all border ${
                        type === t
                          ? 'bg-primary-container text-on-primary-container border-transparent shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                          : 'bg-surface-container-high border-outline-variant/20 text-on-surface-variant hover:border-primary/30 hover:text-on-surface'
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {/* Domain */}
              <div className="bg-surface-container-low p-8 rounded-2xl shadow-xl">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-6">Target Domain</h3>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">work</span>
                  <input
                    className="w-full bg-surface-container-highest border-b border-outline-variant/30 py-4 pl-12 pr-4 rounded-xl text-on-surface focus:outline-none focus:border-primary transition-all font-body-md placeholder:text-on-surface-variant/30"
                    type="text" value={domain} onChange={e => setDomain(e.target.value)}
                    placeholder="e.g. Backend Engineer, Data Scientist, Product Manager…" required
                  />
                </div>
                <p className="font-mono-label text-mono-label text-on-surface-variant/50 mt-2 ml-1 uppercase">Be specific — the AI generates role-targeted questions</p>
              </div>

              {/* Difficulty */}
              <div className="bg-surface-container-low p-8 rounded-2xl shadow-xl">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-6">Difficulty Level</h3>
                <div className="grid grid-cols-3 gap-3">
                  {LEVELS.map(l => (
                    <div key={l.val} onClick={() => setDifficulty(l.val)}
                      className={`p-5 rounded-xl border cursor-pointer transition-all ${
                        difficulty === l.val
                          ? 'bg-primary-container/20 border-primary/40 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                          : 'bg-surface-container-high border-outline-variant/20 hover:border-primary/20'
                      }`}
                    >
                      <p className={`font-headline-md text-headline-md mb-1 ${difficulty === l.val ? 'text-primary' : 'text-on-surface'}`}>{l.label}</p>
                      <p className="font-mono-label text-mono-label text-on-surface-variant uppercase">{l.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Num Questions */}
              <div className="bg-surface-container-low p-8 rounded-2xl shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline-md text-headline-md text-on-surface">Number of Questions</h3>
                  <span className="font-display-lg-mobile text-display-lg-mobile text-primary">{numQ}</span>
                </div>
                <input type="range" min={3} max={15} step={1} value={numQ} onChange={e => setNumQ(Number(e.target.value))}
                  className="w-full accent-[#00f0ff] cursor-pointer" />
                <div className="flex justify-between mt-2">
                  <span className="font-mono-label text-mono-label text-on-surface-variant">Quick (3)</span>
                  <span className="font-mono-label text-mono-label text-on-surface-variant">Comprehensive (15)</span>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_35px_rgba(0,240,255,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed font-headline-md"
              >
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin">progress_activity</span> Generating Questions…</>
                ) : (
                  <><span className="material-symbols-outlined">power</span> Enter War Room</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
