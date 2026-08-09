'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { INTERVIEWER_PERSONAS } from '../../data/mockData';
import { InterviewTrack, ExperienceLevel, DifficultyLevel, InterviewerPersona } from '../../types';
import { X, Briefcase, Sparkles, Copy, CheckCircle2, Link as LinkIcon } from 'lucide-react';

export const JobCampaignModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addJobCampaign } = useApp();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Core Engineering');
  const [location, setLocation] = useState('San Francisco, CA (Hybrid)');
  const [track, setTrack] = useState<InterviewTrack>('Technical');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('3-5 Years');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Hard');
  const [passThresholdScore, setPassThresholdScore] = useState(80);
  const [assignedPersona, setAssignedPersona] = useState<InterviewerPersona>(INTERVIEWER_PERSONAS[0]);
  
  const [createdUrl, setCreatedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const campaignId = `cmp-${Date.now()}`;
    const generatedLink = `https://intervio.ai/assess/${campaignId}`;

    const newCampaign = {
      id: campaignId,
      title,
      department,
      location,
      track,
      experienceLevel,
      difficulty,
      passThresholdScore,
      assignedPersona,
      candidateCount: 0,
      assessmentUrl: generatedLink,
      status: 'Active' as const,
      createdAt: new Date().toISOString().split('T')[0]
    };

    addJobCampaign(newCampaign);
    setCreatedUrl(generatedLink);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(createdUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Top Accent Bar */}
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
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Create Interview Campaign & Link
              </h3>
              <p className="text-xs text-slate-500">
                Set role criteria, minimum passing score, and generate shareable candidate screening link
              </p>
            </div>
          </div>

          {!createdUrl ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Job Campaign Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior React Developer Screening Q3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#059669]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#059669]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#059669]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Interview Track
                  </label>
                  <select
                    value={track}
                    onChange={(e) => setTrack(e.target.value as InterviewTrack)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#059669]"
                  >
                    <option value="Technical">Technical</option>
                    <option value="HR">HR</option>
                    <option value="System Design">System Design</option>
                    <option value="Coding">Coding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Passing Threshold Score
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={95}
                    value={passThresholdScore}
                    onChange={(e) => setPassThresholdScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#059669]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all mt-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Assessment Campaign Link</span>
              </button>
            </form>
          ) : (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#059669] text-white mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Assessment Campaign Generated!</h4>
                <p className="text-xs text-slate-600 mt-1">Share this unique link with candidates to invite them to complete the AI video screening.</p>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800">
                <LinkIcon className="w-4 h-4 text-[#059669] shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={createdUrl}
                  className="w-full bg-transparent focus:outline-none text-xs"
                />
                <button
                  onClick={copyLink}
                  className="px-3 py-1.5 rounded-lg bg-[#059669] text-white text-xs font-bold shrink-0"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              <button
                onClick={() => { setCreatedUrl(''); onClose(); }}
                className="text-xs text-slate-600 hover:text-slate-900 underline font-semibold"
              >
                Done & Return to ATS Pipeline
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
