import { useState } from 'react'
import { Link } from 'react-router-dom'
import vasuAvatar from '../assets/vasu_avatar.png'

type StoredUser = {
  id?: number
  username?: string
  email?: string
}

export default function Support() {
  const rawUser = localStorage.getItem('user')
  const user = rawUser ? (JSON.parse(rawUser) as StoredUser) : null

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [formData, setFormData] = useState({ subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const faqs = [
    {
      q: "My voice recognition (Speech-to-Text) isn't capturing my answers. How do I fix it?",
      a: "Make sure you have granted microphone access permissions to the application in your web browser. If it still doesn't capture, you can toggle the 'Switch to Text Input Fallback' link on the Voice Interview page to type your technical answers manually."
    },
    {
      q: "How does the AI evaluate my answers? Are there strict metrics?",
      a: "Yes, the AI Evaluation Engine assesses your answer on 7 key metrics: Technical Accuracy, Concept Understanding, Communication, Problem Solving, Confidence, Completeness, and Practical Knowledge. It scores each out of 10.0 and generates summarized strengths and weaknesses."
    },
    {
      q: "Why did my resume parsing fail or show a score of 30?",
      a: "Our resume parser requires PDF or DOCX file formats up to 10MB. If the file is scanned or contains only images, text extraction might fail, and the parser will fall back to a baseline score of 30. Make sure your uploaded file contains copyable, searchable text."
    },
    {
      q: "What is the difference between Round 1 and Round 2 of the Technical Interview?",
      a: "Round 1 tests your fundamental knowledge in coding, languages, and tools extracted from your resume. If you pass the configurable threshold, you proceed to Round 2. Round 2 is significantly deeper and focuses on projects, system architecture, performance optimization, design decisions, and debugging."
    }
  ]

  const handleSignOut = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    window.location.href = '/login/user'
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setFormData({ subject: '', message: '' })
    setTimeout(() => setSubmitted(false), 5000)
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
              <Link to="/settings" className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-[#121735] hover:text-slate-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                <span>Settings</span>
              </Link>
              <Link to="/support" className="flex items-center gap-3 rounded-xl bg-[#5d3efd] text-white px-4 py-3 font-semibold shadow-[0_0_15px_rgba(93,62,253,0.35)] transition-all">
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
              Platform Support & FAQs
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Troubleshoot microphone permissions, resume extraction issues, or submit feedback directly to engineering.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* FAQ List */}
            <div className="lg:col-span-7 bg-[#0c0f24]/75 border border-[#1b233d] rounded-3xl p-6 backdrop-blur-md flex flex-col gap-4">
              <h2 className="text-lg font-bold text-white border-b border-[#1b233d] pb-3 flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Frequently Asked Questions
              </h2>

              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-[#1f294d] rounded-2xl bg-[#0a0c20]/50 overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                    className="w-full text-left p-4 font-semibold text-sm flex justify-between items-center text-slate-200 hover:text-white"
                  >
                    <span>{faq.q}</span>
                    <svg
                      className={`w-4 h-4 text-slate-500 transition-transform ${expandedFAQ === idx ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedFAQ === idx && (
                    <div className="p-4 pt-0 border-t border-[#131936] text-xs text-slate-400 leading-relaxed bg-[#0c0f2b]/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Support Request Form */}
            <div className="lg:col-span-5 bg-[#0c0f24]/75 border border-[#1b233d] rounded-3xl p-6 backdrop-blur-md flex flex-col gap-6">
              <h2 className="text-lg font-bold text-white border-b border-[#1b233d] pb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Contact Tech Support
              </h2>

              <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                {submitted && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3 text-xs font-semibold">
                    Support message submitted successfully! We will get back to you soon.
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Voice Microphone Issue"
                    required
                    className="w-full bg-[#10122e] border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-100"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Details / Description</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Briefly describe what happened..."
                    required
                    rows={4}
                    className="w-full bg-[#10122e] border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-100 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#5d3efd] hover:bg-[#4f31ea] py-3.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-indigo-950/50"
                >
                  Send Support Request
                </button>
              </form>
            </div>

          </div>
        </main>

      </div>
    </div>
  )
}
