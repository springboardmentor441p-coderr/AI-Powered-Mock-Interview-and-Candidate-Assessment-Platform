import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, saveSession } from '../api'

export default function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('candidate')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.register({ full_name: fullName, email, password, role })
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
        <p className="muted" style={{ marginTop: 0 }}>Create your account</p>
        <form onSubmit={submit}>
          {error && <div className="error-text">{error}</div>}
          <input className="input" placeholder="Full name" value={fullName}
                 onChange={(e) => setFullName(e.target.value)} required />
          <input className="input" type="email" placeholder="Email" value={email}
                 onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password (min 6 chars)" value={password}
                 onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 16 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
