'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Mic, 
  History, 
  User, 
  Bell, 
  Bot,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StudioSidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, reports } = useApp();

  const userReports = React.useMemo(() => {
    if (!user) return [];
    return reports.filter(
      (r) => r.candidateEmail?.toLowerCase() === user.email?.toLowerCase() || user.role === 'recruiter' || user.role === 'admin'
    );
  }, [reports, user]);

  const latestReportId = userReports.length > 0 ? userReports[0].id : null;
  const sessionHistoryHref = latestReportId ? `/report/${latestReportId}` : '/dashboard';

  const navItems = [
    { name: 'Résumés & Launch', href: '/resume', icon: FileText },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Session History', href: sessionHistoryHref, icon: History },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between p-4 select-none shrink-0 shadow-sm">
      
      <div className="space-y-6">
        {/* Logo Brand Header */}
        <Link href="/" className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-xl bg-[#059669] flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-base font-extrabold text-slate-900 tracking-tight">InterVio</span>
              <span className="text-xs font-bold text-[#059669] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">AI</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider block -mt-0.5">ON-AIR STUDIO</span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.name === 'Session History' && pathname?.startsWith('/report/'));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-[#059669] border border-emerald-200/80 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#059669]' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#059669]" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding */}
      <div className="pt-4 border-t border-slate-100 px-3 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="font-mono tracking-wider">ON AIR STUDIO</span>
        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">V1.0</span>
      </div>

    </aside>
  );
};
