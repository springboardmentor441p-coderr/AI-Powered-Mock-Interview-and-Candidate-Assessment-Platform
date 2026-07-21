import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, Play, CheckCircle2, ChevronRight, HelpCircle, User, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function InterviewRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Session Data
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // Statuses
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Answer Data
  const [transcript, setTranscript] = useState('');
  const [timer, setTimer] = useState(120); // 2 minutes in seconds
  const [duration, setDuration] = useState(0);
  
  // HUD Analytics Simulations
  const [eyeContact, setEyeContact] = useState(95);
  const [attention, setAttention] = useState(98);
  const [emotion, setEmotion] = useState('Focused');
  
  // Webcam & Audio streams
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Track recording state in a ref to avoid recreating HUD intervals and blinking webcam
  const recordingStateRef = useRef(recording);
  useEffect(() => {
    recordingStateRef.current = recording;
  }, [recording]);

  const currentQuestion = questions[currentQIndex];

  useEffect(() => {
    // 1. Fetch Session Questions
    const fetchSession = async () => {
      try {
        const response = await api.get(`/api/interviews/session/${sessionId}`);
        setSession(response.data);
        setQuestions(response.data.questions || []);
      } catch (err) {
        setErrorMsg('Failed to initialize session data. Please restart the interview.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSession();
    startWebcam();

    // 2. Fluctuating HUD Indicators simulation
    const hudInterval = setInterval(() => {
      if (recordingStateRef.current) {
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
      stopWebcam();
      clearInterval(timerIntervalRef.current);
      clearInterval(hudInterval);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [sessionId]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Failed to open webcam:', err);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleStartRecording = async () => {
    setTranscript('');
    setTimer(120);
    setDuration(0);
    setRecording(true);

    // Setup Speech Recognition dynamically on answer trigger
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (err) {
        console.error('Speech recognition start failed:', err);
      }
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }

    // Start MediaRecorder for audio recording
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.start(250);
    } catch (err) {
      console.error('Failed to access microphone for recording:', err);
    }

    // Start timer countdown
    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleStopRecording();
          return 0;
        }
        setDuration((d) => d + 1);
        return prev - 1;
      });
    }, 1000);
  };

  const handleStopRecording = async () => {
    setRecording(false);
    clearInterval(timerIntervalRef.current);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Stop MediaRecorder and grab tracks
    let audioBlob = null;
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        if (audioChunksRef.current.length > 0) {
          audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        }
      } catch (err) {
        console.error('Failed to extract audio recording blob:', err);
      }
    }

    // Check transcript
    if (!transcript.trim()) {
      setErrorMsg('No speech detected. Please speak clearly into your microphone.');
      return;
    }

    setErrorMsg('');
    setSubmittingAnswer(true);

    try {
      // 1. Submit text answer to backend API
      const answerResponse = await api.post(`/api/interviews/session/${sessionId}/answer`, {
        question_id: currentQuestion.id,
        answer_text: transcript,
        duration_seconds: duration,
        eye_contact_pct: eyeContact,
        confidence_pct: attention, // Maps to attention / general confidence
        transcript_confidence: 0.95
      });
      
      // 2. Upload recorded audio file if captured
      if (audioBlob) {
        const formData = new FormData();
        formData.append('file', audioBlob, `answer_${currentQuestion.id}.webm`);
        try {
          await api.post(`/api/interviews/session/${sessionId}/question/${currentQuestion.id}/audio`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (audioErr) {
          console.error('Audio upload failed:', audioErr);
        }
      }

      // 3. Conversational updates: fetch the updated session details
      const sessResponse = await api.get(`/api/interviews/session/${sessionId}`);
      setSession(sessResponse.data);
      const updatedQuestions = sessResponse.data.questions || [];
      setQuestions(updatedQuestions);

      // Move to next question or complete
      if (currentQIndex < updatedQuestions.length - 1) {
        setCurrentQIndex((idx) => idx + 1);
        setTranscript('');
        setTimer(120);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit answer. Please try again.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleCompleteAssessment = async () => {
    setLoading(true);
    try {
      await api.post(`/api/interviews/session/${sessionId}/complete`);
      navigate(`/interview-report/${sessionId}`);
    } catch (err) {
      setErrorMsg('Failed to finalize assessment scores.');
      setLoading(false);
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
  const isAnswered = session?.answers?.some(a => a.question_id === currentQuestion?.id) || false;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {errorMsg && (
        <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Camera & Real-Time Analytics HUD (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card relative overflow-hidden aspect-video border border-white/10 shadow-cyan-500/5 bg-[#0b0c10]">
            
            {/* Webcam video component */}
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover scale-x-[-1]"
            />
            
            {/* Face HUD Box Overlay */}
            {recording && (
              <div className="absolute top-[20%] left-[25%] right-[25%] bottom-[20%] rounded-xl hud-box pointer-events-none flex items-center justify-center">
                {/* scanning indicators */}
                <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl"></div>
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr"></div>
                <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl"></div>
                <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br"></div>
                <span className="text-[10px] text-cyan-400 bg-black/60 font-semibold px-2 py-0.5 rounded tracking-wide border border-cyan-400/20 uppercase">Scanning Face Mesh</span>
              </div>
            )}

            {/* AI Speaker soundwave indicator */}
            {recording && (
              <div className="absolute top-4 left-4 bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-0.5 items-center h-4">
                  <div className="soundwave-bar h-2"></div>
                  <div className="soundwave-bar h-4"></div>
                  <div className="soundwave-bar h-3"></div>
                  <div className="soundwave-bar h-4"></div>
                  <div className="soundwave-bar h-2"></div>
                </div>
                <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase">Mic Active</span>
              </div>
            )}

            {/* HUD Status Bar overlays */}
            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-3">
              {/* Eye contact */}
              <div className="bg-black/70 border border-white/5 rounded-lg p-2 backdrop-blur-sm text-center">
                <span className="text-[10px] text-gray-500 font-semibold uppercase block tracking-wider">Eye Contact</span>
                <span className={`text-sm font-bold ${eyeContact > 80 ? 'text-cyan-400' : 'text-amber-400'}`}>{eyeContact}%</span>
                <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${eyeContact}%` }}></div>
                </div>
              </div>

              {/* Attention level */}
              <div className="bg-black/70 border border-white/5 rounded-lg p-2 backdrop-blur-sm text-center">
                <span className="text-[10px] text-gray-500 font-semibold uppercase block tracking-wider">Engagement</span>
                <span className={`text-sm font-bold ${attention > 80 ? 'text-blue-400' : 'text-amber-400'}`}>{attention}%</span>
                <div className="w-full bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-blue-400 h-full transition-all duration-300" style={{ width: `${attention}%` }}></div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Submitting/Evaluating indicators */}
          {submittingAnswer && (
            <div className="glass-card p-4 flex items-center justify-center gap-3 bg-cyan-500/5 border-cyan-500/20 text-cyan-300">
              <span className="w-4 h-4 border-2 border-cyan-300/30 border-t-cyan-300 rounded-full animate-spin"></span>
              <span className="text-xs font-semibold uppercase tracking-wider">AI Evaluation Service Processing Answer...</span>
            </div>
          )}

          {/* Live Transcript Monitor */}
          {recording && transcript && (
            <div className="glass-card p-5 bg-black/40 border-white/5">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Live Transcript Monitor</h4>
              <p className="text-sm text-gray-300 italic leading-relaxed">"... {transcript} "</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Question Board & Controls (5/12) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="glass-card p-6 flex-grow flex flex-col justify-between">
            <div>
              {/* Stats headers */}
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                <div>
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Assessment Mode</span>
                  <span className="text-sm text-white font-medium capitalize">{session?.domain}</span>
                </div>
                <span className="text-xs font-semibold text-gray-400 bg-white/5 border border-white/15 px-3 py-1 rounded-full">
                  Question {currentQIndex + 1} of {questions.length}
                </span>
              </div>

              {/* Question container */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                    {currentQuestion?.category} Question
                  </span>
                  {(currentQuestion?.question_text.toLowerCase().includes('elaborate') || 
                    currentQuestion?.question_text.toLowerCase().includes('lack') || 
                    currentQuestion?.question_text.toLowerCase().includes('brief') ||
                    currentQuestion?.question_text.toLowerCase().includes('same topic')) && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                      Follow-up Probing Question (Clarification)
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white leading-relaxed">
                  {currentQuestion?.question_text}
                </h3>
              </div>
            </div>

            {/* Timer and Controls */}
            <div className="mt-12 border-t border-white/10 pt-6">
              
              {/* Countdown timer */}
              {recording && (
                <div className="mb-6">
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-gray-400">Time Remaining</span>
                    <span className={timer < 30 ? 'text-red-400' : 'text-white'}>
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

              {/* Controls triggers */}
              <div className="space-y-3">
                {recording ? (
                  <button
                    onClick={handleStopRecording}
                    className="w-full btn-danger py-4 flex items-center justify-center gap-2"
                  >
                    <MicOff className="w-5 h-5" />
                    Stop & Submit Response
                  </button>
                ) : isAnswered ? (
                  <button
                    onClick={handleCompleteAssessment}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all duration-200"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Finalize & Generate Report
                  </button>
                ) : (
                  <button
                    onClick={handleStartRecording}
                    disabled={submittingAnswer}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Start Answering
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
