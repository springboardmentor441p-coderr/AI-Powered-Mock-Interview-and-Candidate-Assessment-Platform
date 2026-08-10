import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { codingService, type CodingChallenge, type CodingSubmissionResponse } from '../services/coding'
import vasuAvatar from '../assets/vasu_avatar.png'

type StoredUser = {
  id?: number
  username?: string
  email?: string
}

export default function CodingTest() {
  const rawUser = localStorage.getItem('user')
  const user = rawUser ? (JSON.parse(rawUser) as StoredUser) : null

  // UI state
  const [challenges, setChallenges] = useState<CodingChallenge[]>([])
  const [selectedChallenge, setSelectedChallenge] = useState<CodingChallenge | null>(null)
  const [code, setCode] = useState('')
  const [filterLang, setFilterLang] = useState('')
  const [filterDomain, setFilterDomain] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<CodingSubmissionResponse | null>(null)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  // Options
  const languages = ['Python', 'JavaScript', 'SQL']
  const domains = ['Arrays', 'Strings', 'SQL', 'OOP']

  useEffect(() => {
    fetchChallenges()
  }, [filterLang, filterDomain])

  const fetchChallenges = () => {
    setLoading(true)
    codingService.getChallenges(filterLang || undefined, filterDomain || undefined)
      .then(({ data }) => {
        setChallenges(data)
        if (data.length > 0 && !selectedChallenge) {
          handleSelectChallenge(data[0])
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }

  const handleSelectChallenge = (chal: CodingChallenge) => {
    setSelectedChallenge(chal)
    setCode(chal.starter_code)
    setResult(null)
  }

  const handleSignOut = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/login/user'
  }

  const handleSubmit = async () => {
    if (!selectedChallenge || submitting) return
    setSubmitting(true)
    setResult(null)
    try {
      const response = await codingService.submitSolution({
        challenge_id: selectedChallenge.id,
        code,
        language: selectedChallenge.language
      })
      setResult(response.data)
    } catch {
      alert('Failed to evaluate code submission.')
    } finally {
      setSubmitting(false)
    }
  }

  const displayName = user?.username || user?.email?.split('@')[0] || 'Vasu'

  const getDifficultyColor = (diff: string) => {
    switch (diff.toUpperCase()) {
      case 'EASY':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    }
  }

  const getVerdictColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SUCCESS':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'COMPILE_ERROR':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    }
  }

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
              <Link to="/coding-test" className="flex items-center gap-3 rounded-xl bg-[#5d3efd] text-white px-4 py-3 font-semibold shadow-[0_0_15px_rgba(93,62,253,0.35)] transition-all">
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
              <Link to="/settings" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-[#121735] hover:text-slate-200">
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

        {/* Main Coding Test View */}
        <main className="flex-1 min-w-0 flex flex-col gap-6">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center rounded-3xl border border-[#1b233d] bg-[#0c0f24]/75 p-5 backdrop-blur-md">
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Technical Coding Test
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Practice and assess your algorithms and software programming capabilities with instant AI code evaluation.
              </p>
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={filterLang}
                onChange={(e) => setFilterLang(e.target.value)}
                className="bg-[#10122e] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Languages</option>
                {languages.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="bg-[#10122e] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Domains</option>
                {domains.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Challenge List */}
            <div className="lg:col-span-3 bg-[#0c0f24]/75 border border-[#1b233d] rounded-3xl p-4 backdrop-blur-md flex flex-col gap-3 max-h-[75vh] overflow-y-auto">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 px-2">Coding Challenges</span>
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                </div>
              ) : challenges.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No challenges found matching selection.</p>
              ) : (
                challenges.map((chal) => (
                  <button
                    key={chal.id}
                    onClick={() => handleSelectChallenge(chal)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                      selectedChallenge?.id === chal.id
                        ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-lg'
                        : 'bg-[#10122e]/40 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-[#12163b]/30'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold truncate max-w-[70%]">{chal.title}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${getDifficultyColor(chal.difficulty)}`}>
                        {chal.difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 w-full">
                      <span>{chal.domain}</span>
                      <span className="font-semibold text-indigo-400">{chal.language}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Middle/Right Column: Workspace Area (Challenge description & editor) */}
            <div className="lg:col-span-9 flex flex-col gap-6">
              {selectedChallenge ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Pane: Problem Description */}
                  <div className="bg-[#0c0f24]/75 border border-[#1b233d] rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between min-h-[50vh]">
                    <div>
                      <div className="flex justify-between items-center border-b border-[#1b233d] pb-3 mb-4">
                        <h2 className="text-lg font-bold text-white">{selectedChallenge.title}</h2>
                        <span className="bg-indigo-500/10 text-indigo-300 text-xs px-3 py-1 rounded-md border border-indigo-500/20 font-bold">
                          {selectedChallenge.language}
                        </span>
                      </div>
                      <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedChallenge.description}
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-[#1b233d]">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Test Cases</span>
                      <div className="bg-[#10122e]/60 border border-white/5 rounded-2xl p-4 mt-2">
                        {JSON.parse(selectedChallenge.starter_code ? '[]' : '[]').map(() => null)}
                        <pre className="text-xs text-indigo-300 font-mono whitespace-pre-wrap">
                          {selectedChallenge.starter_code ? 'Inputs & outputs will be evaluated dynamically.' : ''}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Right Pane: Code Editor */}
                  <div className="bg-[#0c0f24]/75 border border-[#1b233d] rounded-3xl p-6 backdrop-blur-md flex flex-col gap-4 min-h-[50vh]">
                    <div className="flex justify-between items-center border-b border-[#1b233d] pb-3">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Solution Editor</span>
                      <span className="text-xs text-indigo-400 font-bold font-mono">Starter Code Provided</span>
                    </div>

                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      rows={14}
                      className="w-full bg-[#0a0c20] border border-white/10 rounded-2xl p-4 text-xs font-mono focus:outline-none focus:border-indigo-500 text-slate-200 resize-none leading-relaxed"
                    />

                    <div className="flex justify-end gap-3 mt-2">
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || !code.trim()}
                        className={`w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${
                          submitting || !code.trim()
                            ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                            : 'bg-[#5d3efd] hover:bg-[#4f31ea]'
                        }`}
                      >
                        {submitting ? 'Evaluating Solution...' : 'Submit Code for Review'}
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-[#0c0f24]/75 border border-[#1b233d] rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-[50vh]">
                  <svg className="w-12 h-12 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <p className="text-sm">Please select a coding challenge from the left sidebar to begin practice.</p>
                </div>
              )}

              {/* Bottom Panel: Submission Feedback */}
              {result && (
                <div className="bg-[#0c0f24]/75 border border-[#1b233d] rounded-3xl p-6 backdrop-blur-md flex flex-col gap-6 shadow-2xl animate-fade-in-up">
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1b233d] pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Evaluation Verdict:
                        <span className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded border tracking-wide ${getVerdictColor(result.status)}`}>
                          {result.status}
                        </span>
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">Reviewed dynamically by AI Hashing compiler.</p>
                    </div>

                    <div className="flex gap-6 items-center">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Score</span>
                        <span className="text-2xl font-extrabold text-white">{result.score.toFixed(0)} <span className="text-xs text-slate-400">/100</span></span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Complexity</span>
                        <span className="text-sm font-bold text-slate-200 font-mono">{result.complexity}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Code Quality</span>
                        <span className="text-sm font-bold text-indigo-400">{result.code_quality}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider block mb-2">Detailed AI Feedback</span>
                    <p className="text-sm text-slate-300 leading-relaxed bg-[#10122e]/40 border border-white/5 p-4 rounded-2xl">
                      {result.feedback}
                    </p>
                  </div>

                </div>
              )}

            </div>

          </div>
        </main>

      </div>
    </div>
  )
}
