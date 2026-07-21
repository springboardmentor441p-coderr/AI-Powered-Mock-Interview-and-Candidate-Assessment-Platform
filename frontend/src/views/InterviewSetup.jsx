import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Video, Mic, ShieldCheck, Info, Sparkles, User, Briefcase, UploadCloud, FileText } from 'lucide-react';
import api from '../services/api';

export default function InterviewSetup() {
  const navigate = useNavigate();
  
  // Settings
  const [domain, setDomain] = useState('Software Engineering');
  const [difficulty, setDifficulty] = useState('Medium');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // Custom domains & context uploads
  const [customDomainText, setCustomDomainText] = useState('');
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [jdMode, setJdMode] = useState('text'); // 'text' or 'file'
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  
  // Hardware status
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Load templates on start
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.get('/api/interviews/templates');
        setTemplates(response.data);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      }
    };
    fetchTemplates();
    
    // Request webcam permissions immediately for setup preview
    requestPermissions();

    return () => {
      stopCamera();
    };
  }, []);

  const requestPermissions = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCamera(true);
      setHasMic(true);
    } catch (err) {
      console.error('Permission request failed:', err);
      setErrorMsg(
        'Could not access camera or microphone. Please check your browser settings and grant permissions.'
      );
      setHasCamera(false);
      setHasMic(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleStart = async () => {
    if (!hasCamera || !hasMic) {
      setErrorMsg('Webcam and microphone access are required to begin the assessment.');
      return;
    }

    if (domain === 'Other' && !customDomainText.trim()) {
      setErrorMsg('Please specify your custom track name.');
      return;
    }

    if (!selectedTemplateId) {
      const hasJd = (jdMode === 'text' && jdText.trim()) || (jdMode === 'file' && jdFile);
      if (!hasJd) {
        setErrorMsg('Job Description (JD) is compulsory. Please paste text or upload a JD file.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');
    stopCamera(); // Stop setup preview camera stream before entering interview room

    try {
      const formData = new FormData();
      const finalDomain = domain === 'Other' ? customDomainText : domain;
      formData.append('domain', finalDomain);
      formData.append('difficulty', difficulty);
      
      if (selectedTemplateId) {
        formData.append('template_id', selectedTemplateId);
      }
      
      if (resumeFile) {
        formData.append('resume_file', resumeFile);
      }
      
      if (jdMode === 'file' && jdFile) {
        formData.append('jd_file', jdFile);
      } else if (jdMode === 'text' && jdText) {
        formData.append('jd_text', jdText);
      }

      const response = await api.post('/api/interviews/session', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const session = response.data;
      navigate(`/interview-room/${session.id}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to initialize interview room. Please try again.');
      setLoading(false);
      // Resume camera setup preview
      requestPermissions();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-cyan-500/10 rounded-xl">
          <Briefcase className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Interview Configuration Lobby</h1>
          <p className="text-sm text-gray-400">Configure parameters, verify camera positioning, and test microphone levels</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Setup Parameters Panel */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-5">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Configure Interview Details
            </h2>

            {/* Template select option */}
            {templates.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Use Pre-set Interview Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    setSelectedTemplateId(e.target.value);
                    if (e.target.value) {
                      const t = templates.find(temp => temp.id === parseInt(e.target.value));
                      setDomain(t.domain);
                      setDifficulty(t.difficulty);
                      setIsCustomDomain(false);
                    }
                  }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                >
                  <option value="" className="bg-[#07080d]">Create custom dynamic interview (Resume + JD)</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id} className="bg-[#07080d]">{t.title} ({t.domain} - {t.difficulty})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Domain Selection */}
            {!selectedTemplateId && (
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Domain Category</label>
                <select
                  value={domain}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDomain(val);
                    if (val === 'Other') {
                      setIsCustomDomain(true);
                    } else {
                      setIsCustomDomain(false);
                    }
                  }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                >
                  <option value="Software Engineering" className="bg-[#07080d]">Software Engineering</option>
                  <option value="Data Science" className="bg-[#07080d]">Data Science</option>
                  <option value="Product Management" className="bg-[#07080d]">Product Management</option>
                  <option value="Cyber Security" className="bg-[#07080d]">Cyber Security</option>
                  <option value="DevOps & Cloud Engineering" className="bg-[#07080d]">DevOps & Cloud Engineering</option>
                  <option value="AI & Machine Learning Specialist" className="bg-[#07080d]">AI & Machine Learning Specialist</option>
                  <option value="Mobile App Development" className="bg-[#07080d]">Mobile App Development</option>
                  <option value="UI/UX Design" className="bg-[#07080d]">UI/UX Design</option>
                  <option value="Full Stack Development" className="bg-[#07080d]">Full Stack Development</option>
                  <option value="Other" className="bg-[#07080d]">Other (Custom Track)</option>
                </select>

                {isCustomDomain && (
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Custom Track Name</label>
                    <input
                      type="text"
                      value={customDomainText}
                      onChange={(e) => setCustomDomainText(e.target.value)}
                      placeholder="e.g. QA Automation Engineer"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Difficulty Selection */}
            {!selectedTemplateId && (
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Target Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Easy', 'Medium', 'Hard'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all duration-200 ${
                        difficulty === d 
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 shadow-md' 
                          : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Context Upload Card */}
          <div className="glass-card p-6 space-y-5">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
              Upload Context Documents <span className="text-xs text-cyan-400 font-normal">(Required)</span>
            </h2>
            
            {/* Resume File Select */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Candidate Resume (PDF) <span className="text-cyan-400">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="resume-setup-upload"
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  className="hidden"
                />
                <label
                  htmlFor="resume-setup-upload"
                  className="flex-grow flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 hover:border-cyan-500/50 rounded-xl cursor-pointer text-sm text-gray-300 transition-colors"
                >
                  <span className="truncate">{resumeFile ? resumeFile.name : "Upload resume PDF..."}</span>
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </label>
                {resumeFile && (
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    className="text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Uploaded PDF will be parsed. If unselected, saved profile resume details will be used.</p>
            </div>

            {/* JD Input */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Job Description (JD) <span className="text-cyan-400">*</span>
              </label>
              
              {/* Tabs for JD Input Method */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setJdMode('text')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    jdMode === 'text'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => setJdMode('file')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    jdMode === 'file'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Upload File
                </button>
              </div>

              {jdMode === 'text' ? (
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the job description keywords, requirements, or duties here..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 placeholder:text-gray-600"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="jd-setup-upload"
                    accept=".pdf,.txt"
                    onChange={(e) => setJdFile(e.target.files[0])}
                    className="hidden"
                  />
                  <label
                    htmlFor="jd-setup-upload"
                    className="flex-grow flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 hover:border-cyan-500/50 rounded-xl cursor-pointer text-sm text-gray-300 transition-colors"
                  >
                    <span className="truncate">{jdFile ? jdFile.name : "Upload JD PDF or TXT..."}</span>
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </label>
                  {jdFile && (
                    <button
                      type="button"
                      onClick={() => setJdFile(null)}
                      className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              Interview Guidelines
            </h3>
            <ul className="text-xs text-gray-400 space-y-2 leading-relaxed list-disc pl-4">
              <li>Keep eye contact with the screen to maintain score levels.</li>
              <li>Speak clearly at an even pace (aim for 120-140 words per minute).</li>
              <li>Limit pauses and filler phrases like "um", "uh", "like".</li>
              <li>Each question has a 2-minute timer limit.</li>
              <li>You can click "Next Question" to proceed when finished responding.</li>
            </ul>
          </div>
        </div>

        {/* Media Verification Panel */}
        <div className="space-y-6">
          <div className="glass-card p-6 flex flex-col h-full min-h-[360px]">
            <h2 className="text-base font-semibold text-white mb-4">Device Verification</h2>
            
            {/* Camera Frame */}
            <div className="bg-black/60 aspect-video rounded-xl overflow-hidden relative border border-white/5 flex items-center justify-center flex-grow">
              {hasCamera ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="text-center p-4">
                  <Video className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Camera preview not active</p>
                </div>
              )}

              {/* Status Indicators overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                <div className="flex gap-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded bg-black/60 border ${
                    hasCamera ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'
                  }`}>
                    <Video className="w-3 h-3" />
                    CAM: {hasCamera ? 'OK' : 'DISCONNECTED'}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded bg-black/60 border ${
                    hasMic ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'
                  }`}>
                    <Mic className="w-3 h-3" />
                    MIC: {hasMic ? 'OK' : 'DISCONNECTED'}
                  </span>
                </div>

                {!hasCamera && (
                  <button 
                    onClick={requestPermissions}
                    className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Retry Access
                  </button>
                )}
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl mt-4 leading-relaxed">{errorMsg}</p>
            )}

            {/* Launch CTA */}
            <button
              onClick={handleStart}
              disabled={loading || !hasCamera || !hasMic}
              className="w-full btn-primary py-3.5 mt-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Enter Interview Room
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
