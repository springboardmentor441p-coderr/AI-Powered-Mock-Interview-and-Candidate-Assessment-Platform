'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'next/navigation';
import { 
  X, 
  Bot, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Building2,
  Sparkles
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const router = useRouter();
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    authMode, 
    setAuthMode, 
    loginAsDemoCandidate, 
    loginAsDemoRecruiter,
    loginAsDemoAdmin 
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<'candidate' | 'recruiter'>('candidate');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleDemoCandidate = () => {
    loginAsDemoCandidate();
    setIsAuthModalOpen(false);
    router.push('/resume');
  };

  const handleDemoRecruiter = () => {
    loginAsDemoRecruiter();
    setIsAuthModalOpen(false);
    router.push('/recruiter');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsAuthModalOpen(false);
      if (accountType === 'recruiter') {
        loginAsDemoRecruiter();
        router.push('/recruiter');
      } else {
        loginAsDemoCandidate();
        router.push('/resume');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Top Accent Line */}
        <div className="h-1.5 bg-[#059669]" />

        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
              <Bot className="w-7 h-7 text-[#059669]" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {authMode === 'login' && 'Sign in to InterVio AI'}
              {authMode === 'signup' && 'Create your Platform Account'}
              {authMode === 'forgot' && 'Reset your Password'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Select candidate or enterprise recruiter workspace
            </p>
          </div>

          {/* Account Type Selector Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-5 text-xs font-bold border border-slate-200">
            <button
              type="button"
              onClick={() => setAccountType('candidate')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                accountType === 'candidate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Candidate Account
            </button>
            <button
              type="button"
              onClick={() => setAccountType('recruiter')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                accountType === 'recruiter' ? 'bg-[#059669] text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Recruiter / Employer
            </button>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-center">
              ⚡ Instant Demo 1-Click Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDemoCandidate}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 text-xs font-bold shadow-sm transition-all"
              >
                <User className="w-3.5 h-3.5 text-[#059669]" />
                <span>Candidate Demo</span>
              </button>
              <button
                type="button"
                onClick={handleDemoRecruiter}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Recruiter ATS</span>
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-[#059669] font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Chen"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#059669]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={accountType === 'recruiter' ? 'sarah.jenkins@enterprise-hiring.com' : 'alex.chen@devmail.io'}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#059669]"
                />
              </div>
            </div>

            {authMode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[11px] text-[#059669] hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#059669]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {authMode === 'login' && `Sign In as ${accountType === 'recruiter' ? 'Recruiter' : 'Candidate'}`}
                    {authMode === 'signup' && 'Create Account'}
                    {authMode === 'forgot' && 'Send Reset Link'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
