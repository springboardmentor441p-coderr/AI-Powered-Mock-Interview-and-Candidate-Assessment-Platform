import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { interviewService, ReportResponse } from '../services/interview'

export default function FinalReport() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [report, setReport] = useState<ReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) {
      setError('Invalid Session ID')
      setLoading(false)
      return
    }

    interviewService.getReport(parseInt(sessionId))
      .then(({ data }) => {
        setReport(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || 'Failed to load report. Make sure the interview round is fully complete.')
        setLoading(false)
      })
  }, [sessionId])

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Ready for Interview':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'Needs Improvement':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070514] text-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
        <p className="text-slate-400 text-sm">Synthesizing candidate evaluations and generating final report...</p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#070514] text-slate-100 flex flex-col items-center justify-center gap-4 text-center p-6">
        <svg className="w-16 h-16 text-rose-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-xl font-bold text-white">Report Generation Error</h2>
        <p className="text-slate-400 text-sm max-w-md">{error}</p>
        <Link to="/dashboard" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/25">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070514] text-slate-100 font-sans flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        
        {/* Back Link */}
        <div>
          <Link to="/dashboard" className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-2">
            ← Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Technical Interview Report
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Completed on {new Date(report.created_at).toLocaleDateString()} for candidate {report.candidate_name || 'Vasu'}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${getRecommendationColor(report.hiring_recommendation)}`}>
              Verdict: {report.hiring_recommendation}
            </div>
          </div>
        </div>

        {/* Dash Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Score Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-500/5 blur-xl scale-75"></div>
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-indigo-500/20 border-t-indigo-500 mb-4">
              <span className="text-4xl font-extrabold text-white">{report.overall_score}</span>
              <span className="text-xs text-slate-400 absolute bottom-3">/10</span>
            </div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-slate-400">Overall Assessment Score</h3>
          </div>

          {/* Round 1 detail */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Round 1</span>
              <h3 className="text-lg font-bold text-white mt-1">Core Tech & Skills</h3>
              <p className="text-slate-400 text-xs mt-1.5">
                Evaluation of programming languages, basic library heuristics, and technical communication.
              </p>
            </div>
            <div className="flex justify-between items-end mt-4">
              <span className="text-slate-400 text-sm">Round 1 Score</span>
              <span className="text-2xl font-bold text-white">{report.round1_score}/10</span>
            </div>
          </div>

          {/* Round 2 detail */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">Round 2</span>
              <h3 className="text-lg font-bold text-white mt-1">Architecture & Projects</h3>
              <p className="text-slate-400 text-xs mt-1.5">
                Evaluation of design decisions, scaling, performance trade-offs, and project experience depth.
              </p>
            </div>
            <div className="flex justify-between items-end mt-4">
              <span className="text-slate-400 text-sm">Round 2 Score</span>
              <span className="text-2xl font-bold text-white">{report.round2_score}/10</span>
            </div>
          </div>

        </div>

        {/* Details and Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Summary & Strengths */}
          <div className="flex flex-col gap-6">
            
            {/* Notes */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-3">Evaluation Summary</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {report.summary_notes}
              </p>
            </div>

            {/* Strengths */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-emerald-400 mb-3">Candidate Strengths</h3>
              <ul className="flex flex-col gap-3">
                {report.strengths.map((str, idx) => (
                  <li key={idx} className="flex gap-2.5 text-sm text-slate-300">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Weaknesses & Recommendation */}
          <div className="flex flex-col gap-6">
            
            {/* Session details */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Candidate</span>
                <p className="font-bold text-white mt-0.5">{report.candidate_name || 'Vasu'}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Target Role</span>
                <p className="font-bold text-white mt-0.5">{report.job_role}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Difficulty</span>
                <p className="font-bold text-white mt-0.5">{report.difficulty}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Email</span>
                <p className="font-bold text-slate-300 mt-0.5 text-xs truncate">{report.candidate_email}</p>
              </div>
            </div>

            {/* Weaknesses */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-amber-400 mb-3">Areas of Improvement</h3>
              <ul className="flex flex-col gap-3">
                {report.weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex gap-2.5 text-sm text-slate-300">
                    <span className="text-amber-500 font-bold">⚠</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>

        {/* Recommended Learning Path */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Recommended Learning Path</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.learning_path.map((module, idx) => (
              <div key={idx} className="bg-[#100e28] border border-white/5 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-white text-md mb-2">{module.title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">{module.description}</p>
                </div>
                {module.resources.length > 0 && (
                  <div className="border-t border-white/5 pt-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Suggested Links</span>
                    <div className="flex flex-col gap-1.5 mt-2">
                      {module.resources.map((url, rIdx) => (
                        <a
                          key={rIdx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-400 hover:underline truncate"
                        >
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
