'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Cpu, 
  Briefcase, 
  GraduationCap, 
  Code,
  ArrowRight
} from 'lucide-react';

export const ResumeUploader: React.FC<{ onLaunchInterviewWithResume: () => void }> = ({ onLaunchInterviewWithResume }) => {
  const { parseAndUploadResume, activeResume } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsParsing(true);
    try {
      await parseAndUploadResume(file);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        className={`relative p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center space-y-4 shadow-sm ${
          isDragging 
            ? 'border-[#059669] bg-emerald-50' 
            : 'border-slate-300 bg-white hover:border-[#059669]'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          {isParsing ? (
            <Cpu className="w-8 h-8 text-[#059669] animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-[#059669]" />
          )}
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-slate-900">
            {isParsing ? 'Parsing Resume with AI NLP Engine...' : 'Drag & Drop candidate resume (PDF / DOCX)'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            InterVio automatically extracts skills, projects, and work history to customize technical questions.
          </p>
        </div>

        {!isParsing && (
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
            <label className="px-6 py-3 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center gap-2 transition-all">
              <FileText className="w-4 h-4" />
              <span>Browse Resume File (.pdf, .docx, .txt)</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Extracted Details Viewer */}
      {activeResume && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-sm">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#059669]" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">{activeResume.fileName}</h4>
                <span className="text-xs text-[#059669] font-bold">
                  Detected Role: {activeResume.detectedRole} ({activeResume.experienceYears} Years Exp)
                </span>
              </div>
            </div>

            <button
              onClick={onLaunchInterviewWithResume}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Tailored AI Mock Interview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Grid of Extracted Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Extracted Skills */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#059669]" />
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Extracted Tech Stack & Skills ({activeResume.extractedSkills.length})
                </h5>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeResume.extractedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-emerald-800 shadow-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Extracted Projects */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-600" />
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Detected Key Projects
                </h5>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                {activeResume.projects.map((proj, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#059669] font-bold">•</span>
                    <span>{proj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Education & Summary */}
            <div className="md:col-span-2 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Education & Executive Summary
                </h5>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic">
                "{activeResume.summary}"
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
