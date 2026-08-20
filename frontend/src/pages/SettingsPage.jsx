import {useAuth} from '../context/AuthContext';

export default function SettingsPage() {
  const {auth, setAuth} = useAuth();

  return <main className="dashboard performance-page">
    <header className="page-header"><div><span className="eyebrow">SETTINGS</span><h1>Practice settings.</h1><p>Manage how SmartHire AI works for you.</p></div></header>
    <section className="performance-detail" style={{marginTop: 22}}>
      <article className="skill-evaluation">
        <span className="eyebrow">ACCOUNT</span>
        <h2>Signed in as</h2>
        <p style={{margin: '6px 0'}}><strong>{auth.user.full_name}</strong></p>
        <p style={{margin: '6px 0', color: '#6b7280'}}>{auth.user.email}</p>
        <button className="secondary-button" style={{marginTop: 14}} onClick={() => setAuth(null)}>Log out</button>
      </article>
      <article className="recommendations-card">
        <span className="eyebrow">PRACTICE PREFERENCES</span>
        <h2>Voice &amp; camera</h2>
        <p style={{color: '#4b5563', lineHeight: 1.5}}>Microphone and camera access for mock interviews is controlled by your browser's site permissions for privacy — SmartHire AI never stores raw audio or video.</p>
        <p style={{color: '#4b5563', lineHeight: 1.5, marginTop: 12}}>Notification and report preferences will appear here as they become available.</p>
      </article>
    </section>
  </main>;
}
