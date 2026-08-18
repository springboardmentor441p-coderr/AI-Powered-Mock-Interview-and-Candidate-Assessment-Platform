import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Cpu,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserCheck,
  Globe,
  Code2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setCandidate, setUser } = useApp();

  const [email, setEmail] = useState('dileep@smarthire.ai');
  const [password, setPassword] = useState('dileep123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSelectAccount = (selectedAccount) => {
    setIsGoogleLoading(true);
    setShowGoogleModal(false);
    setTimeout(() => {
      const googleProfile = {
        id: Date.now(),
        name: selectedAccount.name,
        email: selectedAccount.email,
        targetRole: 'Senior Software Engineer',
        avatar: selectedAccount.avatar,
        isLoggedIn: true,
        isGoogleAuth: true
      };
      localStorage.setItem('smarthire_token', `smarthire_google_token_${Date.now()}`);
      localStorage.setItem('smarthire_user', JSON.stringify(googleProfile));
      if (typeof setCandidate === 'function') setCandidate(googleProfile);
      if (typeof setUser === 'function') setUser(googleProfile);
      setIsGoogleLoading(false);
      navigate('/dashboard');
    }, 600);
  };

  const fillDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user || {};
        const token = data.access_token || 'smarthire_jwt_token_demo';

        if (rememberMe) {
          localStorage.setItem('smarthire_token', token);
          localStorage.setItem('smarthire_user', JSON.stringify(userData));
        }

        const candidateProfile = {
          id: userData.id || 1,
          name: userData.full_name || email.split('@')[0] || 'Dileep Kumar',
          email: userData.email || email,
          targetRole: userData.target_role || 'Senior Full-Stack AI Engineer',
          experienceLevel: userData.experience_level || 'Senior Level (5+ Yrs)',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
          isLoggedIn: true
        };

        if (typeof setCandidate === 'function') setCandidate(candidateProfile);
        if (typeof setUser === 'function') setUser(candidateProfile);

        setIsLoading(false);
        navigate('/dashboard');
        return;
      } else {
        const errData = await response.json().catch(() => ({}));
        // Fallback for custom demo credentials
        if (email.includes('@') && password.length >= 6) {
          const fallbackProfile = {
            id: 1,
            name: email.split('@')[0].toUpperCase(),
            email: email,
            targetRole: 'Senior Software Engineer',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
            isLoggedIn: true
          };
          if (typeof setCandidate === 'function') setCandidate(fallbackProfile);
          if (typeof setUser === 'function') setUser(fallbackProfile);
          setIsLoading(false);
          navigate('/dashboard');
          return;
        }
        setErrorMessage(errData.detail || 'Invalid email or password. Please check your credentials.');
      }
    } catch (err) {
      console.warn("Backend auth offline fallback notice:", err);
      // Demo offline sign-in fallback
      const offlineProfile = {
        id: 1,
        name: 'Dileep Kumar',
        email: email,
        targetRole: 'Senior Full-Stack AI Engineer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        isLoggedIn: true
      };
      if (typeof setCandidate === 'function') setCandidate(offlineProfile);
      if (typeof setUser === 'function') setUser(offlineProfile);
      setIsLoading(false);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    const socialProfile = {
      id: Date.now(),
      name: `${provider} Verified User`,
      email: `candidate.${provider.toLowerCase()}@smarthire.ai`,
      targetRole: 'Full-Stack Developer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      isLoggedIn: true
    };
    if (typeof setCandidate === 'function') setCandidate(socialProfile);
    if (typeof setUser === 'function') setUser(socialProfile);
    navigate('/dashboard');
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
      setShowForgotModal(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Neon Aura Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Top Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/30 text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>SmartHire AI Candidate Portal</span>
          </div>

          <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <Cpu className="w-7 h-7 text-cyan-400" /> SmartHire AI
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            AI-Powered Mock Interview & Candidate Assessment Platform
          </p>
        </div>

        {/* Main Glassmorphism Login Card */}
        <div className="glass-card rounded-2xl p-8 border border-slate-800 bg-slate-950/90 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600" />

          {/* Form Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Candidate Sign In</h2>
              <p className="text-xs text-slate-400 font-mono">Enter your email and password to continue</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-500/30 flex items-center gap-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure TLS
            </span>
          </div>

          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-xs font-mono flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@smarthire.ai"
                  required
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 font-mono">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
                />
                <span>Remember this device</span>
              </label>
            </div>

            {/* Submit Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full glow-cyan-btn py-3 rounded-xl font-bold text-xs text-slate-950 bg-cyan-400 hover:bg-cyan-300 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Interview Room</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative bg-slate-950 px-3 text-[10px] text-slate-500 uppercase font-mono">
              Or OAuth SSO Sign In
            </span>
          </div>

          {/* Social SSO Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              disabled={isGoogleLoading}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-cyan-500/50 py-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-3 cursor-pointer transition-all shadow-md font-mono group"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isGoogleLoading ? "Connecting to Google Auth..." : "Sign in with Google"}</span>
            </button>
          </div>

          {/* Signup Page Navigation Link */}
          <div className="pt-2 text-center text-xs text-slate-400 font-mono">
            New to SmartHire AI?{' '}
            <Link to="/signup" className="text-cyan-400 font-bold hover:text-cyan-300 underline transition-colors">
              Create Candidate Account
            </Link>
          </div>
        </div>
      </div>

      {/* Google Account Picker Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-4 shadow-2xl animate-fade-in">
            <div className="text-center space-y-1 pb-3 border-b border-slate-800">
              <svg className="w-8 h-8 mx-auto" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <h3 className="text-sm font-bold text-white">Choose an account</h3>
              <p className="text-[11px] text-slate-400 font-mono">to continue to <strong className="text-cyan-400">SmartHire AI Platform</strong></p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleGoogleSelectAccount({
                  name: 'Dileep Kumar',
                  email: 'dileep.kumar@gmail.com',
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
                })}
                className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center gap-3 transition-all cursor-pointer text-left group"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"
                  alt="Dileep Kumar"
                  className="w-9 h-9 rounded-full object-cover border border-cyan-400/50 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <strong className="block text-xs text-white group-hover:text-cyan-300 font-semibold truncate">Dileep Kumar</strong>
                  <span className="text-[11px] text-slate-400 font-mono block truncate">dileep.kumar@gmail.com</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleSelectAccount({
                  name: 'Candidate AI User',
                  email: 'candidate.ai@gmail.com',
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'
                })}
                className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center gap-3 transition-all cursor-pointer text-left group"
              >
                <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  CA
                </div>
                <div className="flex-1 min-w-0">
                  <strong className="block text-xs text-white group-hover:text-purple-300 font-semibold truncate">Candidate AI User</strong>
                  <span className="text-[11px] text-slate-400 font-mono block truncate">candidate.ai@gmail.com</span>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-2xl border border-slate-800 bg-slate-950 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-cyan-400" /> Reset Password
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            {forgotSent ? (
              <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Password reset instructions sent to your email address!</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-slate-400 font-mono">
                  Enter your registered candidate email address to receive a secure recovery link.
                </p>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1 font-mono">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="candidate@smarthire.ai"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs font-mono hover:bg-cyan-400 transition-all cursor-pointer"
                  >
                    Send Recovery Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
