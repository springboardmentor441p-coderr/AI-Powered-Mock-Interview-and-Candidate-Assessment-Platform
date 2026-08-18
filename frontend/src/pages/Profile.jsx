import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Briefcase, Upload, ShieldCheck, FileText, CheckCircle, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Profile = () => {
  const navigate = useNavigate();
  const { candidate: user, setCandidate: setUser, resumeData, setResumeData } = useApp();
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('smarthire_token');
      localStorage.removeItem('smarthire_user');
      localStorage.removeItem('smarthire_session_qa');
      localStorage.removeItem('smarthire_video_url');
    } catch (e) {}

    if (typeof setUser === 'function') {
      setUser({
        id: null,
        name: '',
        email: '',
        targetRole: '',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        isLoggedIn: false
      });
    }
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Candidate Profile & Resume Manager
          </h1>
          <p className="text-xs text-slate-400 font-mono">Manage your technical skills, target roles, and master resume</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-red-500/20"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>Sign Out Account</span>
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-20 h-20 rounded-2xl border-2 border-cyan-400 object-cover shadow-lg shadow-cyan-500/20"
          />
          <div>
            <h2 className="text-lg font-bold text-white">{user.name}</h2>
            <p className="text-xs text-slate-400 font-mono">{user.email}</p>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-500/30 mt-2 font-mono">
              <ShieldCheck className="w-3 h-3" /> VERIFIED APPLICANT
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Target Role</label>
              <input
                type="text"
                value={user.targetRole}
                onChange={(e) => setUser({ ...user, targetRole: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Experience Level</label>
              <input
                type="text"
                value={user.experienceLevel}
                onChange={(e) => setUser({ ...user, experienceLevel: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Master Resume Section */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" /> Master Resume File
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={resumeData.filename}
                onChange={(e) => setResumeData({ ...resumeData, filename: e.target.value })}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100"
              />
              <button
                type="button"
                className="glow-cyan-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Re-upload Resume
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedMessage && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Profile updated successfully!
              </span>
            )}
            <button
              type="submit"
              className="glow-cyan-btn px-6 py-2.5 rounded-xl font-bold text-xs text-white ml-auto cursor-pointer"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
