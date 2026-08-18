import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

const DURATIONS = [
  { label: '2 minutes', value: 120 },
  { label: '3 minutes', value: 180 },
  { label: '5 minutes', value: 300 },
  { label: '10 minutes', value: 600 },
]

export default function StartInterview() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('timed') // timed | practice
  const [interviewType, setInterviewType] = useState('technical')
  const [difficulty, setDifficulty] = useState('medium')
  const [domain, setDomain] = useState('general')
  const [jobTitle, setJobTitle] = useState('')
  const [durationSeconds, setDurationSeconds] = useState(120)
  const [numQuestions, setNumQuestions] = useState(5)
  const [resumeId, setResumeId] = useState('')
  const [resumes, setResumes] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { api.listResumes().then(setResumes) }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const interview = await api.startInterview({
        interview_type: interviewType,
        difficulty,
        domain,
        job_title: jobTitle || null,
        mode,
        time_limit_seconds: mode === 'timed' ? Number(durationSeconds) : null,
        num_questions: Number(numQuestions),
        resume_id: resumeId ? Number(resumeId) : null,
      })
      navigate(`/interview/${interview.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Start a Mock Interview</h1>

      <div className="card" style={{ maxWidth: 560 }}>
        <label className="muted">Interview Mode</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button
            type="button"
            className={mode === 'timed' ? 'btn' : 'btn-secondary btn'}
            style={{ flex: 1 }}
            onClick={() => setMode('timed')}
          >
            ⏱ Timed AI Interview
          </button>
          <button
            type="button"
            className={mode === 'practice' ? 'btn' : 'btn-secondary btn'}
            style={{ flex: 1 }}
            onClick={() => setMode('practice')}
          >
            📝 Normal Practice
          </button>
        </div>
        <p className="muted" style={{ marginTop: -8, fontSize: 13 }}>
          {mode === 'timed'
            ? 'AIRA (your AI interviewer) speaks each question aloud, you answer entirely by voice, and it keeps asking as many questions as fit within your time limit.'
            : 'Classic mode: a fixed number of questions, answer by typing or voice, no time pressure.'}
        </p>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={submit}>
          {error && <div className="error-text">{error}</div>}

          {mode === 'timed' && (
            <>
              <label className="muted">Job Title / Role you're interviewing for</label>
              <input
                className="input"
                placeholder="e.g. AI Engineer, Frontend Developer, Data Scientist"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </>
          )}

          <label className="muted">Interview Type</label>
          <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
            <option value="technical">Technical</option>
            <option value="hr">HR</option>
            <option value="behavioral">Behavioral</option>
            <option value="aptitude">Aptitude</option>
          </select>

          <label className="muted">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {interviewType === 'technical' && mode === 'practice' && (
            <>
              <label className="muted">Domain (e.g. python, react, sql, system design)</label>
              <input className="input" value={domain} onChange={(e) => setDomain(e.target.value)} />
            </>
          )}

          {mode === 'timed' ? (
            <>
              <label className="muted">Time Limit</label>
              <select value={durationSeconds} onChange={(e) => setDurationSeconds(e.target.value)}>
                {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </>
          ) : (
            <>
              <label className="muted">Number of Questions</label>
              <input className="input" type="number" min={2} max={10} value={numQuestions}
                     onChange={(e) => setNumQuestions(e.target.value)} />
            </>
          )}

          {resumes.length > 0 && (
            <>
              <label className="muted">Use resume for personalization (optional)</label>
              <select value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
                <option value="">None</option>
                {resumes.map((r) => <option key={r.id} value={r.id}>{r.filename}</option>)}
              </select>
            </>
          )}

          <button className="btn" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Preparing interview...' : mode === 'timed' ? 'Start Timed AI Interview' : 'Start Practice Interview'}
          </button>
        </form>
      </div>
    </div>
  )
}
