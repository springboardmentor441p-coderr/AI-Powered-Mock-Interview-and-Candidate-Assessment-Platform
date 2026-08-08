import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  PlaySquare,
  BarChart3,
  History,
  User,
  Sparkles,
  Bot,
  Sliders,
  Award,
  LogOut
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Resume Analyzer', icon: FileText, path: '/resume' },
    { label: 'Interview Setup', icon: Sliders, path: '/interview/setup' },
    { label: 'Live Interview', icon: PlaySquare, path: '/interview' },
    { label: 'Latest Result', icon: Award, path: '/interview/result' },
    { label: 'Performance Analytics', icon: BarChart3, path: '/analytics' },
    { label: 'Session History', icon: History, path: '/history' },
    { label: 'Profile & Target Role', icon: User, path: '/profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white text-slate-800 flex flex-col shrink-0 border-r border-slate-200 min-h-screen">
      <div className="p-6 flex items-center space-x-3 border-b border-slate-100">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-indigo-600/30 shrink-0">
          <Bot className="h-5 w-5" />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-900">
          SmartHire<span className="text-indigo-600">AI</span>
        </span>
      </div>

      <nav className="p-4 space-y-1 flex-1">
        <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 m-4 bg-slate-900 rounded-2xl text-white shadow-sm space-y-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Candidate Status
          </p>
          <p className="text-xs text-slate-300 leading-relaxed mb-2">
            AI Interview & Resume Evaluation Engine Active
          </p>
          <div className="w-full bg-slate-800 h-1.5 mb-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full w-[88%]" />
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold text-right">88% Job Ready</div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-300 transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
