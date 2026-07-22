import { Route, Routes } from 'react-router-dom';

import Home from './pages/Home/Home.jsx';
import Interview from './pages/Interview/Interview.jsx';
import Results from './pages/Results/Results.jsx';
import ResumeUpload from './pages/ResumeUpload/ResumeUpload.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/resume-upload" element={<ResumeUpload />} />
      <Route path="/interview" element={<Interview />} />
      <Route path="/results" element={<Results />} />
    </Routes>
  );
}

export default AppRoutes;
