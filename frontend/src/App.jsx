import React, { useEffect, useState } from 'react';

import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';
import LiveInterview from './pages/LiveInterview';
import Report from './pages/Report';
import History from './pages/History';
import Rules from './pages/Rules';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCandidates from './pages/admin/AdminCandidates';
import AdminSessions from './pages/admin/AdminSessions';
import AdminIntegrity from './pages/admin/AdminIntegrity';
import AdminSchedule from './pages/admin/AdminSchedule';
import AdminML from './pages/admin/AdminML';

const PROTECTED = [
  'dashboard', 'onboarding', 'interview-setup', 'live-interview', 'report', 'history', 'rules',
  'admin-dashboard', 'admin-candidates', 'admin-sessions', 'admin-integrity', 'admin-schedule', 'admin-ml'
];

function getRoute() {
  const hash = window.location.hash.replace('#', '').split('?')[0];
  return hash || 'landing';
}

export default function App() {
  const [route, setRoute] = useState(getRoute);

  const navigate = (path) => {
    const [base, query] = path.split('?');
    const isProtected = PROTECTED.includes(base);
    const token = localStorage.getItem('nexiq_token');

    if (isProtected && !token) {
      window.location.hash = 'auth';
      setRoute('auth');
      return;
    }

    if (query) {
      window.history.pushState({}, '', `${window.location.pathname}?${query}#${base}`);
    } else {
      window.location.hash = base;
    }
    setRoute(base);
  };

  useEffect(() => {
    const onPop = () => setRoute(getRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Auto-redirect logged-in users away from public pages
  useEffect(() => {
    const token = localStorage.getItem('nexiq_token');
    if (token && (route === 'landing' || route === 'auth')) {
      navigate('dashboard');
    }
  }, [route]);

  switch (route) {
    // Public
    case 'landing':         return <Landing navigate={navigate} />;
    case 'auth':            return <Auth navigate={navigate} />;

    // Candidate
    case 'onboarding':      return <Onboarding navigate={navigate} />;
    case 'dashboard':       return <Dashboard navigate={navigate} />;
    case 'interview-setup': return <InterviewSetup navigate={navigate} />;
    case 'rules':           return <Rules navigate={navigate} />;
    case 'live-interview':  return <LiveInterview navigate={navigate} />;
    case 'report':          return <Report navigate={navigate} />;
    case 'history':         return <History navigate={navigate} />;

    // Admin
    case 'admin-dashboard': return <AdminDashboard navigate={navigate} />;
    case 'admin-candidates':return <AdminCandidates navigate={navigate} />;
    case 'admin-sessions':  return <AdminSessions navigate={navigate} />;
    case 'admin-integrity': return <AdminIntegrity navigate={navigate} />;
    case 'admin-schedule':  return <AdminSchedule navigate={navigate} />;
    case 'admin-ml':        return <AdminML navigate={navigate} />;

    default:                return <Landing navigate={navigate} />;
  }
}
