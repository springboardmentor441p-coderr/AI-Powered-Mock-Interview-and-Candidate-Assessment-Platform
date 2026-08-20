import {useEffect, useMemo, useState} from 'react';
import {api, downloadFile} from '../api/client';
import {useAuth} from '../context/AuthContext';
import DashboardKpi from '../components/DashboardKpi';
import DashboardSection from '../components/DashboardSection';
import NotificationBell from '../components/NotificationBell';

const emptyAnalytics = {
  interviews_completed: 0, average_score: null, best_score: null,
  communication_score: null, confidence_score: null, technical_relevance_score: null, problem_solving_score: null,
  performance_trend: [], recent_history: [], strengths: [], weaknesses: [], recommendations: [],
};

const recommendations = [['Machine Learning Interview', 'High impact · 45–60 min', '↗'], ['Frontend Developer Interview', 'Medium impact · 30–45 min', '▣'], ['System Design Interview', 'High impact · 45–60 min', '⌁'], ['SQL Interview', 'Medium impact · 30–45 min', '▤']];

export default function CandidateDashboard({onStartInterview, onNavigate}) {
  const {auth, setAuth} = useAuth();
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [menuOpen, setMenuOpen] = useState(false), [accountView, setAccountView] = useState('');
  const [downloadError, setDownloadError] = useState('');
  useEffect(() => { api('/assessments/analytics', {}, auth.access_token).then(setAnalytics).catch(() => setAnalytics(emptyAnalytics)); }, []);

  const points = useMemo(() => analytics.performance_trend.slice(-7), [analytics.performance_trend]);
  const bestInterview = useMemo(() => analytics.recent_history.slice().sort((a, b) => (b.score || 0) - (a.score || 0))[0], [analytics.recent_history]);
  const name = auth.user.full_name.split(' ')[0];
  const avg = analytics.average_score;
  const insightItems = useMemo(() => {
    const fromData = [
      ...analytics.weaknesses.slice(0, 2).map(text => ['◎', 'Focus area', text]),
      ...analytics.recommendations.slice(0, 2).map(text => ['✦', 'Recommendation', text]),
    ];
    return fromData.length ? fromData : [['✦', 'Get started', 'Complete a full interview to unlock personalized AI insights.']];
  }, [analytics]);

  const handleDownload = async (interviewId) => {
    setDownloadError('');
    try { await downloadFile(`/assessments/${interviewId}/report`, auth.access_token, `interview-${interviewId}-report.pdf`); }
    catch (err) { setDownloadError(err.message); }
  };

  return <main className="figma-dashboard">
    <header className="figma-header"><div><h1>👋 Welcome back, {name}!</h1><p>Ready to ace your next interview? Let’s continue your journey.</p></div><div className="figma-tools"><NotificationBell token={auth.access_token} /><div className="account-menu"><button className="profile-trigger" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen}><span className="profile-dot">{name[0]}</span><span>{name}</span><b>⌄</b></button>{menuOpen && <div className="profile-menu"><button onClick={() => { setAccountView('profile'); setMenuOpen(false); }}>My Profile</button><button onClick={() => { setAccountView('settings'); setMenuOpen(false); }}>Settings</button><hr /><button className="logout-option" onClick={() => setAuth(null)}>Logout</button></div>}</div></div></header>
    <div className="figma-kpi-grid">
      <DashboardKpi icon="▣" label="Interviews Completed" value={analytics.interviews_completed} detail={analytics.interviews_completed ? `${analytics.interviews_completed} total` : 'Complete your first interview'} />
      <DashboardKpi icon="✦" label="Average Score" value={`${avg ?? '--'} /100`} detail={analytics.interviews_completed ? `Across ${analytics.interviews_completed} completed interviews` : 'No completed interviews yet'} tone="purple" />
      <DashboardKpi icon="♜" label="Best Score" value={`${analytics.best_score ?? '--'} /100`} detail={bestInterview ? `Interview #${bestInterview.interview_id}` : 'No completed interviews yet'} tone="blue" />
      <DashboardKpi icon="♨" label="Communication" value={`${analytics.communication_score ?? '--'} /100`} detail="Average across completed interviews" tone="orange" />
      <DashboardKpi icon="◎" label="Technical Relevance" value={`${analytics.technical_relevance_score ?? '--'} /100`} detail="Average across completed interviews" progress={analytics.technical_relevance_score ?? 0} />
    </div>
    <div className="figma-overview-grid">
      <DashboardSection title="Performance Overview" action="7D">
        <div className="figma-chart">{points.length ? points.map((x, i) => <div key={x.interview_id} style={{'--point': `${Math.max(x.score, 14)}%`}}><i /><span>{i + 1}</span></div>) : <p>Practice to unlock your performance trend.</p>}</div>
        <div className="figma-skill-strip">
          <span>Communication <b>{analytics.communication_score ?? '--'}%</b></span>
          <span>Confidence <b>{analytics.confidence_score ?? '--'}%</b></span>
          <span>Technical <b>{analytics.technical_relevance_score ?? '--'}%</b></span>
          <span>Problem solving <b>{analytics.problem_solving_score ?? '--'}%</b></span>
        </div>
      </DashboardSection>
      <DashboardSection title="AI Insights" action="View all">{insightItems.map(([icon, title, text]) => <button className="figma-insight" key={title + text} onClick={() => onNavigate('feedback')}><i>{icon}</i><span><b>{title}</b><small>{text}</small></span><em>›</em></button>)}</DashboardSection>
    </div>
    <div className="figma-bottom-grid">
      <DashboardSection title="Recent Interviews" action="View all">
        {downloadError && <p className="error-message">{downloadError}</p>}
        {analytics.recent_history.length ? analytics.recent_history.slice(0, 3).map(x => <article className="figma-recent" key={x.interview_id}>
          <b>{x.score ?? '--'}</b>
          <span><strong>Mock interview #{x.interview_id}</strong><small>{new Date(x.created_at).toLocaleDateString()} · Practice</small></span>
          <div className="recent-actions"><em>{x.status}</em><button className="download-report-btn" onClick={() => handleDownload(x.interview_id)} title="Download report">⬇</button></div>
        </article>) : <p className="figma-empty">Your interview history will appear here.</p>}
      </DashboardSection>
      <DashboardSection title="Recommended for you" action="View all">{recommendations.map(([title, detail, icon]) => <article className="figma-recommend" key={title}><i>{icon}</i><span><b>{title}</b><small>{detail}</small></span><button onClick={onStartInterview}>Start</button></article>)}</DashboardSection>
      <div className="figma-goal"><button className="panel-action">Edit goal</button><span>Your goal</span><h2>Complete 20 interviews this month</h2><b>{Math.min(20, analytics.interviews_completed)} / 20</b><i><em style={{width: `${Math.min(100, analytics.interviews_completed * 5)}%`}} /></i><small>{Math.max(0, 20 - analytics.interviews_completed)} interviews left to achieve your goal</small><div><h2>Ready for your next interview?</h2><p>Start a new mock interview and improve your skills.</p><button onClick={onStartInterview}>Start Interview →</button></div></div>
    </div>
    {accountView && <div className="account-layer" role="dialog" aria-modal="true"><section><button className="close-account" onClick={() => setAccountView('')}>×</button><span className="eyebrow">{accountView === 'profile' ? 'MY PROFILE' : 'SETTINGS'}</span><h2>{accountView === 'profile' ? auth.user.full_name : 'Practice settings'}</h2>{accountView === 'profile' ? <><p>{auth.user.email}</p><div className="account-stat"><b>{analytics.interviews_completed}</b><span>completed interviews</span></div></> : <><p>Voice, camera, and interview permissions are managed by your browser for privacy.</p><button className="primary-button" onClick={() => setAccountView('')}>Done</button></>}</section></div>}
  </main>;
}
