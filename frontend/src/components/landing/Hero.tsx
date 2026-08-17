'use client';

import React from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';

export const Hero: React.FC = () => {

  return (
    <section className="relative pt-12 pb-20 md:pt-16 md:pb-24 bg-white overflow-hidden">
      
      {/* Light Background Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-emerald-100/40 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Enterprise Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-slate-700 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-[#059669]" />
            <span className="font-bold text-[#059669]">Enterprise AI Hiring Platform</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 font-medium">Automated Candidate Screening, Vision Proctoring & Instant Scoring</span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Streamline Candidate Hiring & <br />
            <span className="text-[#059669]">
              Automate Technical AI Interviews
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The complete AI-assisted recruitment platform built for enterprise companies, HR teams, and recruiters. Automate candidate video screening and make data-driven hiring decisions.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start AI Candidate Screening</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

