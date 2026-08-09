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

export default function InterviewSetupPage() {
  const router = useRouter();

  React.useEffect(() => {
    router.replace('/resume');
  }, [router]);

  const [interviewType, setInterviewType] = useState<'Technical' | 'HR' | 'System Design' | 'Coding' | 'Aptitude'>('HR');
  const [roleDomain, setRoleDomain] = useState('backend engineering');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'FAANG'>('Medium');
  const [topicsCount, setTopicsCount] = useState(3);
  const [tailorToResume, setTailorToResume] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<'form' | 'preparing' | 'connecting'>('form');

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationStep('preparing');

    // Simulate topic preparation loading sequence from video
    setTimeout(() => {
      setGenerationStep('connecting');
      setTimeout(() => {
        router.push('/interview/studio');
      }, 1500);
    }, 2000);
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
                  
                  {/* Interview Type */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      INTERVIEW TYPE
                    </label>
                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-white"
                    >
                      <option value="HR">HR</option>
                      <option value="Technical">Technical</option>
                      <option value="System Design">System Design</option>
                      <option value="Coding">Coding</option>
                      <option value="Aptitude">Aptitude</option>
                    </select>
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

                  {/* Difficulty & Topics Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        DIFFICULTY
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-white"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                        <option value="FAANG">FAANG</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        TOPICS
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={topicsCount}
                        onChange={(e) => setTopicsCount(parseInt(e.target.value) || 3)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#059669] focus:bg-white"
                      />
                    </div>
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
