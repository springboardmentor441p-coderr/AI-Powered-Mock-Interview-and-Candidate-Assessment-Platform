import React from 'react';

const ADMIN_NAV = [
  { id: 'admin-dashboard', label: 'Overview', icon: 'monitoring' },
  { id: 'admin-schedule', label: 'Schedule', icon: 'event' },
  { id: 'admin-candidates', label: 'Candidates', icon: 'group' },
  { id: 'admin-sessions', label: 'Sessions', icon: 'video_library' },
  { id: 'admin-integrity', label: 'Integrity', icon: 'gavel' },
  { id: 'admin-ml', label: 'ML Engine', icon: 'model_training' },
];

export default function AdminLayout({ children, active, navigate }) {
  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/nexiq_logo.png" alt="NEXIQ" />
          <div>
            <span style={{ display: 'block', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--violet-bright)', letterSpacing: '0.05em' }}>NEXIQ</span>
            <span style={{ display: 'block', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 1 }}>Admin Portal</span>
          </div>
        </div>

        <div className="sidebar-nav">
          <p className="sidebar-section-label">Management</p>
          {ADMIN_NAV.map(item => (
            <div
              key={item.id}
              className={`nav-item${active === item.id ? ' active' : ''}`}
              style={active === item.id ? { background: 'var(--violet-dim)', color: 'var(--violet-bright)', borderColor: 'rgba(168,85,247,0.2)' } : {}}
              onClick={() => navigate(item.id)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </div>
          ))}

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
          <p className="sidebar-section-label">Candidate View</p>
          <div className="nav-item" onClick={() => navigate('dashboard')}>
            <span className="material-symbols-outlined">switch_account</span>
            Candidate Portal
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="user-chip" onClick={() => { localStorage.removeItem('nexiq_token'); localStorage.removeItem('nexiq_user'); navigate('auth'); }}>
            <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--violet-bright), #ec4899)' }}>AD</div>
            <div className="user-info">
              <p>Admin</p>
              <span>Logout</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-status" style={{ color: 'var(--violet-bright)' }}>
            <div className="pulse-dot" style={{ background: 'var(--violet-bright)' }} />
            Admin Command Center
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="badge badge-violet">
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>admin_panel_settings</span>
              Administrator
            </span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
