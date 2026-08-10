import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../services/api';

function ScoreRing({ score, size = 120 }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, score)) / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="#00f0ff" strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={circ - filled} strokeLinecap="round"
          transform="rotate(-90 50 50)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display-lg-mobile text-display-lg-mobile text-primary leading-none">{Math.round(score)}</span>
        <span className="font-mono-label text-mono-label text-on-surface-variant uppercase">Percentile</span>
      </div>
    </div>
  );
}

export default function Report({ navigate }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('sid');
    if (!sid) { navigate('dashboard'); return; }
    api.getReport(sid)
      .then(r => { setReport(r); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const dimColor = s => s >= 75 ? 'text-primary' : s >= 50 ? 'text-secondary-container' : 'text-error';

  return (
    <Layout navigate={navigate} active="report">
      <div className="flex flex-col px-gutter pt-8 pb-12 min-h-full">
        {loading ? (
          <div className="flex-1 flex items-center justify-center h-64">
            <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
          </div>
        ) : error ? (
          <div className="px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error">{error}</div>
        ) : report && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="font-mono-label text-mono-label text-primary uppercase tracking-[0.3em] block mb-1">Performance Index</span>
                <h1 className="font-display-lg text-display-lg text-on-surface tracking-tighter">Session Report</h1>
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate('interview-setup')} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                  Start Training Session
                </button>
                <button onClick={() => navigate('dashboard')} className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-high border border-outline-variant/20 text-on-surface font-bold rounded-xl hover:border-primary/30 transition-all">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Dashboard
                </button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-gutter">
              {/* Left column */}
              <div className="col-span-12 lg:col-span-8 space-y-gutter">
                {/* Score header cards */}
                <div className="grid grid-cols-3 gap-gutter">
                  {/* Overall score ring */}
                  <div className="col-span-1 bg-surface-container-low/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center gap-4">
                    <ScoreRing score={report.overall_score} />
                    <p className="font-body-md text-on-surface-variant text-center text-sm">
                      You performed better than <span className="text-primary font-bold">{Math.round(report.overall_score)}%</span> of candidates.
                    </p>
                  </div>

                  {/* 4 dimension cards */}
                  <div className="col-span-2 grid grid-cols-2 gap-gutter">
                    {[
                      { label: 'Technical', val: report.technical_score, icon: 'code' },
                      { label: 'Communication', val: report.communication_score, icon: 'chat' },
                      { label: 'Confidence', val: report.confidence_score, icon: 'psychology' },
                      { label: 'Engagement', val: report.professionalism_score, icon: 'visibility' },
                    ].map(d => (
                      <div key={d.label} className="bg-surface-container-low/40 backdrop-blur-xl rounded-2xl p-5 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`font-mono-label text-mono-label uppercase text-right ml-auto font-bold ${dimColor(d.val)}`}>{Math.round(d.val || 0)}/100</span>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant text-[24px] block mb-2">{d.icon}</span>
                        <h3 className="font-headline-md text-headline-md text-on-surface">{d.label}</h3>
                        <div className="mt-2 w-full h-0.5 bg-surface-container-highest rounded-full">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${d.val || 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Question Breakdown */}
                <div className="bg-surface-container-low/40 backdrop-blur-xl rounded-3xl p-8 border border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-headline-md text-headline-md text-on-surface">Question Breakdown</h2>
                    <span className="font-mono-label text-mono-label text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full">{report.total_questions} Questions</span>
                  </div>

                  <div className="space-y-6">
                    {/* Summary feedback since we don't store per-question answers */}
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-mono-label text-mono-label text-on-surface-variant">01</div>
                        <p className="font-body-md text-on-surface">Overall Performance Summary</p>
                      </div>
                      <blockquote className="ml-12 border-l-2 border-primary/30 pl-4 font-body-md text-on-surface-variant/70 italic">
                        {report.strengths || 'Good domain knowledge demonstrated across all questions.'}
                      </blockquote>
                      <div className="ml-12 mt-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="material-symbols-outlined text-primary text-[16px]">smart_toy</span>
                          <span className="font-mono-label text-mono-label text-primary uppercase">AI Feedback</span>
                        </div>
                        <p className="font-body-md text-on-surface-variant">{report.suggestions || 'Focus on concrete examples and structured answers.'}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-mono-label text-mono-label text-on-surface-variant">02</div>
                        <p className="font-body-md text-on-surface">Areas for Development</p>
                      </div>
                      <blockquote className="ml-12 border-l-2 border-secondary-container/40 pl-4 font-body-md text-on-surface-variant/70 italic">
                        {report.weaknesses || 'Some responses could benefit from more specific examples.'}
                      </blockquote>
                      <div className="ml-12 mt-3 p-4 bg-secondary-container/5 rounded-xl border border-secondary-container/10">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="material-symbols-outlined text-secondary-container text-[16px]">smart_toy</span>
                          <span className="font-mono-label text-mono-label text-secondary-container uppercase">AI Feedback</span>
                        </div>
                        <p className="font-body-md text-on-surface-variant">Use the STAR method. Reduce filler words for higher confidence scores.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-gutter">
                  {[
                    { label: 'Words / Min', value: Math.round(report.avg_words_per_min || 0), note: '130-150 is ideal' },
                    { label: 'Filler Words', value: Math.round(report.avg_filler_words || 0), note: 'Lower is better' },
                    { label: 'Duration', value: `${report.duration_minutes}m`, note: 'Session length' },
                  ].map(m => (
                    <div key={m.label} className="bg-surface-container-low/40 rounded-2xl p-5 border border-white/5">
                      <span className="font-mono-label text-mono-label text-on-surface-variant block mb-2 uppercase">{m.label}</span>
                      <span className="font-display-lg-mobile text-display-lg-mobile text-primary">{m.value}</span>
                      <p className="font-mono-label text-mono-label text-on-surface-variant/50 mt-1">{m.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right sidebar */}
              <div className="col-span-12 lg:col-span-4 space-y-gutter">
                {/* Strengths */}
                <div className="bg-surface-container-low/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-[20px]">rocket_launch</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Strengths</h3>
                  </div>
                  <div className="space-y-3">
                    {(report.strengths || 'Deep domain knowledge. Structured problem solving. Clear communication.').split('.').filter(s => s.trim()).map((s, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary text-[16px] mt-0.5">check_circle</span>
                        <div>
                          <p className="font-label-md text-label-md text-on-surface">{s.trim()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Areas to Focus */}
                <div className="bg-surface-container-low/40 backdrop-blur-xl rounded-3xl p-6 border border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-secondary-container text-[20px]">trending_up</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Areas to Focus</h3>
                  </div>
                  <div className="space-y-3">
                    {(report.weaknesses || 'Eye contact consistency. Reduce filler words. Pace control.').split('.').filter(s => s.trim()).map((s, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-error text-[16px] mt-0.5">error_outline</span>
                        <div>
                          <p className="font-label-md text-label-md text-on-surface">{s.trim()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Plan */}
                <div className="bg-surface-container-low/40 backdrop-blur-xl rounded-3xl p-6 border border-primary/10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Nexiq Action Plan</h3>
                  </div>
                  <p className="font-body-md text-on-surface-variant mb-4">To reach the 95th percentile, try these targeted drills:</p>
                  <div className="space-y-3">
                    <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <span className="font-mono-label text-mono-label text-primary uppercase block mb-1">Eye Contact Drill</span>
                      <p className="font-body-md text-on-surface-variant text-sm">Practice looking at the webcam lens, not the screen, when explaining complex logic.</p>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <span className="font-mono-label text-mono-label text-primary uppercase block mb-1">Pace Control</span>
                      <p className="font-body-md text-on-surface-variant text-sm">Slow down 10% during behavioral questions to minimize 'um' fillers.</p>
                    </div>
                  </div>
                  <button onClick={() => navigate('interview-setup')} className="w-full mt-4 py-3 bg-primary text-on-primary font-bold rounded-xl hover:scale-[1.01] transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                    Start Training Session
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
