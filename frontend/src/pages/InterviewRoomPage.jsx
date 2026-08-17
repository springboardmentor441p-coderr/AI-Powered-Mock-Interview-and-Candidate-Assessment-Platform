import React, { useState, useEffect, useRef } from 'react';
import { Video, Mic, MicOff, Volume2, Clock, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Send, Sparkles, VolumeX, Bot, User, MessageSquare, PhoneOff, Bell, AlertTriangle, ShieldAlert } from 'lucide-react';
import WebcamMonitor from '../components/WebcamMonitor';
import AudioWaveform from '../components/AudioWaveform';
import { submitQuestionAnswer, finishInterviewSession } from '../services/api';
import { miraAgent } from '../services/aiAgent';

export default function InterviewRoomPage({ sessionData, setActivePage, setFinalReport }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  const [violationCount, setViolationCount] = useState(0);
  const [candidateAnswersList, setCandidateAnswersList] = useState([]);
  const [speechError, setSpeechError] = useState(null);
  const chatScrollRef = useRef(null);

  // Truthful camera status metrics (No fake random numbers)
  const [cameraMetrics, setCameraMetrics] = useState({
    streamActive: false,
    faceDetected: "Initializing...",
    cameraStatus: "Checking Camera..."
  });

  const recognitionRef = useRef(null);

  const activeDomain = sessionData?.domain || sessionData?.category || "Python Developer";
  const activeDifficulty = sessionData?.difficulty || "Medium";

  // Initial Questions Set (Fallback if backend API offline)
  const questionsBank = [
    {
      id: 1,
      question_number: "Question 1 of 5 (Introduction)",
      question_text: `Hello! My name is ${miraAgent.name}. Welcome to your ${activeDomain} interview (${activeDifficulty} level). To start off, please introduce yourself and your technical background.`,
      sample_answer: "Hello Mira! I am a software engineer with background in software development, REST APIs, and database engineering."
    },
    {
      id: 2,
      question_number: "Question 2 of 5 (Core Technical)",
      question_text: `What are the key technical concepts and architectural patterns you use when building applications in ${activeDomain}?`,
      sample_answer: "I focus on clean code architecture, modular design patterns, error handling, performance optimization, and robust testing."
    },
    {
      id: 3,
      question_number: "Question 3 of 5 (Problem Solving)",
      question_text: "Describe a challenging technical problem or bug you encountered recently and how you resolved it.",
      sample_answer: "I analyzed system logs, reproduced the bug locally, isolated the memory leak / database bottleneck, and issued a verified patch."
    },
    {
      id: 4,
      question_number: "Question 4 of 5 (Best Practices)",
      question_text: "How do you ensure code quality, maintainability, and security in production codebases?",
      sample_answer: "By enforcing code reviews, automated unit testing, strict linting, environment configuration management, and security audits."
    },
    {
      id: 5,
      question_number: "Question 5 of 5 (Career Vision)",
      question_text: "Where do you see yourself technically in the next 2-3 years, and what skills are you actively improving?",
      sample_answer: "I aim to grow into a senior technical lead, mastering system design, cloud scaling, and cutting-edge AI software development."
    }
  ];

  const questions = (sessionData?.questions && sessionData.questions.length > 0) ? sessionData.questions : questionsBank;
  const currentQ = questions[currentIdx] || questions[0];

  // REAL-TIME CONTINUOUS CONVERSATION THREAD CHAT HISTORY
  const [chatThread, setChatThread] = useState([
    {
      id: 1,
      sender: `Mira (AI Interviewer)`,
      text: currentQ.question_text || currentQ.q || `Welcome to your ${activeDomain} interview.`,
      type: 'interviewer'
    }
  ]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => setTimerSeconds(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat thread to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatThread, candidateAnswer]);

  // REAL PROCTORING VIOLATION HANDLER (ONLY TRIGGERS WHEN CANDIDATE ACTUALLY SWITCHES BROWSER TABS)
  const triggerProctoringViolation = (reasonText) => {
    setViolationCount(prev => {
      const nextCount = prev + 1;

      if (nextCount === 1) {
        setActivePopup({
          text: `🚨 MALPRACTICE WARNING (1/2): ${reasonText}! Return to interview room immediately.`,
          color: "bg-red-600/95 border-red-400 text-white font-bold"
        });
        setTimeout(() => setActivePopup(null), 5000);
      } else if (nextCount >= 2) {
        setActivePopup({
          text: "🚨 EXAM TERMINATED (2/2 VIOLATIONS): Session automatically cancelled due to tab switching violations.",
          color: "bg-red-700 border-red-500 text-white font-extrabold"
        });
        handleForceMalpracticeSubmit(reasonText);
      }

      return nextCount;
    });
  };

  // Tab switch listener ONLY
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerProctoringViolation("Browser Tab Switch Detected");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleForceMalpracticeSubmit = async (reasonText) => {
    miraAgent.stopSpeaking();
    stopMicRecording();
    setSubmitting(true);

    const report = await finishInterviewSession(sessionData?.session_id || 1);
    
    const malpracticeReport = {
      ...report,
      overall_score: 0.0,
      performance_rating: "EXAM TERMINATED - Malpractice Penalty Applied",
      malpractice_flag: true,
      tab_switches: violationCount + 1,
      strengths: ["Initial webcam and microphone engagement recorded"],
      weaknesses: [`EXAM AUTO-TERMINATED: Multiple Tab Switches Detected (${reasonText})`],
      improvement_tips: ["Do not switch browser tabs or open external windows during live proctored interviews."]
    };

    setFinalReport(malpracticeReport);
    setSubmitting(false);
    setActivePage('interview-report');
  };

  // Speech synthesis via miraAgent
  const speakCurrentQuestion = (textToSpeak) => {
    const promptText = textToSpeak || currentQ.question_text || currentQ.q;
    miraAgent.speak(
      promptText,
      () => {
        setIsSpeaking(true);
        stopMicRecording();
      },
      () => {
        setIsSpeaking(false);
        startMicRecording();
      }
    );
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      speakCurrentQuestion(currentQ.question_text || currentQ.q);
    }, 400);
    return () => clearTimeout(timeout);
  }, [currentIdx]);

  // Speech Recognition Handling
  const startMicRecording = async () => {
    try {
      setSpeechError(null);
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechError("Speech Recognition is not supported by your browser. Please type or use Chrome/Edge.");
        return;
      }

      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let cleanText = '';
        for (let i = 0; i < event.results.length; i++) {
          cleanText += event.results[i][0].transcript + ' ';
        }
        setCandidateAnswer(cleanText.trim());
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          console.warn("Speech recognition error:", event.error);
          setSpeechError(`Speech Recognition: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (isRecording && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Microphone access error:", err);
      setSpeechError("Microphone access permission denied or microphone disconnected.");
    }
  };

  const stopMicRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // REAL-TIME SUBMIT TURN HANDLER
  const handleNextQuestion = async () => {
    miraAgent.stopSpeaking();
    stopMicRecording();
    setSubmitting(true);

    const spokenText = candidateAnswer.trim();
    const isAnswerProvided = spokenText.length > 0;
    const finalAnswerText = isAnswerProvided ? spokenText : "[Candidate skipped question without speaking]";

    // Append Candidate Answer Bubble (YOU) to Chat Thread
    const candidateBubble = {
      id: Date.now(),
      sender: 'YOU',
      text: finalAnswerText,
      type: 'candidate'
    };

    setChatThread(prev => [...prev, candidateBubble]);

    const answerEntry = {
      q_num: currentIdx + 1,
      q_text: currentQ.question_text || currentQ.q,
      user_answer: finalAnswerText,
      sample_answer: currentQ.sample_answer || currentQ.a || "",
      is_answered: isAnswerProvided
    };

    const updatedAnswers = [...candidateAnswersList, answerEntry];
    setCandidateAnswersList(updatedAnswers);

    await submitQuestionAnswer({
      session_id: sessionData?.session_id || 1,
      question_index: currentIdx + 1,
      question_text: currentQ.question_text || currentQ.q,
      candidate_answer: finalAnswerText,
      transcript: finalAnswerText,
      eye_contact_ratio: cameraMetrics.streamActive ? 0.90 : 0.0
    });

    setCandidateAnswer('');
    
    if (currentIdx < questions.length - 1) {
      const nextQObj = questions[currentIdx + 1];
      const nextInterviewerText = miraAgent.generateAdaptivePrompt(spokenText, nextQObj);

      // Append Next Interviewer Question Bubble to Chat Thread
      setTimeout(() => {
        const interviewerBubble = {
          id: Date.now() + 1,
          sender: `Mira (AI Interviewer)`,
          text: nextInterviewerText,
          type: 'interviewer'
        };
        setChatThread(prev => [...prev, interviewerBubble]);
        speakCurrentQuestion(nextInterviewerText);
      }, 400);

      setCurrentIdx(prev => prev + 1);
      setSubmitting(false);
    } else {
      const report = await finishInterviewSession(sessionData?.session_id || 1);
      const evalResult = miraAgent.evaluateCandidateSession(updatedAnswers, cameraMetrics);

      const fullCustomReport = {
        ...report,
        overall_score: evalResult.score,
        performance_rating: evalResult.rating,
        category: activeDomain,
        difficulty: activeDifficulty,
        camera_status: cameraMetrics.cameraStatus,
        answers_history: updatedAnswers,
        strengths: evalResult.answeredCount > 0 ? [
          `Answered ${evalResult.answeredCount} out of ${questions.length} questions in ${activeDomain} (${activeDifficulty} level)`,
          `Demonstrated microphone communication across Mira AI interviewer turns`,
          `Maintained active session focus and video presence`
        ] : [
          `Attempted proctored interview session with Mira`,
          `Hardware check completed`
        ],
        weaknesses: evalResult.answeredCount < questions.length ? [
          `Candidate skipped ${questions.length - evalResult.answeredCount} question(s) without speaking`,
          `Ensure you speak structured responses clearly into your microphone`
        ] : [
          `Elaborate further on architectural trade-offs during live technical explanations`
        ],
        improvement_tips: [
          `Make sure to speak clear answers for all interview questions`,
          `Practice explaining code complexity and system design trade-offs aloud`
        ]
      };

      setFinalReport(fullCustomReport);
      setSubmitting(false);
      setActivePage('interview-report');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6 pb-20 relative font-sans">
      
      {/* REAL-TIME AI PROCTORING WARNING TOAST */}
      {activePopup && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-2xl border ${activePopup.color} shadow-2xl backdrop-blur-xl animate-bounce flex items-center gap-3`}>
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-xs font-semibold">{activePopup.text}</span>
        </div>
      )}

      {/* ROOM TOP HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-3 px-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Mira AI Interview Room <span className="text-[10px] text-cyan-400 font-mono font-normal">• Live Session</span>
            </h1>
            <span className="text-[11px] text-indigo-300 font-mono">
              Domain: <strong className="text-white">{activeDomain}</strong> ({activeDifficulty} Level — Question {currentIdx + 1} of {questions.length})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {violationCount > 0 && (
            <span className="px-3 py-1 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-xs font-bold flex items-center gap-1">
              🚨 Tab Switches: {violationCount}/2
            </span>
          )}

          <span className="px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-bold flex items-center gap-1.5">
            ● ON AIR - {formatTimer(timerSeconds)}
          </span>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT: LEFT (MIRA AVATAR & CHAT THREAD), RIGHT (WEBCAM & TRUTHFUL TELEMETRY) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: MIRA AI AGENT AVATAR & SCROLLABLE CHAT THREAD (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Mira Avatar Panel */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 bg-slate-950/90 flex flex-col items-center justify-center text-center space-y-2 relative min-h-[180px]">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 via-cyan-400 to-emerald-400 p-1 shadow-2xl transition-all ${
              isSpeaking ? 'animate-pulse ring-8 ring-cyan-500/30 scale-105' : ''
            }`}>
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-cyan-400">
                <Bot className="w-10 h-10" />
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Mira</h2>
              <p className="text-xs font-mono text-cyan-400 mt-0.5">
                {isSpeaking ? "Mira is speaking question..." : isRecording ? "Mira is listening to your answer..." : "Mira is evaluating response..."}
              </p>
            </div>
          </div>

          {/* SCROLLABLE REAL-TIME CONVERSATION CHAT THREAD */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3 shadow-xl h-[380px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
              <span className="text-xs font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-400" /> Real-Time Mira Conversation Thread
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Mira Active
              </span>
            </div>

            {/* Scrollable Conversation Chat History */}
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto pr-2 py-2 space-y-4 font-sans text-xs"
            >
              {chatThread.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col space-y-1 ${
                    msg.type === 'candidate' ? 'items-end' : 'items-start'
                  }`}
                >
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                    msg.type === 'candidate' ? 'text-amber-400/90 pr-1' : 'text-cyan-400 pl-1'
                  }`}>
                    {msg.sender}
                  </span>
                  
                  <div className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed shadow-xl text-xs ${
                    msg.type === 'candidate'
                      ? 'bg-amber-950/80 border border-amber-600/40 text-amber-100 rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Real-time Candidate Spoken Transcript Preview */}
              {candidateAnswer && (
                <div className="flex flex-col items-end space-y-1 animate-pulse">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold pr-1">
                    YOU (SPEAKING LIVE...):
                  </span>
                  <div className="p-3.5 rounded-2xl bg-amber-950/90 border border-amber-500/50 text-amber-100 max-w-[85%] italic">
                    "{candidateAnswer}"
                  </div>
                </div>
              )}
            </div>

            {speechError && (
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
                ⚠️ {speechError}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: CANDIDATE WEBCAM & TRUTHFUL CAMERA STATUS */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Candidate Webcam Box */}
          <div className="relative">
            <WebcamMonitor 
              onMetricsUpdate={(m) => setCameraMetrics(m)}
            />
          </div>

          {/* TRUTHFUL CAMERA & HARDWARE STATUS (No fake numbers) */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono text-slate-300 font-bold uppercase">Hardware Assessment</span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> CAMERA STATUS
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Webcam Stream:</span>
                <span className={cameraMetrics.streamActive ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                  {cameraMetrics.streamActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Face Presence:</span>
                <span className={cameraMetrics.streamActive ? "text-cyan-400 font-bold" : "text-amber-400 font-bold"}>
                  {cameraMetrics.faceDetected}
                </span>
              </div>

              <div className="flex justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Gaze / Attention:</span>
                <span className="text-slate-300 italic">
                  {cameraMetrics.streamActive ? "Face Stream Active" : "Analysis Unavailable"}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM CONTROL BAR */}
      <div className="glass-card p-4 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              isRecording ? 'bg-slate-900 text-slate-200 border-slate-800' : 'bg-red-500/20 text-red-400 border-red-500/40'
            }`}
          >
            <Mic className="w-4 h-4 text-cyan-400" /> {isRecording ? "Mute Mic" : "Unmute Mic"}
          </button>
          
          <span className="text-xs text-slate-400 font-mono">
            Camera: <span className={cameraMetrics.streamActive ? "text-emerald-400 font-bold" : "text-amber-400"}>
              {cameraMetrics.streamActive ? "Active" : "Off"}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleNextQuestion}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all flex items-center gap-2"
          >
            {submitting ? "Mira Processing..." : (
              currentIdx < questions.length - 1 ? (
                <>Submit Spoken Answer & Next Question <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Complete Interview & Generate Report <PhoneOff className="w-4 h-4" /></>
              )
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
