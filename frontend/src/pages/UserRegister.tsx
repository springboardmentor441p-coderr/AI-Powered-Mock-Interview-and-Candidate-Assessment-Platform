import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import { authService } from '../services/auth'

const PASSWORD_HELP =
  'At least 8 characters with uppercase, lowercase, number, and special character.'

function isStrongPassword(password: string): boolean {
  const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
  return strongPasswordPattern.test(password)
}

export default function UserRegister() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [highestQualification, setHighestQualification] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const passwordIsStrong = useMemo(() => isStrongPassword(password), [password])

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!passwordIsStrong) {
      setError('Password is not strong enough. ' + PASSWORD_HELP)
      return
    }

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.')
      return
    }

    setLoading(true)

    try {
      await authService.register({
        email,
        username,
        password,
        highest_qualification: highestQualification,
      })

      const loginResponse = await authService.login(email, password)
      localStorage.setItem('accessToken', loginResponse.data.access_token)
      localStorage.setItem('user', JSON.stringify(loginResponse.data.user))
      setSuccess('Account created successfully. Redirecting to dashboard...')
      window.setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create Account" subtitle="Register as a candidate to begin your journey">
      <form onSubmit={handleCreateAccount} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
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
            placeholder="you@example.com"
            className="input-field"
            required
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Unique Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="choose_a_unique_username"
            className="input-field"
            minLength={3}
            maxLength={30}
            required
          />
          <p className="text-xs text-gray-500 mt-1">Use 3-30 characters. This must be unique.</p>
        </div>

        <div>
          <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-2">
            Highest Qualification
          </label>
          <select
            id="qualification"
            value={highestQualification}
            onChange={(e) => setHighestQualification(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Select qualification</option>
            <option value="High School">High School</option>
            <option value="Diploma">Diploma</option>
            <option value="Bachelor's">Bachelor's</option>
            <option value="Master's">Master's</option>
            <option value="PhD">PhD</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Strong Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            className="input-field"
            required
          />
          <p className={`text-xs mt-1 ${password.length > 0 && !passwordIsStrong ? 'text-red-600' : 'text-gray-500'}`}>
            {PASSWORD_HELP}
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="input-field"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="text-center pt-1">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login/user" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}
