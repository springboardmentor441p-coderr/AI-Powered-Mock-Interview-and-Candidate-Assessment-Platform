import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Rules({ navigate }) {
  const [sessionId, setSessionId] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [extensionActive, setExtensionActive] = useState(false);
  const [hasExtension, setHasExtension] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('sid');
    if (!sid) {
      navigate('dashboard');
      return;
    }
    setSessionId(sid);

    // Check for extension heartbeat
    const checkExtension = setInterval(() => {
      // The extension's content script will inject a meta tag
      const meta = document.querySelector('meta[name="smarthire-extension"]');
      if (meta && meta.content === 'active') {
        setExtensionActive(true);
      } else {
        setExtensionActive(false);
      }
    }, 1000);

    return () => clearInterval(checkExtension);
  }, [navigate]);

  const handleStart = async () => {
    if (!agreed) return;
    if (hasExtension !== 'yes') {
      setError("Please confirm you have the extension installed.");
      return;
    }
    setLoading(true);
    try {
      await api.acceptRules(sessionId);
      setTimeout(() => {
        navigate(`live-interview?sid=${sessionId}`);
      }, 500);
    } catch (err) {
      setError(err.message || "Failed to accept rules. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-8 relative overflow-x-hidden overflow-y-auto">
      {/* Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-secondary-container/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-3xl bg-surface-container-low/40 backdrop-blur-2xl rounded-3xl p-10 border border-white/5 relative z-10 shadow-2xl my-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <span className="material-symbols-outlined text-primary text-[24px]">gavel</span>
          </div>
          <div>
            <h1 className="font-display-md text-display-md text-on-surface tracking-tight">Rules & Regulations</h1>
            <p className="font-mono-label text-mono-label text-on-surface-variant uppercase mt-1">Pre-Interview Requirements</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {[
            { icon: 'help_outline', text: 'No outside help from other individuals.' },
            { icon: 'smart_toy', text: 'No use of generative AI tools (ChatGPT, Claude, etc.).' },
            { icon: 'videocam', text: 'Camera and microphone must stay enabled for the entire session.' },
            { icon: 'tab', text: 'Do not switch tabs, minimize the window, or leave the screen.' },
            { icon: 'keyboard', text: 'All typed answers must be your own original work.' }
          ].map((rule, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-surface-container-highest/30 border border-outline-variant/10">
              <span className="material-symbols-outlined text-primary mt-0.5">{rule.icon}</span>
              <p className="font-body-lg text-on-surface">{rule.text}</p>
            </div>
          ))}
        </div>

        {/* Manual Extension Check */}
        <div className="p-5 rounded-2xl border mb-8 bg-surface-container/50 border-outline-variant/30">
          <p className="font-label-lg font-bold mb-3 text-on-surface">Did you have this extension?</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setHasExtension('yes')}
              className={`px-6 py-2 rounded-lg font-label-md transition-colors ${hasExtension === 'yes' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
            >
              Yes
            </button>
            <button 
              onClick={() => setHasExtension('no')}
              className={`px-6 py-2 rounded-lg font-label-md transition-colors ${hasExtension === 'no' ? 'bg-error text-white' : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'}`}
            >
              No
            </button>
          </div>
          
          {hasExtension === 'no' && (
            <div className="mt-4 p-4 bg-error/10 border border-error/20 rounded-xl">
              <p className="text-error font-body-md mb-2">If you don't have this extension, unable to write exam.</p>
              <a href="https://chromewebstore.google.com/detail/secure-exam-proctor/gfolddmfcichcfnghdchbfgpmgodmkjd" target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-error text-white font-label-md rounded-lg hover:bg-error/80 transition-colors">
                Download Secure Extension
              </a>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error font-body-md">
            {error}
          </div>
        )}

        {/* Checkbox */}
        <label className="flex items-center gap-4 cursor-pointer mb-8 group">
          <div className="relative flex items-center justify-center">
            <input 
              type="checkbox" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="peer appearance-none w-6 h-6 border-2 border-outline-variant rounded-md checked:border-primary checked:bg-primary transition-all cursor-pointer"
            />
            <span className="material-symbols-outlined text-on-primary text-[18px] absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity">
              check
            </span>
          </div>
          <span className="font-body-lg text-on-surface group-hover:text-primary transition-colors">
            I have read and agree to follow all rules and regulations for this interview.
          </span>
        </label>

        {/* Action Button */}
        <button 
          onClick={handleStart}
          disabled={!agreed || hasExtension !== 'yes' || loading}
          className={`w-full py-4 rounded-2xl font-label-lg text-label-lg flex items-center justify-center gap-3 transition-all duration-300 ${
            agreed && hasExtension === 'yes' && !loading
              ? 'bg-primary text-on-primary hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-[1.01]'
              : 'bg-surface-container-highest text-on-surface-variant opacity-50 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 border-on-primary border-t-transparent animate-spin" />
          ) : (
            <span className="material-symbols-outlined">rocket_launch</span>
          )}
          {loading ? 'Initializing Secure Session...' : 'Start Interview'}
        </button>

      </div>
    </div>
  );
}
