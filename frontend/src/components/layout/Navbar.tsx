'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bot, 
  Bell, 
  User, 
  LogOut,
  Building2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, roleMode } = useApp();

  const isStudioRoute = ['/dashboard', '/resume', '/profile', '/interview/setup', '/report'].some(route => pathname?.startsWith(route));
  const hideProfileIcon = pathname === '/' || pathname === '/login';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Brand Header */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#059669] flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-500/20">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <span className="text-lg font-extrabold text-slate-900 tracking-tight">
            Inter<span className="text-[#059669]">Vio</span>
          </span>
        </Link>

        {/* Right Navigation & Profile Badge */}
        <div className="flex items-center gap-4">
          
          {user ? (
            <>
              {/* Notification Bell Icon */}
              <button 
                type="button"
                aria-label="Notifications"
                className="relative p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              {/* User Avatar Badge */}
              <div className="flex items-center gap-3">
                {!hideProfileIcon && (
                  <Link href="/profile" className="flex items-center gap-2.5 group pl-2 border-l border-slate-200">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-xl object-cover ring-2 ring-emerald-500/20 shadow-sm"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-[#059669] text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="hidden sm:block text-left">
                      <span className="block text-xs font-bold text-slate-900 group-hover:text-[#059669] transition-colors leading-tight">
                        {user.name}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-semibold capitalize leading-tight">
                        {roleMode === 'recruiter' ? 'Recruiter' : 'Candidate'}
                      </span>
                    </div>
                  </Link>
                )}

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                Get Started
              </Link>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
