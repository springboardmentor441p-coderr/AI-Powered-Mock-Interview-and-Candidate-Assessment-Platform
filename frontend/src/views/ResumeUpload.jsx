import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, Play, Sparkles, Building, Calendar, GraduationCap } from 'lucide-react';
import api from '../services/api';

export default function ResumeUpload() {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');
  
  // Parsed Profile data
  const [profile, setProfile] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const parseResumeFile = async (selectedFile) => {
    if (!selectedFile.name.endsWith('.pdf')) {
      setError('Only PDF resumes are currently supported.');
      return;
    }

    setFile(selectedFile);
    setError('');
    setLoading(true);
    setProfile(null);

    // Simulated progress indicators for smoother UX
    const steps = [
      'Reading PDF binary stream...',
      'Extracting professional credentials...',
      'Running AI skill and taxonomy extraction...',
      'Registering candidate workspace profile...'
    ];
    
    let stepIdx = 0;
    setProgressMsg(steps[0]);
    const progressInterval = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setProgressMsg(steps[stepIdx]);
      }
    }, 1200);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/api/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      clearInterval(progressInterval);
      setProfile(response.data);
    } catch (err) {
      clearInterval(progressInterval);
      setError(
        err.response?.data?.detail || 
        'Failed to parse resume. Please ensure it is a valid, readable PDF.'
      );
      setFile(null);
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseResumeFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      parseResumeFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-cyan-500/10 rounded-xl">
          <UploadCloud className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Resume Upload & Parsing</h1>
          <p className="text-sm text-gray-400">Upload your resume to extract skills and generate matching interview questions</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-xl text-sm leading-relaxed">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Upload Container */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-base font-semibold text-white mb-4">Select Document</h2>
            
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors relative cursor-pointer ${
                dragActive 
                  ? 'border-cyan-500 bg-cyan-500/5' 
                  : 'border-white/10 hover:border-cyan-500/50 bg-white/5'
              }`}
            >
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                accept=".pdf"
                onChange={handleFileChange}
                disabled={loading}
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <UploadCloud className={`w-12 h-12 mx-auto mb-3 transition-colors ${dragActive ? 'text-cyan-400' : 'text-gray-500'}`} />
                <span className="text-sm text-white font-medium block">Drag & Drop Resume</span>
                <span className="text-xs text-gray-500 block mt-1">Supports PDF (max 5MB)</span>
                <span className="mt-4 inline-block btn-secondary text-xs py-2 px-4">Browse Files</span>
              </label>
            </div>

            {file && (
              <div className="mt-5 flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <FileText className="w-8 h-8 text-cyan-400 flex-shrink-0" />
                <div className="min-w-0 flex-grow">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Start Mock trigger if profile exists */}
          {profile && (
            <div className="glass-card p-6 border-cyan-500/20 bg-cyan-500/5">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Profile Sync Ready
              </h3>
              <p className="text-xs text-gray-400 mb-4">Your technical background has been mapped. Launch a mock session tailored to your skills.</p>
              <button 
                onClick={() => navigate('/interview-setup')}
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-sm"
              >
                <Play className="w-4 h-4" />
                Start Mock Interview
              </button>
            </div>
          )}
        </div>

        {/* Parsing Workspace Output */}
        <div className="md:col-span-2">
          {loading && (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-blue-500/10 border-b-blue-400 animate-spin animate-delay-150"></div>
              </div>
              <p className="text-white font-medium mt-2">{progressMsg}</p>
              <p className="text-xs text-gray-500 mt-1.5">Analyzing syntax patterns and structural fields...</p>
            </div>
          )}

          {!loading && !profile && (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500 border-dashed border-white/5">
              <FileText className="w-16 h-16 mb-4 text-gray-600" />
              <p className="text-base text-gray-300 font-medium">No Document Uploaded</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">Upload a resume in the left panel to trigger automatic parsing and view extracted experience parameters.</p>
            </div>
          )}

          {profile && (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Extracted Summary
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{profile.summary}</p>
              </div>

              {/* Skills Card */}
              <div className="glass-card p-6">
                <h3 className="text-base font-semibold text-white mb-4">Skills & Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.parsed_skills && profile.parsed_skills.length > 0 ? (
                    profile.parsed_skills.map((skill, idx) => (
                      <span 
                        key={idx} 
                        className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-sm"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500 italic">No specific technical tags detected.</span>
                  )}
                </div>
              </div>

              {/* Experience and Education splits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Experience */}
                <div className="glass-card p-6">
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-cyan-400" />
                    Experience Timeline
                  </h3>
                  <div className="space-y-4">
                    {profile.parsed_experience && profile.parsed_experience.length > 0 ? (
                      profile.parsed_experience.map((exp, idx) => (
                        <div key={idx} className="relative pl-4 border-l border-white/10 space-y-1">
                          <div className="absolute left-0 top-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-cyan-500 rounded-full"></div>
                          <h4 className="text-sm font-semibold text-white">{exp.role}</h4>
                          <p className="text-xs text-cyan-400">{exp.company}</p>
                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {exp.duration}
                          </p>
                          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{exp.description}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic">No professional history parsed.</p>
                    )}
                  </div>
                </div>

                {/* Education */}
                <div className="glass-card p-6">
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-cyan-400" />
                    Education History
                  </h3>
                  <div className="space-y-4">
                    {profile.education && profile.education.length > 0 ? (
                      profile.education.map((edu, idx) => (
                        <div key={idx} className="relative pl-4 border-l border-white/10 space-y-1">
                          <div className="absolute left-0 top-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                          <h4 className="text-sm font-semibold text-white">{edu.degree}</h4>
                          <p className="text-xs text-gray-400">{edu.institution}</p>
                          <p className="text-[10px] text-gray-500">Class of {edu.year}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic">No academic history parsed.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
