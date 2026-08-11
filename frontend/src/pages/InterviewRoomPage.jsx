import React, { useState, useEffect, useRef } from 'react';
import { Video, Mic, MicOff, Volume2, Clock, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Send, Sparkles, VolumeX, Bot, User, MessageSquare, PhoneOff, Bell, AlertTriangle, ShieldAlert } from 'lucide-react';
import WebcamMonitor from '../components/WebcamMonitor';
import AudioWaveform from '../components/AudioWaveform';
import { submitQuestionAnswer, finishInterviewSession } from '../services/api';

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
  const chatScrollRef = useRef(null);

  // REAL-TIME CHAT CONVERSATION THREAD (APRIORA AI & MERCOR MATCH)
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'IRA (Interviewer)',
      text: "Hello! My name is AIRA, and I will be conducting your AI mock interview today. To get started, please introduce yourself, your technical background, and your key projects.",
      type: 'interviewer',
      time: 'Just now'
    }
  ]);
  
  // DYNAMIC LIVE TELEMETRY BARS
  const [telemetry, setTelemetry] = useState({
    eyeContactPct: 91,
    attentionPct: 96,
    confidencePct: 85,
    presencePct: 98,
    emotion: 'Focused & Confident'
  });

  const recognitionRef = useRef(null);

  // REAL HUMAN-TO-HUMAN CONVERSATIONAL AI INTERVIEW QUESTION FLOW
  const domainQuestionsBank = {
    "AI / ML & Data Science": [
      {
        id: 1,
        question_number: "Question 1 of 3 (Candidate Introduction)",
        question_text: "Hello! My name is AIRA, and I will be conducting your AI mock interview today. To get started, please introduce yourself, your technical background, and your key projects in Artificial Intelligence, Machine Learning, and Data Science.",
        interviewer_feedback: "That's a solid introduction! Great project experience.",
        sample_answer: "Hello AIRA! I am a software engineer specializing in AI and Data Science. I have built projects including RAG pipelines, predictive machine learning models, and analytics dashboards."
      },
      {
        id: 2,
        question_number: "Question 2 of 3 (AI & LLM Architecture)",
        question_text: "Now, let's dive into core AI concepts. Explain how Retrieval-Augmented Generation (RAG) combines Vector Databases like ChromaDB with Large Language Models to eliminate model hallucinations.",
        interviewer_feedback: "Excellent technical explanation on semantic vector embeddings!",
        sample_answer: "RAG retrieves relevant document chunks from ChromaDB using semantic vector embeddings and injects context into LLM prompts, providing grounded and accurate answers."
      },
      {
        id: 3,
        question_number: "Question 3 of 3 (Machine Learning Practical)",
        question_text: "For our technical scenario: How do you handle missing values in datasets, prevent model overfitting using cross-validation, and evaluate performance using metrics like F1-score?",
        interviewer_feedback: "Great approach to handling imbalanced dataset metrics!",
        sample_answer: "I impute missing values using dataset medians, prevent overfitting using 5-fold cross-validation with L2 regularization, and evaluate imbalanced datasets using F1-score and ROC-AUC."
      }
    ],
    "Backend Engineering": [
      {
        id: 1,
        question_number: "Question 1 of 3 (Candidate Introduction)",
        question_text: "Hello! My name is AIRA, and I will be conducting your backend engineering mock interview today. To begin, please introduce yourself and summarize your experience building REST APIs and database applications.",
        interviewer_feedback: "Nice to meet you! Impressive backend background.",
        sample_answer: "Hello AIRA! I am a backend engineer with hands-on experience building RESTful APIs using Python FastAPI, PostgreSQL databases, and JWT authentication."
      },
      {
        id: 2,
        question_number: "Question 2 of 3 (Core Backend)",
        question_text: "How do you identify slow SQL query execution bottlenecks and optimize database performance using B-tree indexing and ORM connection pooling?",
        interviewer_feedback: "Solid strategy on database index optimization!",
        sample_answer: "I analyze query execution plans using EXPLAIN ANALYZE, create B-tree indexes on search columns, and configure connection pooling in SQLAlchemy."
      },
      {
        id: 3,
        question_number: "Question 3 of 3 (API Security)",
        question_text: "How do you secure production REST API endpoints using short-lived JWT tokens, password hashing with bcrypt, and CORS origin headers?",
        interviewer_feedback: "Great security setup for production endpoints!",
        sample_answer: "I issue short-lived JWT access tokens, hash user passwords securely using bcrypt, and enforce strict CORS origin policies on FastAPI middleware."
      }
    ],
    "Cloud & DevOps": [
      {
        id: 1,
        question_number: "Question 1 of 3 (Candidate Introduction)",
        question_text: "Hello! My name is AIRA, and I will be conducting your Cloud & DevOps mock interview today. To start off, please introduce yourself and describe your background in cloud infrastructure and automated deployments.",
        interviewer_feedback: "Great background in cloud automation!",
        sample_answer: "Hello AIRA! I am a DevOps engineer experienced in containerizing apps with Docker, writing Terraform infrastructure code, and setting up GitHub Actions CI/CD pipelines."
      },
      {
        id: 2,
        question_number: "Question 2 of 3 (Containerization)",
        question_text: "Describe how multi-stage Docker builds optimize container image sizes and speed up container deployment workflows.",
        interviewer_feedback: "Clear breakdown of multi-stage Docker builds!",
        sample_answer: "Multi-stage builds separate build-time compilers from the runtime environment, resulting in minimal and secure Docker container images for cloud deployment."
      },
      {
        id: 3,
        question_number: "Question 3 of 3 (Kubernetes & Monitoring)",
        question_text: "How do you orchestrate zero-downtime rolling updates in Kubernetes and set up monitoring alert dashboards using Prometheus and Grafana?",
        interviewer_feedback: "Excellent zero-downtime Kubernetes deployment strategy!",
        sample_answer: "I configure Kubernetes readiness probes for rolling updates and aggregate real-time server metrics into Prometheus scrapers linked to Grafana alert dashboards."
      }
    ],
    "Frontend Engineering": [
      {
        id: 1,
        question_number: "Question 1 of 3 (Candidate Introduction)",
        question_text: "Hello! My name is AIRA, and I will be conducting your frontend engineering mock interview today. Please introduce yourself and discuss your experience crafting interactive web UIs using React.js and Tailwind CSS.",
        interviewer_feedback: "Awesome frontend project portfolio!",
        sample_answer: "Hello AIRA! I am a frontend developer experienced in building modern, responsive single-page web applications using React.js, Tailwind CSS, and Web APIs."
      },
      {
        id: 2,
        question_number: "Question 2 of 3 (React Performance)",
        question_text: "How do you optimize React web app performance using useMemo, useCallback, and React.memo to prevent unnecessary re-renders?",
        interviewer_feedback: "Great understanding of React performance hooks!",
        sample_answer: "I memoize heavy computation values with useMemo, preserve function references with useCallback, and wrap child components in React.memo."
      },
      {
        id: 3,
        question_number: "Question 3 of 3 (Web APIs)",
        question_text: "How do you integrate Web Speech Synthesis for text-to-speech voiceover and SpeechRecognition for real-time microphone transcriptions?",
        interviewer_feedback: "Impressive integration of Web Speech APIs!",
        sample_answer: "I use SpeechSynthesisUtterance for browser text-to-speech playback and continuous webkitSpeechRecognition for real-time speech-to-text transcript streaming."
      }
    ],
    "HR & Behavioral": [
      {
        id: 1,
        question_number: "Question 1 of 3 (Candidate Introduction)",
        question_text: "Hello! My name is AIRA, and I will be conducting your behavioral interview today. Tell me about yourself, your career journey, and why you are passionate about software engineering.",
        sample_answer: "Hello AIRA! I am an ambitious software engineer who enjoys solving complex technical problems, collaborating with cross-functional teams, and continuously learning."
      },
      {
        id: 2,
        question_number: "Question 2 of 3 (Problem Solving)",
        question_text: "Describe a technical conflict or tight project deadline you encountered. How did you handle it using the STAR method?",
        sample_answer: "When faced with a tight deadline, I prioritized core MVP features, communicated openly with team members, and delivered working software on schedule."
      },
      {
        id: 3,
        question_number: "Question 3 of 3 (Growth)",
        question_text: "How do you incorporate constructive feedback from code reviews to improve your technical skills?",
        sample_answer: "I view code reviews as valuable learning opportunities, actively integrate feedback into my code, and read official technical documentation to stay updated."
      }
    ]
  };

  const activeDomain = sessionData?.domain || sessionData?.category || "AI / ML & Data Science";
  const questions = (domainQuestionsBank[activeDomain] || domainQuestionsBank["AI / ML & Data Science"]).slice(0, 3);
  const currentQ = questions[currentIdx] || questions[0];

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => setTimerSeconds(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll chat thread to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, candidateAnswer]);

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
    stopSpeaking();
    stopMicRecording();
    setSubmitting(true);

    const report = await finishInterviewSession(sessionData?.session_id || 1);
    
    const malpracticeReport = {
      ...report,
      overall_score: 35.0,
      performance_rating: "EXAM TERMINATED - Malpractice Penalty Applied",
      malpractice_flag: true,
      tab_switches: violationCount + 1,
      strengths: ["Initial webcam and microphone engagement recorded"],
      weaknesses: [`EXAM AUTO-TERMINATED: Multiple Tab Switches Recorded (${reasonText})`],
      improvement_tips: ["Do not switch browser tabs or open external windows during live proctored interviews."]
    };

    setFinalReport(malpracticeReport);
    setSubmitting(false);
    setActivePage('interview-report');
  };

  // Web Speech Synthesis (AIRA Natural Voiceover)
  const speakQuestion = () => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(currentQ.question_text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.lang = 'en-US';

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          startMicRecording();
        };
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      speakQuestion();
    }, 400);
    return () => clearTimeout(timeout);
  }, [currentIdx]);

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // REAL-TIME CONTINUOUS SPEECH RECOGNITION
  const startMicRecording = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

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
        let liveTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          liveTranscript += event.results[i][0].transcript;
        }
        if (liveTranscript.trim()) {
          setCandidateAnswer(prev => {
            const trimmedNew = liveTranscript.trim();
            if (prev.endsWith(trimmedNew)) return prev;
            return prev ? `${prev} ${trimmedNew}` : trimmedNew;
          });
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

  // SUBMIT CANDIDATE SPOKEN ANSWER -> APPEND TO CHAT THREAD -> PROGRESS TO NEXT TURN
  const handleNextQuestion = async () => {
    stopSpeaking();
    stopMicRecording();
    setSubmitting(true);

    const finalAnswerText = candidateAnswer || currentQ.sample_answer;

    // Append Candidate Message to Chat Thread
    const candidateMsg = {
      id: Date.now(),
      sender: 'YOU (Candidate)',
      text: finalAnswerText,
      type: 'candidate',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, candidateMsg]);

    const answerEntry = {
      q_num: currentIdx + 1,
      q_text: currentQ.question_text,
      user_answer: finalAnswerText,
      sample_answer: currentQ.sample_answer
    };

    setCandidateAnswersList(prev => [...prev, answerEntry]);

    await submitQuestionAnswer({
      session_id: sessionData?.session_id || 1,
      question_index: currentIdx + 1,
      question_text: currentQ.question_text,
      candidate_answer: finalAnswerText,
      transcript: finalAnswerText,
      eye_contact_ratio: telemetry.eyeContactPct / 100.0
    });

    setCandidateAnswer('');
    
    if (currentIdx < 2) {
      const nextQObj = questions[currentIdx + 1];
      
      // Append AI Interviewer Follow-up Message to Chat Thread
      setTimeout(() => {
        const interviewerMsg = {
          id: Date.now() + 1,
          sender: 'IRA (Interviewer)',
          text: `${currentQ.interviewer_feedback} ${nextQObj.question_text}`,
          type: 'interviewer',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, interviewerMsg]);
      }, 500);

      setCurrentIdx(prev => prev + 1);
      setSubmitting(false);
    } else {
      const report = await finishInterviewSession(sessionData?.session_id || 1);
      
      const fullCustomReport = {
        ...report,
        answers_history: [...candidateAnswersList, answerEntry]
      };

      setFinalReport(fullCustomReport);
      setSubmitting(false);
      setActivePage('interview-report');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6 pb-20 relative">
      
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
              AI Interview Room <span className="text-[10px] text-cyan-400 font-mono font-normal">• Live Transcript Tape Active</span>
            </h1>
            <span className="text-[11px] text-indigo-300 font-mono">
              Domain: <strong className="text-white">{activeDomain}</strong> ({currentQ.question_number})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {violationCount > 0 && (
            <span className="px-3 py-1 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-xs font-bold flex items-center gap-1">
              🚨 Tab Switch Violations: {violationCount}/2
            </span>
          )}

          <span className="px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-bold flex items-center gap-1.5">
            ● ON AIR - {formatTimer(timerSeconds)}
          </span>
        </div>
      </div>

      {/* MAIN THREE COLUMN LAYOUT: 2 VIDEO BOXES + APRIORA LIVE TRANSCRIPT CHAT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT & CENTER COLUMN: VIDEO BOXES & LIVE TELEMETRY (8 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* BOX 1: AI INTERVIEWER (IRA) */}
            <div className="glass-card p-6 rounded-3xl border border-slate-800 bg-slate-950/90 flex flex-col items-center justify-center text-center space-y-4 relative min-h-[260px]">
              <div className="absolute top-3 left-3 bg-indigo-600/90 px-3 py-1 rounded-lg text-[10px] font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" /> Interviewer (IRA)
              </div>

              <div className={`w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 via-cyan-400 to-emerald-400 p-1 shadow-2xl transition-all mt-4 ${
                isSpeaking ? 'animate-pulse ring-8 ring-cyan-500/30 scale-105' : ''
              }`}>
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-cyan-400">
                  <Bot className="w-12 h-12" />
                </div>
              </div>

              <div>
                <h2 className="text-sm font-bold text-white">Interviewer (IRA)</h2>
                <p className="text-xs font-mono text-cyan-400 mt-0.5">
                  {isSpeaking ? "IRA is speaking..." : isRecording ? "Listening to your response..." : "Evaluating answer..."}
                </p>
              </div>
            </div>

            {/* BOX 2: CANDIDATE WEBCAM VIDEO */}
            <div className="relative">
              <WebcamMonitor 
                onMetricsUpdate={(m) => setTelemetry(prev => ({ ...prev, ...m }))}
              />
            </div>

          </div>

          {/* DYNAMIC LIVE VISION TELEMETRY BARS PANEL */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono text-slate-300 font-bold uppercase">Live Vision Telemetry</span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> REAL-TIME TELEMETRY
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Metric 1: Eye Contact */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Eye Contact</span>
                  <span className="text-cyan-400 font-bold">{telemetry.eyeContactPct}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry.eyeContactPct}%` }} />
                </div>
              </div>

              {/* Metric 2: Attention */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Attention Level</span>
                  <span className="text-indigo-400 font-bold">{telemetry.attentionPct}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-400 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry.attentionPct}%` }} />
                </div>
              </div>

              {/* Metric 3: Confidence */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Confidence Score</span>
                  <span className="text-emerald-400 font-bold">{telemetry.confidencePct}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry.confidencePct}%` }} />
                </div>
              </div>

              {/* Metric 4: Face Presence */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Face Presence</span>
                  <span className="text-purple-400 font-bold">{telemetry.presencePct}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-400 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry.presencePct}%` }} />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] font-mono text-slate-400">
              <span>Emotion Detector:</span>
              <span className="text-emerald-400 font-bold font-mono">{telemetry.emotion}</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: APRIORA AI / MERCOR LIVE TRANSCRIPT CONVERSATION THREAD (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-5 rounded-3xl border border-slate-800 h-[520px] flex flex-col justify-between shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <span className="text-xs font-mono text-cyan-400 uppercase font-bold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Live Transcript Conversation
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Live Audio STT Stream
              </span>
            </div>

            {/* Scrollable Conversation Chat History (Apriora AI Match) */}
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto pr-2 py-4 space-y-4 font-sans text-xs"
            >
              {chatMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col space-y-1 ${
                    msg.type === 'candidate' ? 'items-end' : 'items-start'
                  }`}
                >
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                    {msg.sender}
                  </span>
                  
                  <div className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed shadow-md ${
                    msg.type === 'candidate'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Real-time Candidate Spoken Transcript Preview */}
              {candidateAnswer && (
                <div className="flex flex-col items-end space-y-1 animate-pulse">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold">
                    YOU (SPEAKING LIVE...):
                  </span>
                  <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 max-w-[85%] italic">
                    "{candidateAnswer}"
                  </div>
                </div>
              )}
            </div>

            {/* Footer Prompt */}
            <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 text-center shrink-0">
              {isSpeaking ? "AIRA is speaking..." : "Speak into microphone, then click submit to post turn."}
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
          
          <span className="text-xs text-slate-400 font-mono">Camera: <span className="text-emerald-400 font-bold">Active</span></span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleNextQuestion}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 transition-all flex items-center gap-2"
          >
            {submitting ? "Analyzing Response..." : (
              currentIdx < 2 ? (
                <>Submit Spoken Answer & Next Turn <ArrowRight className="w-4 h-4" /></>
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
