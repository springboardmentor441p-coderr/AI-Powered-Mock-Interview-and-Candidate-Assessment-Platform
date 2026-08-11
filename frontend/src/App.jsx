import React, { useEffect, useState } from 'react';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import InterviewSetup from './pages/InterviewSetup';
import LiveInterview from './pages/LiveInterview';
import Report from './pages/Report';
import History from './pages/History';
import Rules from './pages/Rules';
import CompanySelect from './pages/CompanySelect';
import RoleSelect from './pages/RoleSelect';
import LiveApply from './pages/LiveApply';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCandidates from './pages/admin/AdminCandidates';
import AdminSessions from './pages/admin/AdminSessions';
import AdminIntegrity from './pages/admin/AdminIntegrity';
import AdminSchedule from './pages/admin/AdminSchedule';
import AdminML from './pages/admin/AdminML';

const PROTECTED = [
  'dashboard', 'onboarding', 'interview-setup', 'live-interview', 'report', 'history', 'rules',
  'company-select', 'role-select', 'live-apply',
  'admin-dashboard', 'admin-candidates', 'admin-sessions', 'admin-integrity', 'admin-schedule', 'admin-ml',
];

function getRoute() {
  // Support both  /#route  and  /?query=x#route  URL shapes
  const hash = window.location.hash.replace('#', '').split('?')[0].trim();
  return hash || 'auth';
}

export default function App() {
  const [route, setRoute] = useState(getRoute);

  const navigate = (path) => {
    const [base, query] = path.split('?');
    const isProtected = PROTECTED.includes(base);
    const token = localStorage.getItem('nexiq_token');

    if (isProtected && !token) {
      // Push auth onto the stack so the user can go forward again after logging in
      window.history.pushState({ route: 'auth' }, '', `#auth`);
      setRoute('auth');
      return;
    }

    // Always pushState — this gives the browser a real history entry to go back to
    const url = query
      ? `${window.location.pathname}?${query}#${base}`
      : `#${base}`;
    window.history.pushState({ route: base, query: query || null }, '', url);
    setRoute(base);
  };

  useEffect(() => {
    // popstate fires on browser back/forward for pushState entries
    const onPop = () => setRoute(getRoute());
    // hashchange fires as a fallback for any direct hash links
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, []);

  // Auto-redirect logged-in users away from public auth page to dashboard
  useEffect(() => {
    const token = localStorage.getItem('nexiq_token');
    if (token && (route === 'auth' || route === 'landing')) {
      navigate('dashboard');
    }
  }, [route]);

  switch (route) {
    // Public / Default
    case 'auth':             return <Auth navigate={navigate} />;

    // Candidate
    case 'onboarding':       return <Onboarding navigate={navigate} />;
    case 'dashboard':        return <Dashboard navigate={navigate} />;
    case 'interview-setup':  return <InterviewSetup navigate={navigate} />;
    case 'rules':            return <Rules navigate={navigate} />;
    case 'live-interview':   return <LiveInterview navigate={navigate} />;
    case 'report':           return <Report navigate={navigate} />;
    case 'history':          return <History navigate={navigate} />;

    // Live Simulation flow
    case 'company-select':   return <CompanySelect navigate={navigate} />;
    case 'role-select':      return <RoleSelect navigate={navigate} />;
    case 'live-apply':       return <LiveApply navigate={navigate} />;

    // Admin
    case 'admin-dashboard':  return <AdminDashboard navigate={navigate} />;
    case 'admin-candidates': return <AdminCandidates navigate={navigate} />;
    case 'admin-sessions':   return <AdminSessions navigate={navigate} />;
    case 'admin-integrity':  return <AdminIntegrity navigate={navigate} />;
    case 'admin-schedule':   return <AdminSchedule navigate={navigate} />;
    case 'admin-ml':         return <AdminML navigate={navigate} />;

    default:                 return <Auth navigate={navigate} />;
  }
}
