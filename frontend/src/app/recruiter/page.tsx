'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CandidatePipelineTable } from '../../components/recruiter/CandidatePipelineTable';
import { JobCampaignModal } from '../../components/recruiter/JobCampaignModal';
import { 
  Building2, 
  Users, 
  Briefcase, 
  Plus, 
  CheckCircle2, 
  Award, 
  ShieldCheck, 
  Copy,
  ExternalLink
} from 'lucide-react';

export default function RecruiterPage() {
  const { user, jobCampaigns, candidateApplications } = useApp();
  const [activeTab, setActiveTab] = useState<'applicants' | 'campaigns'>('applicants');
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  const shortlistedCount = candidateApplications.filter(a => a.recommendation === 'Strong Hire' || a.recommendation === 'Shortlist').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight">Recruiter ATS Screening Hub</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#059669] text-xs font-bold border border-emerald-200">
                Enterprise Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage hiring campaigns, screen applicants with AI video interviews, and compare shortlisted candidates
            </p>
          </div>

          <button
            onClick={() => setIsCampaignModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Job Campaign</span>
          </button>
        </div>

        {/* Recruiter Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Campaigns</span>
            <p className="text-2xl font-extrabold text-slate-900">{jobCampaigns.length}</p>
            <span className="text-[11px] text-[#059669] font-semibold">Across Engineering & Product</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Applicants Screened</span>
            <p className="text-2xl font-extrabold text-slate-900">{candidateApplications.length}</p>
            <span className="text-[11px] text-[#059669] font-semibold">Automated AI Video Rounds</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Shortlisted Candidates</span>
            <p className="text-2xl font-extrabold text-[#059669]">{shortlistedCount}</p>
            <span className="text-[11px] text-slate-500 font-semibold">Recommended for Onsite</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vision Proctoring Integrity</span>
            <p className="text-2xl font-extrabold text-slate-900">98.2%</p>
            <span className="text-[11px] text-[#059669] font-semibold">Verified Malpractice Clean</span>
          </div>

        </div>

        {/* Tab Selector */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 text-xs font-bold max-w-md">
          <button
            onClick={() => setActiveTab('applicants')}
            className={`flex-1 py-2.5 text-center rounded-xl transition-all ${
              activeTab === 'applicants' ? 'bg-[#059669] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Applicant Pipeline ({candidateApplications.length})
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex-1 py-2.5 text-center rounded-xl transition-all ${
              activeTab === 'campaigns' ? 'bg-[#059669] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Job Campaigns ({jobCampaigns.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'applicants' ? (
          <CandidatePipelineTable />
        ) : (
          <div className="space-y-4">
            {jobCampaigns.map((c) => (
              <div key={c.id} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#059669]">{c.department}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-semibold">{c.location}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                    <span>Track: {c.track}</span>
                    <span>•</span>
                    <span>Persona: {c.assignedPersona.name}</span>
                    <span>•</span>
                    <span>Passing Threshold: {c.passThresholdScore}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    {c.candidateCount} Applicants
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(c.assessmentUrl);
                      alert(`Assessment URL copied: ${c.assessmentUrl}`);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#059669] border border-emerald-200 text-xs font-bold transition-all"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <JobCampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
      />
    </div>
  );
}
