'use client';

import React from 'react';
import { 
  UserCheck, 
  FileText, 
  Video, 
  Award, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Search
} from 'lucide-react';
import Link from 'next/link';

export const CandidateJourneySection: React.FC = () => {
  const steps = [
    {
      title: '1. Candidate Profile Setup',
      description: 'Create an account, specify your target engineering or product roles, and set your career preferences.',
      icon: UserCheck
    },
    {
      title: '2. One-Click Resume Upload',
      description: 'Upload your PDF resume. Our AI parser extracts key tech skills, projects, and work experience instantly.',
      icon: FileText
    },
    {
      title: '3. Attend AI Interview',
      description: 'Engage with conversational AI interviewers using your webcam and microphone from any web browser.',
      icon: Video
    },
    {
      title: '4. View Evaluation & Status',
      description: 'Receive transparent technical evaluation reports and track your application progress in your portal.',
      icon: Award
    }
  ];

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#059669] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Candidate Experience</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              A Seamless, Professional Application Process for Candidates
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              InterVio provides candidates with a fair, unbiased, and fast interview experience. No scheduled waiting times—apply and complete your video interview on your own schedule.
            </p>

            {/* Candidate Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-[#059669]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{step.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{step.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <span>Go to Candidate Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Card Illustration */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-lg space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center font-bold text-sm">
                  AC
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Alex Chen</h4>
                  <span className="text-xs text-slate-500">Candidate Portal • Application Active</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#059669] text-xs font-bold border border-emerald-200">
                Interview Completed
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Senior Full Stack Engineer Campaign</span>
                  <span className="text-slate-400">Applied Aug 6, 2026</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Evaluation Score</span>
                  <span className="font-extrabold text-[#059669]">89 / 100</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Parsed Resume Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'GraphQL'].map((skill, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
