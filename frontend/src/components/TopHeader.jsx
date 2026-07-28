import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { User, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TopHeader = () => {
  const location = useLocation();
  const { candidate } = useApp();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'Dashboard';
      case '/create-interview':
        return 'Create Interview';
      case '/interview-history':
        return 'Interview History';
      case '/assessment':
        return 'AI Assessment Generator';
      case '/assessment-result':
        return 'Assessment Result';
      case '/interview-setup':
        return 'Pre-Interview Setup';
      case '/interview-room':
        return 'Live AI Interview';
      case '/interview-result':
        return 'Interview Evaluation Report';
      case '/performance':
        return 'Performance Analytics';
      case '/profile':
        return 'Candidate Profile';
      case '/settings':
        return 'Settings';
      default:
        return 'SmartHire AI';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3 flex items-center justify-between">
      {/* Page Title / Location indicator */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-white tracking-wide font-mono">
          {getPageTitle()}
        </h2>
      </div>

      {/* Top Right Candidate Profile */}
      <div className="flex items-center gap-3">
        {candidate?.isLoggedIn ? (
          <RouterLink
            to="/profile"
            className="flex items-center gap-3 p-1.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 transition-all group cursor-pointer shadow-sm"
          >
            <img
              src={candidate.avatar}
              alt={candidate.name}
              className="w-8 h-8 rounded-full border-2 border-cyan-400 object-cover shadow-sm shadow-cyan-500/20 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                {candidate.name}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Candidate
              </span>
            </div>
            <User className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 ml-1 transition-colors" />
          </RouterLink>
        ) : (
          <RouterLink
            to="/login"
            className="glow-cyan-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Candidate Login
          </RouterLink>
        )}
      </div>
    </header>
  );
};
