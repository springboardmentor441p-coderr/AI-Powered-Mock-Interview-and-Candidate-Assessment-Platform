import {useState} from 'react';
import {useAuth} from './context/AuthContext';
import CandidateDashboard from './pages/CandidateDashboard';
import InterviewRoom from './pages/InterviewRoom';
import CandidateShell from './components/CandidateShell';
import InterviewSetup from './pages/InterviewSetup';
import FeedbackPage from './pages/FeedbackPage';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const {auth, restoring} = useAuth();
  const [authView, setAuthView] = useState('login');
  const [showInterview, setShowInterview] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [page, setPage] = useState('dashboard');
  const [interviewSettings, setInterviewSettings] = useState(null);
  if (restoring) return <main className="guest-loading"><span className="eyebrow">SMART HIRE AI</span><h1>Loading your session…</h1></main>;
  if (!auth) return authView === 'register'
    ? <Register goLogin={() => setAuthView('login')} />
    : <Login goRegister={() => setAuthView('register')} />;
  const begin = (settings = null) => { setInterviewSettings(settings); setPreparing(true); window.setTimeout(() => { setPreparing(false); setShowInterview(true); }, 2200); };
  const content = page === 'setup' ? <InterviewSetup onBegin={begin} />
    : page === 'feedback' ? <FeedbackPage onStart={() => begin()} />
    : <CandidateDashboard onStartInterview={() => setPage('setup')} onNavigate={setPage} />;
  if (preparing) return <main className="preparing-screen"><div className="preparing-orb">✦</div><span className="eyebrow">NOVA AI</span><h1>Preparing your interview…</h1><p>✓ Strategy prepared<br />✓ Questions generated<br />✓ Voice experience ready</p><i><b /></i></main>;
  return showInterview ? <InterviewRoom settings={interviewSettings} onExit={() => { setShowInterview(false); setPage('feedback'); }} /> : <CandidateShell page={page} onNavigate={setPage}>{content}</CandidateShell>;
}
