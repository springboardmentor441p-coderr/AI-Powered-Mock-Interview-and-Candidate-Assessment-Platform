import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'

const RATING_CLASS = {
  Excellent: 'badge-excellent',
  Good: 'badge-good',
  Average: 'badge-average',
  'Needs Improvement': 'badge-needs',
  Poor: 'badge-poor',
}

const BAR_COLORS = ['#6c8cff', '#ffb84d', '#37d67a', '#ff6b6b']

export default function Results() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    api.listInterviews().then((all) => {
      const found = all.find((i) => i.id === Number(id))
      setResult(found)
    })
  }, [id])

  const downloadReport = async () => {
    setDownloading(true)
    try {
      const text = await api.downloadReport(id)
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `smarthire-interview-${id}-report.txt`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  if (!result) return <p className="muted">Loading results...</p>

  const chartData = [
    { name: 'Communication', value: result.communication_score },
    { name: 'Confidence', value: result.confidence_score },
    { name: 'Technical', value: result.technical_score },
    { name: 'Professionalism', value: result.professionalism_score },
  ]

  return (
    <div>
      <h1>Interview Results</h1>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="muted">{result.interview_type.toUpperCase()} &middot; {result.difficulty} &middot; {result.domain}</div>
            <div style={{ fontSize: 42, fontWeight: 800 }}>{result.overall_score}<span className="muted" style={{ fontSize: 18 }}>/100</span></div>
          </div>
          <span className={`badge ${RATING_CLASS[result.rating] || 'badge-average'}`} style={{ fontSize: 16, padding: '8px 18px' }}>
            {result.rating}
          </span>
        </div>
      </div>

      <div className="card">
        <h3>Score Breakdown</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#263353" />
            <XAxis dataKey="name" stroke="#9aa5c0" />
            <YAxis domain={[0, 100]} stroke="#9aa5c0" />
            <Tooltip contentStyle={{ background: '#131a2b', border: '1px solid #263353' }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>✅ Strengths</h3>
        <ul>{result.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </div>
      <div className="card">
        <h3>⚠️ Areas to Improve</h3>
        <ul>{result.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </div>
      <div className="card">
        <h3>💡 Recommendations</h3>
        <ul>{result.recommendations.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn" onClick={() => navigate('/interview/new')}>Practice Again</button>
        <button className="btn-secondary btn" onClick={downloadReport} disabled={downloading}>
          {downloading ? 'Preparing...' : '⬇ Download Report'}
        </button>
      </div>
    </div>
  )
}
