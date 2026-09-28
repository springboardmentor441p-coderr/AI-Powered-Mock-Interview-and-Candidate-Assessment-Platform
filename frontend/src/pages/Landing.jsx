import React, { useState } from 'react';
import { api } from '../services/api';

export default function Landing({ navigate }) {
  return (
    <div className="auth-page">
      {/* Glow orbs */}
      <div className="glow-orb" style={{ width: 600, height: 600, top: '-20%', left: '-15%', background: 'rgba(0,240,255,0.06)' }} />
      <div className="glow-orb" style={{ width: 500, height: 500, bottom: '-15%', right: '-10%', background: 'rgba(168,85,247,0.06)' }} />

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/nexiq_logo.png" alt="NEXIQ" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <span className="font-display font-bold text-cyan" style={{ fontSize: 20, letterSpacing: '0.06em' }}>NEXIQ</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate('auth')}>Sign In</button>
          <button className="btn btn-primary" onClick={() => navigate('auth')}>Get Started →</button>
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <div className="badge badge-cyan mb-4 fade-up" style={{ fontSize: 12 }}>
          <div className="pulse-dot" style={{ width: 6, height: 6 }} />
          AI Neural Network Online
        </div>

        <h1 className="font-display font-bold fade-up" style={{ fontSize: 'clamp(42px, 7vw, 80px)', lineHeight: 1.1, maxWidth: 900, animationDelay: '0.1s' }}>
          <span style={{ color: 'var(--text)' }}>Ace Every Interview with</span><br />
          <span style={{ background: 'linear-gradient(135deg, var(--cyan), var(--violet-bright))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI-Powered Precision
          </span>
        </h1>

        <p className="fade-up" style={{ fontSize: 18, color: 'var(--text-dim)', maxWidth: 600, lineHeight: 1.7, margin: '24px auto', animationDelay: '0.2s' }}>
          NEXIQ delivers real-time cognitive analysis, AI voice interviews, and deep performance analytics to accelerate your career trajectory.
        </p>

        <div className="flex gap-3 fade-up" style={{ marginTop: 8, animationDelay: '0.3s' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('auth')}>
            <span className="material-symbols-outlined">bolt</span>
            Start Free Interview
          </button>
          <button className="btn btn-secondary btn-lg">
            <span className="material-symbols-outlined">play_circle</span>
            Watch Demo
          </button>
        </div>

        {/* Feature strip */}
        <div className="grid-3 fade-up" style={{ marginTop: 80, maxWidth: 900, width: '100%', animationDelay: '0.4s' }}>
          {[
            { icon: 'psychology', label: 'Neural AI Evaluator', desc: 'Real-time cognitive analysis and scoring across 4 dimensions.' },
            { icon: 'mic', label: 'Voice Interview Room', desc: 'AI speaks questions, transcribes your answers, gives follow-ups.' },
            { icon: 'bar_chart', label: 'Deep Analytics', desc: 'Detailed breakdown of fluency, confidence, and domain accuracy.' },
          ].map((f, i) => (
            <div className="card" key={i} style={{ textAlign: 'left' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--cyan)', fontSize: 22 }}>{f.icon}</span>
              </div>
              <h3 className="font-semibold" style={{ fontSize: 15, marginBottom: 6 }}>{f.label}</h3>
              <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
