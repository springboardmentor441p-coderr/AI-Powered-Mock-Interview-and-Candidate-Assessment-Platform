import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { getToken, getSessionUser, clearSession } from './api'

import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ResumeUpload from './pages/ResumeUpload.jsx'
import StartInterview from './pages/StartInterview.jsx'
import InterviewRoom from './pages/InterviewRoom.jsx'
import Results from './pages/Results.jsx'
import History from './pages/History.jsx'
import RecruiterView from './pages/RecruiterView.jsx'
import Notifications from './pages/Notifications.jsx'
import { api } from './api'

function RequireAuth({ children }) {
  const token = getToken()
  const location = useLocation()
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getSessionUser()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const fetchUnread = () => api.unreadCount().then((d) => setUnread(d.unread_count)).catch(() => {})
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [])

  const links = [
    { to: '/dashboard', label: '📊 Dashboard' },
    { to: '/resume', label: '📄 Resume' },
    { to: '/interview/new', label: '🎤 New Interview' },
    { to: '/history', label: '🕘 History' },
    { to: '/notifications', label: '🔔 Notifications', badge: unread },
  ]
  if (user && (user.role === 'recruiter' || user.role === 'admin')) {
    links.push({ to: '/recruiter', label: '🧑‍💼 Candidates' })
  }

  const logout = () => {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="sidebar">
      <div className="brand">SmartHire AI</div>
      {links.map((l) => (
        <div
          key={l.to}
          className={`nav-link ${location.pathname.startsWith(l.to) ? 'active' : ''}`}
          onClick={() => navigate(l.to)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>{l.label}</span>
          {!!l.badge && (
            <span style={{
              background: '#ff6b6b', color: 'white', borderRadius: 999,
              fontSize: 11, padding: '1px 7px', fontWeight: 700,
            }}>{l.badge}</span>
          )}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      {user && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 600 }}>{user.full_name}</div>
          <div className="muted" style={{ fontSize: 12 }}>{user.role}</div>
        </div>
      )}
      <div className="nav-link" onClick={logout}>🚪 Logout</div>
    </div>
  )
}

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<RequireAuth><AppLayout><Dashboard /></AppLayout></RequireAuth>} />
        <Route path="/resume" element={<RequireAuth><AppLayout><ResumeUpload /></AppLayout></RequireAuth>} />
        <Route path="/interview/new" element={<RequireAuth><AppLayout><StartInterview /></AppLayout></RequireAuth>} />
        <Route path="/interview/:id" element={<RequireAuth><AppLayout><InterviewRoom /></AppLayout></RequireAuth>} />
        <Route path="/results/:id" element={<RequireAuth><AppLayout><Results /></AppLayout></RequireAuth>} />
        <Route path="/history" element={<RequireAuth><AppLayout><History /></AppLayout></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><AppLayout><Notifications /></AppLayout></RequireAuth>} />
        <Route path="/recruiter" element={<RequireAuth><AppLayout><RecruiterView /></AppLayout></RequireAuth>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
