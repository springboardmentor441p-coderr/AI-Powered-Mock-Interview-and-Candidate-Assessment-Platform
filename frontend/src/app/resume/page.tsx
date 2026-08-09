'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudioSidebar } from '../../components/layout/StudioSidebar';
import { useApp } from '../../context/AppContext';
import { INTERVIEWER_PERSONAS } from '../../data/mockData';
import { ParsedResume } from '../../types';
import { 
  FileText, 
  UploadCloud, 
  Star, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Play,
  Lock,
  Unlock,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  FolderGit2
} from 'lucide-react';

export default function ResumePage() {
  const router = useRouter();
  const { user, parseAndUploadResume, activeResume, setActiveResume, setActiveConfig } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const userResumes = user?.resumes || [];

  // Strictly enforce that Step 2 is ONLY unlocked if a fresh resume is active for this session
  const hasResumeUploaded = Boolean(activeResume);
  const activeResumeItem = activeResume;

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploadStatus('uploading');
    setUploadMessage('Parsing résumé content & extracting technical skills...');
    try {
      const parsed = await parseAndUploadResume(file);
      setActiveResume(parsed);
      setUploadStatus('success');
      setUploadMessage(`Successfully parsed "${parsed.fileName}"! Extracted ${parsed.extractedSkills.length} unique skill(s) & detected role "${parsed.detectedRole}".`);
    } catch (e) {
      console.error(e);
      setUploadStatus('error');
      setUploadMessage('Failed to parse file. Please upload a valid PDF, DOC, or DOCX resume.');
    }
  };

  const handleStartInterview = (selectedRes?: ParsedResume) => {
    const targetResume = selectedRes || activeResume;
    if (!targetResume) return;

    setActiveResume(targetResume);

    const newConfig = {
      id: `cfg-${Date.now()}`,
      title: targetResume.detectedRole ? `${targetResume.detectedRole} AI Interview` : 'Technical AI Screening',
      track: 'Technical' as const,
      experienceLevel: '3-5 Years' as const,
      difficulty: 'Medium' as const,
      durationMinutes: 30 as const,
      persona: INTERVIEWER_PERSONAS[0],
      preferredLanguage: 'English',
      enableProctoring: true,
      resumeSkillsUsed: targetResume.extractedSkills || ['FULL-STACK DEVELOPMENT', 'API DESIGN', 'SYSTEM DESIGN']
    };

    setActiveConfig(newConfig);
    router.push('/interview/studio');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      
      {/* Studio Sidebar */}
      <StudioSidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header Banner */}
          <div className="space-y-2 border-b border-slate-200 pb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#059669] text-[11px] font-bold border border-emerald-200 uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Candidate Workflow</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Résumé Upload & Dynamic Skill Extractor
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Upload your résumé below. Our dynamic parser extracts candidate contact details, programming languages, technologies, and technical skills specific to your file content.
            </p>
          </div>

          {/* Sequential 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Resume Upload Section */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Step Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center">
                    1
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Upload Your Résumé
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Required First Step
                </span>
              </div>

              {/* Upload Drop Zone Card */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                className={`p-8 sm:p-10 rounded-3xl border-2 border-dashed transition-all text-center space-y-4 cursor-pointer bg-white shadow-enterprise-md ${
                  uploadStatus === 'uploading'
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : uploadStatus === 'success' || hasResumeUploaded
                    ? 'border-emerald-500 bg-emerald-50/20'
                    : isDragging
                    ? 'border-[#059669] bg-emerald-50/50'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  id="resume-upload-input"
                />
                
                <label htmlFor="resume-upload-input" className="cursor-pointer block space-y-3">
                  {uploadStatus === 'uploading' ? (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                      <Loader2 className="w-7 h-7 animate-spin" />
                    </div>
                  ) : hasResumeUploaded ? (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {uploadStatus === 'uploading' 
                        ? 'Extracting Text & Parsing Candidate Skills...' 
                        : hasResumeUploaded
                        ? 'Upload a New or Updated Résumé'
                        : 'Upload a New or Updated Résumé'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports PDF, DOC, DOCX, or TXT — or click to browse files
                    </p>
                  </div>
                </label>

                {/* Upload Status Banner */}
                {uploadMessage && (
                  <div
                    className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      uploadStatus === 'uploading'
                        ? 'bg-slate-100 text-slate-800 border border-slate-200'
                        : uploadStatus === 'success'
                        ? 'bg-emerald-50 text-[#059669] border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {uploadStatus === 'uploading' && <Loader2 className="w-4 h-4 animate-spin shrink-0 text-slate-700" />}
                    {uploadStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-[#059669]" />}
                    {uploadStatus === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                    <span>{uploadMessage}</span>
                  </div>
                )}
              </div>

              {/* Past Uploaded Resumes Reference List */}
              {userResumes.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Uploaded Résumé Archives ({userResumes.length})
                  </h3>

                  {userResumes.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center shrink-0 shadow-sm">
                            <FileText className="w-4 h-4" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-extrabold text-slate-900">{res.fileName}</h4>
                              {res.isPrimary || idx === 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#059669] text-[9px] font-bold border border-emerald-200 uppercase">
                                  <Star className="w-2.5 h-2.5 fill-[#059669]" /> Primary
                                </span>
                              ) : null}
                            </div>
                            <span className="text-[11px] text-slate-500">
                              Uploaded {res.uploadedAt} · Detected Role: <strong className="text-slate-800">{res.detectedRole}</strong> ({res.experienceYears} yrs exp)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Candidate Contact & Extracted Skills Details */}
                      <div className="space-y-2 text-xs">
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                          <span className="flex items-center gap-1 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {res.candidateName || 'Not Available'}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {res.email || 'Not Available'}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {res.phone || 'Not Available'}
                          </span>
                        </div>

                        {/* Extracted Skills Pills */}
                        {res.extractedSkills && res.extractedSkills.length > 0 ? (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Extracted Skills & Technologies:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {res.extractedSkills.map((skill, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-[#059669] text-[10px] font-extrabold uppercase border border-emerald-200"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No specific technical skills extracted.</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: Start Interview Section */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Step Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl font-extrabold text-xs flex items-center justify-center transition-all ${
                    hasResumeUploaded ? 'bg-[#059669] text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                  }`}>
                    2
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Start AI Candidate Interview
                  </h2>
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  hasResumeUploaded ? 'text-[#059669]' : 'text-slate-400'
                }`}>
                  {hasResumeUploaded ? 'Unlocked & Ready' : 'Locked'}
                </span>
              </div>

              {/* Start Interview Panel Card */}
              <div className={`p-6 sm:p-8 rounded-3xl border transition-all space-y-6 bg-white shadow-enterprise-md ${
                hasResumeUploaded
                  ? 'border-emerald-200 ring-2 ring-emerald-500/10'
                  : 'border-slate-200 bg-slate-50/50'
              }`}>
                
                {/* Visual Status Indicator Banner */}
                {hasResumeUploaded ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 text-[#059669]">
                      <Unlock className="w-5 h-5" />
                      <span className="text-xs font-extrabold uppercase tracking-wide">
                        Step 2 Unlocked — Résumé Validated
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Your résumé has been processed and parsed. Click below to launch your live, voice-driven AI interview session based on your extracted skills.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Lock className="w-5 h-5 text-slate-500" />
                      <span className="text-xs font-extrabold uppercase tracking-wide">
                        Action Required: Upload Résumé
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Please upload your résumé on the left side of this page. The Start Interview button will activate automatically once your file is processed.
                    </p>
                  </div>
                )}

                {/* Resume Context Summary (When Unlocked) */}
                {hasResumeUploaded && activeResumeItem && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="text-slate-500 uppercase text-[10px] tracking-wider">Active Session Résumé</span>
                      <span className="text-[#059669] font-extrabold">{activeResumeItem.extractedSkills?.length || 0} Skills Extracted</span>
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      📄 {activeResumeItem.fileName}
                    </div>
                    <div className="text-[11px] text-slate-600 font-semibold space-y-1">
                      <div>Role: <span className="text-slate-900 font-extrabold">{activeResumeItem.detectedRole || 'Software Engineer'}</span></div>
                      <div>Candidate: <span className="text-slate-800">{activeResumeItem.candidateName || 'Not Available'}</span></div>
                    </div>

                    {/* Extracted Skills Pills Preview */}
                    {activeResumeItem.extractedSkills && activeResumeItem.extractedSkills.length > 0 && (
                      <div className="pt-1">
                        <div className="flex flex-wrap gap-1">
                          {activeResumeItem.extractedSkills.map((skill, sIdx) => (
                            <span key={sIdx} className="px-2 py-0.5 rounded bg-emerald-100/80 text-[#059669] text-[9px] font-extrabold uppercase border border-emerald-200">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sequential Workflow Checklist */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 font-semibold text-slate-700">
                    {hasResumeUploaded ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-[10px] shrink-0">
                        1
                      </div>
                    )}
                    <span className={hasResumeUploaded ? 'text-slate-900 font-bold' : 'text-slate-500'}>
                      1. Upload valid résumé (PDF/DOC)
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 font-semibold text-slate-700">
                    {hasResumeUploaded ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">
                        🔒
                      </div>
                    )}
                    <span className={hasResumeUploaded ? 'text-slate-900 font-bold' : 'text-slate-400'}>
                      2. Unlock AI Interview Session
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 font-semibold text-slate-700">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      hasResumeUploaded ? 'bg-emerald-500 text-white animate-pulse' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {hasResumeUploaded ? '⚡' : '🔒'}
                    </div>
                    <span className={hasResumeUploaded ? 'text-[#059669] font-bold' : 'text-slate-400'}>
                      3. Launch Voice AI Interview Page
                    </span>
                  </div>
                </div>

                {/* THE START INTERVIEW BUTTON (Disabled vs Active) */}
                <div>
                  {hasResumeUploaded ? (
                    <button
                      type="button"
                      onClick={() => handleStartInterview()}
                      className="w-full py-4 rounded-2xl bg-[#059669] hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 ring-4 ring-emerald-500/20"
                    >
                      <Play className="w-5 h-5 fill-white animate-pulse" />
                      <span>Start AI Interview Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-4 rounded-2xl bg-slate-200 text-slate-400 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed border border-slate-300 opacity-70 shadow-none"
                    >
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Start AI Interview (Upload Resume First)</span>
                    </button>
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>
      </main>

    </div>
  );
}
