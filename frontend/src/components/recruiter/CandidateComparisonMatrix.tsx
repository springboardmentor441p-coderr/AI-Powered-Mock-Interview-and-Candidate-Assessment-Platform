'use client';

import React from 'react';
import { CandidateApplication } from '../../types';
import { X, CheckCircle2, AlertCircle, ShieldCheck, ShieldAlert, Award, FileText } from 'lucide-react';

interface ComparisonProps {
  candidates: CandidateApplication[];
  onClose: () => void;
}

export const CandidateComparisonMatrix: React.FC<ComparisonProps> = ({ candidates, onClose }) => {
  if (candidates.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Top Accent Line */}
        <div className="h-1.5 bg-[#059669]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Side-by-Side Candidate Ranking & Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Comparing {candidates.length} candidate screening results against engineering benchmark standards
              </p>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider">
                  <th className="p-4 bg-slate-100 w-48">Evaluation Metric</th>
                  {candidates.map((c) => (
                    <th key={c.id} className="p-4 text-center border-l border-slate-200">
                      <div className="flex flex-col items-center gap-1.5">
                        <img
                          src={c.candidateAvatar}
                          alt={c.candidateName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
                        />
                        <span className="font-bold text-slate-900 text-sm">{c.candidateName}</span>
                        <span className="text-[10px] text-slate-500">{c.candidateEmail}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                
                {/* Overall Score Row */}
                <tr>
                  <td className="p-4 font-bold bg-slate-50 text-slate-900">Overall Score</td>
                  {candidates.map((c) => (
                    <td key={c.id} className="p-4 text-center border-l border-slate-200 font-extrabold text-base text-[#059669]">
                      {c.overallScore}%
                    </td>
                  ))}
                </tr>

                {/* Technical Score */}
                <tr>
                  <td className="p-4 font-semibold bg-slate-50">Technical Depth</td>
                  {candidates.map((c) => (
                    <td key={c.id} className="p-4 text-center border-l border-slate-200 font-bold">
                      {c.technicalScore}%
                    </td>
                  ))}
                </tr>

                {/* Communication Score */}
                <tr>
                  <td className="p-4 font-semibold bg-slate-50">Communication & Fluency</td>
                  {candidates.map((c) => (
                    <td key={c.id} className="p-4 text-center border-l border-slate-200 font-bold">
                      {c.communicationScore}%
                    </td>
                  ))}
                </tr>

                {/* Behavioral Score */}
                <tr>
                  <td className="p-4 font-semibold bg-slate-50">STAR Behavioral Rating</td>
                  {candidates.map((c) => (
                    <td key={c.id} className="p-4 text-center border-l border-slate-200 font-bold">
                      {c.behavioralScore}%
                    </td>
                  ))}
                </tr>

                {/* Proctoring Status */}
                <tr>
                  <td className="p-4 font-semibold bg-slate-50">Vision Proctoring Integrity</td>
                  {candidates.map((c) => (
                    <td key={c.id} className="p-4 text-center border-l border-slate-200">
                      {c.proctoringStatus === 'Clean' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#059669] font-bold border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified Clean
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                          <ShieldAlert className="w-3.5 h-3.5" /> Minor Warnings
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Recommendation */}
                <tr>
                  <td className="p-4 font-bold bg-slate-50 text-slate-900">AI Hiring Verdict</td>
                  {candidates.map((c) => (
                    <td key={c.id} className="p-4 text-center border-l border-slate-200">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        c.recommendation === 'Strong Hire' 
                          ? 'bg-[#059669] text-white' 
                          : c.recommendation === 'Shortlist'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-800'
                      }`}>
                        {c.recommendation}
                      </span>
                    </td>
                  ))}
                </tr>

              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};
