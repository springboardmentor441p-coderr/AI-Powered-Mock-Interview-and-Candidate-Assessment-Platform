'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { 
  User, 
  FileText, 
  Trophy, 
  Flame, 
  CheckCircle2, 
  ExternalLink,
  Sparkles,
  Building2,
  Lock,
  ArrowRight,
  UserCheck
} from 'lucide-react';

export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['candidate', 'recruiter', 'admin']}>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}

function ProfilePageContent() {
  const { user, reports, setUser, roleMode } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'resumes' | 'history' | 'settings'>('profile');

  const [name, setName] = useState(user?.name || '');
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Software Engineer');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setTargetRole(user.targetRole || 'Software Engineer');
    }
  }, [user]);

  if (!user) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      setUser({ ...user, name: name.trim(), targetRole: targetRole.trim() });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Strictly filter candidate reports to authenticated user
  const candidateReports = reports.filter(r => r.candidateEmail.toLowerCase() === user.email.toLowerCase() || user.role === 'recruiter' || user.role === 'admin');

  return (
    <div className="min-h-screen bg-slate-50 py-8 text-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Dynamic Profile Card Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-5">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#059669] text-white font-extrabold text-2xl flex items-center justify-center ring-2 ring-emerald-500/30 shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">{user.name}</h1>
                <span className="text-xs font-bold text-[#059669] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                  {roleMode === 'recruiter' ? 'Recruiter Account' : 'Candidate Account'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Flame className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-indigo-700">{user.readinessLevel || 'Active Candidate'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-[#059669] font-bold">
                  {candidateReports.length > 0 ? `${user.averageScore || 85}% Avg Rating` : 'New Account'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2 transition-all shadow-sm"
            >
              <Trophy className="w-4 h-4 text-[#059669]" />
              <span>Candidate Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 text-xs font-bold shadow-sm">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'profile' ? 'bg-[#059669] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Personal Information
          </button>
          <button
            onClick={() => setActiveTab('resumes')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'resumes' ? 'bg-[#059669] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resume Vault ({user.resumes?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'history' ? 'bg-[#059669] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Interview Archive ({candidateReports.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2.5 rounded-xl transition-all ${
              activeTab === 'settings' ? 'bg-[#059669] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Preferences
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Edit Profile Details</h3>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#059669] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profile details updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Engineering / Professional Role</label>
                <input
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#059669]"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        )}

        {activeTab === 'resumes' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Parsed Resume Vault</h3>
              <Link
                href="/resume"
                className="px-4 py-2 rounded-xl bg-emerald-50 text-[#059669] border border-emerald-200 text-xs font-bold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upload Resume</span>
              </Link>
            </div>

            <div className="space-y-4">
              {(!user.resumes || user.resumes.length === 0) ? (
                <div className="p-10 text-center text-slate-500 space-y-3">
                  <FileText className="w-10 h-10 mx-auto text-slate-300" />
                  <h4 className="text-sm font-bold text-slate-700">No Resumes Uploaded Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Upload your PDF resume to parse technical skills and customize question difficulty automatically.
                  </p>
                </div>
              ) : (
                user.resumes.map((res, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-[#059669]" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{res.fileName}</h4>
                        <span className="text-xs text-slate-500">Uploaded {res.uploadedAt} • {res.detectedRole}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#059669] bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                      {res.extractedSkills.length} Skills Extracted
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Past Interview Evaluations</h3>
            <div className="space-y-3">
              {candidateReports.length === 0 ? (
                <div className="p-10 text-center text-slate-500 space-y-3">
                  <Trophy className="w-10 h-10 mx-auto text-slate-300" />
                  <h4 className="text-sm font-bold text-slate-700">No Completed Interviews Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Complete your first AI interview session to view evaluation reports and score breakdowns here.
                  </p>
                </div>
              ) : (
                candidateReports.map((rpt) => (
                  <div key={rpt.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{rpt.config.title}</h4>
                      <span className="text-xs text-slate-500">{new Date(rpt.createdAt).toLocaleDateString()} • Track: {rpt.config.track}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold text-[#059669]">{rpt.overallScore}%</span>
                      <Link
                        href={`/report/${rpt.id}`}
                        className="px-3 py-1.5 rounded-lg bg-white text-xs font-bold text-slate-800 border border-slate-200 shadow-sm flex items-center gap-1"
                      >
                        <span>Report</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Account & Privacy Settings</h3>
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Account Privacy</h4>
                  <span className="text-slate-500">Isolated candidate profile data (Not shared across users)</span>
                </div>
                <span className="text-[#059669] font-bold">Private</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Vision Proctoring Verification</h4>
                  <span className="text-slate-500">Enable face detection & eye gaze audit logs</span>
                </div>
                <span className="text-[#059669] font-bold">Enabled</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
