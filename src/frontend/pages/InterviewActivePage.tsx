import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ActiveInterviewSession, InterviewQuestion } from '../../types';
import { interviewService } from '../services/interviewService';
import { speechService } from '../services/speechService';
import { api } from '../services/api';
import { EyeTracker, EyeTrackingStats } from '../components/interview/EyeTracker';
import {
  Clock,
  HelpCircle,
  Code2,
  CheckCircle2,
  ArrowRight,
  LogOut,
  AlertCircle,
  Sparkles,
  Info,
  Mic,
  Square,
  Volume2,
  VolumeX,
  Bot,
  Loader2,
  AlertTriangle,
  Play,
  RefreshCw,
} from 'lucide-react';

export const InterviewActivePage: React.FC = () => {
  const navigate = useNavigate();

  const [session, setSession] = useState<ActiveInterviewSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(900);
  const [showHint, setShowHint] = useState(false);
  const [emptyAnswerWarning, setEmptyAnswerWarning] = useState(false);

  // Modals
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live AI Interviewer States
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);

  // Input Tab Mode
  const [inputMode, setInputMode] = useState<'voice' | 'code'>('voice');

  // MediaRecorder & Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordedAudioUrls, setRecordedAudioUrls] = useState<Record<string, string>>({});

  // Refs for MediaRecorder & SpeechRecognition
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef<boolean>(false);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Clean up media tracks, timers, and speech on unmount
  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
      stopMicrophoneMediaStream();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const stopMicrophoneMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // 1. Load active session on component mount
  useEffect(() => {
    const loadedSession = interviewService.getActiveSession();
    if (!loadedSession || !loadedSession.questions || loadedSession.questions.length === 0) {
      setSession(null);
      return;
    }

    setSession(loadedSession);
    setAnswers(loadedSession.answers || {});
    const idx = loadedSession.currentIndex || 0;
    setCurrentIndex(idx);

    const firstQ = loadedSession.questions[idx];
    if (firstQ) {
      if (loadedSession.answers && loadedSession.answers[firstQ.id]) {
        setCurrentAnswer(loadedSession.answers[firstQ.id]);
      } else {
        setCurrentAnswer('');
        // AI speaks question aloud on initial load
        setTimeout(() => {
          speakQuestion(firstQ.questionText);
        }, 400);
      }
    }

    // Calculate remaining session time
    const elapsedSeconds = Math.floor((Date.now() - loadedSession.startTime) / 1000);
    const initialTimeLimit = loadedSession.timeLimitSeconds || 900;
    const remaining = Math.max(0, initialTimeLimit - elapsedSeconds);
    setTimeLeftSeconds(remaining);
  }, []);

  // 2. Timer Countdown Effect
  useEffect(() => {
    if (!session) return;

    if (timeLeftSeconds <= 0) {
      handleAutoFinishOnTimerExpiry();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoFinishOnTimerExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session, timeLeftSeconds]);

  // Handle timer reaching zero
  const handleAutoFinishOnTimerExpiry = () => {
    if (!session) return;
    speechService.stopSpeaking();
    handleStopRecording();

    const updatedAnswers = { ...answers };
    const currentQ = session.questions[currentIndex];
    if (currentQ) {
      updatedAnswers[currentQ.id] = currentAnswer;
    }

    const finalSession = {
      ...session,
      answers: updatedAnswers,
    };

    interviewService.finishInterview(finalSession, 'Time Expired');
    navigate('/interview/result');
  };

  // Speak question aloud using SpeechSynthesis
  const speakQuestion = (questionText: string) => {
    if (isRecordingRef.current) {
      handleStopRecording();
    }

    setAiGenerationError(null);
    setIsAiSpeaking(true);

    speechService.stopSpeaking();
    speechService.speakText(
      questionText,
      () => {
        setIsAiSpeaking(true);
      },
      () => {
        setIsAiSpeaking(false);
      },
      () => {
        setIsAiSpeaking(false);
      }
    );
  };

  const handleStopAiSpeech = () => {
    speechService.stopSpeaking();
    setIsAiSpeaking(false);
  };

  // Sync answer state to localStorage session
  const saveCurrentAnswerToState = (qId: string, text: string) => {
    const newAnswers = {
      ...answers,
      [qId]: text,
    };
    setAnswers(newAnswers);

    if (session) {
      let updatedSpeechData = session.speechData;
      if (session.speechData && session.speechData[qId]) {
        const existing = session.speechData[qId];
        const updatedMetrics = speechService.analyzeSpeech(text, existing.recordingDurationSeconds || 10);
        updatedSpeechData = {
          ...session.speechData,
          [qId]: {
            ...existing,
            answerText: text,
            speechMetrics: updatedMetrics,
          },
        };
      }

      const updatedSession: ActiveInterviewSession = {
        ...session,
        answers: newAnswers,
        speechData: updatedSpeechData,
        currentIndex,
        timeLeftSeconds,
      };
      setSession(updatedSession);
      interviewService.saveActiveSession(updatedSession);
    }
  };

  // ==========================================
  // MEDIA RECORDER MICROPHONE RECORDING FLOW
  // ==========================================
  const handleStartRecording = async () => {
    // Stop AI Speech if it is currently playing
    if (isAiSpeaking) {
      handleStopAiSpeech();
    }

    setRecordingError(null);

    // 1. Check browser MediaRecorder API support
    if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setRecordingError('Audio recording is not supported in this browser environment. Please type your response manually.');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      setRecordingError('MediaRecorder API is unsupported in your browser. Please type your response manually.');
      return;
    }

    try {
      // 2. Request microphone permission & stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 3. Initialize MediaRecorder
      audioChunksRef.current = [];
      let recorder: MediaRecorder;

      try {
        recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (audioBlob.size > 0 && session && session.questions[currentIndex]) {
          const qId = session.questions[currentIndex].id;
          const url = URL.createObjectURL(audioBlob);
          setRecordedAudioUrls((prev) => ({ ...prev, [qId]: url }));
        }
        stopMicrophoneMediaStream();
      };

      recorder.start(200); // collect chunks every 200ms
      mediaRecorderRef.current = recorder;

      // 4. Simultaneously run SpeechRecognition for live transcript if available
      if (speechService.isSpeechRecognitionSupported()) {
        try {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          let accumulatedText = currentAnswer;

          recognition.onresult = (event: any) => {
            let interimText = '';
            let finalChunk = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalChunk += event.results[i][0].transcript + ' ';
              } else {
                interimText += event.results[i][0].transcript;
              }
            }

            if (finalChunk) {
              accumulatedText += (accumulatedText ? ' ' : '') + finalChunk.trim();
            }

            const combinedText = (accumulatedText + (interimText ? ' ' + interimText : '')).trim();
            if (combinedText) {
              handleAnswerTextChange(combinedText);
            }
          };

          recognition.onerror = (event: any) => {
            if (event.error === 'not-allowed') {
              setRecordingError('Microphone permission was revoked.');
            }
          };

          recognition.onend = () => {
            if (isRecordingRef.current) {
              try { recognition.start(); } catch (e) {}
            }
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (err) {
          console.warn('SpeechRecognition initialization failed:', err);
        }
      }

      setIsRecording(true);
      setRecordingDuration(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setRecordingError('Microphone permission was denied. Please allow microphone access in browser settings or type your answer.');
      } else {
        setRecordingError(`Failed to access microphone: ${err.message || 'Unknown error'}. You can type your answer manually.`);
      }
    }
  };

  const handleStopRecording = () => {
    // 1. Stop Speech Recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }

    // 2. Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      mediaRecorderRef.current = null;
    }

    stopMicrophoneMediaStream();

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);

    // Analyze speech metrics for session
    if (session) {
      const currentQ = session.questions[currentIndex];
      if (currentQ) {
        const textToAnalyze = currentAnswer.trim();
        const durationSec = Math.max(1, recordingDuration);
        const metrics = speechService.analyzeSpeech(textToAnalyze, durationSec);

        const updatedSpeechData = {
          ...(session.speechData || {}),
          [currentQ.id]: {
            questionId: currentQ.id,
            questionText: currentQ.questionText,
            answerText: textToAnalyze,
            transcript: textToAnalyze,
            recordingDurationSeconds: durationSec,
            speechMetrics: metrics,
          },
        };

        const updatedSession = { ...session, speechData: updatedSpeechData };
        setSession(updatedSession);
        interviewService.saveActiveSession(updatedSession);
      }
    }
  };

  // Answer change handler
  const handleAnswerTextChange = (text: string) => {
    setCurrentAnswer(text);
    setEmptyAnswerWarning(false);
    if (session && session.questions[currentIndex]) {
      saveCurrentAnswerToState(session.questions[currentIndex].id, text);
    }
  };

  // GENERATE NEXT QUESTION VIA AI SERVICE
  const generateNextQuestion = async (
    activeSession: ActiveInterviewSession,
    qIndex: number,
    updatedAnswersMap: Record<string, string>
  ) => {
    const totalAllowed = activeSession.config.questionCount || 5;
    const nextQNum = qIndex + 2;

    setIsGeneratingNext(true);
    setAiGenerationError(null);

    // Prepare previous QA context
    const previousQaPairs = activeSession.questions.slice(0, qIndex + 1).map((q) => ({
      questionText: q.questionText,
      candidateAnswer: updatedAnswersMap[q.id] || '',
    }));

    try {
      const nextQ = await api.interview.nextQuestion({
        type: activeSession.config.type,
        difficulty: activeSession.config.experienceLevel || 'Senior',
        domain: activeSession.config.targetRole || activeSession.config.type,
        resumeSkills: activeSession.config.resumeSkills,
        questionNumber: nextQNum,
        totalQuestions: totalAllowed,
        previousQaPairs,
        topics: activeSession.config.topics,
        includeCodeSnippet: activeSession.config.includeCodeSnippet,
      });

      const updatedQuestions = [...activeSession.questions];
      updatedQuestions[qIndex + 1] = nextQ;

      const updatedSession: ActiveInterviewSession = {
        ...activeSession,
        answers: updatedAnswersMap,
        questions: updatedQuestions,
        currentIndex: qIndex + 1,
      };

      setSession(updatedSession);
      interviewService.saveActiveSession(updatedSession);
      setCurrentIndex(qIndex + 1);
      setCurrentAnswer('');
      setShowHint(false);
      setIsGeneratingNext(false);

      // AI Speaks the newly generated question
      setTimeout(() => {
        speakQuestion(nextQ.questionText);
      }, 300);
    } catch (err: any) {
      console.warn('Failed to generate next AI question:', err);
      setIsGeneratingNext(false);
      setAiGenerationError(
        err.message || 'Failed to connect to AI service. Click Retry or use Fallback Question.'
      );
    }
  };

  // Fallback question generator if AI service is offline
  const handleUseFallbackQuestion = () => {
    if (!session) return;
    const nextQNum = currentIndex + 2;
    const totalAllowed = session.config.questionCount || 5;

    const fallbackQ: InterviewQuestion = {
      id: `q_fallback_${nextQNum}_${Date.now()}`,
      questionNumber: nextQNum,
      category: session.config.type,
      questionText: `Building on your response, what architectural design patterns, edge cases, or trade-offs would you evaluate when implementing this in ${session.config.targetRole || session.config.type}?`,
      hint: 'Detail your approach using concrete examples and engineering trade-offs.',
      timeAllowedSeconds: 300,
    };

    const updatedQuestions = [...session.questions];
    updatedQuestions[currentIndex + 1] = fallbackQ;

    const updatedSession: ActiveInterviewSession = {
      ...session,
      answers,
      questions: updatedQuestions,
      currentIndex: currentIndex + 1,
    };

    setSession(updatedSession);
    interviewService.saveActiveSession(updatedSession);
    setCurrentIndex(currentIndex + 1);
    setCurrentAnswer('');
    setShowHint(false);
    setAiGenerationError(null);

    setTimeout(() => {
      speakQuestion(fallbackQ.questionText);
    }, 300);
  };

  // SUBMIT ANSWER & CONTINUE TO NEXT QUESTION
  const handleSubmitAndContinue = async () => {
    if (!session) return;

    const currentQ = session.questions[currentIndex];
    if (!currentQ) return;

    handleStopRecording();
    speechService.stopSpeaking();
    setIsAiSpeaking(false);

    const trimmedAnswer = currentAnswer.trim();
    if (!trimmedAnswer) {
      setEmptyAnswerWarning(true);
      return;
    }
    setEmptyAnswerWarning(false);

    saveCurrentAnswerToState(currentQ.id, trimmedAnswer);
    const updatedAnswers = {
      ...answers,
      [currentQ.id]: trimmedAnswer,
    };

    const totalAllowed = session.config.questionCount || 5;

    // Check if candidate reached final question
    if (currentIndex + 1 >= totalAllowed) {
      setIsSubmitting(true);
      const finalSession = {
        ...session,
        answers: updatedAnswers,
      };
      await interviewService.finishInterview(finalSession, 'Completed');
      setIsSubmitting(false);
      navigate('/interview/result');
      return;
    }

    // Generate Next Question from AI
    await generateNextQuestion(session, currentIndex, updatedAnswers);
  };

  // Replay AI Question
  const handleReplayQuestion = () => {
    if (!currentQ) return;
    speakQuestion(currentQ.questionText);
  };

  // Finish Interview Early
  const handleConfirmFinish = () => {
    if (!session) return;
    speechService.stopSpeaking();
    handleStopRecording();

    setIsSubmitting(true);
    const finalAnswers = { ...answers };
    const currentQ = session.questions[currentIndex];
    if (currentQ) {
      finalAnswers[currentQ.id] = currentAnswer;
    }

    const finalSession = {
      ...session,
      answers: finalAnswers,
    };

    interviewService.finishInterview(finalSession, 'Completed');
    setIsSubmitting(false);
    navigate('/interview/result');
  };

  // Exit Interview
  const handleConfirmExit = () => {
    speechService.stopSpeaking();
    handleStopRecording();
    if (session) {
      const currentQ = session.questions[currentIndex];
      if (currentQ) {
        saveCurrentAnswerToState(currentQ.id, currentAnswer);
      }
    }
    navigate('/dashboard');
  };

  // Missing Session State
  if (!session || !session.questions || session.questions.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl w-fit mx-auto border border-amber-100">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">No Active Interview Session</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Please setup or launch a new interview session from the setup page.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              onClick={() => navigate('/interview/setup')}
              icon={<Play className="h-4 w-4" />}
            >
              Start AI Interview
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentQ: InterviewQuestion = session.questions[currentIndex] || {
    id: 'q1',
    questionNumber: currentIndex + 1,
    category: session.config.type,
    questionText: 'Explain key technical architectural considerations.',
    timeAllowedSeconds: 300,
  };

  const totalQuestions = session.config.questionCount || session.questions.length;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const formattedTimer = interviewService.formatDuration(timeLeftSeconds);
  const isTimerLow = timeLeftSeconds <= 180;
  const currentAudioUrl = recordedAudioUrls[currentQ.id];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* ========================================== */}
        {/* TOP BAR: Header | Timer | Question X/Y     */}
        {/* ========================================== */}
        <header className="bg-slate-900 rounded-2xl px-6 py-4 text-white border border-slate-800 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">SmartHire AI</span>
              <span className="text-slate-600">|</span>
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Live Interview</span>
            </div>
            <Badge variant="technical" size="sm">
              {session.config.targetRole || session.config.type}
            </Badge>
          </div>

          <div className="flex items-center gap-5">
            {/* Session Timer */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all ${
                isTimerLow
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse'
                  : 'bg-slate-800 text-indigo-300 border-slate-700'
              }`}
            >
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span>{formattedTimer}</span>
            </div>

            {/* Question Counter */}
            <div className="text-xs text-slate-300 font-semibold">
              Question <span className="text-white font-bold">{currentIndex + 1}</span> / {totalQuestions}
            </div>
          </div>
        </header>

        {/* ========================================== */}
        {/* MAIN CENTER AREA: 2-COLUMN GRID            */}
        {/* ========================================== */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 8 COLUMNS: Questions & Candidate Input */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. AI INTERVIEWER QUESTION CARD */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      AI Interviewer
                    </h1>
                    <p className="text-xs font-semibold text-indigo-600">
                      {session.config.type} • {session.config.experienceLevel || 'Senior'} Level
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReplayQuestion}
                    disabled={isGeneratingNext || isAiSpeaking}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Replay Question</span>
                  </button>

                  {currentQ.hint && (
                    <button
                      type="button"
                      onClick={() => setShowHint(!showHint)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                      <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* AI Status Notification */}
              {isGeneratingNext ? (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2.5 animate-pulse">
                  <Loader2 className="h-4 w-4 text-amber-600 animate-spin shrink-0" />
                  <span>AI is evaluating your response and generating the next adaptive question...</span>
                </div>
              ) : isAiSpeaking ? (
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-indigo-600 animate-bounce shrink-0" />
                    <span>AI Interviewer is speaking question aloud... Listen carefully</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStopAiSpeech}
                    className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <VolumeX className="h-3 w-3" /> Stop Speech
                  </button>
                </div>
              ) : null}

              {/* Question Text */}
              <div className="text-slate-900 font-medium text-base md:text-lg leading-relaxed pt-1">
                {currentQ.questionText}
              </div>

              {/* Hint Box */}
              {showHint && currentQ.hint && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1 animate-in fade-in duration-150">
                  <div className="font-bold flex items-center gap-1 text-indigo-800">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Question Hint:</span>
                  </div>
                  <p className="leading-relaxed">{currentQ.hint}</p>
                </div>
              )}

              {/* AI Generation Error & Retry Bar */}
              {aiGenerationError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-rose-800">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{aiGenerationError}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => generateNextQuestion(session, currentIndex, answers)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Retry AI Generation</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUseFallbackQuestion}
                      className="px-3.5 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 font-semibold rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Use Fallback Question
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* 2. CANDIDATE ANSWER & RECORDING CARD */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Your Answer
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInputMode('voice')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      inputMode === 'voice'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Voice & Transcript
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('code')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      inputMode === 'code'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Code2 className="h-3 w-3" />
                    <span>Code Snippet</span>
                  </button>
                </div>
              </div>

              {/* LARGE MICROPHONE RECORDING CONTROLLER */}
              {inputMode === 'voice' && (
                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-4 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    {/* Status Indicator */}
                    {isRecording ? (
                      <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-800 px-4 py-1.5 rounded-full text-rose-300 text-xs font-bold animate-pulse">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                        <span>Recording Audio... ({interviewService.formatDuration(recordingDuration)})</span>
                      </div>
                    ) : isAiSpeaking ? (
                      <div className="text-xs font-medium text-indigo-300 animate-pulse">
                        AI is currently speaking the question. Microphone will become available when AI finishes.
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-slate-400">
                        Click Record Answer to speak your response via microphone
                      </div>
                    )}

                    {/* Primary Record / Stop Button */}
                    {isRecording ? (
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        className="px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer text-sm animate-pulse"
                      >
                        <Square className="h-4 w-4 fill-current" />
                        <span>Stop Recording</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        disabled={isGeneratingNext || isAiSpeaking}
                        className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Mic className="h-4 w-4" />
                        <span>{isAiSpeaking ? 'AI Speaking Question...' : 'Record Answer'}</span>
                      </button>
                    )}
                  </div>

                  {/* Error Banner */}
                  {recordingError && (
                    <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center justify-center gap-2 max-w-lg mx-auto">
                      <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                      <span>{recordingError}</span>
                    </div>
                  )}

                  {/* Audio Playback Player */}
                  {currentAudioUrl && (
                    <div className="pt-2 border-t border-slate-800 space-y-2 max-w-md mx-auto">
                      <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-center gap-1.5">
                        <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Listen to Your Recorded Audio Answer</span>
                      </div>
                      <audio
                        controls
                        src={currentAudioUrl}
                        className="w-full h-10 rounded-lg filter invert shadow-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {emptyAnswerWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Please speak or type your answer before clicking Submit Answer & Continue.</span>
                </div>
              )}

              {/* Editable Transcript Textarea */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                  <span>{inputMode === 'voice' ? 'Transcribed Answer (Editable)' : 'Code Snippet Response'}</span>
                  <span>Word Count: {currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0}</span>
                </div>

                {inputMode === 'code' ? (
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => handleAnswerTextChange(e.target.value)}
                    rows={8}
                    placeholder="// Write your code solution or architectural pseudocode here..."
                    className="w-full p-4 text-xs font-mono bg-slate-900 text-slate-100 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed resize-y"
                  />
                ) : (
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => handleAnswerTextChange(e.target.value)}
                    rows={6}
                    placeholder="Your live speech transcript will appear here. You can also edit or type your candidate response directly..."
                    className="w-full p-4 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed transition-all resize-y"
                  />
                )}
              </div>

              {/* 3. MAIN PRIMARY ACTION: SUBMIT ANSWER & CONTINUE */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleSubmitAndContinue}
                  isLoading={isGeneratingNext || isSubmitting}
                  icon={currentIndex === totalQuestions - 1 ? <CheckCircle2 className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                >
                  {currentIndex === totalQuestions - 1 ? 'Submit & Complete Assessment' : 'Submit Answer & Continue'}
                </Button>
              </div>
            </section>
          </div>

          {/* RIGHT 4 COLUMNS: Eye Tracking & Webcam View */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
            <EyeTracker />
          </div>
        </main>

        {/* ========================================== */}
        {/* BOTTOM FOOTER: Progress & Exit            */}
        {/* ========================================== */}
        <footer className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Question {currentIndex + 1} of {totalQuestions}</span>
            <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFinishModal(true)}
            >
              Finish Early
            </Button>

            <button
              type="button"
              onClick={() => setShowExitModal(true)}
              className="text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Exit Interview</span>
            </button>
          </div>
        </footer>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Complete Interview Session?"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowFinishModal(false)}>
              Keep Editing
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmFinish}
              isLoading={isSubmitting}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              Submit & Evaluate
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to finish your interview session early? Your current answers and audio recordings will be evaluated by the AI engine.
        </p>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit Interview Room?"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowExitModal(false)}>
              Resume Session
            </Button>
            <Button variant="danger" onClick={handleConfirmExit}>
              Exit Session
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to exit? Your progress will remain saved in your local interview session.
        </p>
      </Modal>
    </DashboardLayout>
  );
};
