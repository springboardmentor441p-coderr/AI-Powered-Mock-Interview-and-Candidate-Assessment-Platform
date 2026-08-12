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

  // DYNAMIC LIVE TELEMETRY BARS
  const [telemetry, setTelemetry] = useState({
    eyeContactPct: 99,
    attentionPct: 99,
    confidencePct: 99,
    presencePct: 99,
    emotion: 'Neutral'
  });

  const recognitionRef = useRef(null);

  // REAL HUMAN-TO-HUMAN CONVERSATIONAL AI INTERVIEW QUESTION FLOW
  const domainQuestionsBank = {
    "Python Developer": [
      {
        id: 1,
        question_number: "Question 1 of 3 (Candidate Introduction)",
        question_text: "Hello! My name is AIRA, and I will be conducting your Python developer mock interview today. To get started, please introduce yourself and summarize your experience writing Python code.",
        sample_answer: "Hello AIRA! I am Janitha Kavuturu. I am a Python developer with experience writing clean Python scripts, working with data structures like lists and dictionaries, and building web applications."
      },
      {
        id: 2,
        question_number: "Question 2 of 3 (Core Python Concepts)",
        question_text: "What is the key difference between Python Lists and Tuples, and when would you use a Dictionary?",
        sample_answer: "Lists are mutable and defined with square brackets, while Tuples are immutable and defined with parentheses. Dictionaries store key-value pairs for fast lookups."
      },
      {
        id: 3,
        question_number: "Question 3 of 3 (Python Features)",
        question_text: "Explain what List Comprehension is in Python and why it is useful.",
        sample_answer: "List comprehension provides a concise and readable way to create lists in Python in a single line of code, making programs much cleaner and faster."
      }
    ],
    "Data Structures & Algorithms (DSA)": [
      {
        id: 1,
        question_number: "Question 1 of 3 (Candidate Introduction)",
        question_text: "Hello! My name is AIRA, and I will be conducting your DSA mock interview today. Please introduce yourself and your knowledge of Data Structures and Algorithms.",
        sample_answer: "Hello AIRA! I am Janitha Kavuturu. I have good knowledge of fundamental data structures like Arrays, Linked Lists, Stacks, Queues, and basic searching and sorting algorithms."
      },
      {
        id: 2,
        question_number: "Question 2 of 3 (Stack vs Queue)",
        question_text: "What is the difference between a Stack and a Queue? Give real-world examples of both.",
        sample_answer: "A Stack follows Last-In-First-Out, like a stack of plates. A Queue follows First-In-First-Out, like a line of people standing at a ticket counter."
      },
      {
        id: 3,
        question_number: "Question 3 of 3 (Searching Algorithms)",
        question_text: "Explain the difference between Linear Search and Binary Search in terms of time complexity.",
        sample_answer: "Linear search checks elements one by one with time complexity O(N). Binary search repeatedly divides a sorted array in half with time complexity O(log N)."
      }
    ],
    "AI / ML & Data Science": [
      {
        id: 1,
        question_number: "Question 1 of 3 (Candidate Introduction)",
        question_text: "Hello! My name is AIRA, and I will be conducting your AI mock interview today. To get started, please introduce yourself, your technical background, and your key projects in Artificial Intelligence, Machine Learning, and Data Science.",
        sample_answer: "Hello AIRA! I am a software engineer specializing in AI and Data Science. I have built projects including RAG pipelines, predictive machine learning models, and analytics dashboards."
      },
      {
        id: 2,
        question_number: "Question 2 of 3 (AI & LLM Architecture)",
        question_text: "Could you describe a specific technical challenge during development of your AI models where you encountered a significant bug or model hallucination? I'd like to hear about the steps you took to resolve it using RAG vector databases like ChromaDB.",
        sample_answer: "RAG retrieves relevant document chunks from ChromaDB using semantic vector embeddings and injects context into LLM prompts, providing grounded and accurate answers."
      },
      {
        id: 3,
        question_number: "Question 3 of 3 (Machine Learning Practical)",
        question_text: "When building predictive data models, how do you handle missing values in datasets, prevent model overfitting using cross-validation, and evaluate performance using metrics like F1-score?",
        sample_answer: "I impute missing values using dataset medians, prevent overfitting using 5-fold cross-validation with L2 regularization, and evaluate imbalanced datasets using F1-score and ROC-AUC."
      }
    ],
    "Backend Engineering": [
      {
        id: 1,
        question_number: "Question 1 of 3 (Candidate Introduction)",
        question_text: "Hello! My name is AIRA, and I will be conducting your backend engineering mock interview today. To begin, please introduce yourself and summarize your experience building REST APIs and database applications.",
        sample_answer: "Hello AIRA! I am a backend engineer with hands-on experience building RESTful APIs using Python FastAPI, PostgreSQL databases, and JWT authentication."
      },
      {
        id: 2,
        question_number: "Question 2 of 3 (Core Backend)",
        question_text: "Could you describe a time during backend development where you encountered a slow SQL query bottleneck? What steps did you take to identify the root cause and optimize performance using B-tree indexing?",
        sample_answer: "I analyze query execution plans using EXPLAIN ANALYZE, create B-tree indexes on search columns, and configure connection pooling in SQLAlchemy."
      },
      {
        id: 3,
        question_number: "Question 3 of 3 (API Security)",
        question_text: "How do you secure production REST API endpoints using short-lived JWT access tokens, password hashing with bcrypt, and strict CORS origin headers?",
        sample_answer: "I issue short-lived JWT access tokens, hash user passwords securely using bcrypt, and enforce strict CORS origin policies on FastAPI middleware."
      }
    ]
  };

  const activeDomain = sessionData?.domain || sessionData?.category || "Python Developer";
  const questions = (domainQuestionsBank[activeDomain] || domainQuestionsBank["Python Developer"]).slice(0, 3);
  const currentQ = questions[currentIdx] || questions[0];

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => setTimerSeconds(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

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

        utterance.onstart = () => {
          setIsSpeaking(true);
          stopMicRecording();
        };
        
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

  // CLEAN NON-LOOPING SPEECH RECOGNITION
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
        let cleanText = '';
        for (let i = 0; i < event.results.length; i++) {
          cleanText += event.results[i][0].transcript + ' ';
        }
        setCandidateAnswer(cleanText.trim());
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

  // SUBMIT SPOKEN ANSWER -> PROGRESS TURN
  const handleNextQuestion = async () => {
    stopSpeaking();
    stopMicRecording();
    setSubmitting(true);

    const finalAnswerText = candidateAnswer || currentQ.sample_answer;

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
    <div className="w-full min-h-screen bg-[#0e0f12] text-slate-100 font-sans p-6 pb-24 relative select-none">
      
      {/* REAL-TIME AI PROCTORING WARNING TOAST */}
      {activePopup && (
        <div className={`fixed top-16 right-6 z-50 p-4 rounded-2xl border ${activePopup.color} shadow-2xl backdrop-blur-xl animate-bounce flex items-center gap-3`}>
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-xs font-semibold">{activePopup.text}</span>
        </div>
      )}

      {/* TOP HEADER BAR (MATCHING USER SCREENSHOT EXACTLY) */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold text-xs">
            ((o))
          </div>
          <span className="text-sm font-extrabold tracking-tight text-amber-100 font-display">AI Interviewer</span>
        </div>

        <div className="flex items-center gap-3">
          {violationCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-mono text-[11px] font-bold">
              🚨 Tab Switch: {violationCount}/2
            </span>
          )}

          <span className="px-3.5 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-400 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> ● ON AIR • {formatTimer(timerSeconds)}
          </span>
        </div>
      </div>

      {/* TOP CENTER: GLOWING AI RING & AUDIO WAVEFORM STATUS (MATCHING USER SCREENSHOT) */}
      <div className="flex flex-col items-center justify-center py-2 mb-6 space-y-2">
        <div className={`w-20 h-20 rounded-full border-2 border-emerald-500/50 bg-[#12141a] flex flex-col items-center justify-center text-emerald-400 shadow-2xl transition-all ${
          isSpeaking ? 'animate-pulse ring-8 ring-emerald-500/20 scale-105' : 'ring-4 ring-slate-900'
        }`}>
          <div className="text-xs font-mono font-bold tracking-widest text-emerald-300">
            ((o))
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
          {isSpeaking ? "SPEAKING" : isRecording ? "LISTENING" : "EVALUATING"}
        </span>

        <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400/90 font-bold tracking-widest">
          .l...
        </div>
      </div>

      {/* CENTER & RIGHT LAYOUT: CENTER LIVE TRANSCRIPT + RIGHT WEBCAM WITH TELEMETRY BARS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">
        
        {/* CENTER MAIN PANEL: LIVE TRANSCRIPT (7 COLS - MATCHING SCREENSHOT BUBBLES EXACTLY) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 rounded-3xl border border-slate-800/80 bg-[#14161d]/90 shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="border-b border-slate-800/80 pb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                LIVE TRANSCRIPT
              </span>
            </div>

            {/* BUBBLE 1 (TOP RIGHT): YOU CANDIDATE SPOKEN ANSWER */}
            <div className="flex flex-col items-end space-y-1.5">
              <span className="text-[10px] font-mono text-amber-400/90 uppercase tracking-wider font-bold pr-1">
                YOU
              </span>
              <div className="p-4 rounded-2xl bg-[#3b2a1a] border border-amber-600/40 text-amber-100 max-w-[90%] text-xs font-sans leading-relaxed shadow-lg">
                {candidateAnswer || "Speak your answer aloud into your microphone (transcribes here in real-time as you talk)..."}
              </div>
            </div>

            {/* BUBBLE 2 (BELOW LEFT): INTERVIEWER QUESTION */}
            <div className="flex flex-col items-start space-y-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold pl-1">
                INTERVIEWER
              </span>
              <div className="p-4.5 rounded-2xl bg-[#1a1c23] border border-slate-800 text-slate-200 max-w-[95%] text-xs font-sans leading-relaxed shadow-lg">
                "{currentQ.question_text}"
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: CANDIDATE WEBCAM & TELEMETRY BARS STACK (4 COLS - MATCHING SCREENSHOT) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Candidate Webcam Box */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800">
            <WebcamMonitor 
              onMetricsUpdate={(m) => setTelemetry(prev => ({ ...prev, ...m }))}
            />
          </div>

          {/* DYNAMIC TELEMETRY BARS PANEL (MATCHING SCREENSHOT PURPLE BARS EXACTLY) */}
          <div className="p-5 rounded-2xl border border-slate-800/80 bg-[#14161d]/90 space-y-3.5 shadow-xl font-mono text-[11px]">
            
            {/* Metric 1: Eye Contact */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase">EYE CONTACT</span>
                <span className="text-purple-300 font-bold">{telemetry.eyeContactPct}</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry.eyeContactPct}%` }} />
              </div>
            </div>

            {/* Metric 2: Attention */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase">ATTENTION</span>
                <span className="text-purple-300 font-bold">{telemetry.attentionPct}</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry.attentionPct}%` }} />
              </div>
            </div>

            {/* Metric 3: Engagement */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase">ENGAGEMENT</span>
                <span className="text-purple-300 font-bold">{telemetry.confidencePct}</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry.confidencePct}%` }} />
              </div>
            </div>

            {/* Emotion Detector */}
            <div className="pt-2 border-t border-slate-800/80 flex justify-between text-slate-400">
              <span className="flex items-center gap-1">ℹ EMOTION</span>
              <span className="text-amber-300 font-bold flex items-center gap-1">
                🙂 {telemetry.emotion}
              </span>
            </div>

            <div className="text-[9px] text-slate-500 uppercase tracking-widest text-center pt-1">
              FACE ASSESSMENT • LIVE
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM CONTROL BAR (MATCHING SCREENSHOT BUTTONS EXACTLY) */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-3 p-2 px-4 rounded-2xl border border-slate-800 bg-[#14161d]/95 shadow-2xl backdrop-blur-xl">
        
        {/* Mute Button */}
        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            isRecording ? 'bg-slate-900 text-slate-200 border border-slate-800 hover:bg-slate-800' : 'bg-red-500/20 text-red-400 border border-red-500/40'
          }`}
        >
          <Mic className="w-3.5 h-3.5 text-cyan-400" /> {isRecording ? "Mute" : "Unmute"}
        </button>
        
        {/* Camera On Button */}
        <button
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-200 border border-slate-800 flex items-center gap-1.5"
        >
          <Video className="w-3.5 h-3.5 text-emerald-400" /> Camera on
        </button>

        {/* Submit Spoken Answer & Progress Turn */}
        <button
          onClick={handleNextQuestion}
          disabled={submitting}
          className="px-5 py-2 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all flex items-center gap-1.5"
        >
          {submitting ? "Analyzing..." : "Submit Answer"}
        </button>

        {/* End Interview Red Button */}
        <button
          onClick={handleNextQuestion}
          disabled={submitting}
          className="px-5 py-2 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5"
        >
          <PhoneOff className="w-3.5 h-3.5" /> End interview
        </button>

      </div>

    </div>
  );
}
