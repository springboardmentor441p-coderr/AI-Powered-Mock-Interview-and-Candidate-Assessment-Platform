import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserCheck, ShieldAlert, Award } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('candidate');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Authenticate
        const response = await api.post('/api/users/login', { email, password });
        const { access_token, role: userRole, email: userEmail, full_name } = response.data;
        
        localStorage.setItem('token', access_token);
        localStorage.setItem('role', userRole);
        localStorage.setItem('email', userEmail);
        localStorage.setItem('full_name', full_name);
        
        navigate('/dashboard');
      } else {
        // Register
        await api.post('/api/users/signup', {
          email,
          password,
          full_name: fullName,
          role,
        });
        
        // Log in immediately after sign up
        const loginResponse = await api.post('/api/users/login', { email, password });
        const { access_token, role: userRole, email: userEmail, full_name } = loginResponse.data;
        
        localStorage.setItem('token', access_token);
        localStorage.setItem('role', userRole);
        localStorage.setItem('email', userEmail);
        localStorage.setItem('full_name', full_name);
        
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'An error occurred during authentication. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080d] bg-mesh-grid flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card p-8 relative overflow-hidden">
        {/* Glow highlights */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/10 mb-3">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">SmartHire AI</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {isLogin ? 'Sign in to access your assessment workspace' : 'Create an account to begin mock interviews'}
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-xl text-sm leading-relaxed">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Role selector on Registration */}
          {!isLogin && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Select Account Role</label>
              <div className="grid grid-cols-3 gap-2">
                {['candidate', 'recruiter', 'admin'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border capitalize transition-all duration-200 ${
                      role === r 
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-500/5' 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Full Name Field */}
          {!isLogin && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Password</label>
              {isLogin && (
                <button type="button" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">Forgot?</button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Mock OAuth Providers */}
        <div className="mt-6 relative z-10">
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="px-3 text-xs text-gray-500 uppercase tracking-wider">Or Continue With</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                localStorage.setItem('token', 'mock_token');
                localStorage.setItem('role', 'candidate');
                localStorage.setItem('email', 'google_candidate@example.com');
                localStorage.setItem('full_name', 'Google Candidate');
                navigate('/dashboard');
              }}
              className="py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-xs text-gray-300 hover:bg-white/10 font-medium flex items-center justify-center gap-2 transition-all duration-200"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.47 1.617l2.4-2.4C17.37 1.737 14.973 1 12.24 1c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.772 0 9.606-4.05 9.606-9.773 0-.66-.06-1.285-.18-1.942H12.24z"/>
              </svg>
              Google
            </button>
            <button
              onClick={() => {
                localStorage.setItem('token', 'mock_token');
                localStorage.setItem('role', 'candidate');
                localStorage.setItem('email', 'github_candidate@example.com');
                localStorage.setItem('full_name', 'GitHub Candidate');
                navigate('/dashboard');
              }}
              className="py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-xs text-gray-300 hover:bg-white/10 font-medium flex items-center justify-center gap-2 transition-all duration-200"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              GitHub
            </button>
          </div>
        </div>

        {/* Footer switch */}
        <div className="mt-8 text-center relative z-10">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-400 hover:text-cyan-400 font-medium transition-colors duration-200"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
