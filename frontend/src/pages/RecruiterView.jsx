import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function RecruiterView() {
  const [candidates, setCandidates] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.recruiterCandidates().then(setCandidates).catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <h1>Candidate Analytics</h1>
      <div className="card">
        {error && <div className="error-text">{error}</div>}
        {candidates.length === 0 && !error && <p className="muted">No candidate data available yet.</p>}
        {candidates.length > 0 && (
          <table>
            <thead>
              <tr><th>Rank</th><th>Candidate</th><th>Email</th><th>Interviews</th><th>Avg Score</th><th>Latest Rating</th></tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => (
                <tr key={c.candidate_id}>
                  <td>#{i + 1}</td>
                  <td>{c.full_name}</td>
                  <td className="muted">{c.email}</td>
                  <td>{c.interviews_completed}</td>
                  <td>{c.average_overall_score}</td>
                  <td>{c.latest_rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
