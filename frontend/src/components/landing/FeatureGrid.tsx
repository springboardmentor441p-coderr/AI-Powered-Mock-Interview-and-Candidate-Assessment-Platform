'use client';

import React from 'react';
import { 
  Bot, 
  Mic, 
  ShieldAlert, 
  FileSearch, 
  Radar, 
  Download, 
  Sparkles,
  CheckCircle,
  Users,
  Building2
} from 'lucide-react';

export const FeatureGrid: React.FC = () => {
  const features = [
    {
      icon: Bot,
      title: 'Adaptive AI Voice Interviewers',
      description: 'Human-like conversational interviewer personas (Alex, Sarah, Marcus) that ask tailored follow-up questions based on live candidate answers.',
      badge: 'Zero Latency Voice'
    },
    {
      icon: Mic,
      title: 'Speech Recognition & Transcripts',
      description: 'Real-time speech recognition converts candidate voice answers into high-accuracy transcripts with automatic punctuation and filler word tracking.',
      badge: 'Real-Time Audio'
    },
    {
      icon: FileSearch,
      title: 'Automated Resume Parsing Engine',
      description: 'Upload PDF or DOCX resumes. The engine extracts tech stack, experience level, key projects, and customizes question difficulty automatically.',
      badge: 'Resume Extraction'
    },
    {
      icon: ShieldAlert,
      title: 'Computer Vision Proctoring HUD',
      description: 'Face detection, eye gaze vector analysis, tab switch logger, multiple face detection, and silence alerts for unbiased candidate screening.',
      badge: 'Malpractice Guard'
    },
    {
      icon: Users,
      title: 'Candidate Ranking & ATS Pipeline',
      description: 'Compare multiple candidate screenings side-by-side. Track technical depth, communication ratings, and proctoring compliance.',
      badge: 'Recruiter Workflow'
    },
    {
      icon: Download,
      title: '1-Click Printable PDF Scorecards',
      description: 'Generate structured candidate evaluation reports with radar skill breakdowns, model answer comparisons, and learning resources.',
      badge: 'Export PDF'
    }
  ];

  return (
    <section className="py-20 bg-slate-50 border-t border-b border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
            <span>Built for Modern Tech Engineering & Enterprise Recruitment</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Comprehensive Platform Features
          </h2>
          <p className="text-slate-600 text-sm">
            Simulate real technical screenings for candidates, or automate applicant pipelines for enterprise hiring teams.
          </p>
        </div>

        {/* Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="group relative p-8 rounded-3xl bg-white border border-slate-200 shadow-enterprise hover:shadow-enterprise-lg hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669] group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#059669] transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-[#059669]">
                  <CheckCircle className="w-4 h-4" />
                  <span>Enterprise Ready</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
