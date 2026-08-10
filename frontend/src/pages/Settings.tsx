import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { interviewService } from '../services/interview'
import vasuAvatar from '../assets/vasu_avatar.png'

type StoredUser = {
  id?: number
  username?: string
  email?: string
  highest_qualification?: string
}

type ProfileData = {
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

export default function Settings() {
  const rawUser = localStorage.getItem('user')
  const user = rawUser ? (JSON.parse(rawUser) as StoredUser) : null

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [themePreference, setThemePreference] = useState('dark')

  useEffect(() => {
    interviewService.getCandidateProfile()
      .then(({ data }) => {
        setProfile(data)
        setLoading(false)
      })
      .catch(() => {
        setProfile(null)
        setLoading(false)
      })
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/login/user'
  }

  const displayName = user?.username || user?.email?.split('@')[0] || 'Vasu'

  return (
    <div className="min-h-screen bg-[#060814] bg-[radial-gradient(circle_at_25%_0%,#111532_0%,#090c1e_45%,#060814_100%)] text-slate-100 antialiased font-sans">
      <div className="mx-auto flex max-w-[1600px] gap-5 p-4 md:p-6">
        
        {/* Sidebar */}
        <aside className="hidden w-[260px] shrink-0 flex-col justify-between rounded-3xl border border-[#1b233d] bg-[#0c0f24]/90 p-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur xl:flex min-h-[92vh]">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </div>
              <div>
                <p className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">AI Interview</p>
                <p className="text-[11px] font-semibold text-indigo-400/80 tracking-wide uppercase">Ace Your Next Interview</p>
              </div>
            </div>

            <nav className="space-y-1 text-sm">
              <Link to="/dashboard" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-[#121735] hover:text-slate-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
                <span>Dashboard</span>
              </Link>
              <Link to="/interview" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-[#121735] hover:text-slate-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                <span>Interviews</span>
              </Link>
              <Link to="/coding-test" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-[#121735] hover:text-slate-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                <span>Coding Tests</span>
              </Link>
              <Link to="/resume" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-[#121735] hover:text-slate-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
                <span>Resume</span>
              </Link>
              <Link to="/history" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-[#121735] hover:text-slate-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
                <span>History</span>
              </Link>
              <Link to="/settings" className="flex items-center gap-3 rounded-xl bg-[#5d3efd] text-white px-4 py-3 font-semibold shadow-[0_0_15px_rgba(93,62,253,0.35)] transition-all">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                <span>Settings</span>
              </Link>
              <Link to="/support" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-[#121735] hover:text-slate-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                <span>Support</span>
              </Link>
            </nav>
          </div>

          <div className="mt-8 space-y-4">
            <div className="relative">
              <div
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center justify-between rounded-2xl border border-[#1e2544] bg-[#0d1026] p-2.5 cursor-pointer hover:bg-[#131838] transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={vasuAvatar}
                    alt="User Profile"
                    className="h-9 w-9 rounded-full border border-indigo-500/30 object-cover"
                  />
                  <div className="text-left leading-none">
                    <p className="text-xs font-bold text-slate-200">{displayName}</p>
                    <span className="text-[10px] font-medium text-slate-500">Candidate</span>
                  </div>
                </div>
                <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
              </div>

              {profileDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-[#212b55] bg-[#0c0e22] p-1.5 shadow-2xl z-20">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 0-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <header className="flex flex-col gap-4 rounded-3xl border border-[#1b233d] bg-[#0c0f24]/75 p-5 backdrop-blur-md mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Settings & Profile
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Manage your personal settings, view parsed resume profile details, and set visual preferences.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Account Settings */}
            <div className="lg:col-span-5 bg-[#0c0f24]/75 border border-[#1b233d] rounded-3xl p-6 backdrop-blur-md flex flex-col gap-6">
              <h2 className="text-lg font-bold text-white border-b border-[#1b233d] pb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Account Credentials
              </h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Username</label>
                <div className="bg-[#10122e] border border-white/5 rounded-xl p-3 text-sm text-slate-200">
                  {user?.username || 'Vasu'}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Email Address</label>
                <div className="bg-[#10122e] border border-white/5 rounded-xl p-3 text-sm text-slate-200">
                  {user?.email || 'vasu@example.com'}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Highest Qualification</label>
                <div className="bg-[#10122e] border border-white/5 rounded-xl p-3 text-sm text-slate-200">
                  {user?.highest_qualification || 'Bachelor of Engineering'}
                </div>
              </div>

              {/* Theme preference */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Theme Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setThemePreference('dark')}
                    className={`py-2 rounded-lg border text-xs font-semibold transition-all ${
                      themePreference === 'dark'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-[#10122e] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    Deep Space Dark (Active)
                  </button>
                  <button
                    onClick={() => {
                      alert('Light mode is coming soon in future releases!')
                    }}
                    className="py-2 bg-[#10122e] border border-white/5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all"
                  >
                    Classic Light
                  </button>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full mt-2 bg-rose-600/10 hover:bg-rose-600/25 border border-rose-500/20 py-3.5 rounded-xl text-sm font-bold text-rose-400 hover:text-rose-300 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" /></svg>
                Sign Out from Session
              </button>
            </div>

            {/* Parsed Profile Info */}
            <div className="lg:col-span-7 bg-[#0c0f24]/75 border border-[#1b233d] rounded-3xl p-6 backdrop-blur-md flex flex-col gap-6">
              <h2 className="text-lg font-bold text-white border-b border-[#1b233d] pb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Parsed Resume Profile
              </h2>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  <p className="text-slate-400 text-xs">Loading parser metrics...</p>
                </div>
              ) : profile ? (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4">
                    <div>
                      <p className="text-slate-300 font-bold text-sm">Resume Score Index</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Calculated by key skills, experience, and educational markers.</p>
                    </div>
                    <span className="text-2xl font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl">
                      {profile.resume_score} <span className="text-[10px] text-slate-500">/100</span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Strong Technical Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.strong_skills.length > 0 ? profile.strong_skills.map(s => (
                        <span key={s} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs px-2.5 py-1 rounded-md font-medium">{s}</span>
                      )) : <span className="text-slate-500 text-xs font-semibold">None detected</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Skills to Develop</span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.weak_skills.length > 0 ? profile.weak_skills.map(w => (
                        <span key={w} className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs px-2.5 py-1 rounded-md font-medium">{w}</span>
                      )) : <span className="text-slate-500 text-xs font-semibold">None detected</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-[#1b233d] pt-4">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Technologies Overview</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Languages</span>
                        <p className="text-xs text-slate-300 font-semibold">{profile.programming_languages.join(', ') || 'N/A'}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Frameworks</span>
                        <p className="text-xs text-slate-300 font-semibold">{profile.frameworks.join(', ') || 'N/A'}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Databases</span>
                        <p className="text-xs text-slate-300 font-semibold">{profile.databases.join(', ') || 'N/A'}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cloud & Platforms</span>
                        <p className="text-xs text-slate-300 font-semibold">{profile.cloud_technologies.join(', ') || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 flex flex-col items-center gap-4">
                  <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-slate-400 text-sm">No resume profile parsed yet. Go upload your resume first.</p>
                  <Link to="/resume" className="bg-[#5d3efd] hover:bg-[#4f31ea] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                    Upload Resume
                  </Link>
                </div>
              )}
            </div>

          </div>
        </main>

      </div>
    </div>
  )
}
