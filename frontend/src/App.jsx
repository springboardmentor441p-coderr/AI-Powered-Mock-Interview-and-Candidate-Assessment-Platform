import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SetupInterview from "./pages/SetupInterview"; 
import LiveInterview from "./pages/LiveInterview"; 
import ResumeUpload from "./pages/ResumeUpload"; 
import SessionSummary from "./pages/SessionSummary"; 
import SessionHistory from "./pages/SessionHistory";
import Profile from "./pages/Profile";             // <-- Import Profile
import Notifications from "./pages/Notifications"; // <-- Import Notifications

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/setup-interview" element={<SetupInterview />} />
        <Route path="/live-interview" element={<LiveInterview />} />
        <Route path="/resumes" element={<ResumeUpload />} />
        <Route path="/summary" element={<SessionSummary />} /> 
        <Route path="/history" element={<SessionHistory />} />
        
        {/* Register the new routes below */}
        <Route path="/profile" element={<Profile />} /> 
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;