'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Eye, 
  Lock, 
  CheckCircle2, 
  FileCheck2, 
  Cpu, 
  Award,
  Sparkles
} from 'lucide-react';

export const EnterpriseTrustSection: React.FC = () => {
  const trustFeatures = [
    {
      title: 'Computer Vision Anti-Cheating HUD',
      description: 'Real-time client-side face mesh tracking detects multiple persons in frame, gaze vector deviations, and window tab switches.',
      icon: Eye
    },
    {
      title: 'Zero-Bias AI Evaluation',
      description: 'Standardized evaluation metrics evaluate purely based on technical accuracy, problem-solving depth, and communication clarity.',
      icon: Cpu
    },
    {
      title: 'Encrypted Video & Audio Audit Logs',
      description: 'Every interview session generates full playback audio/video logs and downloadable candidate evaluation reports.',
      icon: Lock
    },
    {
      title: 'Enterprise Security & Compliance',
      description: 'Built with strict data privacy guidelines, candidate consent workflows, and encrypted cloud storage for resumes.',
      icon: ShieldCheck
    }
  ];

  return (
    <section className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#059669] text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Enterprise Quality & Security</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Reliable, Secure, and Unbiased AI Screening
          </h2>
          <p className="text-slate-600 text-base">
            Designed to meet the security, integrity, and privacy standards required by global enterprise talent acquisition teams.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all space-y-4"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#059669] shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
