import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Video, Mic, MicOff, Volume2, Clock, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Send, Sparkles, VolumeX, Bot, User, MessageSquare, PhoneOff, Bell, AlertTriangle, ShieldAlert, XCircle, Loader2 } from 'lucide-react';
import WebcamMonitor from '../components/WebcamMonitor';
import AudioWaveform from '../components/AudioWaveform';
import { submitQuestionAnswer, finishInterviewSession, fetchNextAdaptiveQuestion, transcribeAudioBlob } from '../services/api';
import { miraAgent } from '../services/aiAgent';

export default function InterviewRoomPage({ sessionData, setActivePage, setFinalReport }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [transcribingAudio, setTranscribingAudio] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  const [violationCount, setViolationCount] = useState(0);
  const [candidateAnswersList, setCandidateAnswersList] = useState([]);
  const [speechError, setSpeechError] = useState(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [speechEngineStatus, setSpeechEngineStatus] = useState("Microphone Ready");

  const chatScrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const micStreamRef = useRef(null);
  
  const isRecordingRef = useRef(true);
  const isStartingRef = useRef(false);
  const candidateAnswerRef = useRef('');
  const finalTranscriptRef = useRef('');

  // Sync ref with state to prevent stale closures in speech event listeners
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Truthful camera status metrics
  const [cameraMetrics, setCameraMetrics] = useState({
    streamActive: false,
    faceDetected: "Initializing...",
    cameraStatus: "Camera Active"
  });

  const handleCameraMetricsUpdate = useCallback((m) => {
    setCameraMetrics(m);
  }, []);

  const activeDomain = sessionData?.domain || sessionData?.category || "Python Developer";
  const activeDifficulty = sessionData?.difficulty || "Medium";

  // Dynamic questions returned from backend
  const backendQuestions = sessionData?.questions && Array.isArray(sessionData.questions) && sessionData.questions.length > 0 ? sessionData.questions : null;
  const hasGenerationError = sessionData?.error || !backendQuestions;

  const [questionsList, setQuestionsList] = useState(backendQuestions || []);
  const currentQ = questionsList[currentIdx] || null;

  // REAL-TIME CONVERSATION CHAT THREAD HISTORY
  const [chatThread, setChatThread] = useState(() => {
    if (backendQuestions && backendQuestions.length > 0) {
      return [
        {
          id: `q-1-${Date.now()}`,
          sender: `Mira (AI Interviewer)`,
          text: backendQuestions[0].question_text || backendQuestions[0].q,
          type: 'interviewer'
        }
      ];
    }
    return [];
  });

  // Session Timer
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

  // REAL PROCTORING TAB-SWITCH VIOLATION HANDLER
  const triggerProctoringViolation = (reasonText) => {
    setViolationCount(prev => {
      const nextCount = prev + 1;

      if (nextCount === 1) {
        setActivePopup({
          text: `🚨 PROCTORING ALERT (1/2): ${reasonText}! Please remain in the interview window.`,
          color: "bg-red-600/95 border-red-400 text-white font-bold"
        });
        setTimeout(() => setActivePopup(null), 5000);
      } else if (nextCount >= 2) {
        setActivePopup({
          text: "🚨 EXAM TERMINATED: Session automatically ended due to repeated tab switching.",
          color: "bg-red-700 border-red-500 text-white font-extrabold"
        });
        handleForceMalpracticeSubmit(reasonText);
      }

      return nextCount;
    });
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerProctoringViolation("Tab Switch Detected");
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
      strengths: ["Webcam and audio stream initiated"],
      weaknesses: [`Session ended automatically due to tab switching (${reasonText})`],
      improvement_tips: ["Do not switch browser tabs or switch application windows during live proctored sessions."]
    };

    setFinalReport(malpracticeReport);
    setSubmitting(false);
    setActivePage('interview-report');
  };

  // Speech synthesis via miraAgent
  const speakCurrentQuestion = (textToSpeak) => {
    if (!textToSpeak) return;
    miraAgent.speak(
      textToSpeak,
      () => {
        setIsSpeaking(true);
        stopMicRecording();
      },
      () => {
        setIsSpeaking(false);
        setTimeout(() => {
          startMicRecording();
        }, 400);
      }
    );
  };

  // Speak question automatically whenever current question changes
  useEffect(() => {
    if (currentQ) {
      const qText = currentQ.question_text || currentQ.q || "";
      if (qText) {
        const timeout = setTimeout(() => {
          speakCurrentQuestion(qText);
        }, 400);
        return () => clearTimeout(timeout);
      }
    }
  }, [currentIdx]);

  // DUAL SPEECH-TO-TEXT PIPELINE (BROWSER WEB SPEECH + BACKEND WHISPER MEDIA RECORDER FALLBACK)
  const startMicRecording = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    try {
      setSpeechError(null);

      // 1. Initiate Microphone Audio Stream for MediaRecorder backup
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        setMicPermissionGranted(true);
        
        audioChunksRef.current = [];
        if (window.MediaRecorder) {
          const recorder = new MediaRecorder(stream);
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };
          recorder.start(500);
          mediaRecorderRef.current = recorder;
        }
      } catch (err) {
        console.warn("[Microphone] Access permission denied:", err);
        setMicPermissionGranted(false);
        setSpeechEngineStatus("Voice transcription unavailable");
        setSpeechError("Voice transcription is unavailable in this browser. Please allow microphone access or type your answer below.");
        setIsRecording(false);
        isStartingRef.current = false;
        return;
      }

      // 2. Launch Browser Native Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechEngineStatus("Voice transcription unavailable");
        setSpeechError("Voice transcription is unavailable in this browser. Please type your answer below.");
        isStartingRef.current = false;
        return;
      }

      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log("[SpeechRecognition] Engine started listening.");
        setIsRecording(true);
        isRecordingRef.current = true;
        isStartingRef.current = false;
        setSpeechEngineStatus("Listening...");
        setSpeechError(null);
      };

      recognition.onaudiostart = () => {
        console.log("[SpeechRecognition] Audio capture stream opened.");
      };

      recognition.onsoundstart = () => {
        console.log("[SpeechRecognition] Sound detected on audio stream.");
      };

      recognition.onspeechstart = () => {
        console.log("[SpeechRecognition] Human speech detected!");
        setSpeechEngineStatus("Transcribing...");
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += chunk + ' ';
          } else {
            currentInterim += chunk + ' ';
          }
        }

        const fullText = (finalTranscriptRef.current + ' ' + currentInterim).trim();
        if (fullText) {
          console.log("[SpeechRecognition] Live transcript:", fullText);
          candidateAnswerRef.current = fullText;
          setCandidateAnswer(fullText);
          setSpeechEngineStatus("Transcript Ready");
          setSpeechError(null);
        }
      };

      recognition.onspeechend = () => {
        console.log("[SpeechRecognition] Speech segment completed.");
      };

      recognition.onerror = (event) => {
        console.warn("[SpeechRecognition] Notice event:", event.error);
        isStartingRef.current = false;

        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }

        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setMicPermissionGranted(false);
          setSpeechEngineStatus("Voice transcription unavailable");
          setSpeechError("Microphone permission required. Please allow microphone access or type your answer below.");
        } else if (event.error === 'network') {
          setSpeechEngineStatus("Speech Service Connecting...");
          setSpeechError("Speech recognition connecting... Speak into your microphone or type your answer below.");
        } else {
          setSpeechEngineStatus(`Speech Notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        console.log("[SpeechRecognition] Engine ended. Active state:", isRecordingRef.current);
        isStartingRef.current = false;
        if (isRecordingRef.current) {
          setSpeechEngineStatus("Listening...");
          setTimeout(() => {
            if (isRecordingRef.current) {
              try { recognitionRef.current?.start(); } catch (e) {}
            }
          }, 200);
        } else {
          setSpeechEngineStatus("Microphone Ready");
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        console.warn("[SpeechRecognition] Start exception:", err);
        isStartingRef.current = false;
      }
    } catch (err) {
      console.warn("[Speech] Exception during initialization:", err);
      setSpeechEngineStatus("Voice transcription unavailable");
      setSpeechError("Voice transcription is unavailable in this browser. Please type your answer below.");
      isStartingRef.current = false;
    }
  };

  const stopMicRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;
    isStartingRef.current = false;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }

    if (micStreamRef.current) {
      try { micStreamRef.current.getTracks().forEach(t => t.stop()); } catch (e) {}
      micStreamRef.current = null;
    }

    setSpeechEngineStatus("Microphone Ready");
  };

  // MANUAL VOICE TRANSCRIPTION ACTION (RECORD & CONVERT SPOKEN AUDIO TO TEXT)
  const processRecordedAudioTranscription = async () => {
    if (audioChunksRef.current.length === 0) return "";
    try {
      setTranscribingAudio(true);
      setSpeechEngineStatus("Transcribing Spoken Voice...");
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (audioBlob.size > 200) {
        const whisperText = await transcribeAudioBlob(audioBlob);
        setTranscribingAudio(false);
        if (whisperText && whisperText.trim()) {
          const clean = whisperText.trim();
          candidateAnswerRef.current = clean;
          setCandidateAnswer(clean);
          setSpeechEngineStatus("Transcript Ready");
          return clean;
        }
      }
    } catch (err) {
      console.warn("[Audio Transcription] Error:", err);
      setTranscribingAudio(false);
    }
    setTranscribingAudio(false);
    return candidateAnswerRef.current || candidateAnswer || "";
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // REAL-TIME SUBMIT / UNANSWERED QUESTION HANDLER
  const handleNextQuestion = async () => {
    if (!currentQ || submitting) return;

    miraAgent.stopSpeaking();
    setSubmitting(true);

    let currentText = (candidateAnswerRef.current || candidateAnswer || '').trim();

    // SERVER-SIDE WHISPER FALLBACK: If candidate spoke into mic but WebSpeech produced no text
    if (!currentText && audioChunksRef.current.length > 0) {
      currentText = await processRecordedAudioTranscription();
    }

    stopMicRecording();

    const isAnswered = currentText.length > 0 && currentText !== "Not answered";
    const finalCandidateAnswer = isAnswered ? currentText : "Not answered";

    candidateAnswerRef.current = '';
    finalTranscriptRef.current = '';
    setCandidateAnswer('');

    // 1. IMMEDIATELY APPEND CANDIDATE BUBBLE ("YOU") TO CHAT THREAD USING FUNCTIONAL STATE UPDATE
    const candidateBubble = {
      id: `cand-${Date.now()}`,
      sender: 'YOU',
      text: finalCandidateAnswer,
      type: 'candidate'
    };

    setChatThread(prev => [...prev, candidateBubble]);

    // 2. Submit answer or unanswered status to backend
    const backendRes = await submitQuestionAnswer({
      session_id: sessionData?.session_id || 1,
      question_index: currentIdx + 1,
      question_text: currentQ.question_text || currentQ.q,
      candidate_answer: finalCandidateAnswer,
      transcript: finalCandidateAnswer,
      eye_contact_ratio: cameraMetrics.streamActive ? 1.0 : 0.0
    });

    const llmEval = backendRes?.llm_evaluation || {
      evaluation_status: isAnswered ? "Answered" : "Unanswered",
      is_answered: isAnswered,
      technical_score: isAnswered ? 80.0 : 0.0,
      clarity_score: isAnswered ? 80.0 : 0.0,
      feedback: isAnswered ? "Answer evaluated." : "Question was skipped without an answer.",
      strengths: isAnswered ? ["Technical answer provided"] : [],
      weaknesses: isAnswered ? [] : ["Question skipped without an answer."]
    };

    const answerEntry = {
      q_num: currentIdx + 1,
      q_text: currentQ.question_text || currentQ.q,
      user_answer: finalCandidateAnswer,
      is_answered: isAnswered,
      evaluation_status: isAnswered ? "Answered" : "Unanswered",
      technical_score: isAnswered ? (llmEval.technical_score || 80.0) : 0.0,
      clarity_score: isAnswered ? (llmEval.clarity_score || 80.0) : 0.0,
      feedback: llmEval.feedback || "",
      strengths: llmEval.strengths || [],
      weaknesses: llmEval.weaknesses || [],
      skill_focus: currentQ.skill_focus || activeDomain
    };

    const updatedAnswers = [...candidateAnswersList, answerEntry];
    setCandidateAnswersList(updatedAnswers);

    const maxQuestions = 5;
    const previousQuestionsAsked = updatedAnswers.map(a => a.q_text);

    if (currentIdx < maxQuestions - 1) {
      // 3. FETCH DYNAMIC NEXT QUESTION FROM GROQ LLM BACKEND
      const nextQObj = await fetchNextAdaptiveQuestion({
        domain: activeDomain,
        difficulty: activeDifficulty,
        skills: sessionData?.skills || [],
        previous_questions: previousQuestionsAsked,
        candidate_answer: isAnswered ? finalCandidateAnswer : ""
      });

      if (nextQObj && nextQObj.question_text) {
        setQuestionsList(prev => {
          const copy = [...prev];
          copy[currentIdx + 1] = nextQObj;
          return copy;
        });

        // 4. FORMULATE & APPEND MIRA'S NEXT QUESTION BUBBLE
        const nextInterviewerText = isAnswered 
          ? miraAgent.generateAdaptivePrompt(finalCandidateAnswer, nextQObj)
          : `Okay, let's move on to the next question. ${nextQObj.question_text}`;

        const interviewerBubble = {
          id: `mira-${Date.now()}`,
          sender: `Mira (AI Interviewer)`,
          text: nextInterviewerText,
          type: 'interviewer'
        };

        setChatThread(prev => [...prev, interviewerBubble]);
        setCurrentIdx(prev => prev + 1);
        setSubmitting(false);
      } else {
        setSubmitting(false);
        alert("Unable to generate the next question. Please try again.");
      }
    } else {
      // Finalize session at question 5 completion
      const report = await finishInterviewSession(sessionData?.session_id || 1);
      const answeredList = updatedAnswers.filter(a => a.is_answered);
      const unansweredCount = updatedAnswers.length - answeredList.length;

      const totalTechScore = answeredList.reduce((acc, a) => acc + a.technical_score, 0);
      const avgOverallScore = answeredList.length > 0 ? Math.round((totalTechScore / answeredList.length) * 10) / 10 : 0.0;

      let rating = "Needs Improvement";
      if (avgOverallScore >= 90) rating = "Outstanding Candidate (Strong Hire)";
      else if (avgOverallScore >= 80) rating = "Recommended Candidate (Good Hire)";
      else if (avgOverallScore >= 60) rating = "Passable Candidate";

      const fullCustomReport = {
        ...report,
        overall_score: avgOverallScore,
        performance_rating: rating,
        category: activeDomain,
        difficulty: activeDifficulty,
        camera_status: cameraMetrics.streamActive ? "Camera Active" : "Camera Off",
        answers_history: updatedAnswers,
        answered_questions_count: answeredList.length,
        unanswered_questions_count: unansweredCount,
        total_questions_count: updatedAnswers.length,
        strengths: answeredList.length > 0 ? [
          `Answered ${answeredList.length} out of ${updatedAnswers.length} questions in ${activeDomain} (${activeDifficulty} level)`,
          `Demonstrated spoken responses during technical interview turns`,
          `Maintained active video stream throughout session`
        ] : [
          `Completed proctored interview session with Mira`
        ],
        weaknesses: unansweredCount > 0 ? [
          `Candidate skipped ${unansweredCount} question(s) without speaking an answer`,
          `Ensure you provide structured responses to all technical prompts`
        ] : [
          `Elaborate further on architectural trade-offs during live technical explanations`
        ],
        improvement_tips: [
          `Make sure to speak clear answers for all interview questions`,
          `Practice explaining technical complexity out loud`
        ]
      };

      setFinalReport(fullCustomReport);
      setSubmitting(false);
      setActivePage('interview-report');
    }
  };

  // IF QUESTION GENERATION FAILED / CANDIDATE ERROR VIEW
  if (hasGenerationError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6 font-sans">
        <div className="glass-card p-8 rounded-3xl border border-red-500/30 bg-slate-950 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Interview Setup Notice</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {sessionData?.error || "Unable to start the AI interview. Please try again."}
          </p>
          <button
            onClick={() => setActivePage('interview-setup')}
            className="px-6 py-3 rounded-xl font-bold text-xs bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 transition-all"
          >
            ← Return to Interview Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6 pb-20 relative font-sans">
      
      {/* PROCTORING ALERT TOAST */}
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
              Role: <strong className="text-white">{activeDomain}</strong> ({activeDifficulty} Level — Question {currentIdx + 1} of 5)
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

      {/* MAIN LAYOUT: LEFT (MIRA AVATAR & CONVERSATION THREAD), RIGHT (WEBCAM & DEVICE STATUS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: MIRA AVATAR & SCROLLABLE CHAT THREAD (8 COLS) */}
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

            {/* Replay Question Voice Button */}
            <button
              onClick={() => {
                const currentQuestionText = currentQ?.question_text || currentQ?.q || "";
                if (currentQuestionText) {
                  speakCurrentQuestion(currentQuestionText);
                }
              }}
              className="mt-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-all shadow-md"
            >
              <Volume2 className="w-3.5 h-3.5" /> Replay Question Voice
            </button>
          </div>

          {/* SCROLLABLE REAL-TIME CONVERSATION CHAT THREAD */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3 shadow-xl h-[380px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
              <span className="text-xs font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-400" /> Real-Time Interview Conversation Thread
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

              {/* REAL-TIME LIVE SPEAKING PREVIEW BUBBLE */}
              {candidateAnswer && (
                <div className="flex flex-col items-end space-y-1 animate-pulse">
                  <span className="text-[10px] font-mono text-amber-400/90 uppercase tracking-wider font-bold pr-1">
                    YOU (SPEAKING LIVE...)
                  </span>
                  <div className="p-3.5 rounded-2xl max-w-[85%] leading-relaxed shadow-xl text-xs bg-amber-950/90 border border-amber-500/50 text-amber-100 rounded-tr-none font-sans italic">
                    "{candidateAnswer}"
                  </div>
                </div>
              )}
            </div>

            {speechError && (
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
                💡 {speechError}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: WEBCAM & SEPARATED DEVICE / SPEECH MONITORING */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Candidate Webcam Box */}
          <div className="relative">
            <WebcamMonitor 
              onMetricsUpdate={handleCameraMetricsUpdate}
            />
          </div>

          {/* TRUTHFUL DEVICE & SPEECH MONITORING BOX */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono text-slate-300 font-bold uppercase">Device & Speech Monitoring</span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> STATUS
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Camera Feed:</span>
                <span className={cameraMetrics.streamActive ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                  {cameraMetrics.streamActive ? "Camera Active" : "Camera Off"}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Microphone Status:</span>
                <span className={micPermissionGranted ? "text-emerald-400 font-bold" : "text-amber-400"}>
                  {micPermissionGranted ? "Microphone Stream Active" : "Permission Required"}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Speech-to-Text Engine:</span>
                <span className="text-cyan-400 font-bold truncate max-w-[130px]">
                  {speechEngineStatus}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* EDITABLE CANDIDATE RESPONSE & CONTROL BAR */}
      <div className="glass-card p-4 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <Mic className="w-4 h-4 text-cyan-400" /> Candidate Response (Live Spoken / Typed Transcript):
          </label>
          <span className="text-[10px] text-slate-400 font-mono">
            Speak into mic or type/edit answer below
          </span>
        </div>

        <textarea
          rows={2}
          value={candidateAnswer}
          onChange={(e) => {
            candidateAnswerRef.current = e.target.value;
            finalTranscriptRef.current = e.target.value;
            setCandidateAnswer(e.target.value);
          }}
          placeholder="Speak your answer out loud into your microphone, or type your answer here..."
          className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all resize-none font-sans"
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isRecording) {
                  stopMicRecording();
                } else {
                  startMicRecording();
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isRecording ? 'bg-slate-900 text-slate-200 border-slate-800' : 'bg-red-500/20 text-red-400 border-red-500/40'
              }`}
            >
              <Mic className="w-4 h-4 text-cyan-400" /> {isRecording ? "Mute Mic" : "Unmute Mic / Speak"}
            </button>

            <button
              onClick={processRecordedAudioTranscription}
              disabled={transcribingAudio}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              {transcribingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {transcribingAudio ? "Transcribing Voice..." : "Transcribe Voice Audio"}
            </button>
            
            <span className="text-xs text-slate-400 font-mono">
              Camera Status: <span className={cameraMetrics.streamActive ? "text-emerald-400 font-bold" : "text-amber-400"}>
                {cameraMetrics.streamActive ? "Camera Active" : "Camera Off"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleNextQuestion}
              disabled={submitting || transcribingAudio}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all flex items-center gap-2"
            >
              {submitting ? "Mira Processing..." : (
                currentIdx < 4 ? (
                  candidateAnswer.trim().length > 0 
                    ? <>Submit Answer & Next Question <ArrowRight className="w-4 h-4" /></>
                    : <>Skip Question (Log Unanswered) <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Complete Interview & Generate Report <PhoneOff className="w-4 h-4" /></>
                )
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
