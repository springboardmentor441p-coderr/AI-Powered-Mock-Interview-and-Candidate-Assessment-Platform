import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { interviewService } from '../services/interview'

interface ProfileData {
  id: number
  programming_languages: string[]
  frameworks: string[]
  libraries: string[]
  databases: string[]
  cloud_technologies: string[]
  tools: string[]
  certifications: string[]
  strong_skills: string[]
  weak_skills: string[]
  resume_score: number
}

export default function InterviewPrep() {
  const navigate = useNavigate()
  
  // Selection States
  const [jobRole, setJobRole] = useState('AI Engineer')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [interviewType, setInterviewType] = useState('Technical')

  // Profile States
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [launching, setLaunching] = useState(false)

  useEffect(() => {
    interviewService.getCandidateProfile()
      .then(({ data }) => {
        setProfile(data)
        setLoadingProfile(false)
      })
      .catch((err) => {
        setProfileError(err?.response?.data?.detail || 'Please upload your resume first.')
        setLoadingProfile(false)
      })
  }, [])

  const handleStart = async () => {
    setLaunching(true)
    try {
      const response = await interviewService.startInterview({
        job_role: jobRole,
        difficulty,
        interview_type: interviewType
      })
      const { session_id, question_id, question_text } = response.data
      
      // Navigate to the Voice Interview session page with state
      navigate('/interview/session', {
        state: {
          sessionId: session_id,
          initialQuestionId: question_id,
          initialQuestionText: question_text,
          jobRole,
          difficulty,
          interviewType
        }
      })
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to start interview session.')
      setLaunching(false)
    }
  }

  const roles = [
    'AI Engineer',
    'Data Scientist',
    'ML Engineer',
    'Python Developer',
    'Java Developer',
    'Backend Developer',
    'Full Stack Developer',
  ]

  const levels = ['Beginner', 'Intermediate', 'Advanced']
  const types = ['Technical', 'HR', 'Mixed']

  return (
    <div className="min-h-screen bg-[#070514] text-slate-100 font-sans flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-6xl flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Link to="/dashboard" className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
              AI Interview Preparation
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Configure your session and view your knowledge profile before starting the voice agent.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Selections */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col gap-6">
            <h2 className="text-xl font-semibold border-b border-white/10 pb-3">Session Configuration</h2>

            {/* Role Select */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Target Job Role</label>
              <select
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className="w-full bg-[#100e28] border border-white/10 rounded-xl p-3 focus:outline-none focus:border-indigo-500 text-slate-100"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Select */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Difficulty Level</label>
              <div className="grid grid-cols-3 gap-2">
                {levels.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      difficulty === lvl
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                        : 'bg-[#100e28] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Interview Type Select */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Interview Type</label>
              <div className="grid grid-cols-3 gap-2">
                {types.map((t) => (
                  <button
                    key={t}
                    onClick={() => setInterviewType(t)}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      interviewType === t
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                        : 'bg-[#100e28] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleStart}
              disabled={loadingProfile || !!profileError || launching}
              className={`w-full py-4 rounded-xl font-semibold text-white tracking-wide transition-all ${
                loadingProfile || !!profileError || launching
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/20 active:scale-[0.98]'
              }`}
            >
              {launching ? 'Initializing Voice Agent...' : 'Start Voice Interview'}
            </button>
            
            {profileError && (
              <p className="text-rose-400 text-xs text-center font-medium bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                {profileError} Please upload a resume first.
              </p>
            )}
          </div>

          {/* Right panel: Candidate Profile Details */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {loadingProfile ? (
              <div className="h-96 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <p className="text-slate-400 text-sm">Retrieving your knowledge profile...</p>
              </div>
            ) : profile ? (
              <div className="flex flex-col gap-6">
                
                {/* Score & Strong/Weak overview */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Gauge Card */}
                  <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-full scale-75"></div>
                    <div className="relative w-28 h-28 flex items-center justify-center rounded-full border-4 border-indigo-500/20 border-t-indigo-500 shadow-lg shadow-indigo-500/20 mb-3 animate-pulse">
                      <span className="text-3xl font-extrabold text-white">{profile.resume_score}</span>
                      <span className="text-xs text-slate-400 absolute bottom-3">/100</span>
                    </div>
                    <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400">Resume Score</h3>
                  </div>

                  {/* Skills categorize */}
                  <div className="md:col-span-8 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
                    <div>
                      <h3 className="text-sm font-semibold tracking-wider uppercase text-emerald-400 mb-2">Strong Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.strong_skills.map((s) => (
                          <span key={s} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-3 py-1.5 rounded-full font-medium shadow-sm">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold tracking-wider uppercase text-amber-400 mb-2">Areas to Improve</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.weak_skills.map((s) => (
                          <span key={s} className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-3 py-1.5 rounded-full font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Categories */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
                  <h3 className="text-lg font-bold tracking-tight text-white">Parsed Skill Profiles</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Languages */}
                    {profile.programming_languages.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Languages</span>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.programming_languages.map(l => (
                            <span key={l} className="bg-indigo-500/10 border border-indigo-500/10 text-indigo-300 text-xs px-2.5 py-1 rounded-md">{l}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Frameworks */}
                    {profile.frameworks.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Frameworks</span>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.frameworks.map(f => (
                            <span key={f} className="bg-purple-500/10 border border-purple-500/10 text-purple-300 text-xs px-2.5 py-1 rounded-md">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Databases */}
                    {profile.databases.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Databases</span>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.databases.map(d => (
                            <span key={d} className="bg-pink-500/10 border border-pink-500/10 text-pink-300 text-xs px-2.5 py-1 rounded-md">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cloud */}
                    {profile.cloud_technologies.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Cloud & Infra</span>
                        <div className="flex flex-wrap gap-1.5">
                          {profile.cloud_technologies.map(c => (
                            <span key={c} className="bg-sky-500/10 border border-sky-500/10 text-sky-300 text-xs px-2.5 py-1 rounded-md">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                </div>

              </div>
            ) : (
              <div className="h-96 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center">
                <svg className="w-12 h-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-lg text-white">No Resume Uploaded</h3>
                  <p className="text-slate-400 text-sm max-w-sm mt-1">
                    To start an interview, you must first upload a resume so the system can build your candidate profile.
                  </p>
                </div>
                <Link to="/resume" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/25">
                  Upload Resume
                </Link>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}
