import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cpu, Mail, Lock, ArrowRight, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setCandidate } = useApp();
  const [email, setEmail] = useState('dileep@smarthire.ai');
  const [password, setPassword] = useState('dileep123');

  const handleLogin = (e) => {
    e.preventDefault();
    setCandidate({
      id: 1,
      name: '',
      email: email,
      targetRole: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      isLoggedIn: true
    });
    navigate('/dashboard');
  };

  const handleGoogleLogin = () => {
    setCandidate({
      id: 1,
      name: '',
      email: 'candidate@example.com',
      targetRole: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      isLoggedIn: true
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="glass-card rounded-2xl p-8 border border-slate-800 w-full max-w-md bg-slate-950/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600" />

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3">
            <Cpu className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Candidate Authentication</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">Sign in to your Candidate Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full glow-cyan-btn py-3 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            Sign In as Candidate <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
          <span className="relative bg-slate-950 px-3 text-[10px] text-slate-500 uppercase font-mono">Or Continue With</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 py-2.5 rounded-xl font-bold text-xs text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Globe className="w-4 h-4 text-red-400" /> Sign In with Google
        </button>

        <div className="mt-6 text-center text-xs text-slate-500">
          New Candidate?{' '}
          <Link to="/signup" className="text-cyan-400 font-semibold hover:underline">
            Register Account
          </Link>
        </div>
      </div>
    </div>
  );
};
