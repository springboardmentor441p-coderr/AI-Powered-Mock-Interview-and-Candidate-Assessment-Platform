import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CandidateDashboard from './pages/CandidateDashboard';
import ResumeUploadPage from './pages/ResumeUploadPage';
import InterviewSetupPage from './pages/InterviewSetupPage';
import InterviewRoomPage from './pages/InterviewRoomPage';
import InterviewReportPage from './pages/InterviewReportPage';
import RecruiterDashboard from './pages/RecruiterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { getStoredUser, setStoredUser, getStoredToken } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [activePage, setActivePage] = useState(() => {
    // Check if candidate has an active session restored in localStorage
    const savedActiveSession = localStorage.getItem("smarthire_active_session");
    if (savedActiveSession) {
      try {
        const parsed = JSON.parse(savedActiveSession);
        if (parsed && parsed.session_id && parsed.status === "active") {
          return "interview-room";
        }
      } catch (e) {}
    }
    return "landing";
  });

  const [interviewSession, setInterviewSession] = useState(() => {
    const savedActiveSession = localStorage.getItem("smarthire_active_session");
    if (savedActiveSession) {
      try {
        const parsed = JSON.parse(savedActiveSession);
        if (parsed && parsed.session_id) return parsed;
      } catch (e) {}
    }
    return null;
  });

  const [finalReport, setFinalReport] = useState(() => {
    const savedReport = localStorage.getItem("smarthire_final_report");
    if (savedReport) {
      try {
        return JSON.parse(savedReport);
      } catch (e) {}
    }
    return null;
  });

  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // Sync user state changes with localStorage
  const handleUserLogin = (userData) => {
    setCurrentUser(userData);
    setStoredUser(userData);
  };

  // Protected route guard helper
  const navigateWithAuthCheck = (page) => {
    const token = getStoredToken();
    const protectedPages = ['interview-setup', 'interview-room', 'candidate-dashboard', 'resume-upload'];
    if (protectedPages.includes(page) && !token) {
      setActivePage('login');
      return;
    }
    setActivePage(page);
  };

  // Sync active interview session state to localStorage
  const handleSetInterviewSession = (sessionData) => {
    setInterviewSession(sessionData);
    if (sessionData && sessionData.session_id) {
      localStorage.setItem("smarthire_active_session", JSON.stringify({ ...sessionData, status: sessionData.status || "active" }));
    } else {
      localStorage.removeItem("smarthire_active_session");
    }
  };

  const handleSetFinalReport = (reportData) => {
    setFinalReport(reportData);
    if (reportData) {
      localStorage.setItem("smarthire_final_report", JSON.stringify(reportData));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* GLOBAL NAVBAR */}
      <Navbar 
        activePage={activePage} 
        setActivePage={navigateWithAuthCheck} 
        currentUser={currentUser}
      />

      {/* DYNAMIC PAGE ROUTER */}
      <main className="flex-1">
        {activePage === 'landing' && <LandingPage setActivePage={navigateWithAuthCheck} />}
        {activePage === 'login' && <LoginPage setActivePage={navigateWithAuthCheck} onUserLogin={handleUserLogin} />}
        {activePage === 'register' && <RegisterPage setActivePage={navigateWithAuthCheck} onUserLogin={handleUserLogin} />}
        {activePage === 'candidate-dashboard' && (
          <CandidateDashboard 
            setActivePage={navigateWithAuthCheck} 
            setSelectedSessionId={setSelectedSessionId}
            currentUser={currentUser}
          />
        )}
        {activePage === 'resume-upload' && <ResumeUploadPage setActivePage={navigateWithAuthCheck} />}
        {activePage === 'interview-setup' && (
          <InterviewSetupPage 
            setActivePage={navigateWithAuthCheck} 
            setInterviewSession={handleSetInterviewSession}
            currentUser={currentUser}
          />
        )}
        {activePage === 'interview-room' && (
          <InterviewRoomPage 
            sessionData={interviewSession} 
            setActivePage={navigateWithAuthCheck} 
            setFinalReport={handleSetFinalReport}
            currentUser={currentUser}
          />
        )}
        {activePage === 'interview-report' && (
          <InterviewReportPage 
            reportData={finalReport}
            finalReport={finalReport} 
            setActivePage={navigateWithAuthCheck}
            currentUser={currentUser}
          />
        )}
        {activePage === 'recruiter-dashboard' && <RecruiterDashboard setActivePage={navigateWithAuthCheck} />}
        {activePage === 'admin-dashboard' && <AdminDashboard setActivePage={navigateWithAuthCheck} />}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SmartHire AI • AI-Powered Candidate Assessment Platform</span>
          <span className="text-slate-400">Authenticated Candidate: <strong className="text-cyan-400">{currentUser?.full_name || "Guest"}</strong></span>
        </div>
      </footer>

    </div>
  );
}
