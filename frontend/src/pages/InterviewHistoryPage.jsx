import {useEffect, useState} from 'react';
import {api, downloadFile} from '../api/client';
import {useAuth} from '../context/AuthContext';

export default function InterviewHistoryPage({onStart}) {
  const {auth} = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    api('/assessments/my-history', {}, auth.access_token)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (interviewId) => {
    setDownloadError('');
    try { await downloadFile(`/assessments/${interviewId}/report`, auth.access_token, `interview-${interviewId}-report.pdf`); }
    catch (err) { setDownloadError(err.message); }
  };

  if (loading) return <main className="dashboard performance-page"><p className="figma-empty">Loading your interview history…</p></main>;

  return <main className="dashboard performance-page">
    <header className="page-header"><div><span className="eyebrow">INTERVIEW HISTORY</span><h1>Your completed interviews.</h1><p>Every finished practice session, in one place.</p></div><button className="primary-button" onClick={onStart}>Start new interview →</button></header>
    <section className="history-section" style={{marginTop: 22}}>
      {downloadError && <p className="error-message">{downloadError}</p>}
      {history.length ? <div className="history-grid">{history.map(item => <article className="history-card" key={item.interview_id}>
        <span className={`history-status ${item.status === 'completed' ? 'completed' : ''}`}>{item.status}</span>
        <strong>Interview #{item.interview_id}</strong>
        <p>{new Date(item.created_at).toLocaleDateString()}</p>
        <div className="history-score">{item.score ?? '--'}<small>/100</small></div>
        <p>{item.answered_questions}/{item.total_questions} responses assessed</p>
        <button className="secondary-button download-report-btn" onClick={() => handleDownload(item.interview_id)}>⬇ Download report</button>
      </article>)}</div> : <div className="empty-feedback"><span className="eyebrow">NO INTERVIEWS YET</span><h1>Your history is empty.</h1><p>Complete a mock interview and it will show up here with your score and report.</p><button className="primary-button" onClick={onStart}>Start your first interview →</button></div>}
    </section>
  </main>;
}
