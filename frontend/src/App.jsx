import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SetupInterview from "./pages/SetupInterview";
import LiveInterview from "./pages/LiveInterview";
import ResumeUpload from "./pages/ResumeUpload";
import SessionSummary from "./pages/SessionSummary";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/setup-interview" element={<SetupInterview />} />
        <Route path="/live-interview" element={<LiveInterview />} />
        <Route path="/resume-upload" element={<ResumeUpload />} />
        <Route path="/summary" element={<SessionSummary />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;