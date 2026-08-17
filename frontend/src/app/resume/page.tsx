'use client';

import React, { useState } from 'react';
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
  FolderGit2,
  Code2,
  Wrench,
  Cpu,
  HeartHandshake,
  Award,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Download,
  Terminal,
  RefreshCw,
  FileCode,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

export default function ResumePage() {
  return (
    <ProtectedRoute allowedRoles={['candidate', 'recruiter', 'admin']}>
      <ResumePageContent />
    </ProtectedRoute>
  );
}

function ResumePageContent() {
  const router = useRouter();
  const { user, parseAndUploadResume, activeResume, setActiveResume, setActiveConfig } = useApp();

  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadProgressStep, setUploadProgressStep] = useState<string>('');
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'experience' | 'projects' | 'education' | 'audit' | 'raw'>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const userResumes = user?.resumes || [];

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploadStatus('uploading');
    setUploadErrorMessage(null);
    setUploadProgressStep('1/4 Extracting document text stream (PDF/DOCX)...');

    try {
      setTimeout(() => setUploadProgressStep('2/4 Identifying candidate contact & structural headers...'), 300);
      setTimeout(() => setUploadProgressStep('3/4 Categorizing 14 resume fields & technical skills...'), 600);
      setTimeout(() => setUploadProgressStep('4/4 Running data completeness & quality audit...'), 900);

      const parsed = await parseAndUploadResume(file);

      setTimeout(() => {
        setActiveResume(parsed);
        setUploadStatus('success');
        setUploadProgressStep('');
      }, 1200);
    } catch (e: any) {
      console.error('Resume Parsing Error:', e);
      setActiveResume(null);
      setUploadStatus('error');
      setUploadErrorMessage(e?.message || 'The uploaded document does not appear to be a valid resume. Please upload a resume in PDF or DOCX format.');
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExportJSON = (resume: ParsedResume) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resume, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `parsed_resume_${resume.candidateName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleStartInterview = (selectedRes?: ParsedResume) => {
    const targetResume = selectedRes || activeResume;
    if (!targetResume) return;

    setActiveResume(targetResume);

    const newConfig = {
      id: `cfg-${Date.now()}`,
      title: `${targetResume.detectedRole} Candidate Assessment`,
      track: 'Technical' as const,
      experienceLevel: '3-5 Years' as const,
      difficulty: 'Medium' as const,
      durationMinutes: 30 as const,
      persona: INTERVIEWER_PERSONAS[0],
      preferredLanguage: 'English',
      enableProctoring: true,
      resumeSkillsUsed: targetResume.extractedSkills
    };

    setActiveConfig(newConfig);
    router.push('/interview/setup');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      
      {/* Studio Sidebar */}
      <StudioSidebar />

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#059669] text-xs font-bold border border-emerald-200 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>InterVio Resume Parser Benchmark</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Candidate Resume Parsing & Intelligence Studio
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                Upload candidate resumes (PDF, DOCX, DOC) for accurate, resume-specific 14-field data extraction, completeness auditing, and AI candidate interview question generation.
              </p>
            </div>

            {activeResume && (
              <button
                type="button"
                onClick={() => handleStartInterview()}
                className="px-6 py-3 rounded-2xl bg-[#059669] hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-lg flex items-center gap-2 transition-all transform hover:-translate-y-0.5 shrink-0"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Launch AI Interview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Top Section: Upload Box & Active Candidate Quick Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Upload Box Container */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-[#059669]" />
                  <span>Upload Resume Document</span>
                </h2>
                <span className="text-[11px] font-bold text-slate-400 uppercase">PDF, DOCX, DOC, TXT</span>
              </div>

              {/* Drag & Drop Card */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all text-center space-y-4 cursor-pointer bg-white shadow-sm ${
                  uploadStatus === 'uploading'
                    ? 'border-emerald-400 bg-emerald-50/40'
                    : isDragging
                    ? 'border-[#059669] bg-emerald-50/60'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  id="resume-file-input"
                />

                <label htmlFor="resume-file-input" className="cursor-pointer block space-y-3">
                  {uploadStatus === 'uploading' ? (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#059669] border border-emerald-300 flex items-center justify-center mx-auto shadow-inner">
                      <Loader2 className="w-7 h-7 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {uploadStatus === 'uploading' 
                        ? 'Parsing Resume & Auditing Candidate Data...' 
                        : 'Drop your resume file here or click to browse'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports PDF, DOCX, DOC, or TXT (Max size 15MB)
                    </p>
                  </div>
                </label>

                {/* Processing Step Progress Bar */}
                {uploadStatus === 'uploading' && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-[#059669] space-y-1.5">
                    <div className="flex items-center justify-center gap-2 font-bold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{uploadProgressStep}</span>
                    </div>
                    <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#059669] h-full rounded-full animate-pulse w-3/4" />
                    </div>
                  </div>
                )}
              </div>

              {/* Diagnostic Error Banner */}
              {uploadStatus === 'error' && uploadErrorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-extrabold text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Resume Extraction Issue Detected</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {uploadErrorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadStatus('idle');
                      setUploadErrorMessage(null);
                    }}
                    className="inline-flex items-center gap-1.5 font-bold text-rose-700 hover:text-rose-900 underline pt-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Try uploading another file
                  </button>
                </div>
              )}

            </div>

            {/* Candidate Summary Quick Card */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#059669]" />
                  <span>Active Resume Profile</span>
                </h2>
                {activeResume && (
                  <span className="text-xs font-bold text-[#059669] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {activeResume.validation.completenessScore}% Completeness
                  </span>
                )}
              </div>

              {activeResume ? (
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">{activeResume.candidateName}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#059669] border border-emerald-200 text-[10px] font-extrabold uppercase">
                          {activeResume.detectedRole}
                        </span>
                        {activeResume.document_type && (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold uppercase flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            <span>{activeResume.document_type} ({Math.round((activeResume.confidence || 0.95) * 100)}%)</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        📄 {activeResume.fileName} ({activeResume.fileSizeFormatted || 'Parsed'})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExportJSON(activeResume)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                      title="Export Parsed Data as JSON"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">JSON</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 font-medium truncate">{activeResume.email}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 font-medium truncate">{activeResume.phone}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 font-medium truncate">{activeResume.experienceYears} Yrs Experience</span>
                    </div>
                  </div>

                  {/* Skills Summary Pill Preview */}
                  {activeResume.extractedSkills.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Extracted Skills Highlight:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeResume.extractedSkills.slice(0, 8).map((skill, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-[#059669] text-[10px] font-extrabold uppercase border border-emerald-200">
                            {skill}
                          </span>
                        ))}
                        {activeResume.extractedSkills.length > 8 && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold">
                            +{activeResume.extractedSkills.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Launch AI Interview Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleStartInterview()}
                      className="w-full py-3 rounded-2xl bg-[#059669] hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Personalized AI Candidate Assessment</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-800">No Resume Uploaded Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Upload a candidate resume on the left to extract skills, work history, projects, and trigger tailored interview generation.
                  </p>
                </div>
              )}

            </div>

          </div>

          {/* MAIN PARSED DETAILS RECRUITER INSPECTION PANEL */}
          {activeResume && (
            <div className="space-y-6 pt-4">
              
              {/* Tab Navigation Controls */}
              <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
                {[
                  { id: 'overview', label: 'Candidate Overview', icon: User, count: null },
                  { id: 'skills', label: '14-Field Skills Matrix', icon: Code2, count: activeResume.extractedSkills.length },
                  { id: 'experience', label: 'Work & Internships', icon: Briefcase, count: Math.max(activeResume.workExperience.length, activeResume.structuredWorkExperience?.length || 0) + Math.max(activeResume.internshipExperience.length, activeResume.structuredInternships?.length || 0) },
                  { id: 'projects', label: 'Projects & Portfolio', icon: FolderGit2, count: Math.max(activeResume.projects.length, activeResume.structuredProjects?.length || 0) },
                  { id: 'education', label: 'Education & Certs', icon: GraduationCap, count: Math.max(activeResume.education.length, activeResume.structuredEducation?.length || 0) + activeResume.certifications.length },
                  { id: 'audit', label: 'Data Quality Audit', icon: ShieldCheck, count: activeResume.validation.completenessScore + '%' },
                  { id: 'raw', label: 'Raw Extracted Text', icon: Terminal, count: null },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap border-b-2 ${
                        isActive
                          ? 'border-[#059669] text-[#059669] bg-emerald-50/50'
                          : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#059669]' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                      {tab.count !== null && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isActive ? 'bg-emerald-100 text-[#059669]' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Executive Summary */}
                  <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#059669]" />
                        <span>Professional Executive Summary</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleCopyText(activeResume.summary, 'summary')}
                        className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        {copiedField === 'summary' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'summary' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {activeResume.summary}
                    </p>

                    {/* Candidate Key Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Target Candidate Role</span>
                        <div className="text-xs font-extrabold text-slate-900">{activeResume.detectedRole}</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Experience Duration</span>
                        <div className="text-xs font-extrabold text-slate-900">{activeResume.experienceYears} Years Estimated</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Data Completeness Card */}
                  <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <ShieldCheck className="w-4 h-4 text-[#059669]" />
                      <span>Data Completeness Audit</span>
                    </h3>

                    <div className="text-center p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                      <div className="text-3xl font-extrabold text-[#059669]">
                        {activeResume.validation.completenessScore}%
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        {activeResume.validation.extractedFieldCount} of 14 Resume Fields Identified
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="font-bold text-slate-700">Extraction Verification:</div>
                      {activeResume.validation.checksPassed.map((chk, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-700 text-[11px] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{chk}</span>
                        </div>
                      ))}

                      {activeResume.validation.warnings.map((wrn, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-amber-700 text-[11px] font-medium bg-amber-50 p-2 rounded-xl border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{wrn}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SKILLS MATRIX */}
              {activeTab === 'skills' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Categorized Technical & Soft Skills</h3>
                      <p className="text-xs text-slate-500">Verified evidence-based skill extraction from uploaded document.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-[#059669] text-xs font-bold border border-emerald-200">
                      {activeResume.extractedSkills.length} Total Verified Extracted
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Programming Languages */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                          <Code2 className="w-4 h-4 text-[#059669]" />
                          <span>Programming Languages ({activeResume.programmingLanguages.length})</span>
                        </div>
                      </div>
                      {activeResume.programmingLanguages.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {activeResume.programmingLanguages.map((lang, idx) => (
                            <span key={idx} className="group relative px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold border border-slate-200 shadow-2xs cursor-help">
                              {lang}
                              {activeResume.evidenceMap?.[lang] && (
                                <span className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl z-50 pointer-events-none">
                                  <span className="font-bold text-emerald-400 block mb-0.5">Evidence Snippet:</span>
                                  "{activeResume.evidenceMap[lang]}"
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No specific programming languages detected.</p>
                      )}
                    </div>

                    {/* Frameworks & Libraries */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                          <Cpu className="w-4 h-4 text-[#059669]" />
                          <span>Frameworks & Technical Stack ({activeResume.technicalSkills.length})</span>
                        </div>
                      </div>
                      {activeResume.technicalSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {activeResume.technicalSkills.map((tech, idx) => (
                            <span key={idx} className="group relative px-3 py-1.5 rounded-xl bg-emerald-50 text-[#059669] text-xs font-extrabold border border-emerald-200 cursor-help">
                              {tech}
                              {activeResume.evidenceMap?.[tech] && (
                                <span className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl z-50 pointer-events-none">
                                  <span className="font-bold text-emerald-400 block mb-0.5">Evidence Snippet:</span>
                                  "{activeResume.evidenceMap[tech]}"
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No specific technical frameworks detected.</p>
                      )}
                    </div>

                    {/* Tools & DevOps */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                          <Wrench className="w-4 h-4 text-[#059669]" />
                          <span>Tools, DevOps & Cloud ({activeResume.toolsAndTechnologies.length})</span>
                        </div>
                      </div>
                      {activeResume.toolsAndTechnologies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {activeResume.toolsAndTechnologies.map((tool, idx) => (
                            <span key={idx} className="group relative px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold border border-slate-200 shadow-2xs cursor-help">
                              {tool}
                              {activeResume.evidenceMap?.[tool] && (
                                <span className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-64 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl z-50 pointer-events-none">
                                  <span className="font-bold text-emerald-400 block mb-0.5">Evidence Snippet:</span>
                                  "{activeResume.evidenceMap[tool]}"
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No specific tools & technologies detected.</p>
                      )}
                    </div>

                    {/* Soft Skills */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                          <HeartHandshake className="w-4 h-4 text-[#059669]" />
                          <span>Soft Skills & Leadership ({activeResume.softSkills.length})</span>
                        </div>
                      </div>
                      {activeResume.softSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {activeResume.softSkills.map((soft, idx) => (
                            <span key={idx} className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                              {soft}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No soft skills detected.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: WORK & INTERNSHIP EXPERIENCE */}
              {activeTab === 'experience' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-base font-extrabold text-slate-900">Work & Internship History</h3>
                    <p className="text-xs text-slate-500">Timeline of professional employment and internships extracted from resume.</p>
                  </div>

                  {/* Work Experience */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#059669]" />
                      <span>Full-Time Work Experience</span>
                    </h4>

                    {activeResume.structuredWorkExperience && activeResume.structuredWorkExperience.length > 0 ? (
                      <div className="space-y-4">
                        {activeResume.structuredWorkExperience.map((exp, idx) => (
                          <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                              <h5 className="text-sm font-extrabold text-slate-900">{exp.role}</h5>
                              {exp.duration && (
                                <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                                  {exp.duration}
                                </span>
                              )}
                            </div>
                            {exp.company && <div className="text-xs font-bold text-[#059669]">{exp.company}</div>}
                            {exp.description.length > 0 && (
                              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pt-1">
                                {exp.description.map((bullet, bIdx) => (
                                  <li key={bIdx}>{bullet}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : activeResume.workExperience.length > 0 ? (
                      <div className="space-y-2">
                        {activeResume.workExperience.map((expStr, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                            • {expStr}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        No full-time work experience section detected in resume.
                      </p>
                    )}
                  </div>

                  {/* Internship Experience */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#059669]" />
                      <span>Internship Experience</span>
                    </h4>

                    {activeResume.structuredInternships && activeResume.structuredInternships.length > 0 ? (
                      <div className="space-y-4">
                        {activeResume.structuredInternships.map((intern, idx) => (
                          <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                              <h5 className="text-sm font-extrabold text-slate-900">{intern.role}</h5>
                              {intern.duration && (
                                <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                                  {intern.duration}
                                </span>
                              )}
                            </div>
                            {intern.company && <div className="text-xs font-bold text-[#059669]">{intern.company}</div>}
                            {intern.description.length > 0 && (
                              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pt-1">
                                {intern.description.map((bullet, bIdx) => (
                                  <li key={bIdx}>{bullet}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : activeResume.internshipExperience.length > 0 ? (
                      <div className="space-y-2">
                        {activeResume.internshipExperience.map((internStr, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                            • {internStr}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        No specific internship experience section detected.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: PROJECTS */}
              {activeTab === 'projects' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-base font-extrabold text-slate-900">Projects & Portfolio</h3>
                    <p className="text-xs text-slate-500">Key technical projects and applications extracted from candidate resume.</p>
                  </div>

                  {activeResume.structuredProjects && activeResume.structuredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeResume.structuredProjects.map((proj, idx) => (
                        <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                            <FolderGit2 className="w-4 h-4 text-[#059669]" />
                            <span>{proj.title}</span>
                          </h4>

                          {proj.techStack && proj.techStack.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {proj.techStack.map((tech, tIdx) => (
                                <span key={tIdx} className="px-2 py-0.5 rounded-md bg-emerald-100 text-[#059669] text-[10px] font-extrabold uppercase">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="text-xs text-slate-700 leading-relaxed">
                            {proj.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : activeResume.projects.length > 0 ? (
                    <div className="space-y-3">
                      {activeResume.projects.map((projStr, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-start gap-2">
                          <FolderGit2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                          <span>{projStr}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      No explicit projects section detected in resume.
                    </p>
                  )}
                </div>
              )}

              {/* TAB 5: EDUCATION & CERTS */}
              {activeTab === 'education' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-base font-extrabold text-slate-900">Education, Certifications & Achievements</h3>
                    <p className="text-xs text-slate-500">Academic credentials and certifications extracted from resume.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Education Section */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#059669]" />
                        <span>Academic Education ({Math.max(activeResume.education.length, activeResume.structuredEducation?.length || 0)})</span>
                      </h4>

                      {activeResume.structuredEducation && activeResume.structuredEducation.length > 0 ? (
                        <div className="space-y-3">
                          {activeResume.structuredEducation.map((edu, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                              <div className="flex justify-between items-center">
                                <h5 className="text-xs font-extrabold text-slate-900">🎓 {edu.degree}</h5>
                                {edu.year && <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{edu.year}</span>}
                              </div>
                              {edu.institution && <p className="text-xs font-bold text-[#059669]">{edu.institution}</p>}
                            </div>
                          ))}
                        </div>
                      ) : activeResume.education.length > 0 ? (
                        <div className="space-y-3">
                          {activeResume.education.map((eduStr, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
                              🎓 {eduStr}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No academic degrees explicitly listed.</p>
                      )}
                    </div>

                    {/* Certifications & Achievements */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#059669]" />
                        <span>Certifications & Achievements</span>
                      </h4>

                      {activeResume.certifications.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Certifications:</span>
                          {activeResume.certifications.map((cert, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#059669]">
                              🏆 {cert}
                            </div>
                          ))}
                        </div>
                      )}

                      {activeResume.achievements.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Key Achievements:</span>
                          {activeResume.achievements.map((ach, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800">
                              ⭐ {ach}
                            </div>
                          ))}
                        </div>
                      )}

                      {activeResume.certifications.length === 0 && activeResume.achievements.length === 0 && (
                        <p className="text-xs text-slate-400 italic">No specific certifications or achievements listed.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: DATA QUALITY AUDIT */}
              {activeTab === 'audit' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-base font-extrabold text-slate-900">Data Extraction Audit & Quality Score</h3>
                    <p className="text-xs text-slate-500">Validation verification checks performed on candidate resume.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                      <div className="text-2xl font-extrabold text-[#059669]">
                        {activeResume.validation.completenessScore}%
                      </div>
                      <div className="text-xs font-bold text-slate-700">Overall Data Quality Score</div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-2xl font-extrabold text-slate-900">
                        {activeResume.validation.extractedFieldCount} / 14
                      </div>
                      <div className="text-xs font-bold text-slate-700">Fields Successfully Populated</div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="text-2xl font-extrabold text-slate-900">
                        {activeResume.validation.warnings.length}
                      </div>
                      <div className="text-xs font-bold text-slate-700">Audit Warnings</div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Passed Verification Checks:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeResume.validation.checksPassed.map((chk, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{chk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: RAW TEXT VIEWER */}
              {activeTab === 'raw' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Extracted Document Raw Text</h3>
                      <p className="text-xs text-slate-500">Unfiltered raw text extracted from PDF or DOCX binary stream.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(activeResume.rawText || '', 'raw')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      {copiedField === 'raw' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'raw' ? 'Copied Raw Text' : 'Copy Raw Text'}</span>
                    </button>
                  </div>

                  <pre className="p-5 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-96 whitespace-pre-wrap leading-relaxed">
                    {activeResume.rawText || 'No raw text stored.'}
                  </pre>
                </div>
              )}

            </div>
          )}

        </div>
      </main>

    </div>
  );
}
