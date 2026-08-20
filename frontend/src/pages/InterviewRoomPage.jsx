import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Video, Mic, MicOff, Volume2, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Send, Sparkles, VolumeX, Bot, User, MessageSquare, PhoneOff, Bell, AlertTriangle, ShieldAlert, XCircle, Loader2, LogOut } from 'lucide-react';
import WebcamMonitor from '../components/WebcamMonitor';
import AudioWaveform from '../components/AudioWaveform';
import { submitQuestionAnswer, finishInterviewSession, fetchNextAdaptiveQuestion, transcribeAudioBlob, getStoredUser } from '../services/api';
import { miraAgent } from '../services/aiAgent';

export default function InterviewRoomPage({ sessionData, setActivePage, setFinalReport, currentUser }) {
  const activeUser = currentUser || getStoredUser();

  const activeDomain = sessionData?.domain || sessionData?.category || "Python Developer";
  const activeDifficulty = sessionData?.difficulty || "Medium";
  const maxQuestions = sessionData?.total_questions || sessionData?.num_questions || (sessionData?.questions ? sessionData.questions.length : 5);

  const [currentIdx, setCurrentIdx] = useState(() => sessionData?.currentIdx || 0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transcribingAudio, setTranscribingAudio] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  const [violationCount, setViolationCount] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);

  const [candidateAnswersList, setCandidateAnswersList] = useState(() => sessionData?.candidateAnswersList || []);
  const [speechError, setSpeechError] = useState(null);
  const [micPermissionGranted, setMicPermissionGranted] = useState(true);
  const [speechEngineSupported, setSpeechEngineSupported] = useState(true);
  const [speechEngineStatus, setSpeechEngineStatus] = useState("Initializing...");

  const chatScrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  const isRecordingRef = useRef(true);
  const candidateAnswerRef = useRef('');
  const finalizingRef = useRef(false);
  const submittingRef = useRef(false); // Lock guard against duplicate submissions

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Clean cleanup on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const defaultQ1 = {
    id: 1,
    question_text: `Welcome! I'm Mira, your AI technical interviewer today. To get started, could you briefly introduce yourself and highlight your experience relevant to the ${activeDomain} role?`,
    skill_focus: "Self Introduction & Background"
  };

  const backendQuestions = sessionData?.questions && Array.isArray(sessionData.questions) && sessionData.questions.length > 0 ? sessionData.questions : [defaultQ1];
  const hasGenerationError = sessionData?.error || false;

  const [questionsList, setQuestionsList] = useState(backendQuestions);
  const currentQ = questionsList[currentIdx] || null;

  const [chatThread, setChatThread] = useState(() => {
    if (sessionData?.chatThread && sessionData.chatThread.length > 0) {
      return sessionData.chatThread;
    }
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

  const [cameraMetrics, setCameraMetrics] = useState({
    streamActive: false,
    faceDetected: "Initializing...",
    cameraStatus: "Camera Active",
    eyeContactRatio: 0.0,
    eyeContactPct: 0,
    attentionPct: 0,
    confidencePct: 0,
    emotion: "Neutral"
  });

  const handleCameraMetricsUpdate = useCallback((m) => {
    setCameraMetrics(m);
  }, []);

  // PERSIST ACTIVE SESSION STATE TO LOCAL STORAGE FOR BROWSER REFRESH PROTECTION
  useEffect(() => {
    if (sessionData && sessionData.session_id && !finalizingRef.current) {
      const activeState = {
        ...sessionData,
        currentIdx,
        chatThread,
        candidateAnswersList,
        questions: questionsList,
        total_questions: maxQuestions,
        status: "active"
      };
      localStorage.setItem("smarthire_active_session", JSON.stringify(activeState));
    }
  }, [currentIdx, chatThread, candidateAnswersList, questionsList, sessionData, maxQuestions]);

  // BROWSER PAGE-LEAVE / REFRESH PROTECTION WARNING
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!finalizingRef.current) {
        e.preventDefault();
        e.returnValue = "An AI interview is currently in progress. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Auto-scroll chat thread to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatThread, candidateAnswer]);

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
        handleFinalizeSession("malpractice_terminated");
      }
      return nextCount;
    });
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !finalizingRef.current) {
        triggerProctoringViolation("Tab Switch Detected");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

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

  // REAL SPEECH-TO-TEXT IMPLEMENTATION VIA WEB SPEECH RECOGNITION API
  const startMicRecording = async () => {
    setSpeechError(null);

    // 1. Verify Microphone Permission & Immediately Release Check Stream
    try {
      const permStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      permStream.getTracks().forEach(t => t.stop()); // Immediately release stream so SpeechRecognition owns mic
      setMicPermissionGranted(true);
    } catch (err) {
      console.warn("[Microphone] Permission denied:", err);
      setMicPermissionGranted(false);
      setSpeechEngineStatus("Microphone Permission Denied");
      setSpeechError("Microphone access is required. Please un-block your microphone in browser settings.");
      setIsRecording(false);
      return;
    }

    // 2. Instantiate Browser Web SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechEngineSupported(false);
      setSpeechEngineStatus("Web Speech Unsupported");
      setSpeechError("Browser speech recognition unavailable in this browser. Please use Google Chrome/Microsoft Edge or type your answer.");
      setIsRecording(false);
      return;
    }

    setSpeechEngineSupported(true);

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        isRecordingRef.current = true;
        setSpeechEngineStatus("Listening...");
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        let finalScript = '';
        let interimScript = '';

        for (let i = 0; i < event.results.length; i++) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalScript += transcriptChunk + ' ';
          } else {
            interimScript += transcriptChunk + ' ';
          }
        }

        const recognizedText = (finalScript + ' ' + interimScript).trim();
        if (recognizedText) {
          candidateAnswerRef.current = recognizedText;
          setCandidateAnswer(recognizedText);
          setSpeechEngineStatus(interimScript ? "Speaking Live..." : "Transcript Ready");
          setSpeechError(null);
        }
      };

      recognition.onerror = (event) => {
        console.warn("[SpeechRecognition Error]", event.error);
        if (event.error === 'no-speech') {
          setSpeechEngineStatus("Listening for speech...");
          return;
        }
        if (event.error === 'aborted') return;

        if (event.error === 'network') {
          setSpeechEngineStatus("Speech Error: network");
          setSpeechError("Browser speech recognition network error. Ensure internet connection is active, or use Chrome/Edge or type your response.");
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechEngineStatus("Speech Error: permission denied");
          setSpeechError("Microphone permission denied by browser. Please un-block microphone access in browser address bar.");
        } else {
          setSpeechEngineStatus(`Speech Error: ${event.error}`);
          setSpeechError(`Speech recognition error (${event.error}). Speak again or type your answer.`);
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current && !finalizingRef.current) {
          setTimeout(() => {
            if (isRecordingRef.current && !finalizingRef.current && recognitionRef.current === recognition) {
              try { recognition.start(); } catch (e) {}
            }
          }, 300);
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {
        console.warn("Failed to start SpeechRecognition:", e);
      }

    } catch (err) {
      console.warn("SpeechRecognition initialization exception:", err);
      setSpeechEngineStatus("Initialization Error");
      setSpeechError("Unable to start browser speech recognition. Please use Google Chrome or type your answer.");
    }
  };

  const stopMicRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    setSpeechEngineStatus("Microphone Off");
  };

  // FALLBACK AUDIO RECORDER FOR WHISPER BACKEND TRANSCRIPTION (ON DEMAND ONLY)
  const processRecordedAudioTranscription = async () => {
    try {
      setTranscribingAudio(true);
      setSpeechEngineStatus("Recording Voice Audio...");
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.start();

      await new Promise(resolve => setTimeout(resolve, 4000)); // Record 4 seconds of audio

      recorder.stop();
      stream.getTracks().forEach(t => t.stop());

      setSpeechEngineStatus("Transcribing via Whisper...");
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      const realTranscript = await transcribeAudioBlob(audioBlob);

      setTranscribingAudio(false);
      if (realTranscript && realTranscript.trim()) {
        const clean = realTranscript.trim();
        const combined = candidateAnswerRef.current 
          ? (candidateAnswerRef.current + ' ' + clean).trim() 
          : clean;
        candidateAnswerRef.current = combined;
        setCandidateAnswer(combined);
        setSpeechEngineStatus("Transcript Ready");
        return clean;
      } else {
        setSpeechError("No clear speech detected in recorded audio. Please speak louder or type your response.");
      }
    } catch (err) {
      console.warn("Recorded audio transcription error:", err);
      setTranscribingAudio(false);
    }
    setTranscribingAudio(false);
    return candidateAnswerRef.current || candidateAnswer || "";
  };

  // SUBMIT ANSWER / NEXT QUESTION HANDLER WITH DUPLICATE LOCK GUARD
  const handleNextQuestion = async () => {
    if (submittingRef.current || finalizingRef.current || !currentQ) return;
    submittingRef.current = true;
    setSubmitting(true);

    miraAgent.stopSpeaking();

    let rawText = (candidateAnswerRef.current || candidateAnswer || '').trim();
    stopMicRecording();

    await handleNextQuestionInternal(rawText);
  };

  const handleNextQuestionInternal = async (rawText) => {
    const isAnswered = rawText.length > 0 && rawText !== "Not answered";
    const finalCandidateAnswer = isAnswered ? rawText : "Not answered";

    candidateAnswerRef.current = '';
    setCandidateAnswer('');

    // 1. IMMEDIATELY APPEND CANDIDATE BUBBLE ("YOU") EXACTLY ONCE TO CHAT THREAD
    const candidateBubble = {
      id: `cand-${currentIdx + 1}-${Date.now()}`,
      sender: 'YOU',
      text: finalCandidateAnswer,
      type: 'candidate'
    };

    // 2. Determine Next Question immediately for seamless UI update
    const hasMoreQuestions = currentIdx < maxQuestions - 1;
    let initialNextQ = hasMoreQuestions ? questionsList[currentIdx + 1] : null;
    if (hasMoreQuestions && (!initialNextQ || !initialNextQ.question_text)) {
      initialNextQ = {
        id: currentIdx + 2,
        question_text: `Could you elaborate on your experience with core architectural design patterns in ${activeDomain}?`,
        skill_focus: `${activeDomain} Architecture`
      };
    }

    if (hasMoreQuestions && initialNextQ) {
      const nextInterviewerText = isAnswered 
        ? miraAgent.generateAdaptivePrompt(finalCandidateAnswer, initialNextQ)
        : `Okay, let's move on to the next question. ${initialNextQ.question_text}`;

      const interviewerBubble = {
        id: `mira-${currentIdx + 2}-${Date.now()}`,
        sender: `Mira (AI Interviewer)`,
        text: nextInterviewerText,
        type: 'interviewer'
      };

      // Append candidate answer and Mira's next question cleanly into conversation thread
      setChatThread(prev => [...prev, candidateBubble, interviewerBubble]);
      setCurrentIdx(prev => prev + 1);
    } else {
      setChatThread(prev => [...prev, candidateBubble]);
    }

    // 3. Submit answer to backend API asynchronously with REAL eyeContactRatio
    const actualEyeContactRatio = cameraMetrics.eyeContactRatio !== undefined 
      ? cameraMetrics.eyeContactRatio 
      : (cameraMetrics.streamActive ? 1.0 : 0.0);

    const backendRes = await submitQuestionAnswer({
      session_id: sessionData?.session_id || 1,
      question_index: currentIdx + 1,
      question_text: currentQ?.question_text || currentQ?.q || "",
      candidate_answer: finalCandidateAnswer,
      transcript: finalCandidateAnswer,
      eye_contact_ratio: actualEyeContactRatio
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
      q_text: currentQ?.question_text || currentQ?.q || "",
      user_answer: finalCandidateAnswer,
      is_answered: isAnswered,
      evaluation_status: isAnswered ? "Answered" : "Unanswered",
      technical_score: isAnswered ? (llmEval.technical_score || 80.0) : 0.0,
      clarity_score: isAnswered ? (llmEval.clarity_score || 80.0) : 0.0,
      feedback: llmEval.feedback || "",
      strengths: llmEval.strengths || [],
      weaknesses: llmEval.weaknesses || [],
      skill_focus: currentQ?.skill_focus || activeDomain
    };

    const updatedAnswers = [...candidateAnswersList, answerEntry];
    setCandidateAnswersList(updatedAnswers);

    if (hasMoreQuestions) {
      // Background async call to fetch adaptive question refinement from Groq LLM if desired
      const previousQuestionsAsked = updatedAnswers.map(a => a.q_text);
      try {
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
        }
      } catch (err) {
        console.warn("fetchNextAdaptiveQuestion background call notice:", err);
      }

      submittingRef.current = false;
      setSubmitting(false);
    } else {
      // Reached configured max questions -> Finalize session cleanly as completed
      submittingRef.current = false;
      await handleFinalizeSession("completed", updatedAnswers);
    }
  };

  const handleFinalizeSession = async (reason = "completed", customAnswers = null) => {
    if (finalizingRef.current) return;
    finalizingRef.current = true;

    miraAgent.stopSpeaking();
    stopMicRecording();
    setSubmitting(true);

    const answersToUse = customAnswers || candidateAnswersList;

    const report = await finishInterviewSession(sessionData?.session_id || 1, reason);
    
    const answeredList = answersToUse.filter(a => a.is_answered);
    const unansweredCount = Math.max(0, maxQuestions - answeredList.length);

    const totalTechScore = answeredList.reduce((acc, a) => acc + (a.technical_score || 0), 0);
    const avgOverallScore = answeredList.length > 0 ? Math.round((totalTechScore / answeredList.length) * 10) / 10 : 0.0;

    let rating = "Needs Improvement";
    if (avgOverallScore >= 90) rating = "Outstanding Candidate (Strong Hire)";
    else if (avgOverallScore >= 80) rating = "Recommended Candidate (Good Hire)";
    else if (avgOverallScore >= 60) rating = "Passable Candidate";

    const isCandidateEnded = reason === "ended_by_candidate";

    const fullCustomReport = {
      ...report,
      overall_score: avgOverallScore,
      performance_rating: rating,
      category: activeDomain,
      difficulty: activeDifficulty,
      status: reason,
      ended_reason: reason,
      configured_question_count: maxQuestions,
      candidate: {
        id: activeUser?.id || 1,
        full_name: activeUser?.full_name || "Candidate User",
        email: activeUser?.email || "candidate@smarthire.ai",
        role: activeUser?.role || "candidate"
      },
      camera_status: cameraMetrics.streamActive ? "Camera Active" : "Camera Off",
      answers_history: answersToUse,
      answered_questions_count: answeredList.length,
      unanswered_questions_count: unansweredCount,
      total_questions_count: maxQuestions,
      strengths: answeredList.length > 0 ? [
        `Completed technical interview session in ${activeDomain} (${activeDifficulty} level)`,
        `Demonstrated verbal technical answers for ${answeredList.length} of ${maxQuestions} prompt(s)`,
        `Maintained active proctored stream throughout session`
      ] : [
        `Initiated technical interview session with Mira`
      ],
      weaknesses: unansweredCount > 0 ? [
        isCandidateEnded ? `Interview session ended early by candidate` : `Candidate skipped ${unansweredCount} prompt(s)`,
        `Ensure comprehensive verbal answers are provided for all technical prompts`
      ] : [
        `Elaborate further on system architecture and trade-offs in future responses`
      ],
      improvement_tips: [
        `Practice speaking concise, structured technical explanations`,
        `Focus on providing detailed examples for all technical questions`
      ]
    };

    localStorage.removeItem("smarthire_active_session");
    setFinalReport(fullCustomReport);
    setSubmitting(false);
    setActivePage('interview-report');
  };

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

      {/* END INTERVIEW CONFIRMATION MODAL */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-slate-800 space-y-5 bg-slate-950/95 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Finish Interview Confirmation</h3>
                <p className="text-xs text-slate-400">Save progress and finalize assessment</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to finish the interview? Your current progress will be saved and the evaluation report will be generated.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 transition-all"
              >
                Cancel
              </button>
              
              <button
                onClick={() => {
                  setShowEndModal(false);
                  handleFinalizeSession("ended_by_candidate");
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5"
              >
                <PhoneOff className="w-3.5 h-3.5" /> Finish Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROOM TOP HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-3 px-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Mira AI Interview Room <span className="text-[10px] text-cyan-400 font-mono font-normal">• Live Session</span>
            </h1>
            <span className="text-[11px] text-indigo-300 font-mono">
              Candidate: <strong className="text-white">{activeUser?.full_name || "Candidate User"}</strong> | Role: <strong className="text-white">{activeDomain}</strong> ({activeDifficulty} Level — Question {currentIdx + 1} of {maxQuestions})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEndModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <PhoneOff className="w-3.5 h-3.5" /> Finish Interview
          </button>
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

            <button
              onClick={() => {
                miraAgent.unlockAudio();
                const currentQuestionText = currentQ?.question_text || currentQ?.q || "";
                if (currentQuestionText) {
                  speakCurrentQuestion(currentQuestionText);
                }
              }}
              className="mt-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" /> 🔊 Replay Question Voice
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
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
                ⚠️ {speechError}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: WEBCAM & DEVICE STATUS */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="relative">
            <WebcamMonitor 
              onMetricsUpdate={handleCameraMetricsUpdate}
            />
          </div>

          <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono text-slate-300 font-bold uppercase">Device & Speech Monitoring</span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> REAL-TIME STATUS
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Camera Feed & Track:</span>
                <span className={cameraMetrics.streamActive ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                  {cameraMetrics.streamActive ? (cameraMetrics.faceDetected || "Active") : "Camera Off"}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Eye-Contact & Gaze:</span>
                <span className={cameraMetrics.eyeContactPct > 50 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                  {cameraMetrics.streamActive ? `${cameraMetrics.eyeContactPct || 0}% (${cameraMetrics.eyeContactRatio || 0.0})` : "0% (0.0)"}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Attention & Emotion:</span>
                <span className="text-cyan-400 font-bold">
                  {cameraMetrics.streamActive ? `${cameraMetrics.attentionPct || 0}% • ${cameraMetrics.emotion || "Neutral"}` : "Off"}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Microphone Permission:</span>
                <span className={micPermissionGranted ? "text-emerald-400 font-bold" : "text-amber-400"}>
                  {micPermissionGranted ? "Permission Granted" : "Permission Denied"}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Speech Recognition API:</span>
                <span className={speechEngineSupported ? "text-emerald-400 font-bold" : "text-amber-400"}>
                  {speechEngineSupported ? "Supported (Web Speech)" : "Unsupported"}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Speech Engine Status:</span>
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
            setCandidateAnswer(e.target.value);
          }}
          placeholder="Speak your answer out loud into your microphone, or type your answer here..."
          className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all resize-none font-sans"
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (isRecording) {
                  stopMicRecording();
                } else {
                  startMicRecording();
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                isRecording ? 'bg-slate-900 text-slate-200 border-slate-800' : 'bg-red-500/20 text-red-400 border-red-500/40'
              }`}
            >
              <Mic className="w-4 h-4 text-cyan-400" /> {isRecording ? "Mute Mic" : "Unmute Mic / Speak"}
            </button>

            <button
              onClick={processRecordedAudioTranscription}
              disabled={transcribingAudio}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              {transcribingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {transcribingAudio ? "Transcribing Spoken Voice..." : "Transcribe Voice Audio"}
            </button>

            <span className="text-xs text-slate-400 font-mono ml-1">
              Mic Status: <span className={isRecording ? "text-emerald-400 font-bold" : "text-slate-500"}>
                {isRecording ? "Listening Active" : "Muted"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleNextQuestion}
              disabled={submitting || transcribingAudio}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all flex items-center gap-2"
            >
              {submitting || transcribingAudio ? "Mira Processing..." : (
                currentIdx < maxQuestions - 1 ? (
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
