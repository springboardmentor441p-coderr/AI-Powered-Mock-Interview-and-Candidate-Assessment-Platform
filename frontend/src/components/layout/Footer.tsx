'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, ShieldCheck, Terminal, Cpu, Globe, Share2, Code2, Building2, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 text-slate-600 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          
          {/* Col 1: Brand & Bio */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                Inter<span className="text-[#059669]">Vio</span> AI
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              The enterprise-grade AI technical screening and interview platform built for candidate evaluation, talent acquisition teams, and engineering hiring managers.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100/80 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-[#059669]" /> SOC 2 Type II Certified
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-200/80 text-slate-700 text-[10px] font-bold border border-slate-300">
                ISO 27001 Verified
              </span>
            </div>
          </div>

          {/* Col 2: Candidates */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              For Candidates
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/interview/demo?track=Technical" className="hover:text-[#059669] transition-colors">Technical Practice Round</Link></li>
              <li><Link href="/interview/demo?track=System%20Design" className="hover:text-[#059669] transition-colors">System Design Practice</Link></li>
              <li><Link href="/resume" className="hover:text-[#059669] transition-colors">AI Resume Parser</Link></li>
              <li><Link href="/dashboard" className="hover:text-[#059669] transition-colors">Candidate Dashboard</Link></li>
              <li><Link href="/profile" className="hover:text-[#059669] transition-colors">Skill Radar & Analytics</Link></li>
            </ul>
          </div>

          {/* Col 3: Employers & Recruiters */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              For Employers & HR
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/recruiter" className="hover:text-[#059669] transition-colors">Recruiter ATS Screening</Link></li>
              <li><Link href="/recruiter?tab=campaigns" className="hover:text-[#059669] transition-colors">Job Campaign Manager</Link></li>
              <li><Link href="/recruiter" className="hover:text-[#059669] transition-colors">Candidate Comparison Matrix</Link></li>
              <li><Link href="/admin" className="hover:text-[#059669] transition-colors">Question Bank Admin</Link></li>
              <li><Link href="/profile" className="hover:text-[#059669] transition-colors">AI Proctoring Reports</Link></li>
            </ul>
          </div>

          {/* Col 4: Enterprise Trust */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Enterprise Trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>Unbiased AI Evaluation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>Malpractice Proctoring</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                <span>Encrypted Audio & Vision</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 InterVio Enterprise AI Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Security & Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
