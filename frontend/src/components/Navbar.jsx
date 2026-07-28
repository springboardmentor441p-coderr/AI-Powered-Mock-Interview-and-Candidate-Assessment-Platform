import React from 'react';
import { Link as RouterLink, useLocation as useRouteLocation } from 'react-router-dom';
import { Cpu, LayoutDashboard, PlusCircle, History, User, Video, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar = () => {
  const location = useRouteLocation();
  const { candidate } = useApp();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Create Interview', path: '/create-interview', icon: PlusCircle },
    { name: 'Interview History', path: '/interview-history', icon: History },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <RouterLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight flex items-center gap-1.5 text-white">
              SmartHire <span className="glow-gradient-text font-black">AI</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase font-semibold">
              Candidate Platform
            </span>
          </div>
        </RouterLink>

        {/* Links */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === '/dashboard'
              ? (location.pathname === '/' || location.pathname === '/dashboard')
              : location.pathname === item.path;
            return (
              <RouterLink
                key={item.name}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {item.name}
              </RouterLink>
            );
          })}
        </div>

        {/* Candidate Profile Badge */}
        <div className="flex items-center gap-3">
          {candidate.isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-100">{candidate.name}</span>
                <span className="text-[10px] text-cyan-400 font-mono font-medium">Candidate</span>
              </div>
              <img
                src={candidate.avatar}
                alt="Profile"
                className="w-9 h-9 rounded-full border-2 border-cyan-500/50 object-cover shadow-sm shadow-cyan-500/30"
              />
            </div>
          ) : (
            <RouterLink
              to="/login"
              className="glow-cyan-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Candidate Login
            </RouterLink>
          )}
        </div>
      </div>
    </nav>
  );
};
