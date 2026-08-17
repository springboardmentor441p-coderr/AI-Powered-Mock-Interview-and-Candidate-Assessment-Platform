'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { 
  Bot, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export default function GeneralLoginPage() {
  const router = useRouter();
  const { loginAsUser } = useApp();
  
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter' | 'admin'>('candidate');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setAuthError('');

    try {
      await loginAsUser(name.trim() || email.split('@')[0], email.trim(), selectedRole, password);

      if (selectedRole === 'recruiter') {
        router.push('/recruiter');
      } else if (selectedRole === 'admin') {
        router.push('/admin');
      } else {
        router.push('/resume');
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign in. Please verify your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#059669] flex items-center justify-center text-white shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <span className="text-lg font-extrabold text-slate-900 tracking-tight">
            Inter<span className="text-[#059669]">Vio</span>
          </span>
        </Link>
      </div>

      {/* Main General Login Card */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-enterprise-lg overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Left Form Panel */}
          <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center space-y-6">
            
            {/* Header */}
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#059669] text-xs font-bold border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5" />
                <span>InterVio Platform Sign In</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {isRegisterMode ? 'Create Your Account' : 'Sign In to InterVio'}
              </h1>
              <p className="text-xs text-slate-500">
                {isRegisterMode ? 'Enter your details to set up your profile.' : 'Enter your credentials to access your account.'}
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedRole('candidate')}
                className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  selectedRole === 'candidate'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5 text-[#059669]" />
                <span>Candidate</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('recruiter')}
                className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  selectedRole === 'recruiter'
                    ? 'bg-[#059669] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Recruiter</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  selectedRole === 'admin'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {/* General Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#059669]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#059669]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                  {!isRegisterMode && (
                    <a href="#" className="text-xs text-[#059669] hover:underline font-semibold">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#059669]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#059669] border-slate-300 rounded focus:ring-[#059669]"
                  />
                  <span className="text-xs text-slate-600 font-medium">Keep me signed in</span>
                </label>
              </div>

              {authError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {isRegisterMode ? 'Create Account & Sign In' : `Sign In as ${selectedRole === 'recruiter' ? 'Recruiter' : selectedRole === 'admin' ? 'Admin' : 'Candidate'}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-500 pt-2">
              {isRegisterMode ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsRegisterMode(false)}
                    className="font-bold text-[#059669] hover:underline"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setIsRegisterMode(true)}
                    className="font-bold text-[#059669] hover:underline"
                  >
                    Register New Account
                  </button>
                </>
              )}
            </div>

          </div>

          {/* Right Information Panel */}
          <div className="md:col-span-5 bg-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-6 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-extrabold tracking-tight leading-snug">
                One Account. <br />
                Your Own Personalized Profile.
              </h2>

              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#059669]" /> Personalized Account
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Your profile data, resume uploads, and interview evaluations are private to your logged-in account.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#059669]" /> Enterprise Recruiter ATS
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Create hiring campaigns, monitor proctoring audit logs, and manage applicants efficiently.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>© 2026 InterVio AI</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Secure
              </span>
            </div>

          </div>

        </div>
      </div>

      <div className="py-4 text-center text-xs text-slate-400">
        Enterprise AI Hiring & Screening Platform
      </div>

    </div>
  );
}
