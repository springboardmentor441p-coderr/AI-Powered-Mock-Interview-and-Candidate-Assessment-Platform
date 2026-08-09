'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { 
  CandidateApplication 
} from '../../types';
import { CandidateComparisonMatrix } from './CandidateComparisonMatrix';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  ExternalLink, 
  Award, 
  CheckSquare, 
  Square,
  Play
} from 'lucide-react';

export const CandidatePipelineTable: React.FC = () => {
  const { 
    candidateApplications, 
    selectedForComparison, 
    toggleSelectForComparison, 
    clearComparison 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [recommendationFilter, setRecommendationFilter] = useState('All Verdicts');
  const [showComparisonMatrix, setShowComparisonMatrix] = useState(false);

  const filtered = candidateApplications.filter((app) => {
    const matchesSearch = app.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.jobCampaignTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = recommendationFilter === 'All Verdicts' || app.recommendation === recommendationFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      
      {/* Top Controls Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidates by name, email, or campaign..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#059669]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={recommendationFilter}
              onChange={(e) => setRecommendationFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none"
            >
              <option value="All Verdicts">All Verdicts</option>
              <option value="Strong Hire">Strong Hire</option>
              <option value="Shortlist">Shortlist</option>
              <option value="Needs Review">Needs Review</option>
            </select>
          </div>

          {selectedForComparison.length > 0 && (
            <button
              onClick={() => setShowComparisonMatrix(true)}
              className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Award className="w-4 h-4" />
              <span>Compare Selected ({selectedForComparison.length})</span>
            </button>
          )}
        </div>

      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3 px-4 w-10">Compare</th>
                <th className="py-3 px-4">Candidate Details</th>
                <th className="py-3 px-4">Job Campaign</th>
                <th className="py-3 px-4">Overall Score</th>
                <th className="py-3 px-4">Proctoring Status</th>
                <th className="py-3 px-4">AI Hiring Verdict</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((app) => {
                const isSelected = selectedForComparison.some((item) => item.id === app.id);
                return (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Checkbox */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => toggleSelectForComparison(app)}
                        className="text-slate-400 hover:text-[#059669]"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#059669]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Candidate Info */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={app.candidateAvatar}
                          alt={app.candidateName}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{app.candidateName}</h4>
                          <span className="text-slate-500 text-[11px]">{app.candidateEmail}</span>
                        </div>
                      </div>
                    </td>

                    {/* Job Campaign */}
                    <td className="py-4 px-4 font-semibold text-slate-700">
                      {app.jobCampaignTitle}
                    </td>

                    {/* Overall Score */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-[#059669]">
                          {app.overallScore}%
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Tech: {app.technicalScore}%
                        </span>
                      </div>
                    </td>

                    {/* Proctoring */}
                    <td className="py-4 px-4">
                      {app.proctoringStatus === 'Clean' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#059669] font-bold border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified Clean
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                          <ShieldAlert className="w-3.5 h-3.5" /> Minor Warning
                        </span>
                      )}
                    </td>

                    {/* Verdict */}
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        app.recommendation === 'Strong Hire' 
                          ? 'bg-[#059669] text-white' 
                          : app.recommendation === 'Shortlist'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-800'
                      }`}>
                        {app.recommendation}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/report/${app.reportId}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#059669] border border-emerald-200 font-bold text-xs inline-flex items-center gap-1 transition-all"
                      >
                        <span>Full Report</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <h4 className="text-sm font-bold text-slate-700">No Candidate Applications Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                There are currently no active candidate applications submitted. As candidates apply to hiring campaigns or complete AI video interviews, their applications will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      {showComparisonMatrix && (
        <CandidateComparisonMatrix
          candidates={selectedForComparison}
          onClose={() => setShowComparisonMatrix(false)}
        />
      )}

    </div>
  );
};
