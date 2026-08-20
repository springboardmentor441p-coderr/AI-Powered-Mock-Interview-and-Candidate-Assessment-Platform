import {useEffect, useState} from 'react';
import {api} from '../api/client';
import {useAuth} from '../context/AuthContext';

export default function ProfilePage() {
  const {auth} = useAuth();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => { api('/assessments/analytics', {}, auth.access_token).then(setAnalytics).catch(() => setAnalytics(null)); }, []);

  const {full_name, email, role} = auth.user;

  return <main className="dashboard performance-page">
    <header className="page-header"><div><span className="eyebrow">MY PROFILE</span><h1>{full_name}</h1><p>Your SmartHire AI account details.</p></div></header>
    <section className="performance-detail" style={{marginTop: 22}}>
      <article className="skill-evaluation">
        <span className="eyebrow">ACCOUNT DETAILS</span>
        <h2>Profile information</h2>
        <div className="skill-meter"><div><span>Name</span><b>{full_name}</b></div></div>
        <div className="skill-meter"><div><span>Email</span><b>{email}</b></div></div>
        <div className="skill-meter"><div><span>Role</span><b style={{textTransform: 'capitalize'}}>{role}</b></div></div>
      </article>
      <article className="recommendations-card">
        <span className="eyebrow">ACTIVITY</span>
        <h2>Your practice so far</h2>
        <div className="account-stat"><b>{analytics?.interviews_completed ?? 0}</b><span>completed interviews</span></div>
        {analytics?.average_score != null && <p style={{marginTop: 16, color: '#4b5563'}}>Average score across completed interviews: <strong>{analytics.average_score}/100</strong></p>}
      </article>
    </section>
  </main>;
}
