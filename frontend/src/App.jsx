import React, { useState } from 'react';
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

export default function App() {
  const [activePage, setActivePage] = useState('landing');
  const [interviewSession, setInterviewSession] = useState(null);
  const [finalReport, setFinalReport] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* GLOBAL NAVBAR */}
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      {/* DYNAMIC PAGE ROUTER */}
      <main className="flex-1">
        {activePage === 'landing' && <LandingPage setActivePage={setActivePage} />}
        {activePage === 'login' && <LoginPage setActivePage={setActivePage} />}
        {activePage === 'register' && <RegisterPage setActivePage={setActivePage} />}
        {activePage === 'candidate-dashboard' && (
          <CandidateDashboard 
            setActivePage={setActivePage} 
            setSelectedSessionId={setSelectedSessionId} 
          />
        )}
        {activePage === 'resume-upload' && <ResumeUploadPage setActivePage={setActivePage} />}
        {activePage === 'interview-setup' && (
          <InterviewSetupPage 
            setActivePage={setActivePage} 
            setInterviewSession={setInterviewSession} 
          />
        )}
        {activePage === 'interview-room' && (
          <InterviewRoomPage 
            sessionData={interviewSession} 
            setActivePage={setActivePage} 
            setFinalReport={setFinalReport} 
          />
        )}
        {activePage === 'interview-report' && (
          <InterviewReportPage 
            reportData={finalReport}
            finalReport={finalReport} 
            setActivePage={setActivePage} 
          />
        )}
        {activePage === 'recruiter-dashboard' && <RecruiterDashboard setActivePage={setActivePage} />}
        {activePage === 'admin-dashboard' && <AdminDashboard setActivePage={setActivePage} />}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SmartHire AI • AI-Powered Candidate Assessment Platform</span>
          <span className="text-slate-400">Target Repo: kavuturujanitha7</span>
        </div>
      </footer>

    </div>
  );
}
