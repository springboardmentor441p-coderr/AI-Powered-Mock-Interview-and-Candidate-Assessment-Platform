import React, { useEffect, useState } from 'react'
import { api } from '../api'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts'

function RatingBadge({ rating }) {
  if (!rating) return null
  const map = {
    Excellent: 'badge-excellent',
    Good: 'badge-good',
    Average: 'badge-average',
    'Needs Improvement': 'badge-needs',
    Poor: 'badge-poor',
  }
  return <span className={`badge ${map[rating] || 'badge-average'}`}>{rating}</span>
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboardSummary().then(setSummary).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="muted">Loading dashboard...</p>
  if (!summary) return null

  if (summary.total_interviews === 0) {
    return (
      <div className="card">
        <h2>Welcome to SmartHire AI 👋</h2>
        <p className="muted">You haven't completed any mock interviews yet. Start one to see your performance analytics here.</p>
      </div>
    )
  }

  const trendData = summary.score_trend.map((t, i) => ({
    name: `#${i + 1}`,
    Overall: t.overall_score,
    Communication: t.communication,
    Confidence: t.confidence,
    Technical: t.technical,
  }))

  const radarData = [
    { subject: 'Communication', value: summary.skill_breakdown.communication },
    { subject: 'Confidence', value: summary.skill_breakdown.confidence },
    { subject: 'Technical', value: summary.skill_breakdown.technical },
    { subject: 'Professionalism', value: summary.skill_breakdown.professionalism },
  ]

  return (
    <div>
      <h1>Performance Dashboard</h1>
      <div className="card-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-value">{summary.total_interviews}</div>
          <div className="stat-label">Interviews Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary.average_overall_score}</div>
          <div className="stat-label">Average Overall Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary.best_score}</div>
          <div className="stat-label">Best Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value"><RatingBadge rating={summary.latest_rating} /></div>
          <div className="stat-label">Latest Rating</div>
        </div>
      </div>

      <div className="card">
        <h3>Score Trend</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#263353" />
            <XAxis dataKey="name" stroke="#9aa5c0" />
            <YAxis domain={[0, 100]} stroke="#9aa5c0" />
            <Tooltip contentStyle={{ background: '#131a2b', border: '1px solid #263353' }} />
            <Legend />
            <Line type="monotone" dataKey="Overall" stroke="#6c8cff" strokeWidth={3} />
            <Line type="monotone" dataKey="Communication" stroke="#37d67a" />
            <Line type="monotone" dataKey="Confidence" stroke="#ffb84d" />
            <Line type="monotone" dataKey="Technical" stroke="#ff6b6b" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>Skill Breakdown (Average)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#263353" />
            <PolarAngleAxis dataKey="subject" stroke="#9aa5c0" />
            <PolarRadiusAxis domain={[0, 100]} stroke="#263353" />
            <Radar name="Score" dataKey="value" stroke="#6c8cff" fill="#6c8cff" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
