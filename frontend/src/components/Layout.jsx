import React, { useState } from 'react';
import ChatBot from './ChatBot';
import NotificationBell from './NotificationBell';
import SearchOverlay from './SearchOverlay';

const NAV_CANDIDATE = [
  { id: 'dashboard',      label: 'Dashboard',        icon: 'dashboard' },
  { id: 'company-select', label: 'Live Simulation',  icon: 'rocket_launch' },
  { id: 'interview-setup', label: 'Practice Mode',   icon: 'videocam' },
  { id: 'history',        label: 'History',          icon: 'history' },
  { id: 'onboarding',     label: 'Profile / Apply',  icon: 'upload_file' },
];

const NAV_ADMIN = [
  { id: 'admin-dashboard',  label: 'Company Management', icon: 'corporate_fare' },
  { id: 'admin-sessions',   label: 'Session Analytics',  icon: 'monitoring' },
  { id: 'admin-candidates', label: 'User Controls',      icon: 'admin_panel_settings' },
];

export default function Layout({ children, active, navigate }) {
  const [isChatOpen, setIsChatOpen]   = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const raw  = localStorage.getItem('nexiq_user');
  const user = raw ? JSON.parse(raw) : {};
  const initials = (user.full_name || user.email || 'U')[0].toUpperCase();

  const logout = () => {
    localStorage.removeItem('nexiq_token');
    localStorage.removeItem('nexiq_user');
    navigate('auth');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low/40 backdrop-blur-2xl z-50 flex flex-col border-r border-outline-variant/10">
        {/* Logo */}
        <div className="p-gutter flex items-center gap-3 mb-8">
          <img src="/nexiq_logo.png" alt="Nexiq" className="h-8 w-auto object-contain" onError={e => { e.target.style.display = 'none'; }} />
          <span className="font-headline-md text-headline-md text-primary tracking-tight">Nexiq</span>
        </div>

        {/* Nav */}
        <div className="flex-1 px-4 space-y-8 overflow-y-auto">
          <section>
            <h3 className="px-4 mb-4 font-mono-label text-mono-label uppercase text-on-surface-variant/50">Candidate Terminal</h3>
            <nav className="space-y-1">
              {NAV_CANDIDATE.map(item => (
                <a
                  key={item.id}
                  href="#"
                  onClick={e => { e.preventDefault(); navigate(item.id); }}
                  className={`flex items-center px-4 py-3 rounded-xl transition-all ${
                    active === item.id
                      ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined mr-3 text-[20px]">{item.icon}</span>
                  {item.label}
                  {item.id === 'company-select' && (
                    <span className="ml-auto font-mono-label text-mono-label text-[9px] uppercase bg-primary/15 text-primary border border-primary/25 px-1.5 py-0.5 rounded-full">Live</span>
                  )}
                </a>
              ))}
            </nav>
          </section>

          <section>
            <h3 className="px-4 mb-4 font-mono-label text-mono-label uppercase text-on-surface-variant/50">Admin Command</h3>
            <nav className="space-y-1">
              {NAV_ADMIN.map(item => (
                <a
                  key={item.id}
                  href="#"
                  onClick={e => { e.preventDefault(); navigate(item.id); }}
                  className={`flex items-center px-4 py-3 rounded-xl transition-all ${
                    active === item.id
                      ? 'bg-secondary-container text-on-secondary-container font-bold'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined mr-3 text-[20px]">{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </nav>
          </section>
        </div>

        {/* Bottom user chip */}
        <div className="mt-auto p-gutter border-t border-outline-variant/10 bg-surface-container-lowest/50">
          <div className="flex items-center gap-3 cursor-pointer" onClick={logout}>
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm ring-2 ring-primary-container/20">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface">{user.full_name || 'Candidate'}</span>
              <span className="font-mono-label text-mono-label text-on-surface-variant">Active Session</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="pl-72 flex flex-col min-h-screen w-full">
        {/* Topbar */}
        <header className="sticky top-0 h-20 bg-surface/60 backdrop-blur-xl z-40 flex items-center justify-between px-gutter border-b border-outline-variant/5">
          <div className="flex items-center gap-4">
            {/* Back arrow — hidden on dashboard (home base) */}
            {active !== 'dashboard' && (
              <button
                id="topbar-back-btn"
                onClick={() => window.history.back()}
                aria-label="Go back"
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface-container-high/40 border border-outline-variant/10 text-on-surface-variant hover:text-primary hover:border-primary/40 hover:bg-primary/10 transition-all group"
              >
                <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
              </button>
            )}
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
            <span className="font-mono-label text-mono-label uppercase tracking-widest text-primary">System Synchronized</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Search icon */}
            <button
              id="topbar-search-btn"
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-xl hover:bg-surface-container-high/40 transition-colors"
              aria-label="Search companies and roles"
            >
              <span className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-[22px]">search</span>
            </button>

            {/* Notification Bell */}
            <NotificationBell navigate={navigate} />

            <div className="h-8 w-px bg-outline-variant/20 mx-1" />
            <div className="flex items-center gap-3 bg-surface-container-high/40 rounded-full py-1.5 pl-4 pr-1.5 border border-outline-variant/10">
              <span className="font-label-md text-label-md text-on-surface">Candidate Terminal</span>
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-surface">
          {children}
        </main>
      </div>

      {/* Search overlay */}
      <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} navigate={navigate} />

      {/* AI Chat */}
      <div style={{ display: isChatOpen ? 'block' : 'none' }}>
        <ChatBot onClose={() => setIsChatOpen(false)} />
      </div>

      {/* AI Chat FAB */}
      <button
        onClick={() => setIsChatOpen(prev => !prev)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-primary shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center text-on-primary z-50 hover:scale-105 transition-transform group"
      >
        <span className="material-symbols-outlined text-3xl group-hover:animate-pulse">
          {isChatOpen ? 'close' : 'smart_toy'}
        </span>
      </button>
    </div>
  );
}
