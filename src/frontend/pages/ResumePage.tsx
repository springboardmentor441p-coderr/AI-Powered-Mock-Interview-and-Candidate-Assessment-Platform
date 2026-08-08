import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { ResumeAnalysis, ResumeStatus } from '../../types';
import { resumeService, formatFileSize } from '../services/resumeService';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  FileCheck,
  ArrowLeft,
  Trash2,
  ArrowRight,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Award,
  Mail,
  Phone,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const ResumePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<ResumeStatus>('Uploaded');

  // Load saved analysis on initial render (async from Firestore database or local cache)
  useEffect(() => {
    let isMounted = true;
    const loadAnalysis = async () => {
      const saved = await resumeService.getSavedAnalysisAsync();
      if (saved && isMounted) {
        setAnalysis(saved);
        setStatus(saved.status || 'Successfully analyzed');
        if (saved.detectedRole) {
          setTargetRole(saved.detectedRole);
        }
      }
    };
    loadAnalysis();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle PDF file processing
  const processFile = async (file: File) => {
    setErrorMessage(null);

    // Validate PDF
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) {
      setErrorMessage('Invalid file type. Please upload a PDF document (.pdf).');
      setStatus('Failed');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    setStatus('Processing');

    try {
      const result = await resumeService.processAndAnalyzeResume(file, targetRole);
      setAnalysis(result);
      setStatus('Successfully analyzed');
    } catch (err: any) {
      console.error('Resume processing error:', err);
      setErrorMessage(err.message || 'Failed to extract text from PDF. Please upload a clear text-based PDF.');
      setStatus('Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setErrorMessage(null);
    setStatus('Uploaded');
    resumeService.clearSavedAnalysis();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRoleChange = (newRole: string) => {
    setTargetRole(newRole);
    if (selectedFile) {
      processFile(selectedFile);
    } else if (analysis && analysis.rawText) {
      // Re-analyze existing parsed text with new target role
      const reAnalyzed = resumeService.getSavedAnalysis();
      if (reAnalyzed) {
        reAnalyzed.detectedRole = newRole;
        resumeService.saveAnalysis(reAnalyzed);
        setAnalysis({ ...reAnalyzed });
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs group shrink-0"
              title="Go Back"
            >
              <ArrowLeft className="h-4 w-4 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Step 1 of 3</span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-indigo-600 font-semibold">Resume Intelligence</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resume ATS Analyzer & Skill Extractor</h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {analysis && (
              <Button
                variant="primary"
                onClick={() => navigate('/interview/setup')}
                icon={<ArrowRight className="h-4 w-4" />}
              >
                Continue to Interview Setup
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column (4 Cols): Upload PDF Box & Target Configuration */}
          <div className="lg:col-span-4 space-y-6">
            <Card title="Upload Resume PDF" subtitle="Select or drag a text-based PDF document">
              <div className="space-y-4">
                {/* Target Role Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Job Profile</label>
                  <select
                    value={targetRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={isProcessing}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <option value="Senior Full Stack Engineer">Senior Full Stack Engineer</option>
                    <option value="Frontend React Specialist">Frontend React Specialist</option>
                    <option value="Backend Node.js Architect">Backend Node.js Architect</option>
                    <option value="Data Science & AI Engineer">Data Science & AI Engineer</option>
                    <option value="Engineering Manager / Tech Lead">Engineering Manager / Tech Lead</option>
                  </select>
                </div>

                {/* Hidden Native File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer group ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50/60'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-300'
                  }`}
                >
                  <div className="p-3.5 bg-white rounded-2xl shadow-xs w-fit mx-auto mb-3 border border-slate-100 group-hover:scale-105 transition-transform">
                    {isProcessing ? (
                      <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
                    ) : (
                      <Upload className="h-7 w-7 text-indigo-600" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {isProcessing ? 'Processing PDF Document...' : 'Drag and drop PDF resume here'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">or click to browse from local computer (.PDF)</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 shadow-2xs group-hover:border-indigo-200">
                    Browse File
                  </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{errorMessage}</span>
                  </div>
                )}

                {/* Selected File Card with Options */}
                {(selectedFile || analysis) && (
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0">
                          <FileCheck className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {selectedFile?.name || analysis?.fileName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {selectedFile ? formatFileSize(selectedFile.size) : analysis?.fileSize || 'PDF Document'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                        title="Remove PDF"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-indigo-100 text-[11px]">
                      <span className="text-slate-500 font-medium">Status</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md ${
                          status === 'Successfully analyzed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : status === 'Processing'
                            ? 'bg-amber-100 text-amber-800'
                            : status === 'Failed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* ATS Match & Format Progress Metrics */}
            {analysis && (
              <Card title="ATS Score Benchmark" subtitle={`Evaluated against ${targetRole}`}>
                <div className="space-y-4">
                  <ProgressBar
                    label="Target Role Match Score"
                    value={analysis.matchScore}
                    color="indigo"
                    size="lg"
                  />
                  <ProgressBar
                    label="Format & Structure Score"
                    value={analysis.formattingScore}
                    color="emerald"
                    size="lg"
                  />
                  <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <span>Candidate resume parsed into local dev state</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column (8 Cols): Extracted Resume Summary */}
          <div className="lg:col-span-8 space-y-6">
            {isProcessing ? (
              <Card>
                <div className="p-12 text-center space-y-4">
                  <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Parsing PDF & Extracting Technical Skills</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Reading candidate document streams, identifying technical stacks, education, and professional projects...
                    </p>
                  </div>
                </div>
              </Card>
            ) : analysis ? (
              <>
                {/* Candidate Overview Card */}
                <Card title="Parsed Candidate Profile" subtitle="Extracted directly from uploaded PDF">
                  <div className="grid md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Candidate Name</p>
                        <p className="font-bold text-slate-900">{analysis.parsedName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Email Address</p>
                        <p className="font-semibold text-slate-800 truncate">{analysis.parsedEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-violet-100 text-violet-700 rounded-lg shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Phone Number</p>
                        <p className="font-semibold text-slate-800">{analysis.parsedPhone || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Extracted Technical Skills Tags */}
                <Card
                  title={`Detected Technical Competencies (${analysis.parsedSkills.length})`}
                  subtitle="Common technologies and frameworks identified"
                >
                  <div className="flex flex-wrap gap-2">
                    {analysis.parsedSkills.map((skill, idx) => (
                      <Badge key={idx} variant="technical" size="md">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card>

                {/* Sections: Experience & Projects */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Experience */}
                  <Card title="Work Experience" subtitle="Extracted career history">
                    <div className="space-y-2.5">
                      {analysis.experience && analysis.experience.length > 0 ? (
                        analysis.experience.map((expLine, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <Briefcase className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                            <span className="text-slate-800 font-medium leading-relaxed">{expLine}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No explicit experience entries detected</p>
                      )}
                    </div>
                  </Card>

                  {/* Projects */}
                  <Card title="Technical Projects" subtitle="Extracted project highlights">
                    <div className="space-y-2.5">
                      {analysis.projects && analysis.projects.length > 0 ? (
                        analysis.projects.map((projLine, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <FolderGit2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-slate-800 font-medium leading-relaxed">{projLine}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No explicit project entries detected</p>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Sections: Education & Certifications */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Education */}
                  <Card title="Education & Academic Background" subtitle="Extracted degrees & institutions">
                    <div className="space-y-2.5">
                      {analysis.education && analysis.education.length > 0 ? (
                        analysis.education.map((eduLine, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <GraduationCap className="h-4 w-4 text-violet-600 shrink-0 mt-0.5" />
                            <span className="text-slate-800 font-medium leading-relaxed">{eduLine}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No explicit education entries detected</p>
                      )}
                    </div>
                  </Card>

                  {/* Certifications */}
                  <Card title="Certifications & Training" subtitle="Extracted technical certifications">
                    <div className="space-y-2.5">
                      {analysis.certifications && analysis.certifications.length > 0 ? (
                        analysis.certifications.map((certLine, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <Award className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <span className="text-slate-800 font-medium leading-relaxed">{certLine}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-100">
                          No external certifications detected in document.
                        </p>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Missing Keywords & AI Recommendations */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card title="Recommended Target Keywords" subtitle="Additional keywords for high ATS ranking">
                    <div className="flex flex-wrap gap-2">
                      {analysis.missingKeywords.map((kw, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-lg border border-amber-200">
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          <span>{kw}</span>
                        </span>
                      ))}
                    </div>
                  </Card>

                  <Card title="Resume Formatting Advice" subtitle="Optimization tips for candidate profile">
                    <ul className="space-y-2 text-xs text-slate-600">
                      {analysis.improvementSuggestions.map((sug, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>

                {/* Footer Continue Button */}
                <div className="p-6 bg-slate-900 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
                  <div>
                    <h3 className="text-sm font-bold text-white">Resume Analysis Complete</h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Your technical skills and experience have been saved. Ready for the AI Mock Interview session?
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => navigate('/interview/setup')}
                    icon={<ArrowRight className="h-4 w-4" />}
                    className="shrink-0"
                  >
                    Continue to Interview Setup
                  </Button>
                </div>
              </>
            ) : (
              /* Empty state before any PDF is uploaded */
              <Card>
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">No Resume Uploaded Yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Upload your PDF resume on the left to extract technical skills, candidate contact info, education, and career experience.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    icon={<Upload className="h-4 w-4" />}
                  >
                    Select Resume PDF
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
