'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudioSidebar } from '../../../components/layout/StudioSidebar';
import { useApp } from '../../../context/AppContext';
import { 
  Mic, 
  Sparkles, 
  Loader2, 
  Sliders, 
  Check, 
  FileText,
  AlertCircle
} from 'lucide-react';

import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { InterviewConfig } from '../../../types';

export default function InterviewSetupPage() {
  return (
    <ProtectedRoute allowedRoles={['candidate', 'recruiter', 'admin']}>
      <InterviewSetupPageContent />
    </ProtectedRoute>
  );
}

function InterviewSetupPageContent() {
  const router = useRouter();
  const { activeResume, setActiveConfig } = useApp();

  const interviewOptions = [
    'Technical',
    'HR',
    'Behavioral',
    'Managerial',
    'System Design',
    'Coding',
    'Custom'
  ] as const;

  const [interviewType, setInterviewType] = useState<'Technical' | 'HR' | 'Behavioral' | 'Managerial' | 'System Design' | 'Coding' | 'Custom'>('Technical');
  const [roleDomain, setRoleDomain] = useState(activeResume?.detectedRole || 'backend engineering');
  const [difficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'FAANG'>('Medium');
  const [tailorToResume, setTailorToResume] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'form' | 'preparing' | 'connecting'>('form');

  React.useEffect(() => {
    if (activeResume?.detectedRole) {
      setRoleDomain(activeResume.detectedRole);
    }
  }, [activeResume]);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationStep('preparing');

    const nextConfig: InterviewConfig = {
      id: `cfg-${Date.now()}`,
      title: `${interviewType} Interview${activeResume ? ' - Resume Tailored' : ''}`,
      track: interviewType,
      experienceLevel: (activeResume?.experienceYears && activeResume.experienceYears >= 5) ? 'Senior' : '3-5 Years',
      difficulty,
      durationMinutes: 30,
      persona: {
        id: 'alex-tech',
        name: 'Alex Vance',
        role: 'Principal Engineer & Tech Lead',
        avatar: '',
        description: 'Direct, analytical, and probes deeply into code architecture, data structures, and edge-cases.',
        accentColor: '#059669',
        voiceGender: 'male',
        tone: 'analytical'
      },
      preferredLanguage: 'English',
      enableProctoring: true,
      resumeSkillsUsed: tailorToResume ? activeResume?.extractedSkills || [] : [],
      customRoleTitle: roleDomain || undefined
    };

    setActiveConfig(nextConfig);

    setTimeout(() => {
      setGenerationStep('connecting');
      setTimeout(() => {
        router.push('/interview/studio');
      }, 1200);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      
      {/* Studio Sidebar */}
      <StudioSidebar />

      {/* Main Canvas Area */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {generationStep === 'form' ? (
            <>
              {/* Header */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#059669] text-[11px] font-bold border border-emerald-200 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Pre-Production</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Set up your interview
                </h1>
                <p className="text-xs text-slate-500">
                  A live, voice-driven session with an AI interviewer that adapts follow-ups to your answers.
                </p>
              </div>

              {/* Session details Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-enterprise-md space-y-6">
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-[#059669]" />
                  <h3 className="text-base font-extrabold text-slate-900">Session details</h3>
                </div>
                <p className="text-xs text-slate-500 -mt-4">
                  This shapes the topics and pacing of your interview.
                </p>

                <form onSubmit={handleCreateSession} className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Interview Type</span>
                      {activeResume && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                          Resume-linked
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {interviewOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setInterviewType(option)}
                          className={`rounded-xl border px-3 py-2 text-left text-[11px] font-bold transition-all ${
                            interviewType === option
                              ? 'border-[#059669] bg-emerald-50 text-[#059669] shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Role / Domain */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      ROLE / DOMAIN
                    </label>
                    <input
                      type="text"
                      required
                      value={roleDomain}
                      onChange={(e) => setRoleDomain(e.target.value)}
                      placeholder="e.g. Backend Engineering, Product Marketing"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-white"
                    />
                  </div>

                  {/* Tailor to my resume toggle */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">Tailor to my résumé</h4>
                      <p className="text-[11px] text-slate-500">Uses your primary résumé to personalize questions.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTailorToResume(!tailorToResume)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                        tailorToResume ? 'bg-[#059669]' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          tailorToResume ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* CTA Submit Button */}
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full py-4 rounded-2xl bg-[#059669] hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                  >
                    <Sparkles className="w-4 h-4 fill-white" />
                    <span>Create session & go live</span>
                  </button>

                </form>

              </div>
            </>
          ) : (
            /* Loading / Connecting Transition Screen */
            <div className="py-20 text-center space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-[#059669] animate-spin mx-auto" />

              <div className="space-y-2">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {generationStep === 'preparing' ? 'Preparing your interview topics...' : 'Connecting to the interviewer...'}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This usually takes a few seconds. We're generating tailored topics based on your role and résumé.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-[#059669] font-semibold flex items-center gap-2 text-left shadow-sm">
                <AlertCircle className="w-4 h-4 text-[#059669] shrink-0" />
                <span>Seed topics are being generated. Please wait a moment...</span>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
