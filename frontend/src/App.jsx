import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Award, LayoutDashboard, UploadCloud, Settings, LogOut, Briefcase } from 'lucide-react';

import Login from './views/Login';
import Dashboard from './views/Dashboard';
import ResumeUpload from './views/ResumeUpload';
import InterviewSetup from './views/InterviewSetup';
import InterviewRoom from './views/InterviewRoom';
import InterviewReport from './views/InterviewReport';
import SettingsPage from './views/Settings';

// Authentication Guard Wrapper
function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Global Dashboard Layout with Sidebar
function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'candidate';
  const fullName = localStorage.getItem('full_name') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('full_name');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#07080d] bg-mesh-grid text-gray-100">
      {/* Sidebar (Permanent Glass Panel) */}
      <aside className="w-64 glass-panel flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-md">
              <Award className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">SmartHire AI</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/5 hover:text-cyan-400 text-gray-300 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5 text-gray-400" />
              Workspace
            </Link>

            {role === 'candidate' && (
              <>
                <Link 
                  to="/resume-upload" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/5 hover:text-cyan-400 text-gray-300 transition-colors"
                >
                  <UploadCloud className="w-5 h-5 text-gray-400" />
                  Upload Resume
                </Link>

                <Link 
                  to="/interview-setup" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/5 hover:text-cyan-400 text-gray-300 transition-colors"
                >
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  Mock Lobby
                </Link>
              </>
            )}

            <Link 
              to="/settings" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/5 hover:text-cyan-400 text-gray-300 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-400" />
              Settings
            </Link>
          </nav>
        </div>

        {/* Footer Sidebar Profile details */}
        <div className="border-t border-white/5 pt-4 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center font-bold text-cyan-400">
              {fullName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{fullName}</p>
              <p className="text-[10px] text-gray-500 truncate capitalize">{role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content container */}
      <main className="flex-grow min-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Guarded views */}
        <Route 
          path="/dashboard" 
          element={
            <RequireAuth>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </RequireAuth>
          } 
        />
        
        <Route 
          path="/resume-upload" 
          element={
            <RequireAuth>
              <DashboardLayout>
                <ResumeUpload />
              </DashboardLayout>
            </RequireAuth>
          } 
        />
        
        <Route 
          path="/interview-setup" 
          element={
            <RequireAuth>
              <DashboardLayout>
                <InterviewSetup />
              </DashboardLayout>
            </RequireAuth>
          } 
        />
        
        <Route 
          path="/interview-room/:sessionId" 
          element={
            <RequireAuth>
              <DashboardLayout>
                <InterviewRoom />
              </DashboardLayout>
            </RequireAuth>
          } 
        />
        
        <Route 
          path="/interview-report/:sessionId" 
          element={
            <RequireAuth>
              <DashboardLayout>
                <InterviewReport />
              </DashboardLayout>
            </RequireAuth>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <RequireAuth>
              <DashboardLayout>
                <SettingsPage />
              </DashboardLayout>
            </RequireAuth>
          } 
        />
        
        {/* Fallbacks */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
