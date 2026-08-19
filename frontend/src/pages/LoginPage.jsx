import React, { useState } from 'react';
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { loginUser } from '../services/api';

export default function LoginPage({ setActivePage, onUserLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid email address (e.g. candidate@domain.com).');
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const result = await loginUser(cleanEmail, cleanPassword);
    setLoading(false);

    if (result && (result.access_token || result.user)) {
      if (onUserLogin && result.user) {
        onUserLogin(result.user);
      }
      const role = result.user?.role || "candidate";
      if (role === "admin") {
        setActivePage('admin-dashboard');
      } else if (role === "recruiter") {
        setActivePage('recruiter-dashboard');
      } else {
        setActivePage('candidate-dashboard');
      }
    } else {
      setErrorMessage('Authentication failed. Please check your credentials and try again.');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md glass-card p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-white">Candidate Sign In</h2>
          <p className="text-xs text-slate-400">Log in to access your AI technical interview portal</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                placeholder="candidate@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Preset Profile Options for Convenience */}
          <div className="pt-1">
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Quick Sign-In Presets:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setEmail('candidate@smarthire.ai'); setPassword('password123'); setErrorMessage(''); }}
                className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-semibold text-indigo-400 hover:bg-slate-800"
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => { setEmail('recruiter@smarthire.ai'); setPassword('password123'); setErrorMessage(''); }}
                className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-semibold text-cyan-400 hover:bg-slate-800"
              >
                Recruiter
              </button>
              <button
                type="button"
                onClick={() => { setEmail('admin@smarthire.ai'); setPassword('password123'); setErrorMessage(''); }}
                className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-semibold text-emerald-400 hover:bg-slate-800"
              >
                Admin
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Authenticating..." : <>Sign In to Account <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          Don't have an account?{' '}
          <button onClick={() => setActivePage('register')} className="text-indigo-400 font-semibold hover:underline">
            Create Account
          </button>
        </div>

      </div>
    </div>
  );
}
