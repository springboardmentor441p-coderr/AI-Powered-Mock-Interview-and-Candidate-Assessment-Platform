import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ResumeUpload from './pages/ResumeUpload';
import InterviewSetup from './pages/InterviewSetup';
import InterviewRoom from './pages/InterviewRoom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/resume" element={<ResumeUpload />} />
        <Route path="/interview-setup" element={<InterviewSetup />} />
        <Route path="/interview-room" element={<InterviewRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;