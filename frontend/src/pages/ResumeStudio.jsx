import {useEffect, useState} from 'react';
import {api} from '../api/client';
import {useAuth} from '../context/AuthContext';
import ResumeUpload from '../components/ResumeUpload';

export default function ResumeStudio() {
  const {auth} = useAuth();
  const [resumes, setResumes] = useState([]), [selected, setSelected] = useState(null);
  const [description, setDescription] = useState(''), [result, setResult] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const load = () => api('/resumes', {}, auth.access_token).then((items) => { setResumes(items); setSelected(items[0]?.id ?? null); }).catch(() => setResumes([]));
  useEffect(() => { load(); }, []);
  async function analyse() {
    if (!selected) return setError('Upload and select a PDF resume first.');
    setLoading(true); setError('');
    try { setResult(await api(`/resumes/${selected}/job-match`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({job_description: description})}, auth.access_token)); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  return <main className="dashboard studio-page"><header><div><span className="eyebrow">RESUME STUDIO</span><h1>Resume and role match</h1><p>Compare detected resume skills with a job description. This is practice guidance, not an employment decision.</p></div></header><div className="studio-grid"><section className="panel"><h2>Upload or choose resume</h2><ResumeUpload onUploaded={load}/>{resumes.length ? <div className="resume-picker">{resumes.map(item => <button key={item.id} className={selected === item.id ? 'selected-resume' : ''} onClick={() => setSelected(item.id)}>{item.original_name}<small>{item.status}</small></button>)}</div> : <p>No PDF uploaded yet.</p>}</section><section className="panel"><h2>Job description</h2><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Paste a job description (at least 30 characters). Skills such as Python, React, SQL, Docker, AWS, or Java will be compared." /><button className="primary-button" disabled={loading || description.trim().length < 30} onClick={analyse}>{loading ? 'Analysing...' : 'Analyse match'}</button>{error && <p className="error-message">{error}</p>}</section></div>{result && <section className="match-result"><div className="match-score"><strong>{result.match_score}</strong><span>/100</span><small>skill match</small></div><div><span className="eyebrow">{result.resume_name}</span><h2>{result.match_score >= 70 ? 'Good skill overlap' : 'Areas to strengthen'}</h2><p>Only keywords detected in your text-based PDF and the pasted description are used.</p></div><article><h3>Detected in resume</h3><div className="tag-list">{result.detected_skills.length ? result.detected_skills.map(x => <span key={x}>{x}</span>) : 'No skills detected'}</div></article><article><h3>Matched skills</h3><div className="tag-list positive">{result.matched_skills.length ? result.matched_skills.map(x => <span key={x}>{x}</span>) : 'No direct match yet'}</div></article><article><h3>Possible gaps</h3><div className="tag-list warning">{result.missing_skills.length ? result.missing_skills.map(x => <span key={x}>{x}</span>) : 'No gaps detected'}</div></article></section>}</main>;
}
