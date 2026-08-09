'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Zap, 
  Code, 
  Users, 
  Layers, 
  Binary, 
  Globe,
  Play
} from 'lucide-react';
import { 
  InterviewTrack, 
  ExperienceLevel, 
  DifficultyLevel, 
  InterviewDuration,
  InterviewerPersona 
} from '../../types';
import { INTERVIEWER_PERSONAS } from '../../data/mockData';

export const InterviewConfigModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { setActiveConfig, activeResume } = useApp();

  const [track, setTrack] = useState<InterviewTrack>('Technical');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('3-5 Years');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Hard');
  const [durationMinutes, setDurationMinutes] = useState<InterviewDuration>(30);
  const [selectedPersona, setSelectedPersona] = useState<InterviewerPersona>(INTERVIEWER_PERSONAS[0]);
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [enableProctoring, setEnableProctoring] = useState(true);
  const [useResumeSkills, setUseResumeSkills] = useState(true);

  if (!isOpen) return null;

  const tracksList: { label: InterviewTrack; icon: any }[] = [
    { label: 'Technical', icon: Code },
    { label: 'HR', icon: Users },
    { label: 'System Design', icon: Layers },
    { label: 'Coding', icon: Binary },
    { label: 'Aptitude', icon: Zap },
    { label: 'Custom', icon: Sparkles }
  ];

  const handleStartInterview = () => {
    const newConfig = {
      id: `cfg-${Date.now()}`,
      title: `${experienceLevel} ${track} Round`,
      track,
      experienceLevel,
      difficulty,
      durationMinutes,
      persona: selectedPersona,
      preferredLanguage,
      enableProctoring,
      resumeSkillsUsed: (useResumeSkills && activeResume) ? activeResume.extractedSkills : []
    };

    setActiveConfig(newConfig);
    onClose();
    router.push('/interview/studio');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8">
        
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
          
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669]">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Configure AI Mock Interview
              </h3>
              <p className="text-xs text-slate-500">
                Customize track, difficulty, duration, interviewer persona, and vision proctoring
              </p>
            </div>
          </div>

          {/* 1. Track Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Select Interview Track
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {tracksList.map((t) => {
                const Icon = t.icon;
                const selected = track === t.label;
                return (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setTrack(t.label)}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all ${
                      selected 
                        ? 'bg-emerald-50 border-[#059669] text-[#059669] shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${selected ? 'text-[#059669]' : 'text-slate-400'}`} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Experience & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Experience Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Fresher', '1-3 Years', '3-5 Years', 'Senior'] as ExperienceLevel[]).map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => setExperienceLevel(exp)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      experienceLevel === exp 
                        ? 'bg-[#059669] border-[#059669] text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Difficulty Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Easy', 'Medium', 'Hard', 'FAANG'] as DifficultyLevel[]).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      difficulty === diff 
                        ? 'bg-[#059669] border-[#059669] text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* 3. Interviewer Persona */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              AI Interviewer Persona
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {INTERVIEWER_PERSONAS.map((p) => {
                const isSelected = selectedPersona.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPersona(p)}
                    className={`p-3 rounded-2xl border text-left flex flex-col items-center text-center space-y-2 transition-all ${
                      isSelected 
                        ? 'bg-emerald-50 border-[#059669] shadow-sm' 
                        : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30"
                    />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 leading-tight">{p.name}</h5>
                      <span className="text-[10px] text-slate-500">{p.role.split('&')[0]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Duration & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#059669]" />
                <span>Session Duration</span>
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value) as InterviewDuration)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#059669]"
              >
                <option value={10}>10 Minutes (Express Screening)</option>
                <option value={20}>20 Minutes (Standard Technical)</option>
                <option value={30}>30 Minutes (Deep System Design)</option>
                <option value={45}>45 Minutes (Full Loop Simulation)</option>
                <option value={60}>60 Minutes (FAANG Onsite)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#059669]" />
                <span>Interviewer Language</span>
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#059669]"
              >
                <option value="English">English Standard</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2 text-slate-800">
              <ShieldCheck className="w-4 h-4 text-[#059669]" />
              <span>Enable Vision & Tab Proctoring Anti-Cheating HUD</span>
            </div>
            <button
              type="button"
              onClick={() => setEnableProctoring(!enableProctoring)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                enableProctoring ? 'bg-[#059669]' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                enableProctoring ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Prominent Start Button */}
          <button
            onClick={handleStartInterview}
            className="w-full py-3.5 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Live AI Interview Studio</span>
          </button>

        </div>
      </div>
    </div>
  );
};
