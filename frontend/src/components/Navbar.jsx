import React, { useState } from 'react';
import { Sparkles, Video, FileText, BarChart2, Award, UserCheck, Shield, ChevronDown, Users, Sliders, LogOut } from 'lucide-react';
import { getStoredUser, removeStoredToken } from '../services/api';

export default function Navbar({ activePage, setActivePage }) {
  const user = getStoredUser();
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  const handleLogout = () => {
    removeStoredToken();
    localStorage.removeItem('smarthire_user');
    setActivePage('login');
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <div 
            onClick={() => setActivePage('landing')} 
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-base font-bold font-display tracking-tight text-white flex items-center gap-1">
                SmartHire <span className="text-gradient">AI</span>
              </span>
              <span className="text-[9px] text-slate-400 block tracking-wide font-mono uppercase">AI Mock Interview Platform</span>
            </div>
          </div>

          {/* FRONTEND CANDIDATE & ADMIN MODULES FROM ARCHITECTURE DIAGRAM */}
          <div className="flex-1 flex justify-center items-center px-2">
            <nav className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
              
              {/* 1. Candidate Interface */}
              <button
                onClick={() => setActivePage('landing')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activePage === 'landing' || activePage === 'resume-upload' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Candidate Interface
              </button>

              {/* 2. Interview Room */}
              <button
                onClick={() => setActivePage('interview-setup')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activePage === 'interview-setup' || activePage === 'interview-room' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Video className="w-3.5 h-3.5" /> Interview Room
              </button>

              {/* 3. Dashboard & Analytics */}
              <button
                onClick={() => setActivePage('candidate-dashboard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activePage === 'candidate-dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Dashboard & Analytics
              </button>

              {/* 4. Reports & Feedback */}
              <button
                onClick={() => setActivePage('interview-report')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activePage === 'interview-report' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-400" /> Reports & Feedback
              </button>

              {/* 5. EXPLICIT Admin / Recruiter Interface */}
              <div className="relative">
                <button
                  onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    activePage === 'recruiter-dashboard' || activePage === 'admin-dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-400" /> Admin/Recruiter Interface <ChevronDown className="w-3 h-3" />
                </button>

                {showAdminDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider px-3 py-1 block font-bold">
                      Admin / Recruiter Sub-Modules:
                    </span>
                    
                    <button
                      onClick={() => { setActivePage('recruiter-dashboard'); setShowAdminDropdown(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-900 flex items-center gap-2"
                    >
                      <Users className="w-3.5 h-3.5 text-cyan-400" /> 1. User Management
                    </button>

                    <button
                      onClick={() => { setActivePage('recruiter-dashboard'); setShowAdminDropdown(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-900 flex items-center gap-2"
                    >
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" /> 2. Interview Management
                    </button>

                    <button
                      onClick={() => { setActivePage('admin-dashboard'); setShowAdminDropdown(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-900 flex items-center gap-2"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-emerald-400" /> 3. Analytics Dashboard
                    </button>

                    <button
                      onClick={() => { setActivePage('interview-report'); setShowAdminDropdown(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-900 flex items-center gap-2"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-400" /> 4. Reports
                    </button>
                  </div>
                )}
              </div>

            </nav>
          </div>

          {/* User Profile & Auth Button */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user.full_name ? user.full_name[0] : 'U'}
                  </div>
                  <span className="text-xs font-medium text-slate-200 hidden sm:inline">{user.full_name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePage('login')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
                >
                  Log In
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
