import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, getSessionUser } from '../api'

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
const SILENCE_AUTO_SUBMIT_MS = 2800

const TIPS = {
  Technical: "Focus on the 'why' behind your technical choices. Briefly explain your approach, key trade-offs, and how you handled complexity.",
  HR: "Be concise and genuine. Connect your answer back to the role and the value you bring to the team.",
  Behavioral: "Use the STAR method: Situation, Task, Action, Result. Keep it specific and outcome-focused.",
  Aptitude: "Think out loud step by step — walk through your reasoning as you work toward the answer.",
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

function LiveMetric({ icon, label, value, color }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
        <span>{icon} {label}</span>
        <span className="muted">{Math.round(value)}%</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

export default function InterviewRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const submittingRef = useRef(false)
  const user = getSessionUser()

  const [interview, setInterview] = useState(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [listening, setListening] = useState(false)
  const [mediaError, setMediaError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)
  const [ended, setEnded] = useState(false)
  const [pendingFeedback, setPendingFeedback] = useState(null)
  const pendingActionRef = useRef(null)
  const feedbackTimerRef = useRef(null)
  const FEEDBACK_AUTO_CONTINUE_MS = 8000

  const [metrics, setMetrics] = useState({ eyeContact: 78, attention: 82, confidence: 70, facePresence: 96 })

  useEffect(() => {
    api.getInterview(id).then((data) => {
      setInterview(data)
      if (data.mode === 'timed') setTimeLeft(data.time_limit_seconds || 120)
    })
  }, [id])

  // Overall countdown for timed mode — auto-finishes the interview at zero.
  useEffect(() => {
    if (!interview || interview.mode !== 'timed' || ended) return
    if (timeLeft === null) return
    if (timeLeft <= 0) {
      finishTimedInterview()
      return
    }
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, interview, ended])

  const finishTimedInterview = async () => {
    if (ended) return
    setEnded(true)
    recognitionRef.current?.stop()
    window.speechSynthesis?.cancel()
    clearTimeout(silenceTimerRef.current)
    try {
      await api.completeInterview(interview.id)
    } catch (e) {
      // fine if nothing was answered yet
    }
    navigate(`/results/${interview.id}`)
  }

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [currentIdx])

  // Webcam + mic access
  useEffect(() => {
    let stream
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch(() => setMediaError('Webcam/microphone access was denied. Please allow access to continue.'))
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [])

  // Simulated live vision-analysis metrics (random-walk, biased upward while actively speaking).
  // This is the exact spot to feed in real MediaPipe/DeepFace output in production.
  useEffect(() => {
    const t = setInterval(() => {
      setMetrics((m) => {
        const bias = listening ? 3 : -1
        return {
          eyeContact: clamp(m.eyeContact + (Math.random() * 6 - 3) + bias * 0.3, 55, 98),
          attention: clamp(m.attention + (Math.random() * 5 - 2.5) + bias * 0.3, 60, 99),
          confidence: clamp(m.confidence + (Math.random() * 6 - 3) + bias * 0.5, 45, 97),
          facePresence: clamp(m.facePresence + (Math.random() * 3 - 1.5), 85, 100),
        }
      })
    }, 1200)
    return () => clearInterval(t)
  }, [listening])

  const speakQuestion = (text) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.lang = 'en-US'
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => {
      setSpeaking(false)
      startListening() // AIRA finishes speaking, then automatically starts listening
    }
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const startListening = () => {
    if (!SpeechRecognitionAPI) {
      setMediaError('Voice recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    recognitionRef.current?.stop()
    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let text = ''
      for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript + ' '
      setTranscript(text.trim())

      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => {
        autoSubmit(text.trim())
      }, SILENCE_AUTO_SUBMIT_MS)
    }
    recognition.onend = () => setListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }

  // Auto-read the question aloud, then auto-listen, for every new question
  useEffect(() => {
    if (interview) {
      const q = interview.mode === 'timed'
        ? interview.questions[interview.questions.length - 1]
        : interview.questions[currentIdx]
      if (q) {
        setTranscript('')
        speakQuestion(q.question_text)
      }
    }
    return () => {
      window.speechSynthesis?.cancel()
      recognitionRef.current?.stop()
      clearTimeout(silenceTimerRef.current)
      clearTimeout(feedbackTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview?.questions?.length, currentIdx])

  if (!interview) return <p className="muted">Loading interview...</p>

  const isTimed = interview.mode === 'timed'
  const question = isTimed ? interview.questions[interview.questions.length - 1] : interview.questions[currentIdx]
  const isLast = !isTimed && currentIdx === interview.questions.length - 1
  const progressPct = isTimed ? 0 : Math.round((currentIdx / interview.questions.length) * 100)

  const autoSubmit = async (finalText) => {
    if (submittingRef.current) return
    if (!finalText || finalText.trim().length < 3) return
    submittingRef.current = true
    await doSubmit(finalText)
    submittingRef.current = false
  }

  const doSubmit = async (finalText) => {
    setSubmitting(true)
    setError('')
    try {
      recognitionRef.current?.stop()
      setListening(false)
      clearTimeout(silenceTimerRef.current)
      window.speechSynthesis?.cancel()

      const res = await api.submitAnswer({
        question_id: question.id,
        answer_text: finalText,
        time_taken_seconds: seconds,
        eye_contact_pct: Math.round(metrics.eyeContact),
        confidence_signal: Math.round(metrics.confidence),
      })

      // Defer moving on: show what went well/wrong in THIS answer first,
      // then either the user clicks Continue or it auto-advances shortly.
      pendingActionRef.current = async () => {
        if (isTimed) {
          setAnsweredCount((c) => c + 1)
          if (timeLeft !== null && timeLeft <= 8) {
            await finishTimedInterview()
            return
          }
          const nextQ = await api.nextQuestion(interview.id)
          setInterview((prev) => ({ ...prev, questions: [...prev.questions, nextQ] }))
          setSeconds(0)
        } else if (isLast) {
          await api.completeInterview(interview.id)
          navigate(`/results/${interview.id}`)
        } else {
          setCurrentIdx((i) => i + 1)
          setSeconds(0)
        }
      }
      setPendingFeedback(res.feedback)
      feedbackTimerRef.current = setTimeout(continueAfterFeedback, FEEDBACK_AUTO_CONTINUE_MS)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const continueAfterFeedback = async () => {
    clearTimeout(feedbackTimerRef.current)
    const action = pendingActionRef.current
    pendingActionRef.current = null
    setPendingFeedback(null)
    if (!action) return
    setSubmitting(true)
    try {
      await action()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const manualSubmit = () => {
    if (!transcript || transcript.trim().length < 3) {
      setError('Please speak your answer before continuing.')
      return
    }
    doSubmit(transcript.trim())
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  const answered = isTimed ? answeredCount : interview.questions.filter((_, i) => i < currentIdx).length

  const tlMin = timeLeft !== null ? String(Math.floor(timeLeft / 60)).padStart(2, '0') : '00'
  const tlSec = timeLeft !== null ? String(timeLeft % 60).padStart(2, '0') : '00'

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <div className="brand" style={{ fontSize: 18, marginBottom: 0 }}>SmartHire AI</div>
          <div className="muted" style={{ fontSize: 12 }}>{interview.job_title || interview.domain} interview session {isTimed ? '· Timed' : '· Practice'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ color: '#37d67a', fontSize: 13 }}>● Recording</span>
          <span className="timer">{isTimed ? `⏱ ${tlMin}:${tlSec}` : `${mm}:${ss}`}</span>
          <button className="btn" style={{ background: 'linear-gradient(90deg,#ff6b6b,#ff8e6b)' }}
                  onClick={() => isTimed ? finishTimedInterview() : navigate('/history')}>End</button>
        </div>
      </div>

      {!isTimed && (
        <div className="progress-bar-track" style={{ marginBottom: 20 }}>
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* LEFT: webcam + live analysis */}
        <div style={{ flex: '0 0 280px' }}>
          <div style={{ position: 'relative' }}>
            <video ref={videoRef} autoPlay muted playsInline className="webcam-preview" />
            <span style={{
              position: 'absolute', top: 10, left: 10, background: 'rgba(255,107,107,0.9)',
              color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
            }}>● LIVE</span>
          </div>
          {mediaError && <p className="error-text" style={{ fontSize: 12, marginTop: 8 }}>{mediaError}</p>}

          <div className="card" style={{ marginTop: 14, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>📡 LIVE ANALYSIS</div>
            <LiveMetric icon="👁" label="Eye Contact" value={metrics.eyeContact} color="linear-gradient(90deg,#6c8cff,#8b6cff)" />
            <LiveMetric icon="🎯" label="Attention" value={metrics.attention} color="linear-gradient(90deg,#37b7ff,#37d6d6)" />
            <LiveMetric icon="😊" label="Confidence" value={metrics.confidence} color="linear-gradient(90deg,#37d67a,#a0e637)" />
            <LiveMetric icon="🧑" label="Face Presence" value={metrics.facePresence} color="linear-gradient(90deg,#ffb84d,#ffd24d)" />
          </div>
        </div>

        {/* CENTER: question + voice transcript */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <div className="question-box" style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, letterSpacing: 1, color: 'var(--accent)' }}>● AIRA</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {speaking ? 'AIRA is speaking...' : listening ? 'AIRA is listening...' : 'Preparing next question...'}
            </div>
            <div className="chip" style={{ marginTop: 10 }}>
              {isTimed ? `QUESTION ${answeredCount + 1}` : `QUESTION ${currentIdx + 1} OF ${interview.questions.length}`} &middot; {question.category}
            </div>
            <h3 style={{ marginTop: 14, lineHeight: 1.5 }}>&ldquo;{question.question_text}&rdquo;</h3>
            <button type="button" className="btn-secondary btn" style={{ fontSize: 13, marginTop: 8 }}
                    onClick={() => speakQuestion(question.question_text)}>
              🔊 Repeat Question
            </button>
          </div>

          {pendingFeedback ? (
            <div className="card" style={{ borderColor: 'var(--warn)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>📝 Quick Feedback on That Answer</div>
                <span className="muted" style={{ fontSize: 11 }}>auto-continuing shortly...</span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div className="muted" style={{ fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>WHAT TO FIX</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7 }}>
                  {pendingFeedback.mistakes.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>

              <div>
                <div className="muted" style={{ fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>HOW TO IMPROVE</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: 'var(--accent-2)' }}>
                  {pendingFeedback.improvements.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>

              <button className="btn" style={{ marginTop: 14 }} onClick={continueAfterFeedback} disabled={submitting}>
                Continue →
              </button>
            </div>
          ) : (
            <div className="card" style={{ minHeight: 110 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: listening ? '#37d67a' : '#425',
                  boxShadow: listening ? '0 0 8px #37d67a' : 'none',
                }} />
                <span className="muted" style={{ fontSize: 13 }}>
                  {listening ? 'Listening... speak your answer now' : submitting ? 'Submitting your answer...' : 'Your answer will appear here as you speak'}
                </span>
              </div>
              <div style={{ fontSize: 15, minHeight: 40 }}>
                {transcript || <span className="muted">—</span>}
              </div>
            </div>
          )}

          {error && <div className="error-text">{error}</div>}

          {!pendingFeedback && (
            <div style={{ display: 'flex', gap: 10 }}>
              {!listening && !speaking && (
                <button type="button" className="btn-secondary btn" onClick={startListening}>🎙 Start Speaking</button>
              )}
              <button className="btn" onClick={manualSubmit} disabled={submitting || !transcript}>
                {submitting ? 'Submitting...' : isLast ? 'Finish Interview' : 'Submit & Next →'}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: session info + tip + how it works */}
        <div style={{ flex: '0 0 260px' }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="muted" style={{ fontSize: 11, letterSpacing: 1 }}>SESSION</div>
            <div style={{ marginTop: 8, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">Candidate</span><span>{user?.full_name || '-'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">Role</span><span>{interview.job_title || interview.domain}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">Answered</span><span>{isTimed ? answered : `${answered}/${interview.questions.length}`}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">Vision AI</span><span style={{ color: '#37d67a' }}>Ready</span></div>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="muted" style={{ fontSize: 11, letterSpacing: 1 }}>📍 TIP</div>
            <p style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>{TIPS[question.category] || TIPS.Technical}</p>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="muted" style={{ fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>HOW IT WORKS</div>
            <ul style={{ fontSize: 12, paddingLeft: 18, margin: 0, lineHeight: 2 }}>
              <li>Speak clearly into your microphone</li>
              <li>{SILENCE_AUTO_SUBMIT_MS / 1000}s of silence auto-submits your answer</li>
              <li>Click "Repeat Question" to re-hear it</li>
              {isTimed
                ? <li>AIRA keeps asking new questions until your time runs out</li>
                : <li>AIRA adapts scoring to your answers</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
