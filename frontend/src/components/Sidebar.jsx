import React from 'react';
import { Link as RouterLink, useLocation as useRouteLocation } from 'react-router-dom';
import {
  Cpu,
  LayoutDashboard,
  PlusCircle,
  FileText,
  History,
  User,
  Settings,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar = () => {
  const location = useRouteLocation();
  const { candidate } = useApp();

  // Hide Sidebar in proctored Interview Room, Login, Signup, or Landing pages
  if (location.pathname === '/interview-room' || location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/landing') {
    return null;
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Interview', path: '/create-interview', icon: PlusCircle },
    { name: 'Assessment', path: '/assessment', icon: FileText },
    { name: 'History', path: '/interview-history', icon: History },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <aside className="sticky top-0 left-0 z-50 h-screen w-64 min-w-[16rem] bg-slate-950/95 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col justify-between shrink-0 shadow-2xl">
      {/* Top Header & Logo */}
      <div className="p-6 space-y-6">
        <RouterLink
          to="/"
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1">
              SmartHire <span className="glow-gradient-text font-black">AI</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase font-semibold">
              Candidate Platform
            </span>
          </div>
        </RouterLink>

        {/* Navigation Links */}
        <nav className="space-y-1.5 pt-2">
          <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest px-3 block mb-2">
            Menu Navigation
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/dashboard'
              ? (location.pathname === '/' || location.pathname === '/dashboard')
              : location.pathname === item.path;

            return (
              <RouterLink
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/15 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
              </RouterLink>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer: Candidate Profile Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
        {candidate?.isLoggedIn ? (
          <RouterLink
            to="/profile"
            className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:border-cyan-500/40 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={candidate.avatar}
                alt={candidate.name}
                className="w-9 h-9 rounded-xl border-2 border-cyan-500/50 object-cover shadow-sm shadow-cyan-500/20 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate max-w-[100px]">
                  {candidate.name}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Candidate
                </span>
              </div>
            </div>

            <Settings className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 transition-colors" />
          </RouterLink>
        ) : (
          <RouterLink
            to="/login"
            className="glow-cyan-btn w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Sparkles className="w-4 h-4" /> Candidate Login
          </RouterLink>
        )}

        <div className="text-center">
          <span className="text-[10px] text-slate-600 font-mono">
            SmartHire AI v1.0 • Candidate Edition
          </span>
        </div>
      </div>
    </aside>
  );
};
