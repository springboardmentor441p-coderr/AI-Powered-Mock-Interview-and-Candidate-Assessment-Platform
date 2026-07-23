import { useState, useEffect } from 'react';
import './App.css';
import * as Icons from './icons';

const getCandidateNameFromEmail = (email) => {
  const localPart = email.split('@')[0] || '';
  const words = localPart
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return 'Candidate';
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const features = [
  {
    title: 'Resume intelligence',
    icon: 'ResumeIcon',
    description: 'Upload a CV and let AI extract skills, experience, and strengths in seconds.',
    detail:
      'Resume intelligence automatically reads your CV, identifies achievements, and builds a candidate profile used for tailored mock questions and progress metrics.',
  },
  {
    title: 'Adaptive interviews',
    icon: 'TargetIcon',
    description: 'Practice HR, technical, behavioral, and aptitude rounds with realistic simulations.',
    detail:
      'Adaptive interviews shift dynamically based on your answers, focusing on weak areas while preserving a realistic recruiter flow.',
  },
  {
    title: 'Actionable feedback',
    icon: 'ChartIcon',
    description: 'Receive detailed scoring with communication, confidence, and professionalism insights.',
    detail:
      'Actionable feedback gives you clear next steps, strengths, and improvement points so every session becomes more effective.',
  },
];

const metrics = [
  { value: '90+', label: 'Interview readiness score' },
  { value: '4x', label: 'Faster skill practice' },
  { value: '24/7', label: 'AI coaching availability' },
  { value: '100%', label: 'Personalized guidance' },
];

const dashboardStats = [
  { label: 'Mock sessions', value: '12' },
  { label: 'Confidence trend', value: '+18%' },
  { label: 'Weakest skill', value: 'System design' },
];

const interviewQuestions = [
  'Describe a recent project where you solved a tough problem.',
  'What is your strongest technical skill, and how have you applied it?',
  'How do you prepare for behavioral interview questions?',
];

const historyRecords = [
  { date: 'Today', type: 'Technical', domain: 'Backend dev', score: 76, trend: '▲ +15' },
  { date: '3 days ago', type: 'Behavioral', domain: 'General HR', score: 61, trend: '▲ +9' },
  { date: '5 days ago', type: 'Technical', domain: 'Backend dev', score: 44, trend: '—' },
];

const reportCards = [
  { label: 'Interview score', value: '78%' },
  { label: 'Communication', value: '84%' },
  { label: 'Technical clarity', value: '76%' },
];

const setupOptions = {
  domains: ['Behavioral', 'Technical', 'Leadership'],
  levels: ['Beginner', 'Intermediate', 'Advanced'],
  focus: ['System design', 'Resume walkthrough', 'Leadership story'],
};

const upcomingRounds = ['HR behavioral', 'Technical coding', 'Leadership round'];

function App() {
  const [view, setView] = useState('landing');
  const [authMode, setAuthMode] = useState('login');
  const [theme, setTheme] = useState('dark');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [resumeStatus, setResumeStatus] = useState('');
  const [candidateName, setCandidateName] = useState('Candidate');
  const [mockRoundStarted, setMockRoundStarted] = useState(false);
  const [mockRoundOpen, setMockRoundOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [hasNext, setHasNext] = useState(false);
  const [interviewTime, setInterviewTime] = useState(165);
  const [selectedDomain, setSelectedDomain] = useState(setupOptions.domains[1]);
  const [selectedLevel, setSelectedLevel] = useState(setupOptions.levels[1]);
  const [selectedFocus, setSelectedFocus] = useState(setupOptions.focus[0]);

  const handleAuthSubmit = (event) => {
    event.preventDefault();
    const name = getCandidateNameFromEmail(email);
    setCandidateName(name);
    setView('dashboard');
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSizeInBytes = 1_500_000;
    if (file.size > maxSizeInBytes) {
      setResumeStatus('Resume too large. Please keep it under 1.5 MB for the demo.');
      return;
    }

    // send the file as FormData to backend /candidates/upload
    setResumeName(file.name);
    const form = new FormData();
    form.append('email', email || `${candidateName.replace(/\s+/g, '.').toLowerCase()}@example.com`);
    form.append('file', file);

    try {
      const res = await fetch('http://127.0.0.1:8000/candidates/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      const savedName = getCandidateNameFromEmail(email || `${candidateName.replace(/\s+/g, '.').toLowerCase()}@example.com`);
      setResumeStatus(`Uploaded: ${json.name} (${json.resume_name || 'no file name'})`);
      setCandidateName(savedName);
      setMockRoundStarted(true);
        setMockRoundOpen(true);
      fetchCandidates();
    } catch (err) {
      setResumeStatus('Upload failed: ' + String(err));
    }
  };

  const fetchCandidates = async () => {
    try {
      const limit = pageSize;
      const offset = (page - 1) * pageSize;
      const q = encodeURIComponent(searchQuery || '');
      const url = `http://127.0.0.1:8000/candidates/all?limit=${limit}&offset=${offset}${q ? `&q=${q}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setCandidates(data);
      setHasNext(data.length === pageSize);
    } catch (err) {
      // ignore for demo
      console.error('fetchCandidates error', err);
    }
  };

  // fetch candidates when dashboard opens or when page/search change
  useEffect(() => {
    if (['dashboard', 'upload', 'history'].includes(view)) fetchCandidates();
  }, [view, page, searchQuery]);

  const beginInterview = () => {
    setMockRoundStarted(true);
    setView('interview');
    setInterviewTime(165);
  };

  const endInterview = () => setView('report');

  const openFeature = (feature) => {
    setSelectedFeature(feature);
    setView('feature');
  };

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className={`app-shell theme-${theme}`}>
      <nav className="navbar">
        <div className="brand">SmartHire AI</div>
        <div className="nav-actions">
          <button
            className="icon-button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            type="button"
          >
            {theme === 'dark' ? (
              <>
                <Icons.SunIcon className="nav-icon" /> Light
              </>
            ) : (
              <>
                <Icons.MoonIcon className="nav-icon" /> Dark
              </>
            )}
          </button>
          <button className="text-button" onClick={() => setView('landing')} type="button">
            Home
          </button>
          <button className="text-button" onClick={() => setView('auth')} type="button">
            Sign in
          </button>
          <button className="text-button" onClick={() => setView('upload')} type="button">
            <Icons.UploadIcon className="nav-icon" /> Resume
          </button>
          <button className="text-button" onClick={() => setView('setup')} type="button">
            <Icons.TargetIcon className="nav-icon" /> Practice
          </button>
          <button className="text-button" onClick={() => setView('history')} type="button">
            <Icons.HistoryIcon className="nav-icon" /> History
          </button>
          <button className="text-button primary" onClick={() => setView('dashboard')} type="button">
            <Icons.DashboardIcon className="nav-icon" /> Dashboard
          </button>
        </div>
      </nav>

      {['dashboard','upload','setup','history','interview','report','feature','advanced'].includes(view) && (
        <aside className="sidebar">
          <div style={{ marginBottom: 18, padding: '0 8px' }} className="logo">
            <Icons.DashboardIcon className="nav-icon" /> SmartHire AI
          </div>
          <button className={`side-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')} type="button">
            <Icons.DashboardIcon className="room-icon" /> Dashboard
          </button>
          <button className={`side-link ${view === 'upload' ? 'active' : ''}`} onClick={() => setView('upload')} type="button">
            <Icons.UploadIcon className="room-icon" /> Resume
          </button>
          <button className={`side-link ${view === 'setup' ? 'active' : ''}`} onClick={() => setView('setup')} type="button">
            <Icons.TargetIcon className="room-icon" /> Practice
          </button>
          <button className={`side-link ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')} type="button">
            <Icons.HistoryIcon className="room-icon" /> History
          </button>
          <button className={`side-link ${view === 'advanced' ? 'active' : ''}`} onClick={() => setView('advanced')} type="button">
            <Icons.ChartIcon className="room-icon" /> Advanced
          </button>
        </aside>
      )}

      {view === 'landing' && (
        <>
          <header className="hero">
            <div className="hero-copy">
              <h1>Train for interviews with intelligent AI coaching.</h1>
              <p>
                SmartHire AI helps candidates sharpen their communication, confidence, and technical
                depth through immersive mock interviews and real-time evaluation.
              </p>
              <div className="hero-actions">
                <button
                  className="button button-primary"
                  onClick={() => {
                    setAuthMode('register');
                    setView('auth');
                  }}
                  type="button"
                >
                  Create account
                </button>
                <button
                  className="button button-secondary"
                  onClick={() => setView('dashboard')}
                  type="button"
                >
                  Open dashboard
                </button>
              </div>
              <p>Built for students, job seekers, and hiring teams.</p>
            </div>

            <div className="hero-card">
              <h2>What the platform delivers</h2>
              <ul>
                <li>✓ AI-generated interview questions</li>
                <li>✓ Speech, emotion, and eye-contact analysis</li>
                <li>✓ Weighted scoring and detailed reports</li>
                <li>✓ Role-based dashboards for candidates and recruiters</li>
              </ul>
            </div>
          </header>

          <section id="features" className="section">
            <div className="section-heading">
              <div>
                <h2 className="section-title">Core capabilities</h2>
                <p className="section-copy">Explore the advanced features that help candidates prepare faster and more confidently.</p>
              </div>
              <button className="button button-secondary" type="button" onClick={() => setView('advanced')}>
                Explore advanced features
              </button>
            </div>
            <div className="card-grid">
              {features.map((feature) => (
                <article className="info-card feature-card" key={feature.title} onClick={() => openFeature(feature)}>
                  <div className="feature-icon">
                    {(() => {
                      const Icon = Icons[feature.icon];
                      return Icon ? <Icon className="feature-svg" /> : null;
                    })()}
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section">
            <h2 className="section-title">Performance insights</h2>
            <div className="metric-grid">
              {metrics.map((metric) => (
                <article className="metric-card" key={metric.label}>
                  <div className="value">{metric.value}</div>
                  <p>{metric.label}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="launch" className="section">
            <div className="cta">
              <h2>Ready to launch your interview journey?</h2>
              <p>Sign in, upload your resume, and start your AI-powered mock interview today.</p>
              <button className="button button-primary" onClick={() => setView('auth')} type="button">
                Start now
              </button>
            </div>
          </section>
        </>
      )}

      {view === 'advanced' && (
        <section className="section">
          <div className="dashboard-card">
            <div className="dashboard-header">
              <div>
                <p className="pill">Advanced features</p>
                <h2>Features built for real interview success</h2>
                <p>Explore the AI capabilities that power resume parsing, adaptive rounds, and personalized feedback.</p>
              </div>
              <button className="button button-secondary" type="button" onClick={() => setView('landing')}>
                Back to home
              </button>
            </div>
            <div className="dashboard-grid">
              {features.map((feature) => (
                <article className="info-card feature-card" key={feature.title} onClick={() => openFeature(feature)}>
                  <div className="feature-icon">
                    {(() => {
                      const Icon = Icons[feature.icon];
                      return Icon ? <Icon className="feature-svg" /> : null;
                    })()}
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {view === 'feature' && selectedFeature && (
        <section className="section">
          <div className="dashboard-card">
            <div className="dashboard-header">
              <div>
                <p className="pill">Feature detail</p>
                <h2>{selectedFeature.title}</h2>
                <p>{selectedFeature.description}</p>
              </div>
              <button className="button button-secondary" type="button" onClick={() => setView('advanced')}>
                Back to advanced features
              </button>
            </div>
            <div className="dashboard-grid lower-grid">
              <article className="dashboard-card">
                <h3>What it does</h3>
                <p>{selectedFeature.detail}</p>
              </article>
              <article className="dashboard-card">
                <h3>Use case</h3>
                <p>
                  {selectedFeature.title === 'Resume intelligence'
                    ? 'Extract resume strengths before practice sessions for better question matching.'
                    : selectedFeature.title === 'Adaptive interviews'
                    ? 'Simulate recruiter follow-ups and questions that adapt to your answers.'
                    : 'Receive clear feedback so each session helps you improve faster.'}
                </p>
              </article>
            </div>
            <div className="dashboard-grid">
              <article className="info-card">
                <h3>Start using this feature</h3>
                <p>
                  {selectedFeature.title === 'Resume intelligence'
                    ? 'Upload a resume first, then review the parsed profile in your candidate dashboard.'
                    : selectedFeature.title === 'Adaptive interviews'
                    ? 'Create a practice session, choose your focus, and let the system adapt questions automatically.'
                    : 'Complete a mock interview to get feedback on communication, confidence, and clarity.'}
                </p>
              </article>
              <article className="info-card">
                <h3>Next step</h3>
                <p>
                  {selectedFeature.title === 'Resume intelligence'
                    ? 'Go to Resume and upload your document.'
                    : selectedFeature.title === 'Adaptive interviews'
                    ? 'Go to Practice to select your domain and difficulty.'
                    : 'Finish your report review to see strengths and weaknesses.'}
                </p>
              </article>
            </div>
          </div>
        </section>
      )}

      {view === 'auth' && (
        <section className="section auth-section">
          <div className="auth-panel">
            <div className="auth-switch">
              <button
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => setAuthMode('login')}
                type="button"
              >
                Login
              </button>
              <button
                className={authMode === 'register' ? 'active' : ''}
                onClick={() => setAuthMode('register')}
                type="button"
              >
                Register
              </button>
            </div>

            <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>
              {authMode === 'login'
                ? 'Continue your interview prep and pick up from your latest session.'
                : 'Join SmartHire AI and begin your first mock interview.'}
            </p>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <label>
                Email
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              <button className="button button-primary" type="submit">
                {authMode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          </div>
        </section>
      )}

      {view === 'dashboard' && (
        <section className="section dashboard-section">
          <div className="dashboard-card hero-card">
            <div className="dashboard-header">
              <div>
                <p className="pill">Candidate dashboard</p>
                <h2>Great progress, {candidateName}.</h2>
                <p>Your interview confidence is trending upward each week.</p>
              </div>
              <button
                className="button button-primary"
                type="button"
                onClick={() => {
                  setMockRoundStarted(true);
                  setMockRoundOpen(true);
                }}
              >
                {mockRoundStarted ? 'Mock round started' : 'Start new mock round'}
              </button>
            </div>
            {mockRoundOpen && (
              <div className="dashboard-card mock-round-card">
                <h3>Mock interview session</h3>
                <p>Your mock round is now live. Answer the next question to continue the demo.</p>
                <ol>
                  <li>Describe a recent project where you solved a tough problem.</li>
                  <li>What is your strongest technical skill, and how have you applied it?</li>
                  <li>How do you prepare for behavioral interview questions?</li>
                </ol>
                <button className="button button-secondary" type="button" onClick={() => setMockRoundOpen(false)}>
                  Close mock round
                </button>
              </div>
            )}

            <div className="dashboard-grid">
              {dashboardStats.map((stat) => (
                <article className="info-card" key={stat.label}>
                  <h3>{stat.value}</h3>
                  <p>{stat.label}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="dashboard-grid lower-grid">
            <article className="dashboard-card">
              <h3>Weekly progress</h3>
              <div className="progress-list">
                <div>
                  <span>Communication</span>
                  <div className="progress-bar"><div style={{ width: '84%' }} /></div>
                </div>
                <div>
                  <span>Technical clarity</span>
                  <div className="progress-bar"><div style={{ width: '76%' }} /></div>
                </div>
                <div>
                  <span>Professionalism</span>
                  <div className="progress-bar"><div style={{ width: '92%' }} /></div>
                </div>
              </div>
            </article>

            <article className="dashboard-card">
              <h3>Resume upload demo</h3>
              <p>Upload a resume to test the candidate profile flow.</p>
              <label className="upload-box">
                <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleResumeUpload} />
                <Icons.UploadIcon className="feature-svg" />
                <span>Choose file</span>
              </label>
              <p className="upload-meta">
                {resumeName ? `Selected: ${resumeName}` : 'PDF, DOCX, TXT supported'}
              </p>
              {resumeStatus && <p className="upload-meta">{resumeStatus}</p>}
              <p className="upload-meta">Candidate name: {candidateName}</p>
              {mockRoundStarted && (
                <p className="upload-meta">Mock round started — launching your next interview session.</p>
              )}
            </article>
            <article className="dashboard-card">
              <h3>Saved candidates</h3>
              <div className="candidate-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <input
                  type="search"
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                />
                <button className="button" onClick={() => { setPage(1); fetchCandidates(); }} type="button">Refresh</button>
                <div className="pagination" style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="button" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} type="button">Prev</button>
                  <span>Page {page}</span>
                  <button className="button" disabled={!hasNext} onClick={() => setPage((p) => p + 1)} type="button">Next</button>
                </div>
              </div>

              {candidates.length === 0 ? (
                <p className="upload-meta">No candidates yet.</p>
              ) : (
                <ul>
                  {candidates.map((c) => (
                    <li key={c.email}>
                      <strong>{c.name}</strong> — {c.email} {c.resume_name ? `(${c.resume_name})` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        </section>
      )}

      {view === 'upload' && (
        <section className="section">
          <div className="dashboard-card">
            <div className="dashboard-header">
              <div>
                <p className="pill">Resume management</p>
                <h2>Upload your resume</h2>
                <p>Keep your profile current and let the system generate tailored questions.</p>
              </div>
              <button className="button button-primary" type="button" onClick={() => setView('setup')}>
                Go to practice
              </button>
            </div>
            <label className="upload-box" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleResumeUpload} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icons.UploadIcon className="feature-svg" />
                <span>Click here to upload a resume file</span>
              </div>
            </label>
            <p className="upload-meta">{resumeName ? `Selected: ${resumeName}` : 'No file selected yet.'}</p>
            {resumeStatus && <p className="upload-meta">{resumeStatus}</p>}
          </div>
        </section>
      )}

      {view === 'setup' && (
        <section className="section">
          <div className="dashboard-card practice-layout">
            <div className="practice-controls">
              <div className="dashboard-header">
                <div>
                  <p className="pill">Practice setup</p>
                  <h2>Prepare your next round</h2>
                  <p>Pick a domain, difficulty, and focus — preview the session on the right.</p>
                </div>
              </div>

              <div className="setup-block">
                <h3>Interview domain</h3>
                <div className="pill-row">
                  {setupOptions.domains.map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      className={`pill-opt ${selectedDomain === domain ? 'sel' : ''}`}
                      onClick={() => setSelectedDomain(domain)}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setup-block">
                <h3>Difficulty</h3>
                <div className="pill-row">
                  {setupOptions.levels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`pill-opt ${selectedLevel === level ? 'sel' : ''}`}
                      onClick={() => setSelectedLevel(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setup-block">
                <h3>Focus area</h3>
                <div className="pill-row">
                  {setupOptions.focus.map((focus) => (
                    <button
                      key={focus}
                      type="button"
                      className={`pill-opt ${selectedFocus === focus ? 'sel' : ''}`}
                      onClick={() => setSelectedFocus(focus)}
                    >
                      {focus}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button className="button button-primary" type="button" onClick={beginInterview}>
                  Begin interview
                </button>
              </div>
            </div>

            <div className="practice-preview">
              <div className="preview-card">
                <h3>Session preview</h3>
                <p className="preview-meta">{`${selectedLevel} ${selectedDomain} — Focus: ${selectedFocus}`}</p>
                <div className="preview-steps">
                  <ol>
                    <li>{interviewQuestions[0]}</li>
                    <li>{interviewQuestions[1]}</li>
                    <li>{interviewQuestions[2]}</li>
                  </ol>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button className="button button-secondary" type="button" onClick={() => setView('dashboard')}>
                    Open dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {view === 'interview' && (
        <section className="section">
          <div className="dashboard-card interview-room">
            <div className="room-header">
              <div className="room-info">
                <span className="room-label">{selectedLevel} {selectedDomain} — {selectedFocus}</span>
                <div className="progress-dots">
                  <span className="dot done" />
                  <span className="dot done" />
                  <span className="dot active" />
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
                <span className="question-count">Question 3 of 8</span>
              </div>
              <div className="timer">{formatTime(interviewTime)}</div>
            </div>

            <div className="room-body">
              <div className="cam-panel">
                <div className="cam-avatar">
                  <Icons.CameraIcon className="room-icon" />
                </div>
                <div className="cam-badge">
                  <span style={{width: '8px', height: '8px', borderRadius: '50%', background: '#3ecf8e', display: 'inline-block', marginRight: '6px'}}></span>
                  Eye contact: good
                </div>
                <div className="rec-badge">
                  <span style={{width: '8px', height: '8px', borderRadius: '50%', background: '#ff6b5e', display: 'inline-block', marginRight: '6px', animation: 'pulse 1.6s ease-in-out infinite'}}></span>
                  REC
                </div>
              </div>

              <div className="chat-panel">
                <div className="chat-scroll">
                  <div className="bubble ai">Hi {candidateName}, I've reviewed your resume. Can you explain the key architecture decisions in your most recent project?</div>
                  <div className="bubble user">I designed a microservices architecture with FastAPI and Kafka for event streaming<span className="cursor" /></div>
                </div>

                <div className="vitals-mini">
                  <div className="vital-row">
                    <div className="vital-label">
                      <span>Confidence</span>
                      <span className="mono">78%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{width: '78%', background: '#3ecf8e'}} />
                    </div>
                  </div>
                  <div className="vital-row">
                    <div className="vital-label">
                      <span>Pace</span>
                      <span className="mono">65%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{width: '65%', background: '#ffb020'}} />
                    </div>
                  </div>
                  <div className="vital-row">
                    <div className="vital-label">
                      <span>Clarity</span>
                      <span className="mono">82%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{width: '82%', background: '#3ecf8e'}} />
                    </div>
                  </div>
                </div>

                <div className="mic-row">
                  <button className="mic-btn" type="button">
                    <Icons.MicIcon className="room-icon" />
                  </button>
                  <div className="wave" id="waveform">
                    {Array.from({length: 28}).map((_, i) => (
                      <span key={i} style={{height: Math.random() * 18 + 4 + 'px'}} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: '8px' }}>
              <button className="button button-coral" type="button" onClick={endInterview}>
                End interview
              </button>
              <button className="button button-secondary" type="button" onClick={() => setView('dashboard')}>
                Back to dashboard
              </button>
            </div>
          </div>
        </section>
      )}

      {view === 'report' && (
        <section className="section">
          <div className="dashboard-card">
            <div className="dashboard-header">
              <div>
                <p className="pill">Session report</p>
                <h2>Your latest interview review</h2>
                <p>Actionable feedback based on your most recent round.</p>
              </div>
            </div>
            <div className="dashboard-grid">
              {reportCards.map((card) => (
                <article className="info-card" key={card.label}>
                  <h3>{card.value}</h3>
                  <p>{card.label}</p>
                </article>
              ))}
            </div>
            <div className="dashboard-grid lower-grid" style={{ marginTop: '1rem' }}>
              <article className="dashboard-card">
                <h3>Strengths</h3>
                <p>Good confidence, clear technical examples, and strong structure.</p>
              </article>
              <article className="dashboard-card">
                <h3>Improvement areas</h3>
                <p>Focus more on business impact, concise storytelling, and stronger summaries.</p>
              </article>
            </div>
          </div>
        </section>
      )}

      {view === 'feature' && selectedFeature && (
        <section className="section">
          <div className="dashboard-card">
            <div className="dashboard-header">
              <div>
                <p className="pill">Feature detail</p>
                <h2>{selectedFeature.title}</h2>
                <p>{selectedFeature.description}</p>
              </div>
              <button className="button button-secondary" type="button" onClick={() => setView('advanced')}>
                Back to advanced features
              </button>
            </div>
            <div className="dashboard-grid lower-grid">
              <article className="dashboard-card">
                <h3>What it does</h3>
                <p>{selectedFeature.detail}</p>
              </article>
              <article className="dashboard-card">
                <h3>Use case</h3>
                <p>
                  {selectedFeature.title === 'Resume intelligence'
                    ? 'Extract resume strengths before practice sessions for better question matching.'
                    : selectedFeature.title === 'Adaptive interviews'
                    ? 'Simulate recruiter follow-ups and questions that adapt to your answers.'
                    : 'Receive clear feedback so each session helps you improve faster.'}
                </p>
              </article>
            </div>
            <div className="dashboard-grid">
              <article className="info-card">
                <h3>Start using this feature</h3>
                <p>
                  {selectedFeature.title === 'Resume intelligence'
                    ? 'Upload a resume first, then review the parsed profile in your candidate dashboard.'
                    : selectedFeature.title === 'Adaptive interviews'
                    ? 'Create a practice session, choose your focus, and let the system adapt questions automatically.'
                    : 'Complete a mock interview to get feedback on communication, confidence, and clarity.'}
                </p>
              </article>
              <article className="info-card">
                <h3>Next step</h3>
                <p>
                  {selectedFeature.title === 'Resume intelligence'
                    ? 'Go to Resume and upload your document.'
                    : selectedFeature.title === 'Adaptive interviews'
                    ? 'Go to Practice to select your domain and difficulty.'
                    : 'Finish your report review to see strengths and weaknesses.'}
                </p>
              </article>
            </div>
          </div>
        </section>
      )}

      {view === 'history' && (
        <section className="section">
          <div className="dashboard-card">
            <div className="dashboard-header">
              <div>
                <p className="pill">Session history</p>
                <h2>Practice history</h2>
                <p>Track your progress across recent interview rounds.</p>
              </div>
            </div>
            <div className="history-grid">
              <div className="history-cards">
                {historyRecords.map((record) => (
                  <article className="info-card" key={`${record.date}-${record.domain}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{record.date}</div>
                        <div className="sess-sub">{record.type} • {record.domain}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className={`tag ${record.score > 70 ? 'tag-teal' : record.score > 60 ? 'tag-amber' : 'tag-coral'}`}>{record.score}</div>
                        <div style={{ marginTop: 6 }} className={record.trend.startsWith('▲') ? 'trend-up' : ''}>{record.trend}</div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="history-table-wrapper">
                <table className="hist-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Domain</th>
                      <th>Score</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRecords.map((record) => (
                      <tr key={`row-${record.date}-${record.domain}`}>
                        <td>{record.date}</td>
                        <td>{record.type}</td>
                        <td>{record.domain}</td>
                        <td><span className={`tag ${record.score > 70 ? 'tag-teal' : record.score > 60 ? 'tag-amber' : 'tag-coral'}`}>{record.score}</span></td>
                        <td className={record.trend.startsWith('▲') ? 'trend-up' : ''}>{record.trend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      
    </div>
  );
}

export default App;
