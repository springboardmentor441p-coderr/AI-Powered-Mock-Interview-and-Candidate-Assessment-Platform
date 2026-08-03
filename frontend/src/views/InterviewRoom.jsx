import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Mic, MicOff, Video, VideoOff, Play, CheckCircle2, ChevronRight, 
  HelpCircle, User, AlertCircle, Volume2, VolumeX, Sparkles, Radio, 
  Zap, RefreshCw, MessageSquare
} from 'lucide-react';
import api from '../services/api';

export default function InterviewRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Session Data
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Voice Interaction & State Machine
  // aiState: 'intro' | 'speaking' | 'listening' | 'processing' | 'completed'
  const [aiState, setAiState] = useState('intro');
  const [isAutoVoiceMode, setIsAutoVoiceMode] = useState(true);
  const [micVolume, setMicVolume] = useState(0);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [silenceCountdown, setSilenceCountdown] = useState(null);
  
  // Statuses & Metrics
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [transcript, setTranscript] = useState('');
  const [timer, setTimer] = useState(120); // 2 minutes max per answer
  const [duration, setDuration] = useState(0);

  // HUD Analytics Simulations
  const [eyeContact, setEyeContact] = useState(95);
  const [attention, setAttention] = useState(98);
  const [emotion, setEmotion] = useState('Focused');

  // Stream & Hardware Refs
  const videoRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const audioStreamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const ttsSafetyTimeoutRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Web Audio API & VAD Refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastSpeechTimeRef = useRef(null);
  
  // Refs to bypass stale closures in intervals and speech events
  const aiStateRef = useRef(aiState);
  const durationRef = useRef(duration);
  const eyeContactRef = useRef(eyeContact);
  const attentionRef = useRef(attention);
  const transcriptRef = useRef(transcript);
  const currentQIndexRef = useRef(currentQIndex);
  const isSpeakingTTSRef = useRef(false);
  const spokenQIndexRef = useRef(-1);

  // Keep refs synchronized on every state/prop change
  useEffect(() => { aiStateRef.current = aiState; }, [aiState]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { eyeContactRef.current = eyeContact; }, [eyeContact]);
  useEffect(() => { attentionRef.current = attention; }, [attention]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { currentQIndexRef.current = currentQIndex; }, [currentQIndex]);

  const currentQuestion = questions[currentQIndex];

  // 1. Initial Fetch & Setup
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await api.get(`/api/interviews/session/${sessionId}`);
        setSession(response.data);
        const qList = response.data.questions || [];
        setQuestions(qList);

        // Check if candidate already answered some questions
        const answeredCount = response.data.answers ? response.data.answers.length : 0;
        if (answeredCount > 0 && answeredCount < qList.length) {
          setCurrentQIndex(answeredCount);
        }
      } catch (err) {
        setErrorMsg('Failed to initialize session data. Please restart the interview.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
    startWebcam();

    // Fluctuating HUD Indicators simulation
    const hudInterval = setInterval(() => {
      const state = aiStateRef.current;
      if (state === 'listening' || state === 'speaking') {
        setEyeContact((prev) => {
          const delta = (Math.random() - 0.5) * 4;
          return Math.min(100, Math.max(70, Math.round(prev + delta)));
        });
        setAttention((prev) => {
          const delta = (Math.random() - 0.5) * 3;
          return Math.min(100, Math.max(75, Math.round(prev + delta)));
        });
        setEmotion(() => {
          const rand = Math.random();
          if (rand > 0.85) return 'Confident';
          if (rand > 0.70) return 'Analytical';
          return 'Focused';
        });
      } else {
        setEyeContact(95);
        setAttention(98);
        setEmotion('Neutral');
      }
    }, 1500);

    return () => {
      cleanupAudioAndSpeech();
      stopWebcam();
      clearInterval(timerIntervalRef.current);
      clearInterval(hudInterval);
    };
  }, [sessionId]);

  // Clean up speech synthesis, recognition, audio context
  const cleanupAudioAndSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isSpeakingTTSRef.current = false;
    clearTimeout(ttsSafetyTimeoutRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {}
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Webcam Start/Stop
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: false 
      });
      webcamStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Failed to open webcam:', err);
    }
  };

  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Start Voice Session (Entry point for browser audio permission)
  const handleStartVoiceSession = async () => {
    spokenQIndexRef.current = currentQIndex;
    setAiState('speaking');
    await startAudioContextAndVAD();
    if (currentQuestion) {
      speakQuestionText(currentQuestion.question_text);
    }
  };

  // 2. TTS Voice Controller (AI Speaking)
  const speakQuestionText = (text) => {
    if (!window.speechSynthesis) {
      console.warn('SpeechSynthesis API not supported.');
      startCandidateListening();
      return;
    }

    // Cancel active speech and resume synth engine (Fixes Chrome freeze)
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    clearTimeout(ttsSafetyTimeoutRef.current);
    isSpeakingTTSRef.current = true;
    setAiState('speaking');
    setIsInterrupted(false);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => 
      (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen')) 
      && v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    const handleSpeechFinished = () => {
      clearTimeout(ttsSafetyTimeoutRef.current);
      if (isSpeakingTTSRef.current) {
        isSpeakingTTSRef.current = false;
        // AI finished speaking question -> start candidate listening automatically!
        if (isAutoVoiceMode) {
          startCandidateListening();
        } else {
          setAiState('idle');
        }
      }
    };

    utterance.onend = handleSpeechFinished;
    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e);
      handleSpeechFinished();
    };

    // Safety fallback: if utterance.onend fails to trigger in Chrome, force transition after max expected duration
    const maxSpeechDurationMs = (text.length * 90) + 4000;
    ttsSafetyTimeoutRef.current = setTimeout(() => {
      console.warn('TTS safety timeout triggered.');
      window.speechSynthesis.cancel();
      handleSpeechFinished();
    }, maxSpeechDurationMs);

    // Short timeout to let browser finish cancelling previous speech
    setTimeout(() => {
      // Ensure candidate didn't already interrupt (barge-in) during this brief delay
      if (isSpeakingTTSRef.current) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      }
    }, 150);

    // Ensure audio analysis is active for candidate mic stream
    if (!audioStreamRef.current) {
      startAudioContextAndVAD();
    }
  };

  // 3. Barge-In Interruption Handler
  const triggerBargeIn = () => {
    if (isSpeakingTTSRef.current) {
      console.log('⚡ BARGE-IN DETECTED: Candidate started speaking during AI TTS!');
      window.speechSynthesis.cancel();
      clearTimeout(ttsSafetyTimeoutRef.current);
      isSpeakingTTSRef.current = false;
      setIsInterrupted(true);

      setTimeout(() => setIsInterrupted(false), 2500);

      // Instantly switch to candidate listening turn
      startCandidateListening();
    }
  };

  // 4. Start Candidate Listening & Speech Recognition
  const startCandidateListening = async () => {
    clearTimeout(ttsSafetyTimeoutRef.current);
    setTranscript('');
    setTimer(120);
    setDuration(0);
    setSilenceCountdown(null);
    setAiState('listening');
    
    // Set baseline last speech time to NOW (starts 3-second silence timer)
    lastSpeechTimeRef.current = Date.now();

    // Ensure mic stream and VAD are active
    if (!audioStreamRef.current) {
      await startAudioContextAndVAD();
    }

    // Setup SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }

        const trimmed = currentTranscript.trim();
        if (trimmed) {
          // If AI is currently speaking and candidate speaks real words, trigger Barge-In!
          if (isSpeakingTTSRef.current && trimmed.length > 2) {
            triggerBargeIn();
          }

          setTranscript(currentTranscript);
          lastSpeechTimeRef.current = Date.now();
        }
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
      };

      rec.onend = () => {
        // If recognition ends while still in listening state, restart it seamlessly
        if (aiStateRef.current === 'listening') {
          try { rec.start(); } catch (e) {}
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (err) {
        console.error('Speech recognition start failed:', err);
      }
    }

    // Setup MediaRecorder for audio blob upload
    try {
      if (audioStreamRef.current) {
        const mediaRecorder = new MediaRecorder(audioStreamRef.current, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        mediaRecorder.start(250);
      }
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
    }

    // Start timer countdown
    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleStopAndSubmitAnswer();
          return 0;
        }
        setDuration((d) => d + 1);
        return prev - 1;
      });
    }, 1000);
  };

  // 5. Audio Context & VAD (Voice Activity Detection + Mic Level Meter)
  const startAudioContextAndVAD = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = audioStream;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(audioStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolumeLoop = () => {
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalizedVol = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalizedVol);

        // Update last speech/sound timestamp whenever candidate speaks/makes sound above noise floor
        if (normalizedVol > 14) {
          lastSpeechTimeRef.current = Date.now();
        }

        animFrameRef.current = requestAnimationFrame(checkVolumeLoop);
      };

      checkVolumeLoop();
    } catch (err) {
      console.error('Microphone VAD setup failed:', err);
    }
  };

  // 6. VAD Silence Monitoring Interval (Auto-Submit after 3s of silence)
  useEffect(() => {
    let vadInterval = null;

    if (isAutoVoiceMode && aiState === 'listening') {
      vadInterval = setInterval(() => {
        const lastActivity = lastSpeechTimeRef.current || Date.now();
        const quietDuration = Date.now() - lastActivity;
        const SILENCE_THRESHOLD_MS = 3000; // 3 seconds silence threshold

        if (quietDuration > 800) {
          const remainingSecs = Math.max(0, ((SILENCE_THRESHOLD_MS - quietDuration) / 1000)).toFixed(1);
          setSilenceCountdown(remainingSecs);

          if (quietDuration >= SILENCE_THRESHOLD_MS) {
            console.log('🎙️ 3 SECONDS SILENCE DETECTED: Auto-submitting response...');
            clearInterval(vadInterval);
            setSilenceCountdown(null);
            handleStopAndSubmitAnswer();
          }
        } else {
          setSilenceCountdown(null);
        }
      }, 100);
    } else {
      setSilenceCountdown(null);
    }

    return () => {
      if (vadInterval) clearInterval(vadInterval);
    };
  }, [aiState, isAutoVoiceMode]);

  // Start speaking current question if they toggle Real-Time Voice Agent on while idle
  useEffect(() => {
    if (isAutoVoiceMode && aiStateRef.current === 'idle' && currentQuestion) {
      spokenQIndexRef.current = currentQIndex;
      speakQuestionText(currentQuestion.question_text);
    }
  }, [isAutoVoiceMode]);

  // 7. Stop & Submit Answer Engine
  const handleStopAndSubmitAnswer = async () => {
    if (aiStateRef.current === 'processing') return;

    aiStateRef.current = 'processing';
    setAiState('processing');
    clearInterval(timerIntervalRef.current);
    clearTimeout(ttsSafetyTimeoutRef.current);
    setSilenceCountdown(null);

    // Stop TTS if active
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isSpeakingTTSRef.current = false;

    // Stop speech recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    // Stop recorder & retrieve audio blob
    let audioBlob = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        await new Promise(resolve => setTimeout(resolve, 250));
        if (audioChunksRef.current.length > 0) {
          audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        }
      } catch (err) {
        console.error('Audio recorder stop failed:', err);
      }
    }

    // Determine final answer text: if candidate didn't speak, assume "don't know / pass"
    const rawText = transcriptRef.current.trim();
    const finalAnswerText = rawText || "I do not know the answer to this question. Please move to the next question.";

    setErrorMsg('');

    try {
      const q = questions[currentQIndexRef.current];

      // 1. Post answer transcript to backend API (using refs to avoid stale values)
      await api.post(`/api/interviews/session/${sessionId}/answer`, {
        question_id: q.id,
        answer_text: finalAnswerText,
        duration_seconds: durationRef.current,
        eye_contact_pct: eyeContactRef.current,
        confidence_pct: attentionRef.current,
        transcript_confidence: rawText ? 0.95 : 0.5
      });

      // 2. Upload audio webm file if captured and candidate spoke
      if (audioBlob && rawText) {
        const formData = new FormData();
        formData.append('file', audioBlob, `answer_${q.id}.webm`);
        try {
          await api.post(`/api/interviews/session/${sessionId}/question/${q.id}/audio`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (audioErr) {
          console.error('Audio upload failed:', audioErr);
        }
      }

      // 3. Refresh session details (gets dynamic next question generated by backend)
      const sessResponse = await api.get(`/api/interviews/session/${sessionId}`);
      setSession(sessResponse.data);
      const updatedQuestions = sessResponse.data.questions || [];
      setQuestions(updatedQuestions);

      // Check if there are more questions
      if (currentQIndexRef.current < updatedQuestions.length - 1) {
        const nextIdx = currentQIndexRef.current + 1;
        spokenQIndexRef.current = nextIdx;
        setCurrentQIndex(nextIdx);
        setTranscript('');
        setTimer(120);

        if (isAutoVoiceMode) {
          speakQuestionText(updatedQuestions[nextIdx].question_text);
        } else {
          setAiState('idle');
        }
      } else {
        // Final question answered -> Complete interview!
        handleCompleteAssessment();
      }

    } catch (err) {
      console.error('Submit answer failed:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to submit answer. Retrying next question...');
      setAiState('listening');
      startCandidateListening();
    }
  };

  // 8. Finalize Assessment
  const handleCompleteAssessment = async () => {
    setAiState('processing');

    // Announce completion via TTS
    if (window.speechSynthesis && isAutoVoiceMode) {
      window.speechSynthesis.cancel();
      const closing = new SpeechSynthesisUtterance(
        "Great job! You have completed all questions in the mock interview. Generating your comprehensive evaluation report now."
      );
      window.speechSynthesis.speak(closing);
    }

    try {
      await api.post(`/api/interviews/session/${sessionId}/complete`);
      setAiState('completed');
      setTimeout(() => {
        navigate(`/interview-report/${sessionId}`);
      }, 2500);
    } catch (err) {
      setErrorMsg('Failed to finalize assessment scores.');
      setAiState('idle');
    }
  };

  // Re-read question out loud on demand
  const handleRepeatQuestion = () => {
    if (currentQuestion) {
      spokenQIndexRef.current = currentQIndex;
      speakQuestionText(currentQuestion.question_text);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="text-gray-400 mt-4 text-sm font-medium">Entering Assessment Room...</p>
      </div>
    );
  }

  const isLastQuestion = currentQIndex === questions.length - 1;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* HEADER BAR & MODE TOGGLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-4 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Real-Time Voice Agent Room
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Continuous 3s Auto-Next
              </span>
            </h2>
            <p className="text-xs text-gray-400 capitalize">{session?.domain} • {session?.difficulty} Level</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time Voice Agent vs Manual Toggle */}
          <button
            onClick={() => setIsAutoVoiceMode(!isAutoVoiceMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isAutoVoiceMode
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/10'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{isAutoVoiceMode ? 'Real-Time Voice Agent: Active' : 'Manual Mode'}</span>
          </button>

          <span className="text-xs font-semibold text-gray-400 bg-white/5 border border-white/10 px-3 py-2 rounded-xl">
            Question {currentQIndex + 1} of {questions.length}
          </span>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMsg && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-xl text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span className="flex-grow">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-xs text-red-400 hover:underline">Dismiss</button>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Camera & Real-Time AI Visualizer HUD (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card relative overflow-hidden aspect-video border border-white/10 shadow-cyan-500/5 bg-[#0b0c10]">
            
            {/* Webcam Video */}
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* AI INTRO START OVERLAY (AUTOPLAY GUARD) */}
            {aiState === 'intro' && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 animate-pulse">
                  <Radio className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Mock Interview Room</h3>
                  <p className="text-xs text-gray-300 max-w-sm mt-1">
                    Hands-free voice conversation. AI speaks questions, stops if interrupted, and moves to the next question automatically after 3 seconds of silence.
                  </p>
                </div>
                <button
                  onClick={handleStartVoiceSession}
                  className="btn-primary px-6 py-3 text-sm flex items-center gap-2 shadow-xl shadow-cyan-500/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Real-Time Voice Agent Session
                </button>
              </div>
            )}

            {/* BARGE-IN INTERRUPTION FLASH BADGE */}
            {isInterrupted && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500/90 text-black font-bold text-xs px-4 py-2 rounded-full shadow-lg border border-amber-300 flex items-center gap-2 animate-bounce z-10">
                <Zap className="w-4 h-4 fill-current" />
                <span>Barge-In Interruption Active! AI Stopped Speaking.</span>
              </div>
            )}

            {/* AI SPEAKING ORB OVERLAY */}
            {aiState === 'speaking' && (
              <div className="absolute top-4 left-4 bg-black/80 border border-cyan-500/40 rounded-xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-md shadow-lg shadow-cyan-500/10">
                <div className="flex gap-1 items-center h-4">
                  <div className="soundwave-bar h-3 bg-cyan-400 animate-bounce"></div>
                  <div className="soundwave-bar h-5 bg-cyan-400 animate-bounce delay-100"></div>
                  <div className="soundwave-bar h-4 bg-cyan-400 animate-bounce delay-200"></div>
                  <div className="soundwave-bar h-6 bg-cyan-400 animate-bounce delay-150"></div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase block">AI Interviewer Speaking</span>
                  <span className="text-[9px] text-gray-400 block">Speak anytime to interrupt</span>
                </div>
              </div>
            )}

            {/* CANDIDATE MIC ACTIVE & VOLUME METER */}
            {aiState === 'listening' && (
              <div className="absolute top-4 left-4 bg-black/80 border border-emerald-500/40 rounded-xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-md">
                <div className="relative w-3 h-3">
                  <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping"></div>
                  <div className="relative w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase block">Listening to Candidate</span>
                  {/* Mic Level bar */}
                  <div className="w-24 bg-white/10 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full transition-all duration-75"
                      style={{ width: `${micVolume}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Face HUD Box Overlay */}
            {(aiState === 'listening' || aiState === 'speaking') && (
              <div className="absolute top-[20%] left-[25%] right-[25%] bottom-[20%] rounded-xl hud-box pointer-events-none flex items-center justify-center">
                <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl"></div>
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr"></div>
                <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl"></div>
                <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br"></div>
                <span className="text-[10px] text-cyan-400 bg-black/60 font-semibold px-2 py-0.5 rounded tracking-wide border border-cyan-400/20 uppercase">
                  Face Mesh & Eye Tracking
                </span>
              </div>
            )}

            {/* Bottom HUD Analytics */}
            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-3">
              <div className="bg-black/70 border border-white/5 rounded-lg p-2 backdrop-blur-sm text-center">
                <span className="text-[10px] text-gray-500 font-semibold uppercase block tracking-wider">Eye Contact</span>
                <span className={`text-sm font-bold ${eyeContact > 80 ? 'text-cyan-400' : 'text-amber-400'}`}>{eyeContact}%</span>
                <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${eyeContact}%` }}></div>
                </div>
              </div>

              <div className="bg-black/70 border border-white/5 rounded-lg p-2 backdrop-blur-sm text-center">
                <span className="text-[10px] text-gray-500 font-semibold uppercase block tracking-wider">Engagement</span>
                <span className={`text-sm font-bold ${attention > 80 ? 'text-blue-400' : 'text-amber-400'}`}>{attention}%</span>
                <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-blue-400 h-full transition-all duration-300" style={{ width: `${attention}%` }}></div>
                </div>
              </div>
            </div>

          </div>

          {/* VAD 3s SILENCE AUTO-SUBMIT COUNTDOWN BAR */}
          {silenceCountdown && aiState === 'listening' && (
            <div className="glass-card p-4 border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Silence Detected</p>
                  <p className="text-xs text-cyan-200">Auto-proceeding to next question in <span className="font-extrabold text-white text-sm">{silenceCountdown}s</span>...</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  lastSpeechTimeRef.current = Date.now();
                  setSilenceCountdown(null);
                }}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-xs font-semibold"
              >
                Keep Talking
              </button>
            </div>
          )}

          {/* AI EVALUATING INDICATOR */}
          {aiState === 'processing' && (
            <div className="glass-card p-4 flex items-center justify-center gap-3 bg-cyan-500/5 border-cyan-500/20 text-cyan-300">
              <span className="w-4 h-4 border-2 border-cyan-300/30 border-t-cyan-300 rounded-full animate-spin"></span>
              <span className="text-xs font-semibold uppercase tracking-wider">AI Evaluating Answer & Preparing Next Question...</span>
            </div>
          )}

          {/* LIVE TRANSCRIPT MONITOR */}
          {transcript && (
            <div className="glass-card p-5 bg-black/40 border-white/5">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  Live Transcript Monitor
                </h4>
                {aiState === 'listening' && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">Recording Voice</span>
                )}
              </div>
              <p className="text-sm text-gray-200 italic leading-relaxed font-normal">
                "{transcript}"
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Question Board & Controls (5/12) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="glass-card p-6 flex-grow flex flex-col justify-between space-y-6">
            
            <div>
              {/* Question Category & Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                    AI Interrogation
                  </span>
                </div>
                <button
                  onClick={handleRepeatQuestion}
                  disabled={aiState === 'processing'}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-cyan-300 bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  Read Question
                </button>
              </div>

              {/* Question Display Card */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                    {currentQuestion?.category || 'Technical'} Question
                  </span>

                  {currentQuestion?.question_text.toLowerCase().includes('elaborate') && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                      Follow-up Probing Question
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white leading-relaxed">
                  {currentQuestion?.question_text || 'Loading question...'}
                </h3>
              </div>
            </div>

            {/* Controls & Status Actions */}
            <div className="border-t border-white/10 pt-6 space-y-4">
              
              {/* Timer Bar */}
              {aiState === 'listening' && (
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-gray-400">Time Remaining</span>
                    <span className={timer < 30 ? 'text-red-400 font-bold' : 'text-white'}>
                      {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${timer < 30 ? 'bg-red-500' : 'bg-cyan-500'}`}
                      style={{ width: `${(timer / 120) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {aiState === 'listening' ? (
                  <button
                    onClick={handleStopAndSubmitAnswer}
                    className="w-full btn-danger py-4 flex items-center justify-center gap-2 shadow-lg shadow-red-500/10"
                  >
                    <MicOff className="w-5 h-5" />
                    Submit Answer Now (Manual)
                  </button>
                ) : aiState === 'speaking' ? (
                  <button
                    onClick={triggerBargeIn}
                    className="w-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Zap className="w-5 h-5 text-amber-400 fill-current" />
                    Interrupt AI & Start Answering
                  </button>
                ) : (
                  <button
                    onClick={startCandidateListening}
                    disabled={aiState === 'processing'}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                  >
                    <Mic className="w-5 h-5" />
                    Start Answering
                  </button>
                )}

                {isLastQuestion && aiState !== 'processing' && (
                  <button
                    onClick={handleCompleteAssessment}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all text-xs uppercase tracking-wider"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Finish & View Assessment Report
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
