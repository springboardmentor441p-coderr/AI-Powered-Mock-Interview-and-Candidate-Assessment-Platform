import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';

// App Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { Dashboard } from './pages/Dashboard';
import { CreateInterview } from './pages/CreateInterview';
import { Assessment } from './pages/Assessment';
import { AssessmentResult } from './pages/AssessmentResult';
import { InterviewSetup } from './pages/InterviewSetup';
import { InterviewRoom } from './pages/InterviewRoom';
import { InterviewResult } from './pages/InterviewResult';
import { InterviewHistory } from './pages/InterviewHistory';
import { PerformanceDashboard } from './pages/PerformanceDashboard';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught UI Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 rounded-2xl border border-red-500/40 bg-slate-950/90 space-y-4">
            <h2 className="text-xl font-bold text-red-400">UI Application Encountered an Error</h2>
            <p className="text-xs font-mono text-slate-400">
              {this.state.error?.toString() || "An unexpected error occurred while rendering the page."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/dashboard';
              }}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-all cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <div className="min-h-screen flex flex-row bg-[#0B0F19] text-white selection:bg-cyan-500 selection:text-black">
            <Sidebar />
            <div className="flex-1 min-w-0 flex flex-col min-h-screen">
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/create-interview" element={<CreateInterview />} />
                  <Route path="/assessment" element={<Assessment />} />
                  <Route path="/assessment-result" element={<AssessmentResult />} />
                  <Route path="/interview-setup" element={<InterviewSetup />} />
                  <Route path="/interview-room" element={<InterviewRoom />} />
                  <Route path="/interview-result" element={<InterviewResult />} />
                  <Route path="/interview-history" element={<InterviewHistory />} />
                  <Route path="/performance" element={<PerformanceDashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}
