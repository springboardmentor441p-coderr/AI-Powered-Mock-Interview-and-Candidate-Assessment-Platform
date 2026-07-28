import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cpu, Mail, Lock, User, Briefcase, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SignupPage = () => {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetRole, setTargetRole] = useState('Senior Full-Stack AI Engineer');
  const [experience, setExperience] = useState('Senior Level (5+ Yrs)');

  const handleSignup = (e) => {
    e.preventDefault();
    setUser({
      id: Date.now(),
      name: fullName || 'Alex Vance',
      email: email || 'alex.vance@example.com',
      targetRole: targetRole,
      experienceLevel: experience,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      isLoggedIn: true
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="glass-card rounded-2xl p-8 border border-slate-800 w-full max-w-md bg-slate-950/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500" />

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6 text-purple-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Candidate Registration</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">Create your AI Interview & Assessment Profile</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Vance"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.vance@example.com"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Target Job Role</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full glow-violet-btn py-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            Create Candidate Account <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-purple-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
