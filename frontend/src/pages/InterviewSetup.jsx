import React, { useState } from 'react';
import Layout from '../components/Layout';
import { api } from '../services/api';

const TOPICS = [
  {
    id: 'Technical',
    title: 'Technical',
    icon: 'code',
    why: 'Tests domain knowledge, problem-solving, algorithms, debugging, and production coding skills.',
  },
  {
    id: 'Behavioral',
    title: 'Behavioral',
    icon: 'psychology',
    why: 'Evaluates soft skills, leadership, conflict resolution, and past teamwork using STAR methodology.',
  },
  {
    id: 'System Design',
    title: 'System Design',
    icon: 'account_tree',
    why: 'Assesses high-level architecture, scalability, database choices, caching, and distributed trade-offs.',
  },
  {
    id: 'HR',
    title: 'HR & Culture',
    icon: 'badge',
    why: 'Evaluates career alignment, communication clarity, motivation, compensation fit, and culture match.',
  },
];

const FORMATS = [
  { id: 'Mixed', title: 'Mixed Round', desc: 'Q&A, Coding & MCQs' },
  { id: 'Coding', title: 'Coding Round', desc: 'Live Hands-on Coding' },
  { id: 'MCQ', title: 'MCQ Round', desc: 'Multiple Choice Questions' },
  { id: 'Conceptual', title: 'Conceptual Q&A', desc: 'Deep-dive Discussions' },
];

const DOMAINS = [
  "Full Stack Web Development",
  "Frontend Development (React / Vue / Angular)",
  "Backend Development (Node.js / Python / Go / Java)",
  "Mobile App Development (iOS / Android / Flutter)",
  "Cloud Engineering & DevOps (AWS / Azure / K8s)",
  "Artificial Intelligence & LLM Engineering",
  "Data Science & Machine Learning",
  "Cybersecurity & Ethical Hacking",
  "Embedded Systems & IoT Engineering",
  "Database Administration & Engineering (SQL / NoSQL)",
  "Blockchain & Smart Contract Development",
  "Quality Assurance & Automated Testing (QA)",
  "UI/UX Design & Frontend Architecture",
  "Data Engineering & Big Data (Spark / Airflow)",
  "Site Reliability Engineering (SRE)",
  "Computer Vision & Image Processing",
  "Natural Language Processing (NLP)",
  "Game Development (Unity / Unreal Engine / C++)",
  "Distributed Systems & Microservices Architecture",
  "Network & Security Engineering",
  "Linux System Administration & Infrastructure",
  "Financial Technology (FinTech) Systems",
  "Healthcare Technology & HIPAA Systems",
  "E-Commerce Platform Engineering",
  "Robotics & Autonomous Systems Software",
  "Information Security & Compliance (SOC2 / ISO)",
  "AR / VR & Spatial Computing",
  "Enterprise ERP & SAP Systems",
  "API & Integration Engineering",
  "Quantum Computing & Advanced Algorithms",
  "Low-Level Firmware & Systems (C / Rust)",
  "Technical Product Management",
  "Systems & Hardware Architecture",
  "Engineering Management & Tech Leadership",
  "General Computer Science Fundamentals",
];

const LEVELS = [
  { val: 'Easy', label: 'Easy', sub: 'Junior level questions' },
  { val: 'Medium', label: 'Medium', sub: 'Mid-level professional' },
  { val: 'Hard', label: 'Hard', sub: 'Senior & leadership' },
];

export default function InterviewSetup({ navigate }) {
  const [type, setType] = useState('Technical');
  const [format, setFormat] = useState('Mixed');
  const [domain, setDomain] = useState('Full Stack Web Development');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQ, setNumQ] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const start = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.startSession({
        interview_type: type,
        domain,
        difficulty,
        num_questions: numQ,
        question_format: format,
      });
      navigate(`live-interview?sid=${res.session_id}`);
    } catch (err) {
      setError(err.message || 'Failed to start session.');
    } finally { setLoading(false); }
  };

  return (
    <Layout navigate={navigate} active="interview-setup">
      <div className="flex flex-col px-gutter pt-8 pb-12">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <span className="font-mono-label text-mono-label text-primary uppercase tracking-[0.3em] block mb-2">Interview Configuration</span>
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tighter">New Session Setup</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => <div key={i} className={`w-8 h-1 rounded-full ${i === 0 ? 'bg-primary' : 'bg-surface-container-highest'}`} />)}
            </div>
            <span className="font-mono-label text-mono-label text-on-surface-variant">STEP 01 / 03</span>
          </div>
        </div>

        {/* Live Simulation shortcut */}
        <div className="mb-8 flex items-center justify-between p-5 bg-primary/5 border border-primary/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[28px]">rocket_launch</span>
            <div>
              <p className="font-label-md text-label-md text-on-surface font-bold">Ready for a real company simulation?</p>
              <p className="font-mono-label text-mono-label text-on-surface-variant text-[11px] uppercase">Live Simulation — pick a company, choose a role, apply &amp; interview</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('company-select')}
            id="live-sim-shortcut-btn"
            className="flex-shrink-0 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:scale-[1.02] transition-all font-label-md text-label-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            Go Live
          </button>
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
                <p className="font-body-md text-on-surface-variant/70 mb-8">Configure your AI interview session. Choose from 35 domains, 4 topic tracks, and custom formats (Coding, MCQ, Q&A).</p>
                
                <div className="p-6 bg-surface-container-low rounded-xl relative overflow-hidden group mb-6">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                  <span className="material-symbols-outlined text-primary mb-4 block">hub</span>
                  <div className="font-label-md text-label-md text-on-surface">Neural Engine Ready</div>
                  <div className="font-mono-label text-mono-label text-primary-fixed-dim mt-1">LATENCY: 12ms (OPTIMAL)</div>
                </div>

                {/* Session summary */}
                <div className="p-5 bg-surface-container-high/30 rounded-xl border border-outline-variant/10">
                  <span className="font-mono-label text-mono-label text-on-surface-variant uppercase block mb-3">Session Summary</span>
                  <div className="space-y-2">
                    {[
                      { label: 'Topic Track', value: type },
                      { label: 'Question Format', value: format },
                      { label: 'Difficulty', value: difficulty },
                      { label: 'Question Count', value: numQ },
                      { label: 'Domain', value: domain.length > 25 ? domain.slice(0, 25) + '…' : domain },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between items-center text-sm">
                        <span className="font-mono-label text-mono-label text-on-surface-variant uppercase text-[11px]">{r.label}</span>
                        <span className="font-label-md text-label-md text-primary font-bold">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right config */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              
              {/* 1. Target Domain Dropdown (35 Domains) */}
              <div className="bg-surface-container-low p-8 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-headline-md text-headline-md text-on-surface">Target Domain (35 Roles Available)</h3>
                  <span className="font-mono-label text-mono-label bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] uppercase">
                    35 Domains
                  </span>
                </div>
                <p className="font-body-md text-on-surface-variant/70 text-sm mb-4">
                  Select your exact specialized domain. Questions, scoring benchmarks, and feedback are customized specifically for your chosen field.
                </p>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary z-10 pointer-events-none">work</span>
                  <select
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    className="w-full bg-surface-container-highest border border-outline-variant/30 py-4 pl-12 pr-10 rounded-xl text-on-surface focus:outline-none focus:border-primary transition-all font-body-md cursor-pointer appearance-none shadow-sm text-base"
                  >
                    {DOMAINS.map(d => (
                      <option key={d} value={d} className="bg-surface-container-high text-on-surface py-2">
                        {d}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* 2. Topic Track Selection (Why we choose each topic) */}
              <div className="bg-surface-container-low p-8 rounded-2xl shadow-xl">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Interview Topic Track</h3>
                <p className="font-body-md text-on-surface-variant/70 text-sm mb-6">
                  Select the core dimension of your interview. Each track focuses on a vital evaluation pillar:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TOPICS.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                        type === t.id
                          ? 'bg-primary-container/20 border-primary/50 shadow-[0_0_20px_rgba(0,240,255,0.15)] ring-1 ring-primary/40'
                          : 'bg-surface-container-high border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-highest/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-[24px] ${type === t.id ? 'text-primary' : 'text-on-surface-variant'}`}>{t.icon}</span>
                            <span className={`font-headline-md text-headline-md ${type === t.id ? 'text-primary font-bold' : 'text-on-surface'}`}>{t.title}</span>
                          </div>
                          {type === t.id && (
                            <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                          )}
                        </div>
                        <p className="font-body-md text-on-surface-variant/80 text-xs leading-relaxed">{t.why}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Question Format (Coding Round, MCQ, Conceptual, Mixed) */}
              {type === 'Technical' && (
                <div className="bg-surface-container-low p-8 rounded-2xl shadow-xl border border-primary/20 bg-gradient-to-br from-surface-container-low to-primary/5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">terminal</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">Technical Question Format</h3>
                  </div>
                  <p className="font-body-md text-on-surface-variant/70 text-sm mb-6">
                    Choose whether you want live hands-on Coding problems, Multiple Choice (MCQs), or Conceptual Q&amp;A:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {FORMATS.map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFormat(f.id)}
                        className={`p-4 rounded-xl text-left transition-all border ${
                          format === f.id
                            ? 'bg-primary text-on-primary border-transparent font-bold shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                            : 'bg-surface-container-high border-outline-variant/20 text-on-surface-variant hover:border-primary/40 hover:text-on-surface'
                        }`}
                      >
                        <p className="font-label-md text-label-md text-sm">{f.title}</p>
                        <p className={`text-[10px] uppercase font-mono-label mt-1 opacity-80 ${format === f.id ? 'text-on-primary' : 'text-on-surface-variant/60'}`}>{f.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Difficulty Level */}
              <div className="bg-surface-container-low p-8 rounded-2xl shadow-xl">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-6">Difficulty Level</h3>
                <div className="grid grid-cols-3 gap-3">
                  {LEVELS.map(l => (
                    <div
                      key={l.val}
                      onClick={() => setDifficulty(l.val)}
                      className={`p-5 rounded-xl border cursor-pointer transition-all ${
                        difficulty === l.val
                          ? 'bg-primary-container/20 border-primary/40 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                          : 'bg-surface-container-high border-outline-variant/20 hover:border-primary/20'
                      }`}
                    >
                      <p className={`font-headline-md text-headline-md mb-1 ${difficulty === l.val ? 'text-primary font-bold' : 'text-on-surface'}`}>{l.label}</p>
                      <p className="font-mono-label text-mono-label text-on-surface-variant uppercase text-[11px]">{l.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Number of Questions */}
              <div className="bg-surface-container-low p-8 rounded-2xl shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-headline-md text-headline-md text-on-surface">Number of Questions</h3>
                  <span className="font-display-lg-mobile text-display-lg-mobile text-primary font-bold">{numQ}</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={15}
                  step={1}
                  value={numQ}
                  onChange={e => setNumQ(Number(e.target.value))}
                  className="w-full accent-[#00f0ff] cursor-pointer"
                />
                <div className="flex justify-between mt-2 font-mono-label text-mono-label text-on-surface-variant text-[11px] uppercase">
                  <span>Quick Blitz (3)</span>
                  <span>Full Evaluation (15)</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_35px_rgba(0,240,255,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed font-headline-md text-lg"
              >
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin">progress_activity</span> Generating Role-Targeted Session…</>
                ) : (
                  <><span className="material-symbols-outlined">power</span> Enter Live Session War Room</>
                )}
              </button>

            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}

