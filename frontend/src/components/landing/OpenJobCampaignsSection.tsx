'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  ArrowRight, 
  FileText, 
  Play, 
  CheckCircle2, 
  Sparkles,
  Building2,
  Filter
} from 'lucide-react';
import { JobCampaign } from '../../types';

export const OpenJobCampaignsSection: React.FC = () => {
  const { jobCampaigns, setIsAuthModalOpen, setAuthMode, loginAsDemoCandidate } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  const filters = ['All', 'Technical', 'System Design', 'HR'];

  const filteredCampaigns = selectedFilter === 'All' 
    ? jobCampaigns 
    : jobCampaigns.filter(job => job.track.toLowerCase() === selectedFilter.toLowerCase());

  const handleApply = (jobId: string) => {
    setApplyingJobId(jobId);
    setTimeout(() => {
      setAppliedJobs(prev => [...prev, jobId]);
      setApplyingJobId(null);
    }, 1000);
  };

  return (
    <section id="open-positions" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#059669] text-xs font-bold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Active Hiring Campaigns</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Explore Open Positions & Take AI Screening
          </h2>
          <p className="text-slate-600 text-base">
            Browse open positions from top enterprise hiring teams. Apply with your resume and complete your AI video interview directly on the platform.
          </p>

          {/* Filter Pills */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <Filter className="w-4 h-4 text-slate-400 mr-1" />
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedFilter === filter
                    ? 'bg-[#059669] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredCampaigns.map((job) => {
            const isApplied = appliedJobs.includes(job.id);
            const isApplying = applyingJobId === job.id;

            return (
              <div 
                key={job.id} 
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="px-3 py-1 rounded-md bg-emerald-50 text-[#059669] text-xs font-bold border border-emerald-200">
                      {job.track} Track
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {job.candidateCount} Applicants
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{job.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.department}</span>
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Experience: {job.experienceLevel}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col gap-2">
                  <Link
                    href="/interview/demo"
                    onClick={loginAsDemoCandidate}
                    className="w-full py-2.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Take AI Interview Screening</span>
                  </Link>

                  <button
                    onClick={() => handleApply(job.id)}
                    disabled={isApplied || isApplying}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      isApplied 
                        ? 'bg-emerald-50 text-[#059669] border border-emerald-200' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                        <span>Application Submitted</span>
                      </>
                    ) : isApplying ? (
                      <span>Submitting Application...</span>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>Apply with Resume</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
