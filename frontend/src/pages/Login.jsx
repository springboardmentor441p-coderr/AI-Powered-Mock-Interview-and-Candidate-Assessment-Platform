import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, saveSession } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login({ email, password })
      saveSession(data.access_token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <div className="brand" style={{ fontSize: 24, marginBottom: 6 }}>SmartHire AI</div>
        <p className="muted" style={{ marginTop: 0 }}>AI-Powered Mock Interview Platform</p>
        <form onSubmit={submit}>
          {error && <div className="error-text">{error}</div>}
          <input className="input" type="email" placeholder="Email" value={email}
                 onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={password}
                 onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 16 }}>
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}
