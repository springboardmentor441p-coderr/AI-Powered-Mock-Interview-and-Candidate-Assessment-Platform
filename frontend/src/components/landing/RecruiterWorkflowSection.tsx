'use client';

import React from 'react';
import { 
  Building2, 
  Layers, 
  Bot, 
  ShieldCheck, 
  Users, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileCheck
} from 'lucide-react';
import Link from 'next/link';

export const RecruiterWorkflowSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Create Hiring Campaign',
      description: 'Define target role, experience level, tech stack requirements, and custom AI interviewer personas in under 2 minutes.',
      icon: Layers,
      tag: 'HR Setup'
    },
    {
      number: '02',
      title: 'Automated AI Video Interviews',
      description: 'Candidates apply and take real-time conversational AI interviews with dynamic follow-up questions tailored to their resume.',
      icon: Bot,
      tag: 'AI Screening'
    },
    {
      number: '03',
      title: 'Vision Proctoring & Grading',
      description: 'Automated computer vision proctoring flags eye gaze shifts or tab switches while AI evaluates technical accuracy.',
      icon: ShieldCheck,
      tag: 'Anti-Cheating'
    },
    {
      number: '04',
      title: 'Candidate Ranking & Final Hire',
      description: 'Compare multiple applicants side-by-side, inspect comprehensive evaluation reports, and make confident hiring decisions.',
      icon: Users,
      tag: 'Recruiter ATS'
    }
  ];

  return (
    <section className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-[#059669]" />
            <span>Recruiter & HR Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Automate Your Technical Hiring Pipeline
          </h2>
          <p className="text-slate-600 text-base">
            Reduce screening time by up to 70% while maintaining rigorous technical standards and zero-bias candidate evaluations.
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between relative group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-extrabold text-emerald-600/30 group-hover:text-[#059669] transition-colors">
                      {step.number}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                      {step.tag}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#059669] shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Callout */}
        <div className="mt-12 p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl font-bold">Ready to streamline your team's recruitment process?</h3>
            <p className="text-xs text-slate-400">Set up your first automated AI interview campaign in less than 2 minutes.</p>
          </div>
          <Link
            href="/recruiter"
            className="px-6 py-3 rounded-xl bg-[#059669] hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 whitespace-nowrap shadow-sm transition-all"
          >
            <span>Open Recruiter Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
};
