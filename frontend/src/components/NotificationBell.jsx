/**
 * NotificationBell.jsx
 * Bell icon with unread badge, dropdown notification list.
 * Seeded from companyCatalog; persists read state in localStorage.
 */
import React, { useEffect, useRef, useState } from 'react';
import { SEED_NOTIFICATIONS } from '../data/companyCatalog';

const STORAGE_KEY = 'nexiq_notifications';

function loadNotifications() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return SEED_NOTIFICATIONS.map(n => ({ ...n }));
}

function saveNotifications(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
}

export default function NotificationBell({ navigate }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(loadNotifications);
  const dropRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    saveNotifications(updated);
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const fmtTime = (ts) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const handleNotifClick = (notif) => {
    markRead(notif.id);
    if (notif.type === 'company' || notif.type === 'role') navigate('company-select');
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropRef}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-xl hover:bg-surface-container-high/40 transition-colors"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors text-[22px]">
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-error rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1 shadow-[0_0_8px_rgba(239,68,68,0.6)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-[360px] z-[200] bg-surface-container-low/95 backdrop-blur-2xl rounded-2xl border border-outline-variant/15 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden animate-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/10">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Notifications</h3>
              <p className="font-mono-label text-mono-label text-on-surface-variant text-[11px] uppercase mt-0.5">
                {unreadCount} unread
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="font-mono-label text-mono-label text-primary text-[11px] uppercase hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30 mb-2 block">notifications_off</span>
                <p className="font-body-md text-on-surface-variant">No notifications yet.</p>
              </div>
            ) : (
              notifications.slice(0, 8).map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left flex items-start gap-3 px-5 py-4 border-b border-outline-variant/5 hover:bg-surface-container-high/30 transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${!notif.read ? 'bg-primary/15' : 'bg-surface-container-high/40'}`}>
                    {notif.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-label-md text-label-md text-sm ${!notif.read ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1 shadow-[0_0_6px_rgba(0,240,255,0.6)]" />
                      )}
                    </div>
                    <p className="font-mono-label text-mono-label text-on-surface-variant text-[11px] mt-0.5 line-clamp-2">{notif.body}</p>
                    <p className="font-mono-label text-mono-label text-on-surface-variant/40 text-[10px] mt-1 uppercase">{fmtTime(notif.time)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 8 && (
            <div className="px-5 py-3 border-t border-outline-variant/10 text-center">
              <button
                onClick={() => { navigate('company-select'); setOpen(false); }}
                className="font-mono-label text-mono-label text-primary text-[11px] uppercase hover:underline"
              >
                View all opportunities →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
