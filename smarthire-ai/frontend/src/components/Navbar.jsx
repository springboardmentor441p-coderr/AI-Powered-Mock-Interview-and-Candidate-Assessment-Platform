import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { Sparkles, LogOut, LayoutDashboard, History, Users, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive(path)
        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`;

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-lg group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-shadow">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold gradient-text hidden sm:inline">SmartHire AI</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {/* Candidate links */}
          {(user.role === 'candidate' || user.role === 'admin') && (
            <>
              <Link to="/dashboard" className={linkClass('/dashboard')}>
                <LayoutDashboard size={16} />
                <span className="hidden md:inline">Dashboard</span>
              </Link>
              <Link to="/history" className={linkClass('/history')}>
                <History size={16} />
                <span className="hidden md:inline">History</span>
              </Link>
            </>
          )}

          {/* Recruiter links */}
          {(user.role === 'recruiter' || user.role === 'admin') && (
            <Link to="/recruiter" className={linkClass('/recruiter')}>
              <Users size={16} />
              <span className="hidden md:inline">Recruiter</span>
            </Link>
          )}

          {/* Admin link */}
          {user.role === 'admin' && (
            <Link to="/admin" className={linkClass('/admin')}>
              <Shield size={16} />
              <span className="hidden md:inline">Admin</span>
            </Link>
          )}
        </div>

        {/* Right side: Notifications + User */}
        <div className="flex items-center gap-3">
          <NotificationBell />

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-sm">
              <p className="text-slate-200 font-medium leading-tight">{user.name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
