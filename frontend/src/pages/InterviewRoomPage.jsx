import React, { useState, useEffect, useRef } from 'react';
import { Video, Mic, MicOff, Volume2, Clock, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Send, Sparkles, VolumeX, Bot, User, MessageSquare, PhoneOff, Bell, AlertTriangle, ShieldAlert } from 'lucide-react';
import WebcamMonitor from '../components/WebcamMonitor';
import AudioWaveform from '../components/AudioWaveform';
import { submitQuestionAnswer, finishInterviewSession } from '../services/api';
import { nexusAgent } from '../services/aiAgent';

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

  // DYNAMIC LIVE TELEMETRY BARS
  const [telemetry, setTelemetry] = useState({
    eyeContactPct: 91,
    attentionPct: 96,
    confidencePct: 85,
    presencePct: 98,
    emotion: 'Focused & Confident'
  });

  const recognitionRef = useRef(null);

  const activeDomain = sessionData?.domain || sessionData?.category || "Python Developer";
  const activeDifficulty = sessionData?.difficulty || "Medium";

  // COMPREHENSIVE 5-QUESTION ADAPTIVE BANKS PER ROLE & DIFFICULTY
  const domainQuestionsBank = {
    "Python Developer": {
      "Easy": [
        {
          id: 1,
          question_number: "Question 1 of 5 (Candidate Introduction)",
          question_text: `Hello! My name is ${nexusAgent.name}. Welcome to your Python developer interview! To get started, please introduce yourself and tell me what technologies or projects you like working on.`,
          sample_answer: "Hello! I am Janitha Kavuturu. I love working with Python, building web applications, machine learning models, and clean backend APIs."
        },
        {
          id: 2,
          question_number: "Question 2 of 5 (Lists vs Tuples)",
          question_text: "What is the key difference between Python Lists and Tuples, and when would you use a Dictionary?",
          sample_answer: "Lists are mutable and defined with square brackets, while Tuples are immutable and defined with parentheses. Dictionaries store key-value pairs for fast lookups."
        },
        {
          id: 3,
          question_number: "Question 3 of 5 (Python Dictionaries)",
          question_text: "How do Python Dictionaries work under the hood, and how do you retrieve values safely using get()?",
          sample_answer: "Dictionaries store key-value pairs indexed by hashable keys. The get() method returns a default value if a key doesn't exist without raising KeyError."
        },
        {
          id: 4,
          question_number: "Question 4 of 5 (Control Flow & Loops)",
          question_text: "What is the difference between range() and enumerate() when iterating through lists in a for loop?",
          sample_answer: "range() generates numbers, whereas enumerate() yields both index numbers and item values simultaneously during iteration."
        },
        {
          id: 5,
          question_number: "Question 5 of 5 (List Comprehensions)",
          question_text: "Explain what List Comprehension is in Python and why it is useful.",
          sample_answer: "List comprehension offers a compact one-line syntax to filter and transform iterables, like [x for x in numbers if x % 2 == 0]."
        }
      ],
      "Medium": [
        {
          id: 1,
          question_number: "Question 1 of 5 (Candidate Introduction)",
          question_text: `Hello! My name is ${nexusAgent.name}. Welcome to your Medium-level Python interview! Please introduce yourself, your favorite tech stacks, and your core projects.`,
          sample_answer: "Hello! I am Janitha Kavuturu. I build Python applications using object-oriented principles, modular packages, and FastAPI backend frameworks."
        },
        {
          id: 2,
          question_number: "Question 2 of 5 (OOP & Decorators)",
          question_text: "What is a Python Decorator, and how does @classmethod differ from @staticmethod in a class?",
          sample_answer: "Decorators wrap functions to extend behavior. @classmethod receives cls as first argument, while @staticmethod behaves like a regular function without self or cls."
        },
        {
          id: 3,
          question_number: "Question 3 of 5 (Generators & Memory)",
          question_text: "How do Python Generators using yield save memory compared to returning regular lists?",
          sample_answer: "Generators evaluate items lazily one at a time using yield iterators, keeping memory consumption low O(1) compared to loading large lists into RAM."
        },
        {
          id: 4,
          question_number: "Question 4 of 5 (Exception Handling)",
          question_text: "How do try-except-else-finally blocks work when handling resource cleanups?",
          sample_answer: "try runs code, except catches errors, else executes if no exceptions occur, and finally ALWAYS runs to release open file/DB handles."
        },
        {
          id: 5,
          question_number: "Question 5 of 5 (Context Managers)",
          question_text: "Explain how the 'with' statement works under the hood using __enter__ and __exit__ dunder methods.",
          sample_answer: "The 'with' statement invokes __enter__ to acquire resources and automatically calls __exit__ to guarantee cleanup even if exceptions occur."
        }
      ],
      "Hard": [
        {
          id: 1,
          question_number: "Question 1 of 5 (Candidate Introduction)",
          question_text: `Hello! My name is ${nexusAgent.name}. Welcome to your Senior Python interview! Introduce yourself and detail your technical experience.`,
          sample_answer: "Hello! I am a senior Python engineer experienced in asyncio concurrency, GIL bottlenecks, metaprogramming, and high-throughput microservices."
        },
        {
          id: 2,
          question_number: "Question 2 of 5 (Python GIL & Multi-threading)",
          question_text: "Explain how the Global Interpreter Lock (GIL) impacts CPU-bound vs I/O-bound tasks in multi-threading vs multiprocessing.",
          sample_answer: "The GIL prevents multi-threaded CPython from executing CPU-bound bytecode in parallel. CPU-bound tasks require multiprocessing, while I/O-bound tasks benefit from threading/asyncio."
        },
        {
          id: 3,
          question_number: "Question 3 of 5 (Asyncio Event Loops)",
          question_text: "How does asyncio's cooperative event loop manage non-blocking socket I/O using async and await keywords?",
          sample_answer: "Asyncio runs a single-threaded event loop that pauses tasks at yield points (await) during socket I/O and context-switches to ready tasks without OS thread overhead."
        },
        {
          id: 4,
          question_number: "Question 4 of 5 (Metaclasses)",
          question_text: "What is a Metaclass in Python, and how does __new__ differ from __init__ in type instantiation?",
          sample_answer: "Metaclasses are classes of classes defined by type. __new__ creates the class object in memory before creation, whereas __init__ initializes attributes after creation."
        },
        {
          id: 5,
          question_number: "Question 5 of 5 (Garbage Collection & Ref Counting)",
          question_text: "How does CPython's reference counting combined with cyclical garbage collection detect reference cycles?",
          sample_answer: "CPython decrements ref counts to deallocate objects at 0, while the cyclic GC uses generation-based inspection to find unreferenceable circular clusters."
        }
      ]
    },
    "Data Structures & Algorithms (DSA)": {
      "Easy": [
        {
          id: 1,
          question_number: "Question 1 of 5 (Candidate Introduction)",
          question_text: `Hello! My name is ${nexusAgent.name}. Welcome to your DSA interview! Introduce yourself and share what data structures you enjoy working with.`,
          sample_answer: "Hello! I am Janitha Kavuturu. I have knowledge of basic data structures like Arrays, Linked Lists, Stacks, Queues, and searching algorithms."
        },
        {
          id: 2,
          question_number: "Question 2 of 5 (Arrays vs Linked Lists)",
          question_text: "What is the difference between an Array and a Singly Linked List in memory layout and insertion time complexity?",
          sample_answer: "Arrays store elements in contiguous memory with O(1) index access. Linked Lists store node pointers across heap memory with O(1) head insertion."
        },
        {
          id: 3,
          question_number: "Question 3 of 5 (Stack vs Queue)",
          question_text: "Explain the difference between a Stack (LIFO) and a Queue (FIFO) with real-world examples.",
          sample_answer: "Stacks use Last-In-First-Out like undo history or plate stacks. Queues use First-In-First-Out like printer jobs or ticket checkout lines."
        },
        {
          id: 4,
          question_number: "Question 4 of 5 (Linear Search vs Binary Search)",
          question_text: "How does Binary Search achieve O(log N) time complexity compared to Linear Search O(N)?",
          sample_answer: "Binary search repeatedly cuts a sorted search space in half by comparing middle elements, whereas Linear search checks items sequentially."
        },
        {
          id: 5,
          question_number: "Question 5 of 5 (Bubble vs Selection Sort)",
          question_text: "What is the main idea behind Bubble Sort vs Selection Sort?",
          sample_answer: "Bubble sort repeatedly swaps adjacent out-of-order pairs, while Selection sort repeatedly finds minimum elements and places them in sorted positions."
        }
      ]
    },
    "AI / ML & Data Science": {
      "Easy": [
        {
          id: 1,
          question_number: "Question 1 of 5 (Candidate Introduction)",
          question_text: `Hello! My name is ${nexusAgent.name}. Welcome to your AI & Data Science interview! Introduce yourself and your background in Artificial Intelligence.`,
          sample_answer: "Hello! I am Janitha Kavuturu. I am passionate about AI and Machine Learning, working with Pandas, NumPy, and predictive models."
        },
        {
          id: 2,
          question_number: "Question 2 of 5 (Supervised vs Unsupervised ML)",
          question_text: "What is the difference between Supervised Learning (Classification) and Unsupervised Learning (Clustering)?",
          sample_answer: "Supervised learning trains on labeled target output data, whereas Unsupervised learning discovers hidden patterns in unlabeled input datasets."
        },
        {
          id: 3,
          question_number: "Question 3 of 5 (Overfitting vs Underfitting)",
          question_text: "How do you detect model Overfitting vs Underfitting on training and validation loss curves?",
          sample_answer: "Overfitting shows high training accuracy but poor validation accuracy. Underfitting shows poor performance on both training and test datasets."
        },
        {
          id: 4,
          question_number: "Question 4 of 5 (Pandas Data Cleaning)",
          question_text: "How do you handle missing values in Pandas using dropna() vs fillna()?",
          sample_answer: "dropna() removes rows containing missing values, while fillna() replaces NaN entries with column means or medians."
        },
        {
          id: 5,
          question_number: "Question 5 of 5 (Confusion Matrix)",
          question_text: "What are Precision and Recall metrics derived from a Confusion Matrix?",
          sample_answer: "Precision measures true positive accuracy among predicted positives, while Recall measures true positives retrieved out of total actual positive cases."
        }
      ]
    }
  };

  const domainBank = domainQuestionsBank[activeDomain] || domainQuestionsBank["Python Developer"];
  const difficultyBank = domainBank[activeDifficulty] || domainBank["Medium"] || domainBank["Easy"];
  const questions = difficultyBank.slice(0, 5);
  const currentQ = questions[currentIdx] || questions[0];

  // REAL-TIME CONTINUOUS CONVERSATION THREAD CHAT HISTORY
  const [chatThread, setChatThread] = useState([
    {
      id: 1,
      sender: `INTERVIEWER (${nexusAgent.name})`,
      text: currentQ.question_text,
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
    nexusAgent.stopSpeaking();
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

  // Trigger speech synthesis via nexusAgent
  const speakCurrentQuestion = (textToSpeak) => {
    nexusAgent.speak(
      textToSpeak || currentQ.question_text,
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
      speakCurrentQuestion(currentQ.question_text);
    }, 400);
    return () => clearTimeout(timeout);
  }, [currentIdx]);

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

  // REAL-TIME AI AGENT SUBMIT TURN HANDLER
  const handleNextQuestion = async () => {
    nexusAgent.stopSpeaking();
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
      q_text: currentQ.question_text,
      user_answer: finalAnswerText,
      sample_answer: currentQ.sample_answer,
      is_answered: isAnswerProvided
    };

    const updatedAnswers = [...candidateAnswersList, answerEntry];
    setCandidateAnswersList(updatedAnswers);

    await submitQuestionAnswer({
      session_id: sessionData?.session_id || 1,
      question_index: currentIdx + 1,
      question_text: currentQ.question_text,
      candidate_answer: finalAnswerText,
      transcript: finalAnswerText,
      eye_contact_ratio: telemetry.eyeContactPct / 100.0
    });

    setCandidateAnswer('');
    
    if (currentIdx < 4) {
      const nextQObj = questions[currentIdx + 1];
      const nextInterviewerText = nexusAgent.generateAdaptivePrompt(spokenText, nextQObj);

      // Append Next Interviewer Question Bubble to Chat Thread
      setTimeout(() => {
        const interviewerBubble = {
          id: Date.now() + 1,
          sender: `INTERVIEWER (${nexusAgent.name})`,
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
      const evalResult = nexusAgent.evaluateCandidateSession(updatedAnswers, telemetry);

      const fullCustomReport = {
        ...report,
        overall_score: evalResult.score,
        performance_rating: evalResult.rating,
        category: activeDomain,
        difficulty: activeDifficulty,
        eye_contact_score: telemetry.eyeContactPct,
        attention_score: telemetry.attentionPct,
        confidence_score: telemetry.confidencePct,
        answers_history: updatedAnswers,
        strengths: evalResult.answeredCount > 0 ? [
          `Answered ${evalResult.answeredCount} out of 5 questions in ${activeDomain} (${activeDifficulty} level)`,
          `Maintained ${telemetry.eyeContactPct}% eye contact and ${telemetry.attentionPct}% attention focus`,
          `Demonstrated microphone communication across ${nexusAgent.name} turns`
        ] : [
          `Attempted 5-question proctored interview session`,
          `Webcam and microphone hardware connected successfully`
        ],
        weaknesses: evalResult.answeredCount < 5 ? [
          `Candidate skipped ${5 - evalResult.answeredCount} questions without speaking`,
          `Ensure you speak full structured answers into your microphone for every turn`
        ] : [
          `Elaborate further on real-world memory and execution trade-offs`,
          `Provide deeper code-level execution steps during live explanations`
        ],
        improvement_tips: [
          `Make sure to speak clear answers for all 5 interview questions`,
          `Maintain high eye contact with the camera while answering technical scenario questions`
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
              {nexusAgent.name} Room <span className="text-[10px] text-cyan-400 font-mono font-normal">• Live Adaptive Thread</span>
            </h1>
            <span className="text-[11px] text-indigo-300 font-mono">
              Domain: <strong className="text-white">{activeDomain}</strong> ({activeDifficulty} Level — {currentQ.question_number})
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

      {/* MAIN TWO-COLUMN LAYOUT: LEFT (AI AGENT + CHAT THREAD), RIGHT (WEBCAM + TELEMETRY BARS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: NEXUS AI AGENT AVATAR & SCROLLABLE CHAT THREAD (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* AI Agent Avatar Panel */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 bg-slate-950/90 flex flex-col items-center justify-center text-center space-y-2 relative min-h-[180px]">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 via-cyan-400 to-emerald-400 p-1 shadow-2xl transition-all ${
              isSpeaking ? 'animate-pulse ring-8 ring-cyan-500/30 scale-105' : ''
            }`}>
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-cyan-400">
                <Bot className="w-10 h-10" />
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-white tracking-wide">{nexusAgent.name}</h2>
              <p className="text-xs font-mono text-cyan-400 mt-0.5">
                {isSpeaking ? `${nexusAgent.name} is speaking prompt...` : isRecording ? `${nexusAgent.name} is listening...` : "Evaluating response..."}
              </p>
            </div>
          </div>

          {/* SCROLLABLE REAL-TIME CONVERSATION CHAT THREAD (INTERVIEWER LEFT, YOU RIGHT) */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3 shadow-xl h-[380px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
              <span className="text-xs font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-400" /> Real-Time {nexusAgent.name} Stream
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> {nexusAgent.name} Active
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
          </div>

        </div>

        {/* RIGHT COLUMN: CANDIDATE WEBCAM & DYNAMIC LIVE VISION TELEMETRY BARS */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Candidate Webcam Box */}
          <div className="relative">
            <WebcamMonitor 
              onMetricsUpdate={(m) => setTelemetry(prev => ({ ...prev, ...m }))}
            />
          </div>

          {/* DYNAMIC LIVE TELEMETRY BARS */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono text-slate-300 font-bold uppercase">Live Vision Telemetry</span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> FACE ASSESSMENT - LIVE
              </span>
            </div>

            {/* Metric 1: Eye Contact */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Eye Contact</span>
                <span className="text-cyan-400 font-bold font-mono">{telemetry.eyeContactPct}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry.eyeContactPct}%` }} />
              </div>
            </div>

            {/* Metric 2: Attention */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Attention Level</span>
                <span className="text-indigo-400 font-bold font-mono">{telemetry.attentionPct}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-400 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry.attentionPct}%` }} />
              </div>
            </div>

            {/* Metric 3: Confidence */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Confidence Score</span>
                <span className="text-emerald-400 font-bold font-mono">{telemetry.confidencePct}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry.confidencePct}%` }} />
              </div>
            </div>

            {/* Metric 4: Face Presence */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Face Presence</span>
                <span className="text-purple-400 font-bold font-mono">{telemetry.presencePct}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-400 h-full rounded-full transition-all duration-500" style={{ width: `${telemetry.presencePct}%` }} />
              </div>
            </div>

            {/* Emotion Detector */}
            <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] font-mono text-slate-400">
              <span>Emotion Detector:</span>
              <span className="text-emerald-400 font-bold font-mono">{telemetry.emotion}</span>
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
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all flex items-center gap-2"
          >
            {submitting ? "AI Agent Processing..." : (
              currentIdx < 4 ? (
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
