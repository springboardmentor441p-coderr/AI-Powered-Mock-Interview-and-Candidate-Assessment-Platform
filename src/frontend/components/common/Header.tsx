import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, User as UserIcon, LogOut, ChevronDown, Sparkles, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all shadow-2xs group cursor-pointer shrink-0"
          title="Go Back"
          aria-label="Go Back"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search interview topics, specs, questions..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/interview/setup"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-200/60"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span>New Mock Session</span>
        </Link>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-200" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white font-semibold flex items-center justify-center text-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CU'}
              </div>
            )}
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'Candidate'}</div>
              <div className="text-[10px] text-slate-500">{user?.targetRole || 'Software Engineer'}</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-lg py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="font-semibold text-slate-900">{user?.name}</div>
                <div className="text-slate-500 text-[11px] truncate">{user?.email}</div>
              </div>
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 text-slate-700"
              >
                <UserIcon className="h-4 w-4 text-slate-400" />
                Profile Settings
              </Link>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-rose-50 text-rose-600 font-medium text-left"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
