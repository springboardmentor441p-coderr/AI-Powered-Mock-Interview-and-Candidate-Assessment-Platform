import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import UserLogin from './pages/UserLogin'
import AdminLogin from './pages/AdminLogin'
import UserRegister from './pages/UserRegister'
import Dashboard from './pages/Dashboard'
import ResumeUpload from './pages/ResumeUpload'
import InterviewPrep from './pages/InterviewPrep'
import VoiceInterview from './pages/VoiceInterview'
import FinalReport from './pages/FinalReport'
import History from './pages/History'
import Settings from './pages/Settings'
import Support from './pages/Support'
import CodingTest from './pages/CodingTest'
import AdminDashboard from './pages/AdminDashboard'
import ForgotPassword from './pages/ForgotPassword'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login/user" replace />} />
        
        {/* Authentication Routes */}
        <Route path="/login/user" element={<UserLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/register/user" element={<UserRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Resume */}
        <Route path="/resume" element={<ResumeUpload />} />
        
        {/* Interview Engine Routes */}
        <Route path="/interview" element={<Navigate to="/interview/prep" replace />} />
        <Route path="/interview/prep" element={<InterviewPrep />} />
        <Route path="/interview/session" element={<VoiceInterview />} />
        <Route path="/interview/report/:sessionId" element={<FinalReport />} />
        
        {/* Feature Routes */}
        <Route path="/coding-test" element={<CodingTest />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/support" element={<Support />} />
      </Routes>
    </Router>
  )
}

export default App


