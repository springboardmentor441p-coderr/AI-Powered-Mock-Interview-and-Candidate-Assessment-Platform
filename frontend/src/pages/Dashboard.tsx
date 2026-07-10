import { Link, Navigate } from 'react-router-dom'

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

function Icon({ name, className }: { name: IconName; className?: string }) {
  const cls = className ?? 'h-5 w-5'

  if (name === 'dashboard') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="3" width="8" height="5" rx="2" />
        <rect x="13" y="10" width="8" height="11" rx="2" />
        <rect x="3" y="13" width="8" height="8" rx="2" />
      </svg>
    )
  }

  if (name === 'interview') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="9" y="3" width="6" height="10" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <path d="M12 17v4" />
        <path d="M8 21h8" />
      </svg>
    )
  }

  if (name === 'code') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 8 4 12l4 4" />
        <path d="m16 8 4 4-4 4" />
        <path d="m14 4-4 16" />
      </svg>
    )
  }

  if (name === 'resume') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h6" />
      </svg>
    )
  }

  if (name === 'history') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 3v4h4" />
        <path d="M12 7v6l4 2" />
      </svg>
    )
  }

  if (name === 'settings') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" />
        <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.1a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.1a1 1 0 0 0-.9.6z" />
      </svg>
    )
  }

  if (name === 'support') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 12a8 8 0 0 1 16 0" />
        <rect x="3" y="12" width="4" height="7" rx="2" />
        <rect x="17" y="12" width="4" height="7" rx="2" />
        <path d="M12 20h2a2 2 0 0 0 2-2" />
      </svg>
    )
  }

  if (name === 'search') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.2-3.2" />
      </svg>
    )
  }

  if (name === 'bell') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M15 17H5.5A1.5 1.5 0 0 1 4 15.5 4.5 4.5 0 0 0 6 12V9a6 6 0 1 1 12 0v3a4.5 4.5 0 0 0 2 3.5 1.5 1.5 0 0 1-1.5 1.5H18" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
    )
  }

  if (name === 'upload') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 16V5" />
        <path d="m7 10 5-5 5 5" />
        <path d="M5 19h14" />
      </svg>
    )
  }

  if (name === 'bookmark') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4z" />
      </svg>
    )
  }

  if (name === 'profile') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20a8 8 0 0 1 16 0" />
      </svg>
    )
  }

  if (name === 'file') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
      </svg>
    )
  }

  if (name === 'target') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    )
  }

  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  )
}

export default function Dashboard() {
  const rawUser = localStorage.getItem('user')
  const user = rawUser ? (JSON.parse(rawUser) as StoredUser) : null
  const token = localStorage.getItem('accessToken')

  if (!user || !token) {
    return <Navigate to="/login/user" replace />
  }

  const displayName = user.username || user.email?.split('@')[0] || 'Candidate'

  const nav = [
    { label: 'Dashboard', to: '/dashboard', icon: 'dashboard' as IconName, active: true },
    { label: 'Interviews', to: '/interview', icon: 'interview' as IconName },
    { label: 'Coding Tests', to: '/coding-test', icon: 'code' as IconName },
    { label: 'Resume', to: '/settings', icon: 'resume' as IconName },
    { label: 'Reports', to: '/history', icon: 'target' as IconName },
    { label: 'History', to: '/history', icon: 'history' as IconName },
    { label: 'Bookmarks', to: '/history', icon: 'bookmark' as IconName },
    { label: 'Profile', to: '/settings', icon: 'profile' as IconName },
    { label: 'Settings', to: '/settings', icon: 'settings' as IconName },
    { label: 'Support', to: '/support', icon: 'support' as IconName },
  ]

  const stats = [
    { title: 'Total Interviews', value: '12', note: '20% from last month', noteColor: 'text-emerald-400' },
    { title: 'Best Score', value: '85%', note: 'Excellent', noteColor: 'text-cyan-400' },
    { title: 'Average Score', value: '72%', note: 'Good', noteColor: 'text-amber-400' },
    { title: 'Interview Readiness', value: '78%', note: 'Keep it up!', noteColor: 'text-lime-400' },
  ]

  const actions = [
    {
      title: 'Take Interview',
      desc: 'Start an AI interview based on your resume',
      to: '/interview',
      gradient: 'from-violet-800/60 to-indigo-900/80',
      icon: 'interview' as IconName,
    },
    {
      title: 'Coding Test',
      desc: 'Test your coding skills with AI evaluation',
      to: '/coding-test',
      gradient: 'from-blue-800/60 to-indigo-900/80',
      icon: 'code' as IconName,
    },
    {
      title: 'Upload Resume',
      desc: 'Upload your resume for AI analysis',
      to: '/settings',
      gradient: 'from-teal-700/60 to-emerald-900/80',
      icon: 'upload' as IconName,
    },
    {
      title: 'Interview History',
      desc: 'View your past interviews and performance',
      to: '/history',
      gradient: 'from-indigo-800/60 to-blue-900/80',
      icon: 'file' as IconName,
    },
  ]

  const activity = [
    { title: 'React Developer Interview', date: 'May 20, 2024', score: '85%', scoreStyle: 'bg-emerald-500/20 text-emerald-300' },
    { title: 'Backend Developer Interview', date: 'May 18, 2024', score: '70%', scoreStyle: 'bg-amber-500/20 text-amber-300' },
    { title: 'Python Developer Interview', date: 'May 15, 2024', score: '65%', scoreStyle: 'bg-yellow-500/20 text-yellow-300' },
    { title: 'Coding Test - DSA', date: 'May 12, 2024', score: '80%', scoreStyle: 'bg-cyan-500/20 text-cyan-300' },
  ]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#111f48_0%,#060d21_32%,#020611_100%)] text-slate-100">
      <div className="mx-auto flex max-w-[1540px] gap-4 px-3 py-3 md:px-5">
        <aside className="hidden min-h-[94vh] w-[250px] rounded-2xl border border-[#20315c] bg-[#070f25]/90 p-4 shadow-[0_0_45px_rgba(60,120,255,0.15)] backdrop-blur xl:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold">AI</div>
            <div>
              <p className="text-lg font-semibold">AI Interview</p>
              <p className="text-xs text-slate-400">Ace Your Next Interview</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-sm">
            {nav.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={
                  item.active
                    ? 'flex items-center gap-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 font-medium'
                    : 'flex items-center gap-3 rounded-xl px-4 py-2.5 text-slate-300 transition hover:bg-white/5'
                }
              >
                <Icon name={item.icon} className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-10 rounded-2xl border border-[#2a3a62] bg-[#0d1730] p-3">
            <p className="text-sm font-semibold text-slate-200">{displayName}</p>
            <p className="text-xs text-slate-400">{user.highest_qualification || 'Candidate'}</p>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('accessToken')
                localStorage.removeItem('user')
                window.location.href = '/login/user'
              }}
              className="mt-3 w-full rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-white/20"
            >
              Sign out
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-600/20 to-violet-600/10 p-3">
            <p className="text-sm font-semibold">Upgrade to Pro</p>
            <p className="mt-1 text-xs text-slate-300">Unlock advanced analytics, mock interviews, and AI insights.</p>
            <button type="button" className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold hover:bg-indigo-500">Upgrade Now</button>
          </div>
        </aside>

        <main className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <div className="mb-3 flex items-center gap-2 overflow-x-auto rounded-xl border border-[#20315c] bg-[#0a1733]/70 p-2 text-xs text-slate-300 xl:hidden">
              <Link to="/dashboard" className="whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-1.5 text-white">Dashboard</Link>
              <Link to="/interview" className="whitespace-nowrap rounded-lg bg-white/10 px-3 py-1.5">Interviews</Link>
              <Link to="/coding-test" className="whitespace-nowrap rounded-lg bg-white/10 px-3 py-1.5">Coding Tests</Link>
              <Link to="/history" className="whitespace-nowrap rounded-lg bg-white/10 px-3 py-1.5">History</Link>
              <Link to="/settings" className="whitespace-nowrap rounded-lg bg-white/10 px-3 py-1.5">Settings</Link>
            </div>

            <header className="fade-in-up mb-4 flex flex-col gap-3 rounded-2xl border border-[#1e2f54] bg-[#091632]/75 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold md:text-[2rem]">Welcome back, {displayName}!</h1>
                <p className="mt-1 text-sm text-slate-300">Let&apos;s crack your dream job with AI-powered preparation.</p>
              </div>

              <div className="flex w-full max-w-md items-center justify-end gap-2 md:w-auto">
                <div className="flex flex-1 items-center rounded-xl border border-[#30456f] bg-[#0a1733] px-3 py-2 md:w-[280px]">
                  <Icon name="search" className="mr-2 h-4 w-4 text-slate-400" />
                  <input
                    placeholder="Search anything..."
                    className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  />
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">Ctrl K</span>
                </div>
                <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#30456f] bg-[#0a1733]">
                  <Icon name="bell" className="h-4 w-4" />
                  <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />
                </button>
                <Link to="/settings" className="grid h-10 w-10 place-items-center rounded-xl border border-[#30456f] bg-[#0a1733]"><Icon name="settings" className="h-4 w-4" /></Link>
              </div>
            </header>

            <section className="fade-in-up mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
              {stats.map((item) => (
                <article key={item.title} className="rounded-2xl border border-[#20315c] bg-[#091632]/80 p-4">
                  <p className="text-sm text-slate-400">{item.title}</p>
                  <p className="mt-1 text-3xl font-bold">{item.value}</p>
                  <p className={`mt-1 text-sm ${item.noteColor}`}>{item.note}</p>
                </article>
              ))}
            </section>

            <section className="fade-in-up rounded-2xl border border-[#20315c] bg-[#08142d]/80 p-4">
              <h2 className="mb-3 text-2xl font-semibold">What would you like to do today?</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
                {actions.map((item) => (
                  <article key={item.title} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${item.gradient} p-4`}>
                    <div className="mb-7 inline-grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-xl">
                      <Icon name={item.icon} className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-200/90">{item.desc}</p>
                    <Link to={item.to} className="mt-4 inline-flex rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium transition hover:bg-white/25">
                      Open
                    </Link>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-4 grid grid-cols-1 gap-3 2xl:grid-cols-3">
              <article className="rounded-2xl border border-[#20315c] bg-[#08142d]/80 p-4 2xl:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Resume Status</h3>
                  <Link to="/settings" className="rounded-lg bg-white/10 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/20">View All Resumes</Link>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-dashed border-indigo-400/40 bg-[#0b1733] p-5 text-center">
                    <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-white/10">
                      <Icon name="upload" className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-sm text-slate-300">Upload your latest resume</p>
                    <p className="text-xs text-slate-500">PDF or DOCX (Max 10MB)</p>
                    <Link to="/settings" className="mt-3 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">Upload Resume</Link>
                  </div>
                  <div className="rounded-2xl border border-[#274277] bg-[#0b1733] p-4">
                    <p className="text-sm text-slate-400">Last Uploaded Resume</p>
                    <p className="mt-2 text-sm font-semibold">{displayName}_Resume.pdf</p>
                    <p className="text-xs text-slate-500">Uploaded on May 20, 2024</p>
                    <Link to="/history" className="mt-4 inline-flex rounded-lg bg-white/10 px-3 py-1.5 text-sm transition hover:bg-white/20">View Analysis {'->'}</Link>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-[#20315c] bg-[#08142d]/80 p-4">
                <h3 className="text-xl font-semibold">Skill Breakdown</h3>
                <div className="mt-4 flex items-center gap-4">
                  <div className="grid h-28 w-28 place-items-center rounded-full bg-[conic-gradient(#7c3aed_0_20%,#2563eb_20%_40%,#eab308_40%_55%,#f97316_55%_75%,#14b8a6_75%_100%)]">
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-[#08142d] text-center">
                      <p className="text-xs text-slate-400">Overall</p>
                      <p className="text-2xl font-bold">72%</p>
                    </div>
                  </div>
                  <ul className="space-y-1 text-sm text-slate-300">
                    <li>DSA 80%</li>
                    <li>System Design 70%</li>
                    <li>Frontend 65%</li>
                    <li>Backend 75%</li>
                    <li>Database 60%</li>
                  </ul>
                </div>
              </article>
            </section>

            <section className="mt-4 rounded-2xl border border-[#20315c] bg-[#08142d]/80 p-4">
              <h3 className="text-xl font-semibold">Recommended for You</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
                <article className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-medium">System Design Basics</p>
                  <p className="text-xs text-slate-400">12 Lessons</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-medium">Dynamic Programming</p>
                  <p className="text-xs text-slate-400">18 Problems</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-medium">React Advanced Concepts</p>
                  <p className="text-xs text-slate-400">16 Lessons</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-medium">SQL for Interviews</p>
                  <p className="text-xs text-slate-400">10 Lessons</p>
                </article>
              </div>
            </section>
          </section>

          <aside className="space-y-4">
            <article className="rounded-2xl border border-[#20315c] bg-[#08142d]/85 p-4">
              <h3 className="text-lg font-semibold">AI Recommendation</h3>
              <p className="mt-2 text-sm text-slate-300">
                Based on your profile, we recommend focusing on System Design and Dynamic Programming.
              </p>
              <button type="button" className="mt-4 w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold hover:from-indigo-500 hover:to-violet-500">
                Start Practicing {'->'}
              </button>
            </article>

            <article className="rounded-2xl border border-[#20315c] bg-[#08142d]/85 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <Link to="/history" className="text-xs text-indigo-300 hover:text-indigo-200">View All</Link>
              </div>
              <ul className="space-y-2">
                {activity.map((item) => (
                  <li key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-slate-400">{item.date}</p>
                      </div>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${item.scoreStyle}`}>{item.score}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-[#20315c] bg-[#08142d]/85 p-4">
              <h3 className="text-lg font-semibold">Tips of the Day</h3>
              <p className="mt-2 text-sm text-slate-300">Break down complex problems into smaller parts. Clarity is the key!</p>
              <p className="mt-4 text-xs text-slate-400">1 / 5 Tips</p>
              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div className="h-2 w-1/4 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
              </div>
            </article>
          </aside>
        </main>
      </div>
    </div>
  )
}
