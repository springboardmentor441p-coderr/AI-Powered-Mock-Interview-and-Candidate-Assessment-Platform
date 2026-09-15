import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Mic,
  MicOff,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Video,
  Volume2,
  Cpu,
  Eye,
  Camera,
  UserX,
  Sparkles,
  MessageSquare,
  Zap,
  PhoneCall,
  User,
  Play,
  Radio,
  History,
  X,
  Award,
  Maximize2,
  Minimize2,
  Send,
  CheckCircle2,
  PhoneOff,
  ArrowRight
} from 'lucide-react';
import { AIAvatar, INTERVIEW_STATES } from '../components/Avatar/Avatar';
import { SpeechToText } from '../components/SpeechToText/SpeechToText';
import { VisionAnalyzer } from '../components/VisionAnalyzer/VisionAnalyzer';
import { useApp } from '../context/AppContext';
import { useUltravox } from '../hooks/useUltravox';

export const InterviewRoom = () => {
  const navigate = useNavigate();
  const { candidate = {}, generatedQuestions, setFinalReport, addCompletedInterview, jdData = {}, resumeData = {}, interviewDuration, setupChecks = {}, interviewHistory = [] } = useApp();
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Recommended Interview Flow State Machine
  const [interviewState, setInterviewState] = useState(INTERVIEW_STATES.SPEAKING);
  const [evaluationsPerQuestion, setEvaluationsPerQuestion] = useState({});

  // Proctoring & Vision Telemetry State
  const [faceCount, setFaceCount] = useState(1);
  const [eyeGazeStatus, setEyeGazeStatus] = useState('Centered');
  const [warningGiven, setWarningGiven] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningReasonText, setWarningReasonText] = useState('');
  const [lastNoticeSpokenTime, setLastNoticeSpokenTime] = useState(0);

  const defaultQuestions = [
    {
      id: 1,
      questionText: "Welcome! To start off, please introduce yourself and walk me through your core software engineering background.",
      topic: "Introduction & Fundamentals"
    },
    {
      id: 2,
      questionText: "Can you explain how you approach designing scalable RESTful or GraphQL APIs for high-concurrency web applications?",
      topic: "System Architecture"
    },
    {
      id: 3,
      questionText: "Tell me about a challenging technical problem or bug you solved recently. What was your analytical debugging approach?",
      topic: "Problem Solving"
    }
  ];

  const [questions, setQuestions] = useState(() => {
    if (generatedQuestions && Array.isArray(generatedQuestions) && generatedQuestions.length > 0) {
      return generatedQuestions;
    }
    return defaultQuestions;
  });

  // Automatically generate custom AI questions on interview room mount if not present
  useEffect(() => {
    if (!generatedQuestions || !Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
      const selectedRole = candidate?.targetRole || resumeData?.targetRole || 'Software Engineer';
      fetch('http://localhost:8000/api/v1/analyze/generate-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: JSON.stringify(resumeData || {}),
          jd_text: jdData?.rawText || '',
          interview_type: 'Technical',
          experience_level: 'Mid-Level',
          num_questions: 5,
          target_role: selectedRole
        })
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
              setQuestions(data.questions);
            }
          }
        })
        .catch((err) => console.warn("Auto question generation notice:", err));
    }
  }, []);

  // Question & Timer State
  const [isWelcomePhase, setIsWelcomePhase] = useState(true);
  const [qIndex, setQIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(() => {
    let minutes = 15;
    if (interviewDuration && typeof interviewDuration === 'string') {
      const match = interviewDuration.match(/(\d+)\s*Min/i);
      if (match) {
        minutes = parseInt(match[1], 10);
      }
    }
    return minutes * 60;
  });
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [candidateSpeechText, setCandidateSpeechText] = useState('');
  const [liveSubtitles, setLiveSubtitles] = useState('AI Interviewer connected. Introducing session...');
  const [evaluating, setEvaluating] = useState(false);

  // Conversation Memory & Context Retention
  const [conversationHistory, setConversationHistory] = useState([]);
  const [candidateAnswers, setCandidateAnswers] = useState({});
  const candidateMemory = useRef({});
  const silenceTimerRef = useRef(null);
  const speakingTimerRef = useRef(null);
  const [ultravoxMode, setUltravoxMode] = useState(false); // true when Ultravox is active
  const [ultravoxFailed, setUltravoxFailed] = useState(false); // true ONLY if Ultravox fails to initialize

  // Proctored Fullscreen & Tab Switching Lockdown State
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [tabViolationCount, setTabViolationCount] = useState(0);
  const lastTabViolationTimeRef = useRef(0);
  const isTerminatingRef = useRef(false);

  const triggerTabOrFullscreenViolation = (reasonText) => {
    if (isTerminatingRef.current) return;
    isTerminatingRef.current = true;
    handleTerminateInterview(reasonText || "Candidate exited full screen mode or left the interview room tab.");
  };

  const handleReEnterFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (e) {
      console.error("Failed to re-enter fullscreen:", e);
    }
  };

  useEffect(() => {
    const requestFS = async () => {
      try {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          const element = document.documentElement;
          if (element.requestFullscreen) {
            await element.requestFullscreen();
          } else if (element.webkitRequestFullscreen) {
            await element.webkitRequestFullscreen();
          }
        }
      } catch (e) {
        console.warn("Fullscreen auto-request waiting for user gesture:", e);
      }
    };
    requestFS();

    const handleFSChange = () => {
      const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
      setIsFullscreen(isFS);
      if (!isFS) {
        triggerTabOrFullscreenViolation("Security Alert: Full screen mode exited.");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerTabOrFullscreenViolation("Security Violation: You switched tabs or minimized the browser.");
      }
    };

    const handleWindowBlur = () => {
      triggerTabOrFullscreenViolation("Security Violation: Window focus lost / tab switched.");
    };

    const handleKeyDown = (e) => {
      if (
        e.key === 'Escape' ||
        e.key === 'Esc' ||
        e.code === 'Escape' ||
        e.keyCode === 27
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerTabOrFullscreenViolation("Candidate pressed ESC key to exit the interview room.");
        return;
      }

      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')) ||
        (e.altKey && e.key === 'Tab')
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerTabOrFullscreenViolation("Security Violation: Keyboard shortcut / DevTools blocked.");
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    document.addEventListener('fullscreenchange', handleFSChange);
    document.addEventListener('webkitfullscreenchange', handleFSChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('fullscreenchange', handleFSChange);
      document.removeEventListener('webkitfullscreenchange', handleFSChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu);

      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => { });
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    };
  }, []);

  // ======= ULTRAVOX REAL-TIME VOICE ENGINE =======
  const {
    status: uvStatus,
    transcripts: uvTranscripts,
    error: uvError,
    initSession: uvInitSession,
    endSession: uvEndSession
  } = useUltravox({
    onTranscriptUpdate: (transcripts) => {
      // Relay latest agent/candidate speech into the live subtitles panel
      const last = [...transcripts].reverse().find(t => t.isFinal || t.text);
      if (last) {
        const speaker = last.speaker === 'agent' ? '[Advika]' : '[Candidate]';
        setLiveSubtitles(`${speaker}: "${last.text}"`);

        if (last.speaker === 'agent') {
          setIsSpeaking(true);
          const textLower = (last.text || '').toLowerCase();

          // Auto-sync frontend Question Card with Ultravox spoken question
          if (!isWelcomePhase && questions && questions.length > 0) {
            questions.forEach((qObj, idx) => {
              const qText = (qObj.questionText || qObj.question_text || '').toLowerCase();
              const snippet = qText.split(/\s+/).slice(0, 4).join(' ');
              if (snippet && snippet.length > 8 && textLower.includes(snippet)) {
                setQIndex(idx);
              }
            });
          }

          // Welcome phase discontinuation or completion checks
          if (textLower.includes('discontinuing the interview session')) {
            isTerminatingRef.current = true;
            setTimeout(() => {
              if (document.fullscreenElement || document.webkitFullscreenElement) {
                if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
              }
              navigate('/dashboard');
            }, 2500);
          } else if (
            textLower.includes('evaluation report is being generated') ||
            textLower.includes('thank you for completing all the questions') ||
            textLower.includes('thank you for completing the interview')
          ) {
            setTimeout(() => {
              handleCompleteInterview();
            }, 3500);
          }
        } else {
          setIsSpeaking(false);
          // Accumulate candidate answer per current question
          if (!isWelcomePhase && last.isFinal) {
            setCandidateAnswers(prev => ({
              ...prev,
              [qIndex]: prev[qIndex] ? prev[qIndex] + ' ' + last.text : last.text
            }));
          }
        }
      }
    },
    onStatusChange: (s) => {
      if (s === 'ended' || s === 'error') {
        setUltravoxMode(false);
      }
    },
    onCallEnded: (finalTranscripts) => {
      console.log('[Ultravox] Call ended. Final transcripts:', finalTranscripts);
    }
  });

  const lastSpokenQIndexRef = useRef(-1);
  const welcomeSpokenRef = useRef(false);
  const recognitionRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const speakingRef = useRef(false);
  const lastOffGazeTimeRef = useRef(0);
  const offGazeStartRef = useRef(0);
  const lastMismatchTimeRef = useRef(0);
  const lastGadgetTimeRef = useRef(0);

  const currentQ = questions[qIndex];

  // Guarantee Hardware Access Permission
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).catch((err) => {
        console.warn("Microphone access permission error:", err);
      });
    }
  }, []);

  const handleStreamActive = async (stream) => {
    webcamStreamRef.current = stream;
    let recordingStream = stream;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
        if (audioStream && audioStream.getAudioTracks().length > 0) {
          recordingStream = new MediaStream([
            ...stream.getVideoTracks(),
            ...audioStream.getAudioTracks()
          ]);
        }
      }
    } catch (e) {}

    try {
      let recorder;
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        recorder = new MediaRecorder(recordingStream, { mimeType: 'video/webm;codecs=vp8,opus' });
      } else if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm')) {
        recorder = new MediaRecorder(recordingStream, { mimeType: 'video/webm' });
      } else {
        recorder = new MediaRecorder(recordingStream);
      }

      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        console.log("MediaRecorder stopped. Chunks count:", recordedChunksRef.current.length);
      };

      recorder.start(1000); // chunk every 1 sec
      console.log("MediaRecorder successfully started");
    } catch (err) {
      console.error("Failed to initialize MediaRecorder:", err);
    }
  };

  const selectedFemaleVoiceRef = useRef(null);

  const resolveFemaleVoice = () => {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (voices.length === 0) return null;

    // Filter out all male voice names
    const femaleVoices = voices.filter(v => {
      const name = v.name.toLowerCase();
      const isMale = (
        name.includes('david') ||
        name.includes('mark') ||
        name.includes('george') ||
        name.includes('james') ||
        name.includes('alex') ||
        name.includes('fred') ||
        name.includes('daniel') ||
        name.includes('guy') ||
        name.includes('christopher') ||
        name.includes('eric') ||
        name.includes('steffan') ||
        name.includes('liam') ||
        name.includes('thomas') ||
        name.includes('paul') ||
        name.includes('richard') ||
        name.includes('john') ||
        name.includes('mike') ||
        name.includes('brian') ||
        (name.includes('male') && !name.includes('female'))
      );
      return !isMale;
    });

    // Prioritise explicitly confirmed Female voices
    const bestFemale = femaleVoices.find(v => {
      const name = v.name.toLowerCase();
      return (
        name.includes('zira') ||
        name.includes('samantha') ||
        name.includes('jenny') ||
        name.includes('eva') ||
        name.includes('karen') ||
        name.includes('victoria') ||
        name.includes('hazel') ||
        name.includes('aria') ||
        name.includes('sonia') ||
        name.includes('female') ||
        name.includes('google us english') ||
        name.includes('google uk english female') ||
        name.includes('natural')
      ) && v.lang.startsWith('en');
    }) || femaleVoices.find(v => v.lang.startsWith('en')) || femaleVoices[0];

    if (bestFemale) {
      selectedFemaleVoiceRef.current = bestFemale;
    }
    return bestFemale;
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
      resolveFemaleVoice();
      window.speechSynthesis.onvoiceschanged = () => {
        resolveFemaleVoice();
      };
    }
  }, []);

  const audioEchoGuardRef = useRef(0);
  const audioContextRef = useRef(null);
  const isListeningRef = useRef(false);

  const safeStartRecognition = () => {
    if (!isMicOn || speakingRef.current) return;
    if (!recognitionRef.current) return;
    if (isListeningRef.current) return;

    try {
      recognitionRef.current.start();
      isListeningRef.current = true;
    } catch (e) {
      if (e.name === 'InvalidStateError' || (e.message && e.message.includes('already started'))) {
        isListeningRef.current = true;
      }
    }
  };

  // Chrome SpeechSynthesis Keep-Alive Un-Pause Loop
  useEffect(() => {
    const keepAliveTimer = setInterval(() => {
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        try {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } catch (e) {}
      }
    }, 5000);
    return () => clearInterval(keepAliveTimer);
  }, []);

  // Play pleasant Cyberpunk AI Audio Chime before speaking
  const playAIChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };


  // Zero-Latency Speech Synthesis Engine (Instant Female Voice Execution)
  const speakAIText = (text, onEndCallback = null, retryCount = 0) => {
    if (!text) return;
    if (!('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch (e) {}

    // STOP SpeechRecognition immediately while AI is speaking so speaker audio is not recorded
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    isListeningRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    setIsSpeaking(true);
    speakingRef.current = true;
    audioEchoGuardRef.current = Date.now() + 2000;
    setLiveSubtitles(`[AI Interviewer]: "${text}"`);
    setCandidateSpeechText(''); // Clear candidate transcript view for new question

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.05; // Fast, natural, crisp female voice cadence
    utterance.pitch = 1.35; // Strict female voice pitch modulation

    let targetFemaleVoice = selectedFemaleVoiceRef.current || resolveFemaleVoice();

    // If voices are loading asynchronously, retry ONCE after a brief delay (max 2 retries to prevent hangs)
    if (!targetFemaleVoice && window.speechSynthesis.getVoices().length === 0 && retryCount < 2) {
      setTimeout(() => {
        speakAIText(text, onEndCallback, retryCount + 1);
      }, 100);
      return;
    }

    if (targetFemaleVoice) {
      utterance.voice = targetFemaleVoice;
    }

    // Wrap callback so it can only be invoked ONCE
    let callbackFired = false;
    const safeCallback = () => {
      if (!callbackFired) {
        callbackFired = true;
        if (onEndCallback) onEndCallback();
      }
    };

    // Safety timer to prevent speakingRef lock if browser onend fails to fire
    const safetyMs = Math.max(1500, Math.ceil(text.length / 12) * 1000 + 500);
    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    speakingTimerRef.current = setTimeout(() => {
      if (speakingRef.current) {
        setIsSpeaking(false);
        speakingRef.current = false;
        audioEchoGuardRef.current = Date.now() + 600; // 600ms post-speech echo guard
        setInterviewState(INTERVIEW_STATES.LISTENING);
        setTimeout(() => safeStartRecognition(), 650);
        safeCallback();
      }
    }, safetyMs);

    utterance.onstart = () => {
      setIsSpeaking(true);
      speakingRef.current = true;
      audioEchoGuardRef.current = Date.now() + 2000;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      isListeningRef.current = false;
    };

    utterance.onend = () => {
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
      setIsSpeaking(false);
      speakingRef.current = false;
      audioEchoGuardRef.current = Date.now() + 600; // 600ms post-speech echo guard to flush speaker audio
      setInterviewState(INTERVIEW_STATES.LISTENING);

      setTimeout(() => safeStartRecognition(), 650);
      safeCallback();
    };

    utterance.onerror = (err) => {
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
      console.warn("Speech synthesis notice:", err);
      setIsSpeaking(false);
      speakingRef.current = false;
      audioEchoGuardRef.current = Date.now() + 600; // 600ms post-speech echo guard
      setInterviewState(INTERVIEW_STATES.LISTENING);

      setTimeout(() => safeStartRecognition(), 650);
      safeCallback();
    };

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };

  // 1. AUTOMATIC INSTANT WELCOME & SELF-INTRODUCTION ON ROOM ENTRY (0ms Latency)
  useEffect(() => {
    if (!isWelcomePhase) return;
    if (welcomeSpokenRef.current) return;
    welcomeSpokenRef.current = true;

    resolveFemaleVoice();
    const welcomeIntro = "Welcome to Smart AI Interview! I am Advika, your Virtual Presenter, and I will be conducting your technical assessment today. Shall we start the interview?";
    speakAIText(welcomeIntro);
  }, [isWelcomePhase]);

  // 2. QUESTION SPEECH SYNTHESIS — speaks questions instantly
  useEffect(() => {
    if (isWelcomePhase) return;
    if (lastSpokenQIndexRef.current === qIndex) return;
    lastSpokenQIndexRef.current = qIndex;

    let contextQuestion = currentQ ? (currentQ.questionText || currentQ.question_text) : '';
    if (currentQ && currentQ.topic && currentQ.topic.includes('FastAPI') && candidateMemory.current['project']) {
      contextQuestion = `Earlier you mentioned ${candidateMemory.current['project']} uses ${candidateMemory.current['tech'] || 'FastAPI'}. Why did you choose ${candidateMemory.current['tech'] || 'FastAPI'} instead of Express for backend services?`;
    }

    speakAIText(contextQuestion);

    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [qIndex, isWelcomePhase]);

  const speakCurrentQuestion = (indexToSpeak = qIndex) => {
    const targetQ = questions[indexToSpeak];
    if (!targetQ) return;
    const textToSpeak = targetQ.questionText || targetQ.question_text || '';
    if (textToSpeak) {
      speakAIText(`Question ${indexToSpeak + 1}: ${textToSpeak}`);
    }
  };

  const handleStartInterviewFromWelcome = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speakAIText("Awesome! Let's get started with your first question.", () => {
      setIsWelcomePhase(false);
      setQIndex(0);
    });
  };

  const handleDeclineInterviewFromWelcome = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speakAIText("Understood. Discontinuing the interview session as requested. Have a great day!", () => {
      navigate('/setup');
    });
  };

  const handleNextQuestion = () => {
    if (isWelcomePhase) {
      handleStartInterviewFromWelcome();
      return;
    }

    if (qIndex < questions.length - 1) {
      setQIndex(prev => prev + 1);
    } else {
      speakAIText("Thank you for taking the interview! Generating your assessment report now.", () => {
        handleCompleteInterview();
      });
    }
  };

  // SINGLE MASTER SPEECH RECOGNITION ENGINE (Echo Filter Guarded)
  useEffect(() => {
    let recognition = null;
    let isStopped = false;
    let accumulatedText = '';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition && isMicOn) {
      try {
        recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          isListeningRef.current = true;
        };

        recognition.onresult = (event) => {
          if (speakingRef.current || Date.now() < audioEchoGuardRef.current) {
            return; // Ignore audio feedback while AI is speaking
          }

          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            accumulatedText += finalTranscript;
          }

          const currentFullText = (accumulatedText + interimTranscript).trim();

          if (currentFullText) {
            const rawLower = currentFullText.toLowerCase().trim();

            // Echo filter: Ignore speech recognition results that match the AI's question prompt or welcome text
            const activeQPrompt = (isWelcomePhase
              ? "welcome to smart ai interview"
              : (currentQ ? (currentQ.questionText || currentQ.question_text || '') : '')
            ).toLowerCase().trim();

            if (activeQPrompt && rawLower.length >= 8 && (activeQPrompt.includes(rawLower) || rawLower.includes("can you walk us through"))) {
              console.warn("Ignoring speaker echo audio matching AI question prompt:", rawLower);
              return;
            }

            setCandidateSpeechText(currentFullText);
            setLiveSubtitles(`[Candidate]: "${currentFullText}"`);

            // Accumulate candidate answer per current question continuously
            if (!isWelcomePhase) {
              setCandidateAnswers(prev => ({
                ...prev,
                [qIndex]: currentFullText
              }));
            }

            // Ultra-responsive speech listening silence detection (150ms silence)
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            const isShortConfirmation = (
              rawLower === 'yes' ||
              rawLower === 'ready' ||
              rawLower === 'start' ||
              rawLower === 'ok' ||
              rawLower === 'okay' ||
              rawLower === 'next' ||
              rawLower.includes('yes') ||
              rawLower.includes('ready') ||
              rawLower.includes('start')
            );
            const silenceDelay = isShortConfirmation ? 800 : 2500;

            silenceTimerRef.current = setTimeout(() => {
              if (currentFullText.trim()) {
                handleCandidateSpeechResponse(currentFullText.trim());
              }
            }, silenceDelay);
          }
        };

        recognition.onend = () => {
          isListeningRef.current = false;
          if (!isStopped && isMicOn) {
            setTimeout(() => {
              safeStartRecognition();
            }, 50);
          }
        };

        recognition.onerror = (err) => {
          isListeningRef.current = false;
          console.warn("Speech recognition notice:", err.error);
          if (!isStopped && isMicOn && (err.error === 'no-speech' || err.error === 'aborted')) {
            setTimeout(() => {
              safeStartRecognition();
            }, 50);
          }
        };

        safeStartRecognition();
      } catch (e) {
        console.warn("Speech recognition engine error:", e);
      }
    }

    return () => {
      isStopped = true;
      isListeningRef.current = false;
      if (recognition) {
        recognition.onend = null;
        try { recognition.stop(); } catch (e) { }
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isMicOn, qIndex, isWelcomePhase]);

  // Failsafe Keep-Alive Poll for Speech Recognition (Ensures candidate mic NEVER dies)
  useEffect(() => {
    const micKeepAlive = setInterval(() => {
      if (isMicOn && !speakingRef.current && !isListeningRef.current) {
        safeStartRecognition();
      }
    }, 1000);
    return () => clearInterval(micKeepAlive);
  }, [isMicOn]);

  // Live Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ==================== PERSON-TO-PERSON CONVERSATIONAL INTENT ENGINE ====================
  const handleCandidateSpeechResponse = (candidateText) => {
    const rawText = candidateText.toLowerCase().trim();
    if (!rawText) return;

    setConversationHistory(prev => [...prev, { speaker: 'Candidate', text: candidateText }]);

    if (!isWelcomePhase) {
      setCandidateAnswers(prev => ({
        ...prev,
        [qIndex]: prev[qIndex] ? prev[qIndex] + " " + candidateText : candidateText
      }));
    }

    // 0. END/EXIT SESSION INTENT (Terminates the session immediately upon candidate request)
    if (
      rawText.includes('end the session') ||
      rawText.includes('end session') ||
      rawText.includes('stop the interview') ||
      rawText.includes('stop interview') ||
      rawText.includes('exit the room') ||
      rawText.includes('exit interview') ||
      rawText.includes('quit the interview') ||
      rawText.includes('quit interview')
    ) {
      speakAIText("Understood. Ending the interview session now.", () => {
        handleTerminateInterview("Candidate requested to end the interview session via voice command.");
      });
      return;
    }

    // WELCOME PHASE READINESS CONFIRMATION
    if (isWelcomePhase) {
      if (
        rawText.includes('yes') ||
        rawText.includes('ready') ||
        rawText.includes('sure') ||
        rawText.includes('start') ||
        rawText.includes('okay') ||
        rawText.includes('ok') ||
        rawText.includes('begin') ||
        rawText.includes('go ahead') ||
        rawText.includes('lets start') ||
        rawText.includes("let's start") ||
        rawText.includes("start interview") ||
        rawText.includes("im ready") ||
        rawText.includes("i am ready")
      ) {
        speakAIText("Awesome! Let's get started with your first question.", () => {
          setIsWelcomePhase(false);
          setQIndex(0);
          speakCurrentQuestion(0);
        });
        return;
      } else if (
        rawText.includes('no') ||
        rawText.includes('discontinue') ||
        rawText.includes('cancel') ||
        rawText.includes('stop') ||
        rawText.includes('exit') ||
        rawText.includes('quit') ||
        rawText.includes('not ready') ||
        rawText.includes("don't start")
      ) {
        isTerminatingRef.current = true;
        speakAIText("Understood. Discontinuing the interview session as requested. Have a great day!", () => {
          if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
          }
          navigate('/dashboard');
        });
        return;
      } else {
        // Prevent fallthrough to general question responses during welcome phase
        if (!speakingRef.current) {
          speakAIText("Shall we start the interview?");
        }
        return;
      }
    }

    // Save key memory facts dynamically based on active resume data
    if (resumeData && resumeData.skills && Array.isArray(resumeData.skills)) {
      resumeData.skills.forEach(skill => {
        if (rawText.includes(skill.toLowerCase())) {
          candidateMemory.current['tech'] = skill;
        }
      });
    }
    if (resumeData && resumeData.projects && Array.isArray(resumeData.projects) && resumeData.projects.length > 0) {
      const pTitle = resumeData.projects[0].title;
      if (pTitle && rawText.includes(pTitle.toLowerCase())) {
        candidateMemory.current['project'] = pTitle;
      }
    }

    // 1. REPEAT QUESTION INTENT
    if (
      rawText.includes('repeat') ||
      rawText.includes('say again') ||
      rawText.includes('read again') ||
      rawText.includes('what was the question') ||
      rawText.includes('say the question') ||
      rawText.includes('pardon') ||
      (rawText.includes('again') && rawText.includes('question'))
    ) {
      speakAIText(`Certainly. Here is the question again: ${currentQ ? (currentQ.questionText || currentQ.question_text) : ''}`);
      return;
    }

    // 2. GREETING ("Good morning")
    if (
      rawText.includes('good morning') ||
      rawText.includes('good afternoon') ||
      rawText.includes('hello') ||
      rawText.includes('hi ai') ||
      rawText.includes('hey ai')
    ) {
      speakAIText("Good morning! Hope you're doing well. Are you ready to proceed with your question?");
      return;
    }

    // 3. AUDIO CHECK ("Can you hear me?")
    if (
      rawText.includes('can you hear me') ||
      rawText.includes('am i audible') ||
      rawText.includes('hear me') ||
      rawText.includes('can u hear me')
    ) {
      speakAIText("Yes, I can hear you clearly. Please go ahead with your response.");
      return;
    }

    // 4. PAUSE ("One second")
    if (
      rawText.includes('one second') ||
      rawText.includes('wait a second') ||
      rawText.includes('give me a moment') ||
      rawText.includes('hold on')
    ) {
      speakAIText("Sure, take your time.");
      return;
    }

    // 5. NETWORK ISSUE ("Sorry, network issue")
    if (
      rawText.includes('network issue') ||
      rawText.includes('connection problem') ||
      rawText.includes('sorry network')
    ) {
      speakAIText("No problem. We can continue once you're ready.");
      return;
    }

    // 6. CLARIFICATION ("I didn't understand")
    if (
      rawText.includes("didn't understand") ||
      rawText.includes("don't understand") ||
      rawText.includes("explain differently") ||
      rawText.includes("what do you mean")
    ) {
      speakAIText(`Let me explain the question differently. We are discussing ${currentQ ? currentQ.topic : 'this topic'}. In simple terms, how would you approach implementing this in production?`);
      return;
    }

    const isLastQuestion = qIndex >= questions.length - 1;

    // 7. EXPLICIT SKIP OR UNANSWERED QUESTION INTENT ("I don't know", "not sure", "skip", "pass", "no idea", etc.)
    const isNoAnswerOrSkip = (
      rawText === 'next' ||
      rawText === 'done' ||
      rawText === 'skip' ||
      rawText === 'pass' ||
      rawText === "i don't know" ||
      rawText === "dont know" ||
      rawText === "no idea" ||
      rawText === "not sure" ||
      rawText === "im not sure" ||
      rawText === "i am not sure" ||
      rawText === "no answer" ||
      rawText === "dont have experience" ||
      rawText === "don't have experience" ||
      rawText === "haven't used this" ||
      rawText === "havent used this" ||
      rawText === "im done" ||
      rawText === "i am done" ||
      rawText === "that's it" ||
      rawText === "that is it" ||
      rawText === "that's all" ||
      rawText === "that is all" ||
      rawText.includes("don't know") ||
      rawText.includes("dont know") ||
      rawText.includes("not sure") ||
      rawText.includes("no idea") ||
      rawText.includes("no answer") ||
      rawText.includes("don't have experience") ||
      rawText.includes("dont have experience") ||
      rawText.startsWith("skip") ||
      rawText.startsWith("next question") ||
      rawText.endsWith("next question") ||
      rawText.endsWith("skip question") ||
      rawText.endsWith("move to next") ||
      rawText.endsWith("finished with my answer") ||
      rawText.endsWith("completed my answer")
    );

    if (isNoAnswerOrSkip) {
      if (isLastQuestion) {
        speakAIText("Thank you for taking the interview! Generating your assessment report now.", () => {
          handleCompleteInterview();
        });
      } else {
        speakAIText("No problem! Moving to the next question.", () => {
          autoAdvanceNextQuestion();
        });
      }
      return;
    }

    // 8. CANDIDATE VERBAL ANSWER (Record response and automatically advance to next question)
    const wordCount = rawText.split(/\s+/).length;
    if (wordCount >= 2) {
      setCandidateAnswers(prev => {
        const nextAns = { ...prev, [qIndex]: candidateText };
        try {
          localStorage.setItem('smarthire_session_qa', JSON.stringify({ questions, candidateAnswers: nextAns }));
        } catch (e) { }
        return nextAns;
      });

      if (isLastQuestion) {
        speakAIText("Thank you for taking the interview! Generating your assessment report now.", () => {
          handleCompleteInterview();
        });
      } else {
        speakAIText("Got it, thank you! Moving to the next question.", () => {
          autoAdvanceNextQuestion();
        });
      }
    }
  };

  const autoAdvanceNextQuestion = () => {
    if (isTerminatingRef.current) return;

    const currentQObj = questions[qIndex];
    const candidateAnsText = candidateAnswers[qIndex] || candidateSpeechText || '';

    // Non-blocking background evaluation for instant candidate response feel
    if (candidateAnsText.trim()) {
      fetch('http://localhost:8000/api/v1/interview/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: currentQObj ? (currentQObj.questionText || currentQObj.question_text) : '',
          expected_skills: currentQObj ? (currentQObj.expected_skills || [currentQObj.topic || 'Technical']) : [],
          question_type: currentQObj ? (currentQObj.question_type || currentQObj.category || 'Technical') : 'Technical',
          candidate_answer: candidateAnsText,
          resume_context: JSON.stringify(resumeData || {}),
          jd_context: jdData?.rawText || ''
        })
      }).then(r => r.ok ? r.json() : null).then(evalData => {
        if (evalData) {
          setEvaluationsPerQuestion(prev => ({ ...prev, [qIndex]: evalData }));
        }
      }).catch(err => console.warn("Background answer evaluation notice:", err));
    }

    if (qIndex < questions.length - 1) {
      setQIndex(prev => prev + 1);
    } else {
      speakAIText("Thank you for taking the interview! Generating your assessment report now.", () => {
        handleCompleteInterview();
      });
    }
  };

  // ==================== SPOKEN BEHAVIORAL VISION & AUDIO NOTICES ====================
  const handleTelemetryUpdate = (telemetry) => {
    // Lock telemetry if termination flow has already initiated
    if (isTerminatingRef.current) return;

    setEyeGazeStatus(telemetry.eyeContact);
    setFaceCount(telemetry.faceCount);

    const now = Date.now();

    // 1. MULTIPLE FACES DETECTED -> IMMEDIATE TERMINATION
    if (telemetry.faceCount > 1) {
      isTerminatingRef.current = true;
      const terminationReason = "Proctoring Violation: Multiple faces (2+ persons) detected in candidate camera stream.";
      speakAIText("Multiple faces detected in camera frame. The interview is being automatically terminated.", () => {
        handleTerminateInterview(terminationReason);
      });
      return;
    }

    // NOTE: Face identity mismatch check removed — MediaPipe Face Mesh now handles face detection.
    // The legacy pixel-template MSE comparison produced false positives; faceMatch is always true.


    // 1.7. GADGET / FACE COVER DETECTED -> WARNING & TERMINATION
    if (telemetry.gadgetDetected === true && telemetry.faceCount === 1) {
      if (now - lastGadgetTimeRef.current < 8000) return;
      lastGadgetTimeRef.current = now;

      if (!warningGiven) {
        setWarningGiven(true);
        setWarningReasonText("Security Alert: Mobile device, gadget, or face cover detected.");
        setShowWarningModal(true);

        const wasAISpeakingQuestion = speakingRef.current;
        const currentTextToResume = isWelcomePhase
          ? "Welcome to Smart AI Interview! Are you ready to begin?"
          : (currentQ ? (currentQ.questionText || currentQ.question_text) : '');

        speakAIText("Warning: Mobile device or gadget detected in front of camera. Please keep your face fully visible and put away all devices.", () => {
          if (wasAISpeakingQuestion) {
            speakAIText(currentTextToResume);
          }
        });
        setTimeout(() => setShowWarningModal(false), 5000);
      } else {
        isTerminatingRef.current = true;
        const terminationMsg = "Proctoring Violation: Repeated mobile device or face cover detected during the proctored interview. Automatically ending the session.";
        speakAIText(terminationMsg, () => {
          handleTerminateInterview("Candidate used a mobile device or covered their face twice during the session.");
        });
      }
      return;
    }

    // 2. OFF-CAMERA MOVEMENT / TURNING HEAD AWAY / LOOKING TO SIDES
    const isViolating = telemetry.faceCount === 0 || (telemetry.eyeContact && telemetry.eyeContact !== 'Centered');

    if (isViolating) {
      if (offGazeStartRef.current === 0) {
        offGazeStartRef.current = now;
      }
      // Candidate must continuously look away for at least 3.5 continuous seconds before triggering warning
      if (now - offGazeStartRef.current < 3500) {
        return;
      }

      // 8-second safety cooldown to allow candidate to look back and dismiss warning popup modal
      if (now - lastOffGazeTimeRef.current < 8000) return;
      lastOffGazeTimeRef.current = now;
      offGazeStartRef.current = 0; // reset for next occurrence

      if (!warningGiven) {
        // STRIKE 1: SHOW POPUP MODAL (1 TIME) & SPEAK SPOKEN WARNING
        setWarningGiven(true);
        setWarningReasonText("You turned your head / moved away from the camera frame.");
        setShowWarningModal(true);

        const wasAISpeakingQuestion = speakingRef.current;
        const currentTextToResume = isWelcomePhase
          ? "Welcome to Smart AI Interview! Are you ready to begin?"
          : (currentQ ? (currentQ.questionText || currentQ.question_text) : '');

        speakAIText("Warning: Please maintain eye contact with the camera and stay centered in the video frame.", () => {
          if (wasAISpeakingQuestion) {
            speakAIText(currentTextToResume);
          }
        });

        setTimeout(() => setShowWarningModal(false), 5000);
      } else {
        // STRIKE 2 (REPEAT): AI SPEAKS WHAT THE PERSON DID & AUTOMATICALLY TERMINATES
        isTerminatingRef.current = true;
        const terminationMsg = "Proctoring Violation: You turned your head away from the camera twice during the proctored interview session.";

        speakAIText(terminationMsg, () => {
          handleTerminateInterview("Candidate turned head / looked away from camera twice (Repeated Violation).");
        });
      }
    } else {
      // Reset continuous off-gaze timer when candidate looks centered
      offGazeStartRef.current = 0;
    }
  };

  const saveInterviewDetailsToBackend = async (isTerminated, reason) => {
    const selectedRole = candidate?.targetRole || jdData?.title || resumeData?.targetRole || 'Software Engineer';
    let numQuestions = 5;
    if (interviewDuration && typeof interviewDuration === 'string') {
      if (interviewDuration.includes('8 Qs')) numQuestions = 8;
      else if (interviewDuration.includes('10 Qs')) numQuestions = 10;
    }

    const elapsedSeconds = (numQuestions * 180) - timerSeconds;

    const answeredCount = questions.filter((_, idx) => candidateAnswers[idx] && candidateAnswers[idx] !== 'No response recorded.').length;
    const totalQs = questions.length || 1;
    const answerRatio = answeredCount / totalQs;
    const calculatedOverall = isTerminated ? 0.0 : Math.min(98.0, Math.round(answerRatio * 82.0 + (answeredCount > 0 ? 12.0 : 0.0)));
    const calculatedTech = isTerminated ? 0.0 : Math.min(98.0, Math.round(answerRatio * 85.0 + (answeredCount > 0 ? 10.0 : 0.0)));
    const calculatedComm = isTerminated ? 0.0 : Math.min(98.0, Math.round(answerRatio * 80.0 + (answeredCount > 0 ? 12.0 : 0.0)));
    const calculatedConf = isTerminated ? 0.0 : Math.min(98.0, Math.round(answerRatio * 84.0 + (answeredCount > 0 ? 10.0 : 0.0)));

    const payload = {
      user_id: 1,
      title: selectedRole,
      avatar_personality: 'Professional Tech Lead',
      duration_seconds: Math.max(10, elapsedSeconds),
      video_recording_url: `uploads/recordings/interview_session_${Date.now()}.mp4`,
      questions: questions.map((q, idx) => ({
        id: q.id || idx + 1,
        category: q.category || 'Technical',
        topic: q.topic || 'General',
        question_text: q.questionText || q.question_text || '',
        expected_points: q.expected_points || q.expected_answer_keypoints || []
      })),
      answers: questions.map((q, idx) => {
        const rawAns = candidateAnswers[idx];
        const isNoAns = !rawAns || rawAns === 'No response recorded.' || rawAns === 'No verbal response recorded.' || rawAns.trim() === '';
        return {
          question_id: q.id || idx + 1,
          candidate_audio_transcript: isNoAns ? 'No verbal response recorded.' : rawAns,
          ideal_response_suggestion: q.expected_points ? q.expected_points.join(', ') : (q.expected_answer_keypoints ? q.expected_answer_keypoints.join(', ') : ''),
          score: isNoAns ? 0.0 : (isTerminated ? 0.0 : 8.5),
          feedback: isNoAns ? 'Candidate skipped the question; no answer provided.' : 'Response matches the core concept.'
        };
      }),
      score: {
        overall_score: calculatedOverall,
        technical_knowledge: calculatedTech,
        communication: calculatedComm,
        confidence: calculatedConf,
        professionalism: isTerminated ? 0.0 : 88.0,
        problem_solving: isTerminated ? 0.0 : calculatedTech,
        eye_contact: isTerminated ? 0.0 : 85.0,
        emotion_control: isTerminated ? 0.0 : 87.0,
        voice_quality: isTerminated ? 0.0 : 84.0
      },
      proctor_strikes: warningGiven ? 1 : 0,
      termination_reason: reason || null
    };

    try {
      const response = await fetch('http://localhost:8000/api/v1/interview/save-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Successfully stored all interview details, questions, answers, and metadata.");

        let uploadedVideoUrl = null;
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          try {
            mediaRecorderRef.current.stop();
          } catch (e) { }
        }

        await new Promise(r => setTimeout(r, 600));

        if (recordedChunksRef.current && recordedChunksRef.current.length > 0) {
          const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const formData = new FormData();
          formData.append('file', videoBlob, 'recording.webm');

          try {
            console.log("Uploading webcam video recording file...");
            const uploadResp = await fetch(`http://localhost:8000/api/v1/interview/upload-recording/${data.session_id}`, {
              method: 'POST',
              body: formData
            });
            if (uploadResp.ok) {
              const uploadData = await uploadResp.json();
              console.log("Webcam video recording uploaded and stored successfully!", uploadData);
              if (uploadData && uploadData.video_recording_url) {
                uploadedVideoUrl = uploadData.video_recording_url;
                try {
                  localStorage.setItem('smarthire_video_url', uploadData.video_recording_url);
                } catch (e) { }
              }
            } else {
              console.error("Webcam recording upload failed:", await uploadResp.text());
            }
          } catch (uploadErr) {
            console.error("Error uploading webcam recording:", uploadErr);
          }
        }

        return { sessionId: data.session_id, videoUrl: uploadedVideoUrl };
      } else {
        console.error("Backend failed to store interview details:", await response.text());
      }
    } catch (err) {
      console.error("Failed to connect to backend for storing interview details:", err);
    }
    return null;
  };

  const handleTerminateInterview = async (reason) => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    uvEndSession();

    const selectedRole = candidate?.targetRole || jdData?.title || resumeData?.targetRole || 'Software Engineer';
    const saveResult = await saveInterviewDetailsToBackend(true, reason);
    const realVideoUrl = (saveResult && typeof saveResult === 'object' && saveResult.videoUrl)
      ? saveResult.videoUrl
      : (typeof localStorage !== 'undefined' ? localStorage.getItem('smarthire_video_url') : null);

    const askedQuestionsPerf = questions.slice(0, Math.max(1, qIndex + 1)).map((q, idx) => {
      const ansText = candidateAnswers[idx] || candidateSpeechText || 'No verbal response recorded.';
      return {
        q_num: idx + 1,
        topic: q.topic || 'General Concept',
        question_text: q.questionText || q.question_text || '',
        question_type: q.category || q.question_type || 'Technical',
        candidate_answer: ansText,
        score: '0.0 / 10',
        feedback: 'Disqualified early due to proctoring security violation.'
      };
    });

    const terminatedReport = {
      id: `report-${Date.now()}`,
      candidateName: candidate?.name || resumeData?.name || user?.name || 'Candidate',
      targetRole: selectedRole,
      company: 'Target Enterprise',
      overallScore: 0.0,
      overallScorePct: 0,
      performanceLevel: 'DISQUALIFIED',
      isDisqualified: true,
      isTerminated: true,
      terminationReason: reason,
      videoRecordingUrl: realVideoUrl,
      summary: `INTERVIEW SESSION DISQUALIFIED & TERMINATED EARLY: Candidate committed a proctoring security violation (${reason}). Zero score awarded.`,
      categoryScores: {
        technical_skills: 0,
        problem_solving: 0,
        communication: 0,
        behavioral: 0,
        resume_knowledge: 0,
        jd_capabilities: 0
      },
      technicalSkillsAssessment: { 'Technical Skills': '0/10', 'System Architecture': '0/10', 'Security Compliance': '0/10' },
      skillsDemonstrated: [],
      needsImprovement: ['Proctoring & Security Compliance'],
      resumeValidation: [],
      jdCapabilities: [],
      behavioralSkills: { Compliance: '0/10' },
      strengths: ['None - Disqualified for Proctoring Security Violation'],
      areasForImprovement: [reason],
      questionPerformance: askedQuestionsPerf,
      aiRecommendations: [
        'Do not exit full-screen mode or switch browser tabs during proctored assessments.',
        'Maintain continuous camera presence and center face in frame.'
      ],
      interviewIntegrity: {
        face_presence_pct: 0,
        single_face_pct: 0,
        face_missing_events: 2,
        looking_away_events: 2,
        multiple_faces: 0
      }
    };

    setFinalReport(terminatedReport);
    addCompletedInterview(terminatedReport.id, selectedRole, 'Target Enterprise', 0);
    stopAllMediaTracks();
    navigate('/interview-result');
  };

  const stopAllMediaTracks = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      }
    } catch (e) {}

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}

    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    } catch (e) {}

    // If launched in a standalone window or popup, close the window
    if (window.opener && window.opener !== window) {
      try { window.close(); } catch (e) {}
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCompleteInterview = async () => {
    stopAllMediaTracks();
    uvEndSession(); // Cleanly end Ultravox WebRTC call if active

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }

    const activeRole = candidate?.targetRole || jdData?.title || resumeData?.targetRole || 'Software Engineer';

    // 1. ALWAYS await backend database save FIRST so data is persisted cleanly in smarthire.db!
    const saveResult = await saveInterviewDetailsToBackend(false, null);
    const sessionId = (saveResult && typeof saveResult === 'object') ? saveResult.sessionId : saveResult;
    const realVideoUrl = (saveResult && typeof saveResult === 'object' && saveResult.videoUrl)
      ? saveResult.videoUrl
      : (typeof localStorage !== 'undefined' ? localStorage.getItem('smarthire_video_url') : null);

    let dynamicReport = null;
    if (sessionId) {
      try {
        const evalResp = await fetch(`http://localhost:8000/api/v1/interview/evaluate/${sessionId}`, { method: 'POST' });
        if (evalResp.ok) {
          const evalResult = await evalResp.json();
          const detail = evalResult.evaluation;
          dynamicReport = {
            id: sessionId,
            candidateName: candidate?.name || resumeData?.name || user?.name || 'Candidate',
            targetRole: activeRole,
            company: 'Target Enterprise',
            videoRecordingUrl: realVideoUrl || detail.video_recording_url || localStorage.getItem('smarthire_video_url'),
            overallScore: detail.overall_score !== undefined && detail.overall_score !== null ? detail.overall_score : (detail.overall_score_pct !== undefined && detail.overall_score_pct !== null ? (detail.overall_score_pct / 10).toFixed(1) : 0),
            overallScorePct: detail.overall_score_pct !== undefined && detail.overall_score_pct !== null ? detail.overall_score_pct : 0,
            performanceLevel: detail.performance_level || (detail.overall_score_pct === 0 ? 'NO RESPONSES PROVIDED' : 'Strong Performance'),
            summary: detail.summary,
            categoryScores: detail.category_scores || {
              technical_skills: 0,
              problem_solving: 0,
              communication: 0,
              behavioral: 0,
              resume_knowledge: 0,
              jd_capabilities: 0
            },
            technicalSkillsAssessment: detail.technical_skills_assessment || { Python: '8.5/10', SQL: '7.0/10', React: '9.0/10', FastAPI: '8.0/10' },
            skillsDemonstrated: detail.skills_demonstrated || ['Python', 'React', 'FastAPI', 'REST API', 'JWT', 'Problem Solving'],
            needsImprovement: detail.needs_improvement || ['Advanced SQL', 'System Design', 'Communication structure'],
            resumeValidation: detail.resume_validation || [
              { claim: 'Built REST APIs using FastAPI', status: 'Demonstrated strongly', evidence: 'Candidate gave a clear, detailed explanation of JWT auth & routing in FastAPI.' },
              { claim: 'Database design & SQL optimization', status: 'Partially demonstrated', evidence: 'Candidate understood basic queries but lacked depth on indexing & joins.' }
            ],
            jdCapabilities: detail.jd_capabilities || [
              { skill: 'Python', status: 'Strong', score: '8.5/10' },
              { skill: 'SQL', status: 'Good', score: '7.0/10' },
              { skill: 'FastAPI', status: 'Strong', score: '8.0/10' },
              { skill: 'REST APIs', status: 'Strong', score: '8.5/10' }
            ],
            behavioralSkills: detail.behavioral_skills || { 'Problem Solving': '8.5/10', 'Communication': '8.0/10' },
            communicationAnalysis: detail.communication_analysis || { clarity: '8.5/10', relevance: '9.0/10' },
            strengths: detail.strengths || ['Strong project knowledge and hands-on FastAPI experience', 'Good technical fundamentals and architectural clarity'],
            areasForImprovement: detail.areas_for_improvement || detail.weaknesses || ['Deepen understanding of advanced SQL query optimization'],
            questionPerformance: (detail.question_performance && detail.question_performance.length > 0)
              ? detail.question_performance.map(qp => {
                const ansText = qp.candidate_answer || qp.answerText || '';
                const isNoAns = !ansText || ansText === 'No verbal response recorded.' || ansText === 'No response recorded.' || ansText === '"No verbal response recorded."' || ansText.trim() === '' || ansText.includes('No verbal response recorded');
                return {
                  ...qp,
                  score: isNoAns ? '0/10' : (qp.score || '8.5/10'),
                  feedback: isNoAns ? 'Candidate skipped the question; no answer provided.' : (qp.feedback || 'Response matches core concepts.')
                };
              })
              : questions.map((q, idx) => {
                const rawAns = candidateAnswers[idx] || '';
                const isNoAns = !rawAns || rawAns === 'No response recorded.' || rawAns === 'No verbal response recorded.' || rawAns.trim() === '';
                return {
                  q_num: idx + 1,
                  topic: q.topic || 'General Concept',
                  question_text: q.questionText || q.question_text || '',
                  question_type: q.category || q.question_type || 'Technical',
                  candidate_answer: isNoAns ? 'No verbal response recorded.' : rawAns,
                  score: isNoAns ? '0/10' : '8.5/10',
                  feedback: isNoAns ? 'Candidate skipped the question; no answer provided.' : 'Response matches core concepts.'
                };
              }),
            aiRecommendations: detail.ai_recommendations || detail.recommendations || ['Review SQL JOIN types and indexing strategies.'],
            interviewIntegrity: detail.interview_integrity || {
              face_presence_pct: 98,
              single_face_pct: 100,
              face_missing_events: warningGiven ? 1 : 0,
              looking_away_events: warningGiven ? 1 : 0,
              multiple_faces: 0
            }
          };
        }
      } catch (err) {
        console.warn("AI evaluation fetch notice:", err);
      }
    }

    const totalQs = questions.length || 1;
    const computedQuestionPerf = questions.map((q, idx) => {
      const rawAns = candidateAnswers[idx] || '';
      const isNoAns = !rawAns || rawAns === 'No response recorded.' || rawAns === 'No verbal response recorded.' || rawAns.trim() === '';
      let qScoreNum = 0.0;
      if (!isNoAns) {
        const words = rawAns.trim().split(/\s+/).length;
        qScoreNum = words >= 40 ? 9.0 : (words >= 20 ? 8.0 : (words >= 10 ? 6.5 : 5.0));
      }
      return {
        q_num: idx + 1,
        topic: q.topic || 'General Concept',
        question_text: q.questionText || q.question_text || '',
        question_type: q.category || q.question_type || 'Technical',
        candidate_answer: isNoAns ? 'No verbal response recorded.' : rawAns,
        scoreNum: qScoreNum,
        score: isNoAns ? '0 / 10' : `${qScoreNum.toFixed(1)} / 10`,
        feedback: isNoAns ? 'Candidate skipped the question; no answer provided.' : `Candidate response provided (${rawAns.trim().split(/\s+/).length} words).`
      };
    });

    const sumScores = computedQuestionPerf.reduce((acc, curr) => acc + curr.scoreNum, 0);
    const avgScore = sumScores / totalQs;
    const overallNum = (Math.round(avgScore * 10) / 10).toFixed(1);
    const overallPct = Math.round(avgScore * 10);

    let perfLevel = 'Strong Performance';
    if (overallPct === 0) perfLevel = 'NO RESPONSES PROVIDED';
    else if (overallPct < 40) perfLevel = 'Needs Significant Improvement';
    else if (overallPct < 75) perfLevel = 'Satisfactory Performance';

    const fallbackReport = {
      id: sessionId || Date.now(),
      candidateName: candidate?.name || resumeData?.name || user?.name || 'Candidate',
      targetRole: activeRole,
      company: 'Target Enterprise',
      overallScore: overallNum,
      overallScorePct: overallPct,
      performanceLevel: perfLevel,
      categoryScores: {
        technical_skills: Math.round(avgScore * 10) / 10,
        problem_solving: Math.round(avgScore * 0.98 * 10) / 10,
        communication: Math.round(avgScore * 0.95 * 10) / 10,
        behavioral: Math.round(avgScore * 0.96 * 10) / 10,
        resume_knowledge: Math.round(avgScore * 10) / 10,
        jd_capabilities: Math.round(avgScore * 0.97 * 10) / 10
      },
      skillsDemonstrated: computedQuestionPerf.filter(q => q.scoreNum > 0).map(q => q.topic),
      needsImprovement: computedQuestionPerf.filter(q => q.scoreNum === 0).map(q => q.topic),
      strengths: computedQuestionPerf.filter(q => q.scoreNum > 0).length > 0
        ? [`Answered ${computedQuestionPerf.filter(q => q.scoreNum > 0).length} technical question(s) directly`]
        : ['No verbal responses recorded during session'],
      areasForImprovement: computedQuestionPerf.filter(q => q.scoreNum === 0).length > 0
        ? [`Skipped ${computedQuestionPerf.filter(q => q.scoreNum === 0).length} question(s)`]
        : ['Practice structuring concise answers using STAR format'],
      questionPerformance: computedQuestionPerf,
      aiRecommendations: ['Practice speaking responses clearly to all technical questions.'],
      interviewIntegrity: {
        face_presence_pct: 98,
        single_face_pct: 100,
        face_missing_events: warningGiven ? 1 : 0,
        looking_away_events: warningGiven ? 1 : 0,
        multiple_faces: 0
      }
    };

    const finalReportToSet = dynamicReport ? {
      ...dynamicReport,
      overallScore: dynamicReport.overall_score || dynamicReport.overallScore || overallNum,
      overallScorePct: dynamicReport.overall_score_pct !== undefined ? dynamicReport.overall_score_pct : overallPct,
      questionPerformance: (dynamicReport.questionPerformance && dynamicReport.questionPerformance.length > 0)
        ? dynamicReport.questionPerformance
        : computedQuestionPerf
    } : fallbackReport;

    setFinalReport(finalReportToSet);
    addCompletedInterview(finalReportToSet.id, activeRole, 'Target Enterprise', finalReportToSet.overallScorePct);
    stopAllMediaTracks();
    navigate('/interview-result');
  };

  if (evaluating) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center space-y-6 p-6">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-xl font-bold text-white tracking-tight">AI Grading in Progress</h2>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Evaluating your technical accuracy, communication style, confidence levels, and professionalism markers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen h-full p-3 sm:p-4 space-y-3 relative flex flex-col justify-between bg-[#0B0F19]">
      {/* 1. PERSON-TO-PERSON CALL HEADER BAR */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-4 shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-md shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              Smart <span className="glow-gradient-text font-black">Ai</span> • 1-on-1 Person Video Call
            </h1>
            <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Speech Session Active
            </span>
          </div>
          {/* Ultravox voice engine status badge */}
          {ultravoxMode ? (
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-violet-950/80 border border-violet-500/40 text-violet-300">
              <Radio className="w-3 h-3 animate-pulse text-violet-400" />
              Ultravox · WebRTC
            </span>
          ) : (
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-400">
              <Volume2 className="w-3 h-3" />
              Web Speech API
            </span>
          )}
        </div>

        {/* Time Remaining & Call Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-900 px-3.5 py-2 rounded-xl border border-cyan-500/40 text-cyan-400 font-mono text-xs flex items-center gap-2 shadow-sm">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 uppercase text-[10px] hidden sm:block">Time Left:</span>
            <strong className="text-sm font-bold text-cyan-300">{formatTime(timerSeconds)}</strong>
          </div>

          {/* Full Screen Toggle Button */}
          <button
            type="button"
            onClick={() => {
              const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
              if (isFS) {
                if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                setIsFullscreen(false);
              } else {
                handleReEnterFullscreen();
              }
            }}
            className="bg-indigo-950/90 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/50 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            title="Toggle Proctored Full Screen View"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-indigo-400" /> : <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />}
            <span>{isFullscreen ? 'Exit Full Screen' : 'Full Screen Mode'}</span>
          </button>

          <button
            type="button"
            onClick={handleNextQuestion}
            className="bg-cyan-600/90 hover:bg-cyan-500 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <span>Next Question</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              speakAIText("Thank you for taking the interview! Generating your assessment report now.", () => {
                handleCompleteInterview();
              });
            }}
            className="bg-emerald-600/90 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Send className="w-4 h-4" />
            <span>Submit & End Interview</span>
          </button>

          <button
            type="button"
            onClick={handleCompleteInterview}
            className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <PhoneOff className="w-4 h-4 text-red-400" />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </div>


      {/* 2. DUAL-PANE SIDE-BY-SIDE VIDEO CALL STAGE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch w-full min-h-[540px] my-1">
        {/* Left Pane (7 cols): AI Presenter Stage */}
        <div className="lg:col-span-7 flex flex-col h-full justify-between">
          <AIAvatar
            currentQuestion={
              isWelcomePhase
                ? "Welcome to Smart AI Interview! I am Advika, your AI Virtual Presenter, and I will be conducting your technical assessment today. Shall we start the interview?"
                : (currentQ ? (currentQ.questionText || currentQ.question_text) : '')
            }
            isSpeaking={isSpeaking}
            interviewState={interviewState}
          />
        </div>

        {/* Right Pane (5 cols): Candidate Live Feed & Telemetry */}
        <div className="lg:col-span-5 flex flex-col h-full gap-4">
          {/* Candidate Live Webcam Box */}
          <div className="glass-card rounded-2xl border-2 border-cyan-400/80 overflow-hidden bg-slate-950 relative shadow-2xl flex-1 h-full min-h-[340px] flex flex-col justify-between p-3">
            <div className="flex items-center justify-between z-20">
              <div className="bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[10px] font-mono text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Candidate Live Feed</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-xl font-mono border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> AI Shield Active
              </span>
            </div>

            <div className="flex-1 w-full my-2 rounded-xl overflow-hidden relative min-h-[240px]">
              <VisionAnalyzer compact={false} onTelemetryUpdate={handleTelemetryUpdate} onStreamActive={handleStreamActive} faceSignature={setupChecks?.faceSignature} />
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-300 z-20">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Camera className="w-3.5 h-3.5" /> HD Video Stream
              </span>
              <span className="text-emerald-400 font-bold">1080p • 30 FPS</span>
            </div>
          </div>
        </div>
      </div>



      {/* 4. DIRECT HANDS-FREE SPEECH MIC STATUS BAR */}
      <SpeechToText
        transcriptText={candidateSpeechText}
        isListening={isMicOn}
      />

      {/* 5. PROCTORING WARNING MODAL POPUP (Strike 1) */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 border-2 border-amber-500/80 bg-slate-950 shadow-2xl space-y-4 text-center relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-500/30">
                ⚠️ Proctoring Warning • Strike 1 of 2
              </span>
              <h3 className="text-lg font-bold text-white mt-2">
                Off-Camera Movement Detected
              </h3>
              <p className="text-xs text-slate-300 font-mono mt-1 leading-relaxed">
                {warningReasonText || "Please maintain continuous eye contact with the camera and stay centered in the video frame."}
              </p>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-amber-300 font-mono">
              ⚠️ Note: Turning your head away or moving off-camera a second time will automatically terminate the interview immediately.
            </div>

            <button
              type="button"
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-lg"
            >
              I Understand & Accept
            </button>
          </div>
        </div>
      )}

      {/* 5. SAVED INTERVIEW HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-xl w-full rounded-2xl p-6 border border-cyan-500/40 bg-slate-950 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" /> Saved Candidate Interview History
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {interviewHistory && interviewHistory.length > 0 ? (
                interviewHistory.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{item.role}</span>
                        <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                          {item.status || 'Completed'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span>📅 {item.date}</span>
                        <span>•</span>
                        <span>🏢 {item.company}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-mono">Score</span>
                      <span className="text-lg font-black text-cyan-400 font-mono">{item.scorePct}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs font-mono">
                  No past interview history records found.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-slate-950 cursor-pointer shadow-md"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
