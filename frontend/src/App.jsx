import { Routes, Route } from "react-router-dom";
import InterviewHistory from "./pages/InterviewHistory";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import InterviewResults from "./pages/InterviewResults";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Interview from "./pages/Interview";
import Dashboard from "./pages/Dashboard";
import Feedback from "./pages/Feedback";
import Evaluating from "./pages/Evaluating";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/recruiter" element={<RecruiterDashboard />} />
        <Route path="/results" element={<InterviewResults />} />
        <Route path="/interview-history/:email" element={<InterviewHistory />} />
        <Route path="/evaluating" element={<Evaluating />} />
      </Routes>
    </>
  );
}

export default App;