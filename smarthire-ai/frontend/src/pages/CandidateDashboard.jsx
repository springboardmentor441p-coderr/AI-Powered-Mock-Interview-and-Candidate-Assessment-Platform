import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Upload, FileText, Settings, Play, CheckCircle, Clock } from 'lucide-react';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [resume, setResume] = useState(null);
  const [existingResumes, setExistingResumes] = useState([]);
  const [interviewType, setInterviewType] = useState('technical');
  const [difficulty, setDifficulty] = useState('medium');
  const [domain, setDomain] = useState('full-stack development');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch user's existing resumes on mount
  useEffect(() => {
    api.get('/resume/my').then(({ data }) => {
      setExistingResumes(data.resumes || []);
    }).catch(() => {});
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setStatus('Uploading and parsing resume...');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const { data } = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResume(data.resume);
      setExistingResumes((prev) => [data.resume, ...prev]);
      setStatus('');
    } catch (err) {
      setStatus(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectExisting(r) {
    setResume(r);
  }

  function handleClearResume() {
    setResume(null);
    setFile(null);
  }

  async function handleGenerateInterview() {
    if (!resume) return;
    setLoading(true);
    setStatus('Generating your personalized interview...');
    try {
      const { data } = await api.post('/interview/generate', {
        resumeId: resume._id,
        type: interviewType,
        difficulty,
        domain,
      });
      navigate(`/interview/${data.session._id}`);
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to generate interview');
    } finally {
      setLoading(false);
    }
  }

  const difficultyConfig = {
    easy: { label: 'Easy', desc: '5 questions · Foundational', colorActive: 'bg-emerald-500/20 border-emerald-500 text-emerald-300' },
    medium: { label: 'Medium', desc: '7 questions · Applied', colorActive: 'bg-indigo-500/20 border-indigo-500 text-indigo-300' },
    hard: { label: 'Hard', desc: '10 questions · Expert', colorActive: 'bg-rose-500/20 border-rose-500 text-rose-300' },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-4xl mx-auto p-6 lg:p-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold gradient-text">
            Welcome, {user?.name}
          </h1>
          <p className="text-slate-400 mt-1">Ready to ace your next interview?</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Step 1: Upload Resume */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`glass-card p-8 relative overflow-hidden transition-colors ${resume ? 'border-emerald-500/30' : ''}`}
          >
            {resume && (
              <div className="absolute top-4 right-4 text-emerald-400 bg-emerald-400/10 p-2 rounded-full">
                <CheckCircle size={20} />
              </div>
            )}
            <div className="flex items-center gap-3 mb-6 text-emerald-400">
              <div className="p-3 bg-emerald-400/10 rounded-xl"><FileText size={24} /></div>
              <h2 className="text-xl font-semibold text-slate-100">1. Upload Resume</h2>
            </div>
            
            {resume ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-sm text-emerald-300 font-medium mb-1">✓ Resume Ready</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {resume.parsedData?.skills?.slice(0, 5).join(', ') || 'Skills extracted'}
                    {resume.parsedData?.skills?.length > 5 ? ` +${resume.parsedData.skills.length - 5} more` : ''}
                  </p>
                  {resume.summary && (
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
                      {resume.summary}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClearResume}
                  className="w-full py-2.5 rounded-xl text-sm font-medium border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
                >
                  ↩ Change Resume
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpload} className="flex flex-col gap-4">
                <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-800/20">
                  <Upload size={32} className="text-slate-400 mb-3" />
                  <span className="text-sm font-medium text-slate-300">
                    {file ? file.name : "Click or drag PDF here"}
                  </span>
                  {file && (
                    <span className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(0)} KB</span>
                  )}
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading || !file}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
                >
                  {loading ? 'Parsing...' : 'Upload & Extract Skills'}
                </button>
              </form>
            )}

            {/* Existing Resumes Selector */}
            {!resume && existingResumes.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1">
                  <Clock size={12} /> Or use a previous resume
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {existingResumes.map((r) => (
                    <button
                      key={r._id}
                      onClick={() => handleSelectExisting(r)}
                      className="w-full text-left px-4 py-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/50 hover:border-emerald-500/30 transition-all text-sm"
                    >
                      <p className="text-slate-200 font-medium truncate">
                        {r.summary ? r.summary.slice(0, 80) + '...' : 'Resume'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {r.parsedData?.skills?.slice(0, 3).join(', ') || 'No skills extracted'} · {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Step 2: Configure Interview */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`glass-card p-8 ${!resume ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="flex items-center gap-3 mb-6 text-indigo-400">
              <div className="p-3 bg-indigo-400/10 rounded-xl"><Settings size={24} /></div>
              <h2 className="text-xl font-semibold text-slate-100">2. Configure Interview</h2>
            </div>

            <div className="flex flex-col gap-5 mb-8">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wider">Interview Type</label>
                <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)} className="input-field">
                  <option value="hr">HR / Behavioral</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="aptitude">Aptitude</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wider">Difficulty Level</label>
                <div className="flex gap-2">
                  {Object.entries(difficultyConfig).map(([level, cfg]) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-medium capitalize border transition-all text-center ${
                        difficulty === level
                          ? cfg.colorActive
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-semibold">{cfg.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5 leading-tight">{cfg.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wider">Domain / Target Role</label>
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. Full-Stack Developer"
                  className="input-field"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateInterview}
              disabled={loading || !resume}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 flex items-center justify-center gap-2 text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading && resume ? 'Preparing Room...' : (
                <>Start Interview <Play size={16} fill="currentColor" /></>
              )}
            </button>
          </motion.div>
        </div>

        {status && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center text-sm font-medium text-indigo-400 bg-indigo-400/10 py-3 px-6 rounded-lg inline-block border border-indigo-400/20"
          >
            <span className="animate-pulse">{status}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
