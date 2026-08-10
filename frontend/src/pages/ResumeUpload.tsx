import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { resumeService, type ParsedResume } from '../services/resume'

/* ─── tiny icon components ─────────────────────────────────────────────── */
function UploadIcon({ cls = 'h-6 w-6' }: { cls?: string }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  )
}
function CheckIcon({ cls = 'h-5 w-5' }: { cls?: string }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function SpinnerIcon({ cls = 'h-6 w-6' }: { cls?: string }) {
  return (
    <svg className={`${cls} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
function ChevronLeft({ cls = 'h-4 w-4' }: { cls?: string }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}
function FileIcon({ cls = 'h-5 w-5' }: { cls?: string }) {
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

/* ─── helpers ───────────────────────────────────────────────────────────── */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ─── sub-components ────────────────────────────────────────────────────── */
function SkillChip({ skill }: { skill: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-[11px] font-semibold text-indigo-300">
      {skill}
    </span>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
      <span className="flex-1 h-px bg-[#1e2544]" />
      {children}
      <span className="flex-1 h-px bg-[#1e2544]" />
    </h3>
  )
}

function ParsedResumeCard({ data }: { data: ParsedResume }) {
  return (
    <div className="space-y-6">
      {/* Identity */}
      <div className="rounded-2xl border border-[#1e2544] bg-[#080d1e] p-5">
        <div className="flex items-start gap-4">
          {/* Avatar placeholder */}
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-700/20 border border-violet-500/20 text-violet-300 text-xl font-extrabold">
            {(data.candidate_name ?? 'R').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-100">{data.candidate_name ?? 'Name not detected'}</p>
            {data.candidate_email && (
              <p className="text-xs text-indigo-400 mt-0.5">{data.candidate_email}</p>
            )}
            {data.candidate_phone && (
              <p className="text-xs text-slate-500 mt-0.5">{data.candidate_phone}</p>
            )}
          </div>
          {/* file badge */}
          <div className="ml-auto shrink-0 text-right">
            <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-extrabold text-emerald-400 uppercase tracking-wide">
              Parsed ✓
            </span>
            <p className="text-[10px] text-slate-500 mt-1.5">{formatBytes(data.file_size)}</p>
          </div>
        </div>
        {data.summary && (
          <p className="mt-4 text-xs text-slate-400 leading-relaxed border-t border-[#1e2544] pt-4">
            {data.summary}
          </p>
        )}
      </div>

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="rounded-2xl border border-[#1e2544] bg-[#080d1e] p-5">
          <SectionHeading>Skills Detected ({data.skills.length})</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((s) => <SkillChip key={s} skill={s} />)}
          </div>
        </div>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <div className="rounded-2xl border border-[#1e2544] bg-[#080d1e] p-5">
          <SectionHeading>Education</SectionHeading>
          <ul className="space-y-3">
            {data.education.map((edu, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                <div>
                  <p className="text-xs font-bold text-slate-200">{edu.institution ?? 'Institution not found'}</p>
                  {edu.degree && <p className="text-[11px] text-slate-400 mt-0.5">{edu.degree}</p>}
                  {edu.year && <p className="text-[10px] text-slate-500 mt-0.5">{edu.year}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <div className="rounded-2xl border border-[#1e2544] bg-[#080d1e] p-5">
          <SectionHeading>Experience</SectionHeading>
          <ul className="space-y-4">
            {data.experience.map((exp, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                <div>
                  <p className="text-xs font-bold text-slate-200">{exp.title ?? 'Role not detected'}</p>
                  {exp.company && <p className="text-[11px] text-indigo-400 mt-0.5">{exp.company}</p>}
                  {exp.duration && <p className="text-[10px] text-slate-500 mt-0.5">{exp.duration}</p>}
                  {exp.description && (
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{exp.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-indigo-700/5 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-200">Ready to practise?</p>
          <p className="text-xs text-slate-400 mt-0.5">Start an AI mock interview tailored to your resume.</p>
        </div>
        <Link
          to="/interview"
          className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-900/40 hover:from-violet-500 hover:to-indigo-500 transition-all"
        >
          Start Interview →
        </Link>
      </div>
    </div>
  )
}

/* ─── main page ─────────────────────────────────────────────────────────── */
type Stage = 'idle' | 'uploading' | 'success' | 'error'

export default function ResumeUpload() {
  const rawUser = localStorage.getItem('user')
  const token = localStorage.getItem('accessToken')
  if (!rawUser || !token) return <Navigate to="/login/user" replace />

  const [stage, setStage] = useState<Stage>('idle')
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ParsedResume | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [loadingLatest, setLoadingLatest] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  /* Fetch latest resume on mount */
  useEffect(() => {
    resumeService.getLatestResume()
      .then(({ data }) => {
        if (data) {
          setParsed(data)
          setStage('success')
        }
      })
      .finally(() => setLoadingLatest(false))
  }, [])

  /* Upload handler */
  const doUpload = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx', 'doc'].includes(ext ?? '')) {
      setErrorMsg('Unsupported file type. Please upload a PDF or DOCX.')
      setStage('error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File is too large. Maximum allowed size is 10 MB.')
      setStage('error')
      return
    }

    setSelectedFile(file)
    setStage('uploading')
    setProgress(0)

    try {
      const { data } = await resumeService.uploadResume(file, setProgress)
      setParsed(data)
      setStage('success')
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail ?? 'Upload failed. Please try again.')
      setStage('error')
    }
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) doUpload(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) doUpload(file)
  }

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-[#060814] bg-[radial-gradient(circle_at_25%_0%,#111532_0%,#090c1e_45%,#060814_100%)] text-slate-100 antialiased font-sans p-4 md:p-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            to="/dashboard"
            className="grid h-9 w-9 place-items-center rounded-xl border border-[#1e2544] bg-[#0c0f24] text-slate-400 hover:text-slate-200 hover:border-[#2b3564] transition-all"
          >
            <ChevronLeft />
          </Link>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Resume Parser
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Upload your resume to power AI mock interviews</p>
          </div>
        </div>

        {/* Loading state */}
        {loadingLatest ? (
          <div className="flex justify-center py-24">
            <SpinnerIcon cls="h-8 w-8 text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── Upload zone ── */}
            <div
              className={`relative rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-200 cursor-pointer
                ${dragOver ? 'border-violet-500 bg-violet-500/5' : 'border-[#1e2544] bg-[#0c0f24]/60 hover:border-[#2b3564] hover:bg-[#0c0f24]'}
                ${stage === 'uploading' ? 'pointer-events-none' : ''}
              `}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.doc"
                className="hidden"
                onChange={onFileChange}
              />

              {stage === 'uploading' ? (
                <div className="space-y-4">
                  <SpinnerIcon cls="h-10 w-10 mx-auto text-violet-400" />
                  <p className="text-sm font-semibold text-slate-300">
                    {selectedFile?.name}
                  </p>
                  <div className="h-2 w-full max-w-sm mx-auto rounded-full bg-[#1b203a] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{progress}% — parsing resume…</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                    <UploadIcon cls="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">
                      {stage === 'success' ? 'Upload a new resume' : 'Drop your resume here'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">PDF or DOCX · Max 10 MB</p>
                  </div>
                  <span className="inline-block rounded-xl border border-[#1e2544] bg-[#080a18] px-4 py-1.5 text-xs font-semibold text-slate-300 hover:border-violet-500/40 hover:text-violet-300 transition-all">
                    Browse file
                  </span>
                </div>
              )}
            </div>

            {/* Error banner */}
            {stage === 'error' && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-start gap-3">
                <span className="mt-0.5 text-rose-400 text-base">⚠</span>
                <div>
                  <p className="text-sm font-bold text-rose-300">Upload failed</p>
                  <p className="text-xs text-rose-400/80 mt-0.5">{errorMsg}</p>
                </div>
                <button
                  className="ml-auto text-xs font-bold text-rose-400 hover:text-rose-300"
                  onClick={() => setStage('idle')}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* ── Parsed result ── */}
            {stage === 'success' && parsed && (
              <div>
                {/* Success banner */}
                <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-2.5">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckIcon cls="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-300 truncate">
                      {parsed.filename}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Uploaded {formatDate(parsed.uploaded_at)} · {formatBytes(parsed.file_size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 shrink-0">
                    <FileIcon cls="h-3.5 w-3.5" />
                    {parsed.skills.length} skills found
                  </div>
                </div>

                <ParsedResumeCard data={parsed} />
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
