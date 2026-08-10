import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import vasuAvatar from '../assets/vasu_avatar.png'
import aiSphere from '../assets/ai_sphere.png'
import { resumeService, type ParsedResume } from '../services/resume'

type StoredUser = {
  id?: number
  username?: string
  email?: string
  highest_qualification?: string
}

type IconName =
  | 'dashboard'
  | 'interview'
  | 'code'
  | 'resume'
  | 'history'
  | 'settings'
  | 'support'
  | 'search'
  | 'bell'
  | 'upload'
  | 'file'
  | 'target'
  | 'bookmark'
  | 'profile'
  | 'briefcase'
  | 'medal'
  | 'graph'
  | 'crown'
  | 'bulb'
  | 'sun'
  | 'chevron'
  | 'arrow-right'

function Icon({ name, className }: { name: IconName; className?: string }) {
  const cls = className ?? 'h-5 w-5'

  if (name === 'dashboard') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    )
  }

  if (name === 'interview') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    )
  }

  if (name === 'code') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    )
  }

  if (name === 'resume') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M10 9H8" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
      </svg>
    )
  }

  if (name === 'history') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
      </svg>
    )
  }

  if (name === 'settings') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }

  if (name === 'support') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  }

  if (name === 'search') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    )
  }

  if (name === 'bell') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    )
  }

  if (name === 'upload') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" x2="12" y1="3" y2="15" />
      </svg>
    )
  }

  if (name === 'bookmark') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
    )
  }

  if (name === 'profile') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  }

  if (name === 'file') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    )
  }

  if (name === 'target') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    )
  }

  if (name === 'briefcase') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    )
  }

  if (name === 'medal') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L9 7H4.5L7 11L5 21L12 17L19 21L17 11L19.5 7H15L12 2Z" />
        <circle cx="12" cy="11" r="3" />
      </svg>
    )
  }

  if (name === 'graph') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    )
  }

  if (name === 'crown') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
        <rect x="5" y="18" width="14" height="2" rx="1" />
      </svg>
    )
  }

  if (name === 'bulb') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .5 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    )
  }

  if (name === 'sun') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    )
  }

  if (name === 'chevron') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    )
  }

  if (name === 'arrow-right') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    )
  }

  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  )
}

const TIPS = [
  "Break down complex problems into smaller parts. Clarity is the key!",
  "Always start with a brute force solution, then optimize it step by step.",
  "When designing systems, prioritize scalability and single points of failure.",
  "Explain your thought process clearly during mock interviews to gain confidence.",
  "Review your past coding tests to understand common mistakes and patterns."
]

export default function Dashboard() {
  const rawUser = localStorage.getItem('user')
  const user = rawUser ? (JSON.parse(rawUser) as StoredUser) : null
  const token = localStorage.getItem('accessToken')

  const [activeTip, setActiveTip] = useState(0)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [latestResume, setLatestResume] = useState<ParsedResume | null>(null)
  const [resumeLoading, setResumeLoading] = useState(true)

  useEffect(() => {
    resumeService.getLatestResume()
      .then(({ data }) => setLatestResume(data))
      .catch(() => setLatestResume(null))
      .finally(() => setResumeLoading(false))
  }, [])

  if (!user || !token) {
    return <Navigate to="/login/user" replace />
  }

  const displayName = user.username || user.email?.split('@')[0] || 'Vasu'

  const nav = [
    { label: 'Dashboard', to: '/dashboard', icon: 'dashboard' as IconName, active: true },
    { label: 'Interviews', to: '/interview', icon: 'interview' as IconName },
    { label: 'Coding Tests', to: '/coding-test', icon: 'code' as IconName },
    { label: 'Resume', to: '/resume', icon: 'resume' as IconName },
    { label: 'Reports', to: '/history', icon: 'target' as IconName },
    { label: 'History', to: '/history', icon: 'history' as IconName },
    { label: 'Bookmarks', to: '/history', icon: 'bookmark' as IconName },
    { label: 'Profile', to: '/settings', icon: 'profile' as IconName },
    { label: 'Settings', to: '/settings', icon: 'settings' as IconName },
    { label: 'Support', to: '/support', icon: 'support' as IconName },
  ]

  const stats = [
    {
      title: 'Total Interviews',
      value: '12',
      note: '↑ 20% from last month',
      noteColor: 'text-emerald-400',
      icon: 'briefcase' as IconName,
      iconClass: 'bg-[#5d3efd]/10 text-[#8c74ff] border border-[#5d3efd]/20',
      glow: 'glow-purple',
    },
    {
      title: 'Best Score',
      value: '85%',
      note: 'Excellent',
      noteColor: 'text-emerald-400',
      icon: 'medal' as IconName,
      iconClass: 'bg-[#0e77ff]/10 text-[#5ea4ff] border border-[#0e77ff]/20',
      glow: 'glow-blue',
    },
    {
      title: 'Average Score',
      value: '72%',
      note: 'Good',
      noteColor: 'text-amber-400',
      icon: 'graph' as IconName,
      iconClass: 'bg-[#10b981]/10 text-[#34d399] border border-[#10b981]/20',
      glow: 'glow-teal',
    },
    {
      title: 'Interview Readiness',
      value: '78%',
      note: 'Keep it up!',
      noteColor: 'text-emerald-400',
      icon: 'target' as IconName,
      iconClass: 'bg-[#6366f1]/10 text-[#818cf8] border border-[#6366f1]/20',
      glow: 'glow-indigo',
    },
  ]

  const actions = [
    {
      title: 'Take Interview',
      desc: 'Start an AI interview based on your resume',
      to: '/interview',
      color: 'purple',
      icon: 'interview' as IconName,
      iconClass: 'bg-gradient-to-br from-violet-600/30 to-violet-950/20 text-[#8c74ff] border border-violet-500/30',
      btnClass: 'bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/40',
    },
    {
      title: 'Coding Test',
      desc: 'Test your coding skills with AI evaluation',
      to: '/coding-test',
      color: 'blue',
      icon: 'code' as IconName,
      iconClass: 'bg-gradient-to-br from-blue-600/30 to-blue-950/20 text-[#5ea4ff] border border-blue-500/30',
      btnClass: 'bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/40',
    },
    {
      title: 'Upload Resume',
      desc: 'Upload your resume for AI analysis',
      to: '/resume',
      color: 'teal',
      icon: 'upload' as IconName,
      iconClass: 'bg-gradient-to-br from-teal-600/30 to-teal-950/20 text-[#34d399] border border-teal-500/30',
      btnClass: 'bg-teal-600/20 text-teal-300 border border-teal-500/30 hover:bg-teal-600/40',
    },
    {
      title: 'Interview History',
      desc: 'View your past interviews and performance',
      to: '/history',
      color: 'indigo',
      icon: 'file' as IconName,
      iconClass: 'bg-gradient-to-br from-indigo-600/30 to-indigo-950/20 text-[#818cf8] border border-indigo-500/30',
      btnClass: 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/40',
    },
  ]

  const activity = [
    { title: 'React Developer Interview', date: 'May 20, 2024', score: '85%', scoreStyle: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', icon: 'interview' as IconName, iconBg: 'bg-[#5d3efd]/10 text-[#8c74ff]' },
    { title: 'Backend Developer Interview', date: 'May 18, 2024', score: '70%', scoreStyle: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', icon: 'file' as IconName, iconBg: 'bg-amber-500/10 text-amber-400' },
    { title: 'Python Developer Interview', date: 'May 15, 2024', score: '65%', scoreStyle: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', icon: 'code' as IconName, iconBg: 'bg-[#0e77ff]/10 text-[#5ea4ff]' },
    { title: 'Coding Test - DSA', date: 'May 12, 2024', score: '80%', scoreStyle: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', icon: 'code' as IconName, iconBg: 'bg-[#10b981]/10 text-[#34d399]' },
  ]

  const recommendations = [
    { title: 'System Design Basics', count: '12 Lessons', badge: 'Intermediate', badgeClass: 'bg-[#1b203a] text-slate-300', icon: 'folder' as IconName, iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
    { title: 'Dynamic Programming', count: '18 Problems', badge: 'Hard', badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/20', icon: 'file' as IconName, iconBg: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
    { title: 'React Advanced Concepts', count: '15 Lessons', badge: 'Intermediate', badgeClass: 'bg-[#1b203a] text-slate-300', icon: 'code' as IconName, iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
    { title: 'SQL for Interviews', count: '10 Lessons', badge: 'Easy', badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', icon: 'target' as IconName, iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  ]

  const handleSignOut = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/login/user'
  }

  const nextTip = () => {
    setActiveTip((prev) => (prev + 1) % TIPS.length)
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
              {nav.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className={
                    item.active
                      ? 'flex items-center gap-3 rounded-xl bg-[#5d3efd] text-white px-4 py-3 font-semibold shadow-[0_0_15px_rgba(93,62,253,0.35)] transition-all'
                      : 'flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-[#121735] hover:text-slate-200'
                  }
                >
                  <Icon name={item.icon} className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-8 space-y-4">
            {/* Upgrade to Pro Card */}
            <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-[#1b1c3c] to-[#0f1026] p-4 text-center relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-violet-600/10 blur-xl group-hover:bg-violet-600/20 transition-all duration-300" />
              <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Icon name="crown" className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-slate-200">Upgrade to Pro 👑</p>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">Unlock advanced analytics, mock interviews, and AI insights.</p>
              <button type="button" className="mt-3.5 w-full rounded-xl bg-[#5d3efd] py-2 text-xs font-bold text-white shadow-lg shadow-violet-950/50 hover:bg-[#4f31ea] transition-all">
                Upgrade Now
              </button>
            </div>

            {/* Profile Section */}
            <div className="relative">
              <div
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center justify-between rounded-2xl border border-[#1e2544] bg-[#0d1026] p-2.5 cursor-pointer hover:bg-[#131838] transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={vasuAvatar}
                    alt="Vasu Ayyanar"
                    className="h-9 w-9 rounded-full border border-indigo-500/30 object-cover"
                  />
                  <div className="text-left leading-none">
                    <p className="text-xs font-bold text-slate-200">{displayName} Ayyanar</p>
                    <span className="text-[10px] font-medium text-slate-500">Candidate</span>
                  </div>
                </div>
                <Icon name="chevron" className="h-4 w-4 text-slate-500" />
              </div>

              {profileDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-[#212b55] bg-[#0c0e22] p-1.5 shadow-2xl z-20 animate-fade-in-up">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          
          {/* Mobile Navigation Header */}
          <div className="mb-4 flex items-center gap-2 overflow-x-auto rounded-2xl border border-[#1b233d] bg-[#0c0f24]/90 p-2 text-xs text-slate-300 xl:hidden">
            <Link to="/dashboard" className="whitespace-nowrap rounded-lg bg-[#5d3efd] px-3.5 py-2 font-semibold text-white">Dashboard</Link>
            <Link to="/interview" className="whitespace-nowrap rounded-lg bg-white/5 px-3.5 py-2 hover:bg-white/10 transition-all">Interviews</Link>
            <Link to="/coding-test" className="whitespace-nowrap rounded-lg bg-white/5 px-3.5 py-2 hover:bg-white/10 transition-all">Coding Tests</Link>
            <Link to="/history" className="whitespace-nowrap rounded-lg bg-white/5 px-3.5 py-2 hover:bg-white/10 transition-all">History</Link>
            <Link to="/settings" className="whitespace-nowrap rounded-lg bg-white/5 px-3.5 py-2 hover:bg-white/10 transition-all">Settings</Link>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
            
            {/* Left and Middle Columns */}
            <div className="space-y-5">
              
              {/* Header */}
              <header className="flex flex-col gap-4 rounded-3xl border border-[#1b233d] bg-[#0c0f24]/75 p-5 backdrop-blur-md md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
                    Welcome back, Vasu! <span className="animate-bounce">👋</span>
                  </h1>
                  <p className="mt-1 text-xs text-slate-400 font-medium">Let&apos;s crack your dream job with AI-powered preparation.</p>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center rounded-xl border border-[#1e2544] bg-[#080a18] px-3.5 py-2 w-full md:w-[240px] focus-within:border-indigo-500/50 transition-all">
                    <Icon name="search" className="mr-2 h-4 w-4 text-slate-500" />
                    <input
                      placeholder="Search anything..."
                      className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
                    />
                    <span className="rounded-md bg-[#161a35] px-1.5 py-0.5 text-[9px] font-bold text-slate-400 border border-[#212a52]">Ctrl K</span>
                  </div>
                  
                  <button className="relative grid h-9 w-9 place-items-center rounded-xl border border-[#1e2544] bg-[#080a18] text-slate-400 hover:text-slate-200 hover:border-[#2b3564] transition-all">
                    <Icon name="bell" className="h-5 w-5" />
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white border-2 border-[#060814]">3</span>
                  </button>
                  
                  <button className="flex h-9 items-center gap-1.5 rounded-xl border border-[#1e2544] bg-[#080a18] px-3 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:border-[#2b3564] transition-all">
                    <Icon name="sun" className="h-5 w-5" />
                    <Icon name="chevron" className="h-3 w-3" />
                  </button>
                </div>
              </header>

              {/* Stats Grid */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                  <article key={item.title} className={`glass-card glass-card-hover rounded-2xl p-4 flex items-center gap-4 ${item.glow}`}>
                    <div className={`grid h-11 w-11 place-items-center rounded-2xl shrink-0 ${item.iconClass}`}>
                      <Icon name={item.icon} className="h-6 w-6" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{item.title}</p>
                      <p className="mt-1 text-2xl font-extrabold text-slate-100">{item.value}</p>
                      <p className={`mt-0.5 text-xs font-semibold ${item.noteColor}`}>{item.note}</p>
                    </div>
                  </article>
                ))}
              </section>

              {/* What would you like to do today */}
              <section className="glass-card rounded-3xl p-5 relative overflow-hidden">
                <h2 className="text-base font-bold text-slate-200 mb-4">What would you like to do today?</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {actions.map((item) => (
                    <article key={item.title} className="bg-gradient-to-b from-[#0e1126] to-[#070915] border border-[#1e2544] hover:border-[#353f6e] rounded-2xl p-5 transition-all duration-300 relative group flex flex-col justify-between min-h-[190px]">
                      <div>
                        <div className={`mb-4 inline-grid h-11 w-11 place-items-center rounded-2xl ${item.iconClass}`}>
                          <Icon name={item.icon} className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-200">{item.title}</h3>
                        <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Link
                          to={item.to}
                          className={`grid h-8 w-8 place-items-center rounded-full transition-all duration-300 group-hover:translate-x-1 ${item.btnClass}`}
                        >
                          <Icon name="arrow-right" className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Resume Status & Skill Breakdown */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                
                {/* Resume Status — live */}
                <article className="glass-card rounded-3xl p-5 lg:col-span-2 flex flex-col justify-between">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-200">Resume Status</h3>
                    <Link to="/resume" className="rounded-xl border border-[#212b55] bg-[#0c0e22] px-3.5 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-[#131735] hover:text-white transition-all">Manage Resumes</Link>
                  </div>

                  {resumeLoading ? (
                    /* skeleton */
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {[0, 1].map((i) => (
                        <div key={i} className="h-[140px] rounded-2xl bg-[#0d1226] animate-pulse border border-[#1e2544]" />
                      ))}
                    </div>
                  ) : latestResume ? (
                    /* ── Resume found ── */
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* File card */}
                      <div className="bg-[#070915] border border-[#1e2544] rounded-2xl p-4 flex flex-col justify-between min-h-[140px]">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last Uploaded Resume</p>
                          <div className="mt-3 flex items-start gap-3">
                            <div className="grid h-10 w-9 place-items-center rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 font-extrabold text-[10px] leading-none shrink-0">
                              {latestResume.filename.split('.').pop()?.toUpperCase() ?? 'PDF'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-200 truncate">{latestResume.filename}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Uploaded {new Date(latestResume.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {' • '}{latestResume.file_size < 1024 * 1024
                                  ? `${(latestResume.file_size / 1024).toFixed(1)} KB`
                                  : `${(latestResume.file_size / (1024 * 1024)).toFixed(1)} MB`}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/20">Analyzed</span>
                          <Link to="/resume" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            View Analysis <Icon name="arrow-right" className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>

                      {/* Parsed info card */}
                      <div className="bg-[#070915] border border-[#1e2544] rounded-2xl p-4 flex flex-col gap-3 min-h-[140px]">
                        {latestResume.candidate_name && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Detected Candidate</p>
                            <p className="mt-1 text-xs font-bold text-slate-200">{latestResume.candidate_name}</p>
                            {latestResume.candidate_email && (
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{latestResume.candidate_email}</p>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-auto">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Skills Found</p>
                            <p className="mt-1 text-xl font-extrabold text-violet-300">{latestResume.skills.length}</p>
                          </div>
                          <Link
                            to="/resume"
                            className="rounded-xl bg-[#5d3efd] px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#4f31ea] transition-all"
                          >
                            See Skills →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── No resume yet ── */
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Link
                        to="/resume"
                        className="border border-dashed border-[#242e56] bg-[#070915] hover:bg-[#0d1026] rounded-2xl p-5 text-center transition-all flex flex-col items-center justify-center min-h-[140px] group"
                      >
                        <div className="mx-auto mb-2.5 grid h-10 w-10 place-items-center rounded-full bg-violet-600/10 text-violet-400 border border-violet-500/20 group-hover:bg-violet-600/20 transition-all">
                          <Icon name="upload" className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-200">Upload your latest resume</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">PDF or DOCX (Max 10MB)</p>
                        <span className="mt-3.5 rounded-xl bg-[#5d3efd] px-4 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-[#4f31ea] transition-all">
                          Upload Resume
                        </span>
                      </Link>

                      <div className="bg-[#070915] border border-[#1e2544] rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px] gap-2 text-center">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-500">
                          <Icon name="file" className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-400">No resume uploaded yet</p>
                        <p className="text-[10px] text-slate-600">Upload a resume to unlock AI interview personalisation</p>
                      </div>
                    </div>
                  )}
                </article>

                {/* Skill Breakdown */}
                <article className="glass-card rounded-3xl p-5 flex flex-col">
                  <h3 className="text-base font-bold text-slate-200 mb-4">Skill Breakdown</h3>
                  <div className="flex flex-col sm:flex-row items-center gap-5 justify-center flex-1">
                    
                    {/* Doughnut Chart */}
                    <div className="relative flex items-center justify-center shrink-0">
                      <div className="w-28 h-28 rounded-full flex items-center justify-center p-3.5 bg-[conic-gradient(#8b5cf6_0_32%,#3b82f6_32%_60%,#f59e0b_60%_72%,#f97316_72%_88%,#10b981_88%_100%)] shadow-inner">
                        <div className="w-20 h-20 rounded-full bg-[#060814] flex flex-col items-center justify-center leading-none">
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Overall</p>
                          <p className="text-xl font-extrabold text-slate-100 mt-0.5">72%</p>
                        </div>
                      </div>
                    </div>

                    {/* Chart Legend */}
                    <ul className="space-y-1.5 text-[11px] font-semibold text-slate-400 flex-1 w-full">
                      <li className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
                          <span>DSA</span>
                        </div>
                        <span className="text-slate-200">80%</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                          <span>System Design</span>
                        </div>
                        <span className="text-slate-200">70%</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                          <span>Frontend</span>
                        </div>
                        <span className="text-slate-200">65%</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                          <span>Backend</span>
                        </div>
                        <span className="text-slate-200">75%</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                          <span>Database</span>
                        </div>
                        <span className="text-slate-200">60%</span>
                      </li>
                    </ul>

                  </div>
                </article>
              </div>

              {/* Recommended for You */}
              <section className="glass-card rounded-3xl p-5">
                <h3 className="text-base font-bold text-slate-200 mb-4">Recommended for You</h3>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                  {recommendations.map((item) => (
                    <article key={item.title} className="bg-[#070915] border border-[#1e2544] hover:border-[#353f6e] rounded-2xl p-3.5 flex items-center gap-3.5 transition-all">
                      <div className={`grid h-10 w-10 place-items-center rounded-xl shrink-0 ${item.iconBg}`}>
                        <Icon name={item.icon} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 leading-tight">
                        <p className="text-xs font-bold text-slate-200 truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{item.count}</p>
                        <span className={`inline-block mt-1.5 rounded-md px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider ${item.badgeClass}`}>{item.badge}</span>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="mt-5 flex justify-center">
                  <Link to="/history" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 group">
                    Explore All Topics <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </section>

            </div>

            {/* Right Column (Side Cards) */}
            <div className="space-y-5">
              
              {/* AI Recommendation */}
              <article className="glass-card rounded-3xl p-5 relative overflow-hidden group">
                <h3 className="text-base font-bold text-slate-200 mb-3.5">AI Recommendation</h3>
                <div className="flex gap-4 items-center">
                  <img
                    src={aiSphere}
                    alt="AI Agent"
                    className="h-16 w-16 rounded-full border border-violet-500/30 object-cover shrink-0 shadow-[0_0_20px_rgba(139,92,246,0.3)] animate-pulse"
                  />
                  <p className="text-xs font-medium text-slate-300 leading-relaxed flex-1">
                    Based on your profile, I recommend focusing on <strong className="text-indigo-300 font-bold">System Design</strong> and <strong className="text-indigo-300 font-bold">Dynamic Programming</strong>.
                  </p>
                </div>
                <button type="button" className="mt-4 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-950/40 hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-1.5">
                  Start Practicing <Icon name="arrow-right" className="h-3.5 w-3.5" />
                </button>
              </article>

              {/* Recent Activity */}
              <article className="glass-card rounded-3xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-200">Recent Activity</h3>
                  <Link to="/history" className="text-xs font-bold text-indigo-400 hover:text-indigo-300">View All</Link>
                </div>
                <ul className="space-y-3">
                  {activity.map((item) => (
                    <li key={item.title} className="bg-[#070915] border border-[#1e2544]/65 rounded-2xl p-3 flex items-center justify-between gap-3.5 hover:border-[#353f6e] transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`grid h-9 w-9 place-items-center rounded-xl shrink-0 ${item.iconBg}`}>
                          <Icon name={item.icon} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 leading-tight">
                          <p className="text-xs font-bold text-slate-200 truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{item.date}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-extrabold ${item.scoreStyle}`}>{item.score}</span>
                    </li>
                  ))}
                </ul>
              </article>

              {/* Tips of the Day */}
              <article className="glass-card rounded-3xl p-5 flex flex-col justify-between min-h-[185px]">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 mb-3.5">
                    <Icon name="bulb" className="h-5 w-5" />
                    <h3 className="text-base font-bold text-slate-200">Tips of the Day</h3>
                  </div>
                  <p className="text-xs font-medium text-slate-300 leading-relaxed min-h-[48px] cursor-pointer hover:text-slate-200" onClick={nextTip}>
                    {TIPS[activeTip]}
                  </p>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-2">
                    <span>{activeTip + 1} / 5 Tips</span>
                    <button type="button" onClick={nextTip} className="text-indigo-400 hover:text-indigo-300">Next Tip</button>
                  </div>
                  <div className="h-1.5 w-full bg-[#1b203a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${((activeTip + 1) / TIPS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </article>

            </div>

          </div>
        </main>
      </div>
    </div>
  )
}

