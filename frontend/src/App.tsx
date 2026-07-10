import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import UserLogin from './pages/UserLogin'
import AdminLogin from './pages/AdminLogin'
import UserRegister from './pages/UserRegister'
import Dashboard from './pages/Dashboard'
import Placeholder from './pages/Placeholder'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login/user" replace />} />
        
        {/* Authentication Routes */}
        <Route path="/login/user" element={<UserLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/register/user" element={<UserRegister />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin/dashboard" element={<Placeholder />} />
        
        {/* Feature Placeholder Routes */}
        <Route path="/interview" element={<Placeholder />} />
        <Route path="/coding-test" element={<Placeholder />} />
        <Route path="/history" element={<Placeholder />} />
        <Route path="/settings" element={<Placeholder />} />
        <Route path="/support" element={<Placeholder />} />
      </Routes>
    </Router>
  )
}

export default App
