import {useEffect, useMemo, useState} from 'react';
import {api} from '../api/client';
import {useAuth} from '../context/AuthContext';

export default function QuestionBankPage({onStart}) {
  const {auth} = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/interviews', {}, auth.access_token)
      .then(setInterviews)
      .catch(() => setInterviews([]))
      .finally(() => setLoading(false));
  }, []);

  const questions = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const interview of interviews) {
      for (const q of interview.questions || []) {
        if (q.order_number <= 0) continue;
        const key = q.question.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({id: `${interview.id}-${q.id}`, question: q.question, answered: !!q.answer_text, skills: interview.detected_skills});
      }
    }
    return list;
  }, [interviews]);

  if (loading) return <main className="dashboard performance-page"><p className="figma-empty">Loading your question bank…</p></main>;

  return <main className="dashboard performance-page">
    <header className="page-header"><div><span className="eyebrow">QUESTION BANK</span><h1>Questions from your interviews.</h1><p>A running collection of every question Nova has asked you so far — great for revision.</p></div><button className="primary-button" onClick={onStart}>Practice more →</button></header>
    <section className="history-section" style={{marginTop: 22}}>
      {questions.length ? <div className="history-grid">{questions.map(item => <article className="history-card" key={item.id}>
        <span className={`history-status ${item.answered ? 'completed' : ''}`}>{item.answered ? 'answered' : 'unanswered'}</span>
        <strong>{item.question}</strong>
        {item.skills?.length ? <p>Related: {item.skills.slice(0, 3).join(', ')}</p> : null}
      </article>)}</div> : <div className="empty-feedback"><span className="eyebrow">NO QUESTIONS YET</span><h1>Your question bank is empty.</h1><p>Start a mock interview and the questions you're asked will be saved here for review.</p><button className="primary-button" onClick={onStart}>Start an interview →</button></div>}
    </section>
  </main>;
}
