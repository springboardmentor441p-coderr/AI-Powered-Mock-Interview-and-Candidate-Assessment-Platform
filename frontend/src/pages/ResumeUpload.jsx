import React, { useEffect, useState } from 'react'
import { api } from '../api'

function AtsGauge({ score }) {
  let color = '#ff6b6b'
  if (score >= 75) color = '#37d67a'
  else if (score >= 50) color = '#ffb84d'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 70, height: 70, borderRadius: '50%',
        background: `conic-gradient(${color} ${score * 3.6}deg, #263353 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: '50%', background: '#1a2338',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15,
        }}>
          {score}
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 700 }}>ATS Score</div>
        <div className="muted" style={{ fontSize: 13 }}>Out of 100 — how well this resume parses in Applicant Tracking Systems</div>
      </div>
    </div>
  )
}

export default function ResumeUpload() {
  const [resumes, setResumes] = useState([])
  const [uploading, setUploading] = useState(false)
  const [checkingId, setCheckingId] = useState(null)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState({})

  const load = () => api.listResumes().then(setResumes)

  useEffect(() => { load() }, [])

  const onFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      await api.uploadResume(file)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const checkAts = async (id) => {
    setCheckingId(id)
    try {
      await api.recomputeAts(id)
      await load()
      setExpanded((s) => ({ ...s, [id]: true }))
    } catch (err) {
      setError(err.message)
    } finally {
      setCheckingId(null)
    }
  }

  return (
    <div>
      <h1>Resume Upload &amp; Skill Extraction</h1>
      <div className="card">
        <p className="muted">Upload a PDF resume. SmartHire AI will automatically extract your skills, experience, and education, and check your ATS (Applicant Tracking System) compatibility score.</p>
        {error && <div className="error-text">{error}</div>}
        <input type="file" accept="application/pdf" onChange={onFileChange} disabled={uploading} />
        {uploading && <p className="muted">Parsing resume &amp; calculating ATS score...</p>}
      </div>

      <h3>Your Resumes</h3>
      {resumes.length === 0 && <p className="muted">No resumes uploaded yet.</p>}
      {resumes.map((r) => (
        <div key={r.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <strong>{r.filename}</strong>
              <p className="muted" style={{ marginTop: 6 }}>{r.summary}</p>
              <div style={{ marginTop: 10 }}>
                {r.skills.length > 0 ? r.skills.map((s) => <span key={s} className="chip">{s}</span>) : <span className="muted">No skills detected</span>}
              </div>
              <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
                Experience: {r.experience_years} years &middot; Education: {r.education.join(', ') || 'Not detected'}
              </div>
            </div>

            <div style={{ minWidth: 220 }}>
              {r.ats_score != null ? (
                <>
                  <AtsGauge score={r.ats_score} />
                  <button
                    className="btn-secondary btn"
                    style={{ marginTop: 12, fontSize: 13 }}
                    onClick={() => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }))}
                  >
                    {expanded[r.id] ? 'Hide Details' : 'View ATS Breakdown'}
                  </button>
                </>
              ) : (
                <button className="btn" onClick={() => checkAts(r.id)} disabled={checkingId === r.id}>
                  {checkingId === r.id ? 'Checking...' : '📋 Check ATS Score'}
                </button>
              )}
            </div>
          </div>

          {expanded[r.id] && r.ats_breakdown && (
            <div style={{ marginTop: 18, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div className="card-grid">
                <div className="stat-card">
                  <div className="stat-value">{r.ats_breakdown.breakdown.contact_info.score}</div>
                  <div className="stat-label">Contact Info</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{r.ats_breakdown.breakdown.section_structure.score}</div>
                  <div className="stat-label">Section Structure</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{r.ats_breakdown.breakdown.keyword_match.score}</div>
                  <div className="stat-label">Keyword Match</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{r.ats_breakdown.breakdown.achievements_impact.score}</div>
                  <div className="stat-label">Achievements/Impact</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{r.ats_breakdown.breakdown.length_format.score}</div>
                  <div className="stat-label">Length &amp; Format</div>
                </div>
              </div>
              <h4 style={{ marginTop: 16 }}>💡 Tips to improve</h4>
              <ul>
                {r.ats_breakdown.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
              <button className="btn-secondary btn" style={{ fontSize: 13 }} onClick={() => checkAts(r.id)} disabled={checkingId === r.id}>
                {checkingId === r.id ? 'Rechecking...' : '🔄 Recheck ATS Score'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
