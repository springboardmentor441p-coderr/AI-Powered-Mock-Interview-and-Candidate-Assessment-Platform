const items = [
  ['dashboard', 'Dashboard', '⌂'],
  ['setup', 'Mock Interview', '◎'],
  ['feedback', 'AI Feedback', '◇'],
  ['dashboard', 'Analytics', '▥'],
];

export default function CandidateShell({children, page, onNavigate}) {
  return <div className="candidate-shell"><aside className="app-sidebar"><div className="brand-mark"><b>✦</b><span>SmartHire<small>AI PRACTICE STUDIO</small></span></div><nav aria-label="Main navigation">{items.map(([key, label, icon]) => <button key={label} className={page === key ? 'active' : ''} aria-current={page === key ? 'page' : undefined} onClick={() => onNavigate(key)}><i>{icon}</i>{label}</button>)}</nav><div className="streak-card"><span>♨ Practice streak</span><strong>7 Days</strong><small>Keep it up! You’re doing great.</small><div>● ● ● ● ● ● ●</div></div><div className="upgrade-card"><b>✦ AI practice tip</b><small>Use the STAR method: situation, task, action, result.</small><button onClick={() => onNavigate('setup')}>Start a practice →</button></div></aside><section className="app-content">{children}</section></div>;
}
