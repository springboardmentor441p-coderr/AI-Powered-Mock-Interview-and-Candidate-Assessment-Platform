import React from 'react';
import { ArrowRight, BarChart3, CheckCircle2, Clock3, Mic2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button.jsx';
import { useInterview } from '../../context/InterviewContext.jsx';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const { history, interviewStatus, jobRole, currentStage } = useInterview();
  const averageScore = history.length
    ? history.reduce((total, item) => total + Number(item.overallScore || 0), 0) / history.length
    : 0;
  const latest = history[0];

  return (
    <div className="home-container page-grid">
      <section className="overview-intro">
        <div>
          <p className="page-kicker">Verixa</p>
          <h1>Candidate interview operations</h1>
          <p className="page-description">AI-Powered Interview &amp; Candidate Assessment Platform</p>
        </div>
        <Button onClick={() => navigate('/resume-upload')}>
          New interview <ArrowRight size={15} />
        </Button>
      </section>

      <section className="metrics-grid" aria-label="Interview metrics">
        <article className="metric-card"><span>Completed interviews</span><strong>{history.length}</strong><small>All-time assessments</small></article>
        <article className="metric-card"><span>Average score</span><strong>{averageScore.toFixed(1)}<em>/100</em></strong><small>Across completed interviews</small></article>
        <article className="metric-card"><span>Latest score</span><strong>{latest ? Number(latest.overallScore || 0).toFixed(1) : '—'}{latest && <em>/100</em>}</strong><small>{latest?.jobRole || 'No completed assessment'}</small></article>
        <article className="metric-card"><span>Current status</span><strong className="metric-status">{interviewStatus === 'in_progress' ? 'In progress' : 'Ready'}</strong><small>{interviewStatus === 'in_progress' ? currentStage.replaceAll('_', ' ') : 'Available for a new session'}</small></article>
      </section>

      <section className="overview-grid">
        <div className="overview-panel">
          <div className="panel-header"><div><h2>Recent assessments</h2><p>Latest candidate interview outcomes</p></div><button onClick={() => navigate('/history')}>View all</button></div>
          {history.length ? (
            <div className="recent-table" role="table">
              {history.slice(0, 5).map((item, idx) => (
                <button key={item.sessionId || idx} className="recent-row" onClick={() => navigate('/history')}>
                  <span className="row-icon"><BarChart3 size={16} /></span>
                  <span className="row-main"><strong>{item.jobRole || 'Candidate interview'}</strong><small>{item.date || 'Recently completed'} · {item.interviewType || 'Technical'}</small></span>
                  <span className="row-score">{Number(item.overallScore || 0).toFixed(1)}</span>
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          ) : <div className="empty-state"><BarChart3 size={22} /><strong>No completed interviews</strong><p>Your latest assessments will appear here.</p></div>}
        </div>

        <aside className="overview-panel readiness-panel">
          <div className="panel-header"><div><h2>Interview readiness</h2><p>Operational checklist</p></div></div>
          <ul className="readiness-list">
            <li><CheckCircle2 size={16} /><span><strong>Adaptive interviewer</strong><small>Context-aware follow-up questions</small></span></li>
            <li><Mic2 size={16} /><span><strong>Voice pipeline</strong><small>Turn-based TTS and transcription</small></span></li>
            <li><Clock3 size={16} /><span><strong>Time management</strong><small>Dynamic stage and duration control</small></span></li>
          </ul>
          {interviewStatus === 'in_progress' ? (
            <Button variant="secondary" onClick={() => navigate('/interview')}>Return to {jobRole}<ArrowRight size={15} /></Button>
          ) : (
            <Button variant="secondary" onClick={() => navigate('/resume-upload')}>Configure assessment<ArrowRight size={15} /></Button>
          )}
        </aside>
      </section>
    </div>
  );
}

export default Home;
