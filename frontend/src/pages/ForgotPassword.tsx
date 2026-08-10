import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import { authService } from '../services/auth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await authService.resetPassword(email, newPassword)
      setSuccess('Your password has been successfully reset. Redirecting to login...')
      setTimeout(() => {
        navigate('/login/user')
      }, 3000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please verify your email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Reset Account Password" subtitle="Enter your email and define a new access password">
      <form onSubmit={handleReset} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-semibold">
            {success}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="input-field"
            required
            disabled={loading || !!success}
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="input-field"
            required
            disabled={loading || !!success}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="input-field"
            required
            disabled={loading || !!success}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !!success}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Resetting Password...' : 'Reset Access Password'}
        </button>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-600">
            Remembered your credentials?{' '}
            <Link to="/login/user" className="text-primary-600 hover:text-primary-700 font-medium">
              Back to Sign In
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}
