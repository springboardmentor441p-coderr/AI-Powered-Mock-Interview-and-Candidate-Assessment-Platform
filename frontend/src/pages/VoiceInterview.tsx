import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { interviewService } from '../services/interview'

type AgentState =
  | 'Idle'
  | 'Initializing'
  | 'Greeting'
  | 'Speaking'
  | 'Listening'
  | 'Processing'
  | 'Waiting for AI'
  | 'Next Question'
  | 'Interview Finished'

export default function VoiceInterview() {
  const location = useLocation()
  const navigate = useNavigate()

  // Get state passed from config page
  const {
    sessionId: stateSessionId,
    initialQuestionId,
    initialQuestionText,
    jobRole,
    difficulty,
    interviewType,
  } = location.state || {}

  const sessionId = stateSessionId || 1

  // Dialogue & Engine State
  const [agentState, setAgentState] = useState<AgentState>('Initializing')
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestionText || 'Setting up your interview...')
  const [currentQuestionId, setCurrentQuestionId] = useState<number>(initialQuestionId || 0)
  const [roundNumber, setRoundNumber] = useState(1)
  const [questionNumber, setQuestionNumber] = useState(1)
  
  // Timer States
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  
  // Manual text fallback state
  const [manualText, setManualText] = useState('')
  const [isTextFallback, setIsTextFallback] = useState(false)
  const [transcriptText, setTranscriptText] = useState('')

  // Voice recording controls
  const [isRecording, setIsRecording] = useState(false)
  const [canRecord, setCanRecord] = useState(false)
  const [interimText, setInterimText] = useState('')

  const isRecordingRef = useRef(false)
  isRecordingRef.current = isRecording

  const isPausedRef = useRef(false)
  isPausedRef.current = isPaused

  // Speech APIs Refs
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const waveCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameId = useRef<number | null>(null)
  const silenceTimeoutRef = useRef<any | null>(null)

  // Initialize Speech Synthesis and Speech Recognition
  useEffect(() => {
    if (!location.state) {
      // If reached this page directly, redirect back
      navigate('/interview/prep')
      return
    }

    synthRef.current = window.speechSynthesis

    // Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-US'

      rec.onstart = () => {
        setAgentState('Listening')
        clearSilenceTimer()
      }

      rec.onresult = (evt: any) => {
        let finalTranscript = ''
        let interimTranscript = ''
        for (let i = evt.resultIndex; i < evt.results.length; ++i) {
          const transcript = evt.results[i][0].transcript
          if (evt.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }
        if (finalTranscript) {
          setTranscriptText((prev) => prev + finalTranscript)
          setInterimText('')
        } else {
          setInterimText(interimTranscript)
        }
      }

      rec.onerror = (evt: any) => {
        logger("Recognition error: " + evt.error)
        if (evt.error !== 'no-speech') {
          setIsTextFallback(true) // Switch to text fallback if mic permission or system error occurs
          setAgentState('Idle')
          setIsRecording(false)
        }
      }

      rec.onend = () => {
        if (isRecordingRef.current && !isPausedRef.current) {
          try {
            rec.start()
          } catch (e) {}
        }
      }

      recognitionRef.current = rec
    } else {
      setIsTextFallback(true) // Browser doesn't support Web Speech API
    }

    // Start Greeting and Speak first question
    setTimeout(() => {
      setAgentState('Greeting')
      const greeting = `Welcome to your ${difficulty} ${interviewType} round for the ${jobRole} position. Let's begin with the first question: ${currentQuestion}`
      speakText(greeting)
    }, 1000)

    // Start Interview Timer
    const interval = setInterval(() => {
      if (!isPaused && agentState !== 'Interview Finished') {
        setTimerSeconds((prev) => prev + 1)
      }
    }, 1000)

    // Wave animation start
    startWaveAnimation()

    return () => {
      clearInterval(interval)
      clearSilenceTimer()
      stopSpeech()
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [])

  // Logger helper
  const logger = (msg: string) => {
    console.log(`[VoiceAgent] ${msg}`)
  }

  // Text-To-Speech (Speak Question)
  const speakText = (text: string) => {
    if (!synthRef.current) return

    stopSpeech()
    setAgentState('Speaking')
    setCanRecord(false)
    setIsRecording(false)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    
    // Choose a professional-sounding default English voice if possible
    const voices = synthRef.current.getVoices()
    const enVoices = voices.filter(v => v.lang.startsWith('en') || v.lang.startsWith('EN'))
    const premiumVoice = enVoices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || enVoices[0]
    if (premiumVoice) {
      utterance.voice = premiumVoice
    }

    utterance.onend = () => {
      if (!isPausedRef.current) {
        setAgentState('Idle')
        setCanRecord(true)
      }
    }

    utterance.onerror = () => {
      setAgentState('Idle')
    }

    utteranceRef.current = utterance
    synthRef.current.speak(utterance)
  }

  const stopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (err) {}
    }
  }

  const clearSilenceTimer = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
    }
  }

  // Process & Submit User Answer
  const handleSendTranscript = async (textToSubmit: string) => {
    if (!textToSubmit.trim()) return

    stopListening()
    setIsRecording(false)
    setCanRecord(false)
    setAgentState('Processing')
    
    try {
      const response = await interviewService.submitAnswer({
        session_id: sessionId,
        question_id: currentQuestionId,
        answer_text: textToSubmit,
      })

      const { next_action, next_question, next_question_id } = response.data

      if (next_action === 'GENERATE_REPORT') {
        setAgentState('Interview Finished')
        speakText("Thank you. The interview is now complete. I am generating your performance evaluation report now.")
        setTimeout(() => {
          navigate(`/interview/report/${sessionId}`)
        }, 5000)
      } else {
        // Advance round/question parameters
        if (next_action === 'PROCEED_TO_ROUND_2') {
          setRoundNumber(2)
          setQuestionNumber(1)
          speakText("Congratulations, you have passed the Round 1 threshold. Let's proceed to Round 2 which will focus on your project architecture, tech choices, and optimization.")
        } else {
          setQuestionNumber((prev) => prev + 1)
        }

        if (next_question && next_question_id) {
          setCurrentQuestion(next_question)
          setCurrentQuestionId(next_question_id)
          setTranscriptText('')
          setInterimText('')
          setManualText('')
          
          // Wait briefly, then speak next question
          setTimeout(() => {
            speakText(next_question)
          }, 1500)
        }
      }
    } catch (err) {
      alert('Error submitting answer. Please retry.')
      setAgentState('Idle')
      setCanRecord(true)
    }
  }

  const handleRecordToggle = () => {
    if (isRecording) {
      // Stop recording and submit
      setIsRecording(false)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {}
      }
      setAgentState('Processing')
      
      const fullText = (transcriptText + ' ' + interimText).trim()
      handleSendTranscript(fullText)
    } else {
      // Start recording
      setTranscriptText('')
      setInterimText('')
      setIsRecording(true)
      setAgentState('Listening')
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (err) {
          console.error(err)
        }
      }
    }
  }

  // Canvas Voice Wave Animation
  const startWaveAnimation = () => {
    const canvas = waveCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let phase = 0

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Determine wave configurations based on state
      let numWaves = 4
      let amplitude = 15
      let speed = 0.08
      let color = 'rgba(99, 102, 241, 0.4)' // Indigo

      if (agentState === 'Speaking') {
        amplitude = 25
        speed = 0.12
        color = 'rgba(139, 92, 246, 0.5)' // Purple
      } else if (agentState === 'Listening') {
        amplitude = 35
        speed = 0.15
        color = 'rgba(16, 185, 129, 0.5)' // Emerald Green
      } else if (agentState === 'Processing' || agentState === 'Waiting for AI') {
        amplitude = 8
        speed = 0.05
        color = 'rgba(245, 158, 11, 0.4)' // Amber
      } else if (agentState === 'Idle') {
        amplitude = 2
        speed = 0.01
        color = 'rgba(148, 163, 184, 0.2)' // Slate
      }

      ctx.lineWidth = 2
      phase += speed

      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath()
        const currentAmp = amplitude * (1 - i / numWaves)
        const curPhase = phase + i * (Math.PI / 4)
        
        ctx.strokeStyle = color

        for (let x = 0; x < canvas.width; x++) {
          const y =
            canvas.height / 2 +
            Math.sin(x * 0.015 + curPhase) *
              currentAmp *
              Math.sin(x * Math.PI / canvas.width) // fade out at edges
          
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      }

      animationFrameId.current = requestAnimationFrame(render)
    }

    render()
  }

  // Voice Controls Implementation
  const handlePauseToggle = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false)
      logger('Resuming session...')
      interviewService.controlInterview(sessionId, 'resume')
      speakText(currentQuestion)
    } else {
      // Pause
      setIsPaused(true)
      stopSpeech()
      stopListening()
      setIsRecording(false)
      setCanRecord(false)
      clearSilenceTimer()
      setAgentState('Idle')
      interviewService.controlInterview(sessionId, 'pause')
      logger('Session Paused.')
    }
  }

  const handleStopInterview = () => {
    if (confirm('Are you sure you want to stop the interview? Your progress will be ended.')) {
      stopSpeech()
      stopListening()
      interviewService.controlInterview(sessionId, 'stop')
      navigate('/dashboard')
    }
  }

  const handleRepeatQuestion = () => {
    speakText(currentQuestion)
  }

  const handleRetryQuestion = () => {
    setTranscriptText('')
    setManualText('')
    speakText(currentQuestion)
  }

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-[#070514] text-slate-100 font-sans flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-lg flex flex-col gap-8 shadow-2xl shadow-indigo-950/20 relative">
        
        {/* Connection status and Round Indicator */}
        <div className="flex justify-between items-center text-sm font-semibold tracking-wider uppercase text-slate-400">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
            <span>Connection: {isPaused ? 'Paused' : 'Active'}</span>
          </div>
          <div className="flex gap-4">
            <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full">
              Round {roundNumber}
            </span>
            <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              Q{questionNumber} of 5
            </span>
            <span className="bg-slate-500/10 border border-slate-500/20 px-3 py-1 rounded-full font-mono text-slate-300">
              {formatTime(timerSeconds)}
            </span>
          </div>
        </div>

        {/* Center Panel: Wave and State */}
        <div className="flex flex-col items-center justify-center py-10 relative">
          
          {/* Wave Canvas */}
          <canvas
            ref={waveCanvasRef}
            width={600}
            height={150}
            className="w-full max-w-lg h-32 opacity-80"
          />

          {/* Glowing state badge */}
          <div className={`mt-6 px-5 py-2.5 rounded-full text-sm font-semibold border shadow-md transition-all ${
            agentState === 'Speaking'
              ? 'bg-purple-600/10 border-purple-500/30 text-purple-400'
              : agentState === 'Listening'
              ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400'
              : agentState === 'Processing' || agentState === 'Waiting for AI'
              ? 'bg-amber-600/10 border-amber-500/30 text-amber-400'
              : 'bg-slate-600/10 border-slate-500/30 text-slate-400'
          }`}>
            State: {agentState}
          </div>
        </div>

        {/* Display Current Question */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col gap-2 shadow-inner">
          <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Interview Question</span>
          <p className="text-lg md:text-xl font-medium leading-relaxed text-white">
            {currentQuestion}
          </p>
        </div>

        {/* Response Box / Text Fallback Option */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {isTextFallback ? 'Enter your response below' : 'Live Transcript'}
            </span>
            <button
              onClick={() => setIsTextFallback(!isTextFallback)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
            >
              Switch to {isTextFallback ? 'Voice Mode' : 'Text Input Fallback'}
            </button>
          </div>

          {isTextFallback ? (
            <div className="flex gap-2">
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Type your technical response here..."
                rows={3}
                className="w-full bg-[#100e28] border border-white/10 rounded-xl p-3 focus:outline-none focus:border-indigo-500 text-slate-100 text-sm resize-none"
              />
              <button
                onClick={() => handleSendTranscript(manualText)}
                disabled={!manualText.trim() || agentState === 'Processing'}
                className={`px-6 rounded-xl font-semibold text-sm transition-all ${
                  !manualText.trim() || agentState === 'Processing'
                    ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                Submit
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="bg-[#100e28]/50 border border-white/5 rounded-xl p-4 min-h-[4rem] text-sm text-slate-200 flex items-center">
                {transcriptText + (interimText ? ' ' + interimText : '') || (
                  <span className="text-slate-400 italic">
                    {isRecording ? 'Listening... start speaking.' : 'Click "Start Voice Recording" to speak.'}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRecordToggle}
                  disabled={!canRecord || agentState === 'Processing'}
                  className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-sm border transition-all shadow-lg ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-500 border-rose-500 text-white animate-pulse shadow-rose-950/50'
                      : !canRecord || agentState === 'Processing'
                      ? 'bg-slate-800 text-slate-500 border-white/5 cursor-not-allowed shadow-none'
                      : 'bg-[#5d3efd] hover:bg-[#4f31ea] border-[#5d3efd] text-white shadow-indigo-950/50'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <svg className="w-5 h-5 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <rect x="4" y="4" width="12" height="12" rx="2" />
                      </svg>
                      Stop Recording & Submit Answer
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                      </svg>
                      Start Voice Recording
                    </>
                  )}
                </button>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {isRecording 
                    ? 'Recording live. Click stop when you have completed saying your answer.' 
                    : canRecord 
                    ? 'Click to start recording your response.' 
                    : 'Wait for agent to finish speaking...'
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Bar */}
        <div className="border-t border-white/10 pt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={handlePauseToggle}
            className={`py-3 rounded-xl font-semibold text-sm border transition-all ${
              isPaused
                ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            {isPaused ? 'Resume Session' : 'Pause Session'}
          </button>

          <button
            onClick={handleRepeatQuestion}
            disabled={agentState === 'Processing'}
            className="py-3 bg-white/5 border border-white/10 rounded-xl font-semibold text-sm text-slate-300 hover:bg-white/10 disabled:opacity-50"
          >
            Repeat Question
          </button>

          <button
            onClick={handleRetryQuestion}
            disabled={agentState === 'Processing'}
            className="py-3 bg-white/5 border border-white/10 rounded-xl font-semibold text-sm text-slate-300 hover:bg-white/10 disabled:opacity-50"
          >
            Retry Answer
          </button>

          <button
            onClick={() => handleSendTranscript('I am unsure about this topic, please proceed to the next question.')}
            disabled={agentState === 'Processing'}
            className="py-3 bg-white/5 border border-white/10 rounded-xl font-semibold text-sm text-slate-300 hover:bg-white/10 disabled:opacity-50"
          >
            Skip Question
          </button>

          <button
            onClick={handleStopInterview}
            className="py-3 col-span-2 md:col-span-1 bg-rose-600/10 border border-rose-500/20 rounded-xl font-semibold text-sm text-rose-400 hover:bg-rose-600/20"
          >
            Stop Interview
          </button>
        </div>

      </div>
    </div>
  )
}
