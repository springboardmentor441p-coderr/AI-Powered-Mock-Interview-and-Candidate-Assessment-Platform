import React from 'react';
import { useLocation } from 'react-router-dom';
import { Cpu, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

export const Footer = () => {
  const location = useLocation();

  if (location.pathname === '/interview-room') {
    return null;
  }
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 px-6 mt-16 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="font-semibold text-slate-200">SmartHire AI Candidate Engine</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500 font-mono text-[11px]">v1.0.0 (FastAPI + React + Vite)</span>
        </div>

        <div className="flex items-center gap-6 text-slate-400">
          <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> ISO/IEC 27001 AI Telemetry
          </span>
          <span className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer">
            <Sparkles className="w-4 h-4 text-purple-400" /> Web Speech & Vision ML Core
          </span>
        </div>

        <div className="text-slate-500 text-[11px] font-mono">
          © 2026 SmartHire AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
