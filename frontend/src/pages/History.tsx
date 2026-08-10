import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { interviewService, type InterviewHistoryItem } from '../services/interview'
import vasuAvatar from '../assets/vasu_avatar.png'

type StoredUser = {
  id?: number
  username?: string
  email?: string
}

export default function History() {
  const navigate = useNavigate()
  const rawUser = localStorage.getItem('user')
  const user = rawUser ? (JSON.parse(rawUser) as StoredUser) : null

  const [history, setHistory] = useState<InterviewHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  useEffect(() => {
    interviewService.getHistory()
      .then(({ data }) => {
        setHistory(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || 'Failed to fetch interview history.')
        setLoading(false)
      })
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/login/user'
  }

  const displayName = user?.username || user?.email?.split('@')[0] || 'Vasu'

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'IN_PROGRESS':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
      case 'PAUSED':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'TERMINATED':
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    }
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 7.5) return 'text-emerald-400 font-bold'
    if (score >= 5.5) return 'text-amber-400 font-semibold'
    return 'text-rose-400'
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
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
              <Link to="/coding-test" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-[#121735] hover:text-slate-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                <span>Coding Tests</span>
              </Link>
              <Link to="/resume" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-[#121735] hover:text-slate-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
                <span>Resume</span>
              </Link>
              <Link to="/history" className="flex items-center gap-3 rounded-xl bg-[#5d3efd] text-white px-4 py-3 font-semibold shadow-[0_0_15px_rgba(93,62,253,0.35)] transition-all">
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

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <header className="flex flex-col gap-4 rounded-3xl border border-[#1b233d] bg-[#0c0f24]/75 p-5 backdrop-blur-md mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Interview History & Reports
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Review your past session metrics, scores, and evaluation insights.
            </p>
          </header>

          <div className="rounded-3xl border border-[#1b233d] bg-[#0c0f24]/75 p-6 backdrop-blur-md">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                <p className="text-slate-400 text-xs">Retrieving your history...</p>
              </div>
            ) : error ? (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-center text-rose-400 text-sm">
                {error}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center gap-4">
                <svg className="w-12 h-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-lg text-white">No Interviews Yet</h3>
                  <p className="text-slate-400 text-sm max-w-sm mt-1">
                    You haven't completed any interviews yet. Configure and start your first mock interview prep!
                  </p>
                </div>
                <Link to="/interview" className="bg-[#5d3efd] hover:bg-[#4f31ea] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                  Start Mock Interview
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1f294d] text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-4 px-4">Date</th>
                      <th className="py-4 px-4">Job Role</th>
                      <th className="py-4 px-4">Difficulty</th>
                      <th className="py-4 px-4">Round</th>
                      <th className="py-4 px-4">Overall Score</th>
                      <th className="py-4 px-4">Status</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#131936] text-sm text-slate-200">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-[#12163b]/30 transition-colors">
                        <td className="py-4 px-4 text-xs font-medium text-slate-400 whitespace-nowrap">
                          {formatDateTime(item.created_at)}
                        </td>
                        <td className="py-4 px-4 font-semibold text-white whitespace-nowrap">
                          {item.job_role}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-md font-medium border border-slate-700">
                            {item.difficulty}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          Round {item.current_round}
                        </td>
                        <td className="py-4 px-4 font-mono text-base whitespace-nowrap">
                          {item.status.toUpperCase() === 'COMPLETED' ? (
                            <span className={getScoreBadgeColor(item.cumulative_score)}>
                              {item.cumulative_score.toFixed(1)} <span className="text-[10px] text-slate-500">/10</span>
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`text-[10px] uppercase font-bold tracking-wide px-2.5 py-1 rounded-full border ${getStatusColor(item.status)}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          {item.status.toUpperCase() === 'COMPLETED' ? (
                            <button
                              onClick={() => navigate(`/interview/report/${item.id}`)}
                              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all"
                            >
                              View Report
                            </button>
                          ) : item.status.toUpperCase() === 'IN_PROGRESS' || item.status.toUpperCase() === 'PAUSED' ? (
                            <button
                              onClick={() => navigate('/interview/prep')}
                              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-all"
                            >
                              Resume
                            </button>
                          ) : (
                            <span className="text-slate-500 text-xs font-medium">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  )
}
