import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Webcam from '../components/Webcam';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { useFaceTracker } from '../hooks/useFaceTracker';
import { useEmotionTracker } from '../hooks/useEmotionTracker';
import { motion } from 'framer-motion';
import { Mic, Video, VideoOff, MicOff, Send, Loader2, Clock } from 'lucide-react';

export default function InterviewRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState('Setting up your environment...');
  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const recordingStartRef = useRef(null);
  
  const videoRef = useRef(null);
  const { stream, recording, error, initStream, startRecording, stopRecording, cleanup } = useMediaRecorder();
  const { getMetricsAndReset: getFaceMetrics } = useFaceTracker(videoRef);
  const { getMetricsAndReset: getEmotionMetrics } = useEmotionTracker(videoRef);


  // Timer for current question
  useEffect(() => {
    if (recording) {
      recordingStartRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - recordingStartRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [recording]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    async function setup() {
      try {
        const s = await initStream();
        
        // Fetch actual session questions from the backend
        const { data: sessionData } = await api.get(`/interview/${sessionId}`);
        const realQuestions = sessionData.questions || [];
        
        if (realQuestions.length === 0) {
          setStatus('No questions found for this session.');
          return;
        }

        setQuestions(realQuestions);

        // Start the session
        await api.post(`/interview/${sessionId}/start`);
        
        setStatus('');
        startRecording(s);
      } catch (err) {
        setStatus(err.response?.data?.message || err.message || 'Failed to initialize interview session');
      }
    }
    setup();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function handleNext() {
    setSubmitting(true);
    try {
      const blob = await stopRecording();
      const currentQuestion = questions[currentIndex];
      
      const faceMetrics = getFaceMetrics();
      const emotionMetrics = getEmotionMetrics();
      const visualMetrics = {
        ...faceMetrics,
        emotionScores: emotionMetrics
      };

      const formData = new FormData();
      formData.append('questionId', currentQuestion._id);
      formData.append('visualMetrics', JSON.stringify(visualMetrics));
      // Calculate actual duration from recording start
      const durationSec = recordingStartRef.current 
        ? Math.floor((Date.now() - recordingStartRef.current) / 1000) 
        : 0;
      formData.append('duration', String(durationSec)); 
      if (blob) formData.append('media', blob, 'response.webm');

      await api.post(`/interview/${sessionId}/response`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
        startRecording(stream);
      } else {
        setStatus('Finalizing your interview...');
        await api.post(`/interview/${sessionId}/complete`);
        cleanup();
        navigate(`/report/${sessionId}`);
      }
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-rose-400 font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-indigo-950/20">
      <div className="max-w-5xl mx-auto flex flex-col h-full min-h-[85vh]">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
            <h1 className="text-xl font-semibold text-slate-200 tracking-wide">Live Interview</h1>
          </div>
          <div className="flex items-center gap-4">
            {recording && (
              <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                <Clock size={14} />
                <span className="font-mono">{formatTime(elapsed)}</span>
              </div>
            )}
            {questions.length > 0 && (
              <div className="px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium">
                Question {currentIndex + 1} of {questions.length}
              </div>
            )}
          </div>
        </header>

        {status && (
          <div className="flex-1 flex flex-col items-center justify-center text-indigo-400">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="text-lg font-medium">{status}</p>
          </div>
        )}

        <div className={`flex-1 flex flex-col md:flex-row gap-8 ${status || questions.length === 0 ? 'hidden' : ''}`}>
          {/* Left Col: Question */}
            <div className="flex-1 flex flex-col justify-center">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-100 to-slate-400 mb-6">
                  {questions[currentIndex]?.text}
                </h2>
                <p className="text-slate-400 leading-relaxed text-lg mb-8">
                  Take your time to think. Maintain eye contact with the camera for better engagement scores.
                </p>
              </motion.div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Right Col: Video */}
            <div className="flex-1 flex flex-col max-w-2xl w-full">
              <Webcam stream={stream} ref={videoRef} />
              
              {/* Controls */}
              <div className="mt-6 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between backdrop-blur-sm">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-full flex items-center justify-center transition-colors ${stream ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {stream ? <Video size={20} /> : <VideoOff size={20} />}
                  </div>
                  <div className={`p-3 rounded-full flex items-center justify-center transition-colors ${recording ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {recording ? <Mic size={20} /> : <MicOff size={20} />}
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 flex items-center gap-2 font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <>Processing <Loader2 size={18} className="animate-spin" /></>
                  ) : currentIndex < questions.length - 1 ? (
                    <>Submit & Next <Send size={18} /></>
                  ) : (
                    <>Finish Interview <Send size={18} /></>
                  )}
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
