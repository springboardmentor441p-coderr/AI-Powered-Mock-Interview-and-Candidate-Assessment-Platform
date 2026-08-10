import React, { useState } from 'react';
import { api } from '../services/api';

export default function Auth({ navigate }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        localStorage.setItem('nexiq_token', res.access_token);
        localStorage.setItem('nexiq_user', JSON.stringify(res.user || { email }));
        navigate('dashboard');
      } else {
        await api.register(name, email, password);
        const res = await api.login(email, password);
        localStorage.setItem('nexiq_token', res.access_token);
        localStorage.setItem('nexiq_user', JSON.stringify(res.user || { email, full_name: name }));
        navigate('onboarding');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Atmospheric glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[150px]" />
      </div>

      <div className="flex items-center justify-center min-h-screen w-full px-margin-mobile lg:px-margin-desktop py-12 z-10">
        {/* Card */}
        <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-3xl overflow-hidden shadow-2xl shadow-primary-container/5 bg-surface-container-lowest/40 backdrop-blur-2xl border border-outline-variant/10">

          {/* Left: visual */}
          <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-12 overflow-hidden bg-surface-container-high/20">
            {/* Grid overlay */}
            <div className="absolute inset-0 z-10 opacity-20 pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 20 L100 20 M20 0 L20 100" stroke="#00dbe9" strokeWidth="0.05" />
                <circle cx="20" cy="20" r="0.5" fill="#dbfcff" />
                <path d="M0 80 L100 80 M80 0 L80 100" stroke="#00dbe9" strokeWidth="0.05" />
                <circle cx="80" cy="80" r="0.5" fill="#dbfcff" />
              </svg>
            </div>

            <div className="relative z-20">
              {/* Logo */}
              <div className="flex items-center gap-4 mb-12">
                <img src="/nexiq_logo.png" alt="NEXIQ" className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(0,219,233,0.4)]" onError={e => { e.target.style.display='none'; }} />
                <span className="font-headline-md text-headline-md text-primary tracking-tighter">NEXIQ</span>
              </div>

              <div className="space-y-6">
                <h1 className="font-display-lg text-display-lg leading-tight text-on-surface max-w-md">
                  Elevate your <span className="text-primary-container">career trajectory</span> with AI-driven precision.
                </h1>
                <p className="font-body-lg text-on-surface-variant max-w-sm">
                  The high-performance command center for the modern workforce.
                </p>
              </div>
            </div>

            {/* Neural network status */}
            <div className="relative z-20 mt-12">
              <div className="flex items-center gap-3 bg-surface/40 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/10 w-fit">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span className="font-mono-label text-mono-label text-primary uppercase tracking-[0.2em]">Neural Network Active</span>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="lg:col-span-5 flex flex-col p-8 lg:p-16 bg-surface-container-lowest">
            <div className="mb-10 text-center lg:text-left">
              <div className="lg:hidden flex justify-center mb-6">
                <img src="/nexiq_logo.png" alt="NEXIQ" className="w-16 h-16 object-contain" onError={e => { e.target.style.display='none'; }} />
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-2">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="font-body-md text-on-surface-variant">
                {mode === 'login' ? 'Enter your credentials to access the terminal.' : 'Join the NEXIQ platform.'}
              </p>
            </div>

            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-error/10 border border-error/20 text-error font-body-md text-sm">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={submit}>
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="font-mono-label text-mono-label text-on-surface-variant uppercase ml-1">Full Name</label>
                  <div className="relative group" style={{ transition: 'transform 0.3s ease' }}
                    onFocus={e => e.currentTarget.style.transform = 'translateX(4px)'}
                    onBlur={e => e.currentTarget.style.transform = 'translateX(0)'}
                  >
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">person</span>
                    <input
                      className="w-full bg-surface-container-high/30 border-b border-outline-variant/30 py-4 pl-12 pr-4 rounded-xl text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-high/50 transition-all placeholder:text-on-surface-variant/30"
                      type="text" placeholder="Alex Rivera" value={name} onChange={e => setName(e.target.value)} required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-mono-label text-mono-label text-on-surface-variant uppercase ml-1">Email Address</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">alternate_email</span>
                  <input
                    className="w-full bg-surface-container-high/30 border-b border-outline-variant/30 py-4 pl-12 pr-4 rounded-xl text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-high/50 transition-all placeholder:text-on-surface-variant/30"
                    type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="font-mono-label text-mono-label text-on-surface-variant uppercase">Password</label>
                  {mode === 'login' && <a className="font-label-md text-label-md text-primary-fixed-dim hover:text-primary transition-colors" href="#">Forgot?</a>}
                </div>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">lock</span>
                  <input
                    className="w-full bg-surface-container-high/30 border-b border-outline-variant/30 py-4 pl-12 pr-4 rounded-xl text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-high/50 transition-all placeholder:text-on-surface-variant/30"
                    type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                  />
                </div>
              </div>

              {mode === 'login' && (
                <div className="flex items-center gap-3 py-2">
                  <div className="relative flex items-center">
                    <input className="peer appearance-none w-5 h-5 border border-outline-variant rounded-md checked:bg-primary checked:border-transparent transition-all cursor-pointer" id="remember" type="checkbox" />
                    <span className="material-symbols-outlined absolute text-[16px] text-on-primary pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5">check</span>
                  </div>
                  <label className="font-label-md text-label-md text-on-surface-variant cursor-pointer select-none" htmlFor="remember">Remember this session</label>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'SIGN IN TO TERMINAL' : 'CREATE ACCOUNT'}</span>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/20" />
              </div>
              <div className="relative flex justify-center bg-surface-container-lowest px-4">
                <span className="font-mono-label text-mono-label text-on-surface-variant/40 uppercase tracking-widest">Or Authorize Via</span>
              </div>
            </div>

            <button className="w-full py-3.5 bg-surface-container border border-outline-variant/20 rounded-xl flex items-center justify-center gap-3 text-on-surface hover:bg-surface-container-high hover:border-primary/30 transition-all group">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="font-label-md">Google Workspace</span>
            </button>

            <div className="mt-6 flex justify-center">
              <a href="seb://localhost:5173/#auth" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high/50 border border-outline-variant/20 hover:border-primary/50 transition-colors group">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors">lock</span>
                <span className="font-label-md text-on-surface-variant group-hover:text-on-surface transition-colors">Login with Secure Exam Browser</span>
              </a>
            </div>

            <div className="mt-auto pt-10 text-center">
              <p className="font-body-md text-on-surface-variant">
                {mode === 'login' ? 'New to Nexiq?' : 'Already have an account?'}
                <a className="text-primary-fixed-dim font-bold hover:underline ml-1 cursor-pointer" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
                  {mode === 'login' ? 'Create Account' : 'Sign In'}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
