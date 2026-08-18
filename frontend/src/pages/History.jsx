import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

const RATING_CLASS = {
  Excellent: 'badge-excellent',
  Good: 'badge-good',
  Average: 'badge-average',
  'Needs Improvement': 'badge-needs',
  Poor: 'badge-poor',
}

export default function History() {
  const [interviews, setInterviews] = useState([])
  const navigate = useNavigate()

  useEffect(() => { api.listInterviews().then(setInterviews) }, [])

  return (
    <div>
      <h1>Interview History</h1>
      <div className="card">
        {interviews.length === 0 && <p className="muted">No interviews yet. Start your first mock interview!</p>}
        {interviews.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Type</th><th>Domain</th><th>Difficulty</th><th>Status</th><th>Score</th><th>Rating</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {interviews.map((i) => (
                <tr key={i.id}>
                  <td>{i.interview_type}</td>
                  <td>{i.domain}</td>
                  <td>{i.difficulty}</td>
                  <td>{i.status}</td>
                  <td>{i.overall_score ?? '-'}</td>
                  <td>{i.rating ? <span className={`badge ${RATING_CLASS[i.rating]}`}>{i.rating}</span> : '-'}</td>
                  <td className="muted">{new Date(i.created_at).toLocaleDateString()}</td>
                  <td>
                    {i.status === 'completed'
                      ? <button className="btn-secondary btn" onClick={() => navigate(`/results/${i.id}`)}>View</button>
                      : <button className="btn-secondary btn" onClick={() => navigate(`/interview/${i.id}`)}>Resume</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
