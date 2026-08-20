import {useEffect, useState} from 'react';
import {api, downloadFile} from '../api/client';
import {useAuth} from '../context/AuthContext';

export default function FeedbackPage({onStart}) {
  const {auth} = useAuth();
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [downloadError, setDownloadError] = useState('');
  useEffect(() => {
    api('/assessments/my-history', {}, auth.access_token).then(setHistory).catch(() => setHistory([]));
    api('/assessments/analytics', {}, auth.access_token).then(setAnalytics).catch(() => setAnalytics(null));
  }, []);

  const handleDownload = async (interviewId) => {
    setDownloadError('');
    try { await downloadFile(`/assessments/${interviewId}/report`, auth.access_token, `interview-${interviewId}-report.pdf`); }
    catch (err) { setDownloadError(err.message); }
  };

  const completed = history.filter(x => x.score !== null).slice(0, 6).reverse();
  if (!completed.length) return <main className="dashboard performance-page"><section className="empty-feedback"><span className="eyebrow">AI FEEDBACK</span><h1>No interview feedback available.</h1><p>Complete a full interview to unlock AI analysis, score trends, and improvement recommendations.</p><button className="primary-button" onClick={onStart}>Start a full interview →</button></section></main>;

  const best = analytics?.best_score ?? Math.max(...completed.map(x => x.score));
  const average = analytics?.average_score ?? Math.round(completed.reduce((sum, x) => sum + x.score, 0) / completed.length);
  const skills = [
    ['Confidence', analytics?.confidence_score ?? null],
    ['Communication', analytics?.communication_score ?? null],
    ['Technical relevance', analytics?.technical_relevance_score ?? null],
    ['Problem solving', analytics?.problem_solving_score ?? null],
  ];
  const recommendations = analytics?.recommendations?.length ? analytics.recommendations : [
    'Lead with a clear outcome before explaining your process.',
    'Use one concrete example in each answer.',
    'Pause briefly before answering to structure your thoughts.',
  ];

  return <main className="dashboard performance-page">
    <header className="page-header"><div><span className="eyebrow">AI PERFORMANCE INSIGHTS</span><h1>Your interview performance, made clear.</h1><p>Use each session to find a focused next improvement.</p></div><button className="primary-button" onClick={onStart}>Start practice →</button></header>
    <section className="performance-grid">
      <article className="score-overview"><span className="eyebrow">OVERALL PERFORMANCE</span><div className="score-ring" style={{'--score': `${best ?? 0}%`}}><strong>{best ?? '--'}</strong><small>/100</small></div><h3>{best ? 'Your best practice score' : 'Complete an interview to begin'}</h3><p>{best ? 'Your score improves as you complete more focused sessions.' : 'Nova will turn your answers into an assessment.'}</p></article>
      <article className="trend-card"><div className="section-heading"><div><span className="eyebrow">PERFORMANCE TREND</span><h3>Recent sessions</h3></div><strong>{average || '--'}<small> avg</small></strong></div><div className="trend-bars">{completed.length ? completed.map((item, index) => <div key={item.interview_id}><i style={{height: `${Math.max(12, item.score)}%`}} /><span>S{index + 1}</span></div>) : <p>Practice history will appear here.</p>}</div></article>
    </section>
    <section className="performance-detail">
      <article className="skill-evaluation"><span className="eyebrow">SKILL EVALUATION</span><h2>Where to focus next</h2>{skills.map(([label, score]) => <div className="skill-meter" key={label}><div><span>{label}</span><b>{score ?? '--'}</b></div><i><em style={{width: `${score ?? 0}%`}} /></i></div>)}</article>
      <article className="recommendations-card"><span className="eyebrow">AI RECOMMENDATIONS</span><h2>Build a stronger answer</h2><ul>{recommendations.map(text => <li key={text}>{text}</li>)}</ul></article>
    </section>
    <section className="history-section">
      <div className="section-heading"><div><span className="eyebrow">QUESTION-WISE HISTORY</span><h3>Completed interviews</h3></div></div>
      {downloadError && <p className="error-message">{downloadError}</p>}
      {completed.length ? <div className="assessment-grid">{completed.map(item => <article className="assessment-card" key={item.interview_id}>
        <span className="history-status completed">completed</span>
        <h3>Interview #{item.interview_id}</h3>
        <p>{new Date(item.created_at).toLocaleDateString()}</p>
        <div className="assessment-score">{item.score}<small>/100</small></div>
        <p>{item.answered_questions}/{item.total_questions} responses assessed</p>
        <button className="secondary-button download-report-btn" onClick={() => handleDownload(item.interview_id)}>⬇ Download report</button>
      </article>)}</div> : <p className="empty-copy">No completed interview yet.</p>}
    </section>
  </main>;
}
