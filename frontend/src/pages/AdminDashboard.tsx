import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService, type CandidateSummary, type CandidateDetails, type PlatformAnalytics } from '../services/admin'

type StoredUser = {
  id?: number
  username?: string
  email?: string
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const rawUser = localStorage.getItem('user')
  const user = rawUser ? (JSON.parse(rawUser) as StoredUser) : null

  // UI state
  const [candidates, setCandidates] = useState<CandidateSummary[]>([])
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'candidates' | 'analytics' | 'leaderboard'>('candidates')

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'resume_score' | 'avg_score' | 'interviews_completed'>('avg_score')

  useEffect(() => {
    // Verify admin role before loading
    if (!user || localStorage.getItem('accessToken') === null) {
      navigate('/login/admin')
      return
    }

    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [candRes, analRes] = await Promise.all([
        adminService.getCandidates(),
        adminService.getAnalytics()
      ])
      setCandidates(candRes.data)
      setAnalytics(analRes.data)
    } catch {
      alert('Failed to load administrative workspace data.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewCandidate = async (candId: number) => {
    try {
      const response = await adminService.getCandidateDetails(candId)
      setSelectedCandidate(response.data)
    } catch {
      alert('Failed to fetch candidate report details.')
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    navigate('/login/admin')
  }

  const displayName = user?.username || user?.email?.split('@')[0] || 'Admin'

  // Filtering candidates
  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  }).sort((a, b) => {
    return b[sortField] - a[sortField]
  })

  // Leaderboard lists
  const getLeaderboardList = () => {
    return candidates
      .filter(c => c.interviews_completed > 0)
      .sort((a, b) => b.best_score - a.best_score)
      .slice(0, 10)
  }

  return (
    <div className="min-h-screen bg-[#060814] bg-[radial-gradient(circle_at_25%_0%,#111532_0%,#090c1e_45%,#060814_100%)] text-slate-100 antialiased font-sans flex flex-col">
      
      {/* Top Header Bar */}
      <header className="border-b border-[#1b233d] bg-[#0c0f24]/80 p-4 md:px-8 flex justify-between items-center backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">AI Interview Admin</p>
            <p className="text-[9px] font-semibold text-indigo-400 tracking-wide uppercase">Recruiter Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-semibold">{displayName} (Admin)</span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1b233d] pb-0.5 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('candidates')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'candidates' ? 'border-[#5d3efd] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Candidate Directory
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'analytics' ? 'border-[#5d3efd] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Recruitment Analytics
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'leaderboard' ? 'border-[#5d3efd] text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Top Scorers Leaderboard
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="text-slate-400 text-xs font-semibold">Loading portal dashboard...</p>
          </div>
        ) : (
          <>
            {/* ------------------------------------------------------------- */}
            {/* TAB: CANDIDATES */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'candidates' && (
              <div className="flex flex-col gap-5">
                
                {/* Search & Sort Panel */}
                <div className="flex flex-col md:flex-row justify-between gap-4 bg-[#0c0f24]/75 border border-[#1b233d] p-4 rounded-2xl backdrop-blur-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidate by name or email..."
                    className="flex-1 bg-[#10122e] border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sort By:</span>
                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as any)}
                      className="bg-[#10122e] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 focus:outline-none"
                    >
                      <option value="avg_score">Average Score</option>
                      <option value="resume_score">Resume Score</option>
                      <option value="interviews_completed">Interviews Done</option>
                    </select>
                  </div>
                </div>

                {/* Candidate Table */}
                <div className="bg-[#0c0f24]/75 border border-[#1b233d] rounded-3xl p-5 backdrop-blur-md overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1f294d] text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-4 px-4">Candidate</th>
                        <th className="py-4 px-4">Resume Score</th>
                        <th className="py-4 px-4">Completed Interviews</th>
                        <th className="py-4 px-4">Avg Score</th>
                        <th className="py-4 px-4">Best Score</th>
                        <th className="py-4 px-4">Avg Coding</th>
                        <th className="py-4 px-4">Latest Interview</th>
                        <th className="py-4 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#131936] text-sm text-slate-200">
                      {filteredCandidates.map((cand) => (
                        <tr key={cand.id} className="hover:bg-[#12163b]/30 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-semibold text-white">{cand.username}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{cand.email}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="bg-indigo-500/10 text-indigo-300 text-xs px-2.5 py-1 rounded border border-indigo-500/20 font-bold">
                              {cand.resume_score} / 100
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap font-mono text-center">
                            {cand.interviews_completed}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-white whitespace-nowrap">
                            {cand.interviews_completed > 0 ? `${cand.avg_score} / 10` : '—'}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-indigo-400 whitespace-nowrap">
                            {cand.interviews_completed > 0 ? `${cand.best_score} / 10` : '—'}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {cand.avg_coding_score > 0 ? `${cand.avg_coding_score} %` : '—'}
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-400 whitespace-nowrap">
                            {cand.latest_interview}
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleViewCandidate(cand.id)}
                              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all"
                            >
                              View Reports
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: ANALYTICS */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'analytics' && analytics && (
              <div className="flex flex-col gap-6">
                
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#0c0f24]/75 border border-[#1b233d] rounded-2xl p-5 backdrop-blur-md">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Candidates</span>
                    <span className="text-3xl font-extrabold text-white mt-1 block">{analytics.metrics.total_candidates}</span>
                  </div>
                  <div className="bg-[#0c0f24]/75 border border-[#1b233d] rounded-2xl p-5 backdrop-blur-md">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Completed Interviews</span>
                    <span className="text-3xl font-extrabold text-indigo-400 mt-1 block">{analytics.metrics.completed_interviews}</span>
                  </div>
                  <div className="bg-[#0c0f24]/75 border border-[#1b233d] rounded-2xl p-5 backdrop-blur-md">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Average Score</span>
                    <span className="text-3xl font-extrabold text-white mt-1 block">{analytics.metrics.avg_score} <span className="text-xs text-slate-400">/10</span></span>
                  </div>
                  <div className="bg-[#0c0f24]/75 border border-[#1b233d] rounded-2xl p-5 backdrop-blur-md">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Platform Pass Rate</span>
                    <span className="text-3xl font-extrabold text-emerald-400 mt-1 block">{analytics.metrics.pass_rate}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Score Distribution Chart (CSS styled bars) */}
                  <div className="bg-[#0c0f24]/75 border border-[#1b233d] rounded-3xl p-6 backdrop-blur-md flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#1b233d] pb-2">Score Distribution</h3>
                    <div className="flex flex-col gap-4 py-2">
                      {Object.entries(analytics.distributions.score).map(([range, count]) => {
                        const maxCount = Math.max(...Object.values(analytics.distributions.score), 1)
                        const pct = (count / maxCount) * 100
                        return (
                          <div key={range} className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-400 w-12">{range}</span>
                            <div className="flex-1 bg-[#10122e] h-4 rounded-md overflow-hidden relative border border-white/5">
                              <div
                                style={{ width: `${pct}%` }}
                                className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-md shadow-inner"
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-white w-6 text-right">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Role Distribution Chart (CSS styled bars) */}
                  <div className="bg-[#0c0f24]/75 border border-[#1b233d] rounded-3xl p-6 backdrop-blur-md flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#1b233d] pb-2">Role Distribution</h3>
                    <div className="flex flex-col gap-4 py-2">
                      {Object.keys(analytics.distributions.role).length === 0 ? (
                        <p className="text-xs text-slate-500 py-10 text-center">No role metrics available.</p>
                      ) : (
                        Object.entries(analytics.distributions.role).map(([role, count]) => {
                          const maxCount = Math.max(...Object.values(analytics.distributions.role), 1)
                          const pct = (count / maxCount) * 100
                          return (
                            <div key={role} className="flex items-center gap-3">
                              <span className="text-xs font-semibold text-slate-400 w-24 truncate">{role}</span>
                              <div className="flex-1 bg-[#10122e] h-4 rounded-md overflow-hidden relative border border-white/5">
                                <div
                                  style={{ width: `${pct}%` }}
                                  className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-md shadow-inner"
                                />
                              </div>
                              <span className="text-xs font-mono font-bold text-white w-6 text-right">{count}</span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: LEADERBOARD */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'leaderboard' && (
              <div className="flex flex-col gap-5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block px-1">Top Performing Candidates</span>
                
                <div className="bg-[#0c0f24]/75 border border-[#1b233d] rounded-3xl p-5 backdrop-blur-md overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1f294d] text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-4 px-4 w-12 text-center">Rank</th>
                        <th className="py-4 px-4">Candidate</th>
                        <th className="py-4 px-4">Best Performance Score</th>
                        <th className="py-4 px-4">Resume Parsing Score</th>
                        <th className="py-4 px-4">Total Interviews Completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#131936] text-sm text-slate-200">
                      {getLeaderboardList().map((cand, idx) => (
                        <tr key={cand.id} className="hover:bg-[#12163b]/30 transition-colors">
                          <td className="py-4 px-4 text-center font-bold text-indigo-400">
                            #{idx + 1}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-white">{cand.username}</span>
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                            {cand.best_score} <span className="text-[10px] text-slate-500">/10</span>
                          </td>
                          <td className="py-4 px-4 font-mono">
                            {cand.resume_score} / 100
                          </td>
                          <td className="py-4 px-4 text-center font-mono">
                            {cand.interviews_completed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* Detailed Modals Overlay */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-[#0c0f24] border border-[#212b55] rounded-3xl p-6 max-w-4xl w-full flex flex-col gap-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedCandidate(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {/* Candidate Summary Header */}
            <div>
              <h2 className="text-xl font-bold text-white">{selectedCandidate.candidate.username} Reports Dashboard</h2>
              <p className="text-xs text-slate-500 mt-0.5">{selectedCandidate.candidate.email}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Interview Sessions reports */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Interview Sessions ({selectedCandidate.interviews.length})</span>
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[40vh] pr-1">
                  {selectedCandidate.interviews.map(session => (
                    <div key={session.id} className="border border-[#1f294d] bg-[#0a0c20]/50 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-bold text-slate-200">{session.job_role} ({session.difficulty})</span>
                        <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 uppercase">
                          {session.verdict}
                        </span>
                      </div>
                      <div className="flex justify-between items-end text-xs w-full text-slate-400">
                        <span>Score: <span className="font-mono font-bold text-white">{session.score.toFixed(1)}/10</span></span>
                        <span className="text-[10px] text-slate-500">{session.created_at}</span>
                      </div>
                      {session.status === 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setSelectedCandidate(null)
                            navigate(`/interview/report/${session.id}`)
                          }}
                          className="w-full text-center py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-xs font-bold rounded-xl border border-indigo-500/20 transition-all mt-1"
                        >
                          View Evaluation Report
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Coding submissions */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Coding Submissions ({selectedCandidate.coding.length})</span>
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[40vh] pr-1">
                  {selectedCandidate.coding.map(sub => (
                    <div key={sub.id} className="border border-[#1f294d] bg-[#0a0c20]/50 rounded-2xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-bold text-slate-200 truncate max-w-[70%]">{sub.challenge_title}</span>
                        <span className="text-[9px] font-bold text-indigo-400">{sub.language}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs w-full text-slate-400 mt-1">
                        <span>Score: <span className="font-mono font-bold text-emerald-400">{sub.score}%</span></span>
                        <span>Quality: <span className="font-semibold text-white">{sub.code_quality}</span></span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 w-full border-t border-white/5 pt-2 mt-1">
                        <span>{sub.complexity}</span>
                        <span>{sub.created_at}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  )
}
