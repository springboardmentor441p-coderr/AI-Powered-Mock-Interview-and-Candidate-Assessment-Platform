import {useEffect, useMemo, useState} from 'react';
import {api} from '../api/client';
import {useAuth} from '../context/AuthContext';

export default function RecruiterDashboard() {
  const {auth, setAuth} = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { api('/assessments/recruiter', {}, auth.access_token).then(setAssessments).catch(err => setError(err.message)); }, []);
  const visible = useMemo(() => assessments.filter(item => `${item.candidate_name} ${item.candidate_email}`.toLowerCase().includes(query.toLowerCase())), [assessments, query]);
  const average = assessments.length ? Math.round(assessments.reduce((sum, item) => sum + (item.score || 0), 0) / assessments.length) : 0;
  return <main className="recruiter-dashboard">
    <header><div><span className="eyebrow">RECRUITER PORTAL</span><h1>Candidate assessments</h1></div><button onClick={() => setAuth(null)}>Sign out</button></header>
    <section className="recruiter-summary"><article><span>Completed interviews</span><strong>{assessments.length}</strong></article><article><span>Average practice score</span><strong>{average}<small>/100</small></strong></article><article><span>Assessment mode</span><strong>Practice</strong></article></section>
    <section className="assessment-list"><div className="list-header"><h2>Completed candidate reports</h2><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search candidate name or email" /></div>{error && <p className="error-message">{error}</p>}{visible.length ? <div className="assessment-grid">{visible.map(item => <article className="assessment-card" key={item.interview_id}><div className="candidate-initial">{item.candidate_name?.charAt(0).toUpperCase()}</div><h3>{item.candidate_name}</h3><p>{item.candidate_email}</p><div className="assessment-meta"><span>Interview #{item.interview_id}</span><span>{item.answered_questions}/{item.total_questions} answered</span></div><div className="assessment-score">{item.score}<small>/100</small></div><p className="assessment-date">Completed {item.ended_at ? new Date(item.ended_at).toLocaleDateString() : 'recently'}</p></article>)}</div> : <p>No completed candidate assessments are available yet.</p>}</section>
    <p className="privacy-note">Practice-only results: use them to support coaching, not as the only basis for hiring decisions.</p>
  </main>;
}
