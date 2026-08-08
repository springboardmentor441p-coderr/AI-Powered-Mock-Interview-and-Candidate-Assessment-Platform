import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './frontend/context/AuthContext';
import { ProtectedRoute } from './frontend/components/common/ProtectedRoute';

// Pages
import { LandingPage } from './frontend/pages/LandingPage';
import { LoginPage } from './frontend/pages/LoginPage';
import { SignupPage } from './frontend/pages/SignupPage';
import { DashboardPage } from './frontend/pages/DashboardPage';
import { ResumePage } from './frontend/pages/ResumePage';
import { InterviewSetupPage } from './frontend/pages/InterviewSetupPage';
import { InterviewActivePage } from './frontend/pages/InterviewActivePage';
import { InterviewResultPage } from './frontend/pages/InterviewResultPage';
import { AnalyticsPage } from './frontend/pages/AnalyticsPage';
import { HistoryPage } from './frontend/pages/HistoryPage';
import { ProfilePage } from './frontend/pages/ProfilePage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Authentication */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Candidate Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <ResumePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/setup"
            element={
              <ProtectedRoute>
                <InterviewSetupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <InterviewActivePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview/result"
            element={
              <ProtectedRoute>
                <InterviewResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
