import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const MAX_FOLLOWUPS_PER_QUESTION = 2;
const SILENCE_THRESHOLD = 8;
const SILENCE_DURATION = 2000;
const MIN_RECORDING_TIME = 1500;
const MAX_RECORDING_TIME = 60000;
const GRACE_PERIOD = 3000;
const NO_SPEECH_TIMEOUT = 8000;
const INTERVIEW_TIME_LIMIT = 15 * 60 * 1000;

function InterviewSession({ questions, onInterviewEnd }) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [status, setStatus] = useState('starting');

  const conversationHistoryRef = useRef([]);
  const remainingQuestionsRef = useRef([...questions]);
  const followUpCountRef = useRef(0);
  const interviewStartTimeRef = useRef(null);

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startInterview();
    }
  }, []);

  const startInterview = async () => {
    interviewStartTimeRef.current = Date.now();
    const firstQuestion = remainingQuestionsRef.current.shift();
    const greeting = `Hello! Thank you for joining today. Let's get started. ${firstQuestion}`;

    conversationHistoryRef.current.push({ role: 'assistant', content: greeting });
    await speakAndListen(greeting);
  };

  const speakAndListen = async (text) => {
    setStatus('ai_speaking');
    setCurrentMessage(text);

    try {
      const response = await api.post('/interview/speak', { text }, { responseType: 'blob' });
      const audioUrl = URL.createObjectURL(response.data);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => startListening();
        audioRef.current.play();
      }
    } catch (err) {
      console.error('TTS failed', err);
      startListening();
    }
  };

  const startListening = async () => {
    setStatus('listening');
    audioChunksRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await handleCandidateAnswer(audioBlob);
    };

    mediaRecorder.start();

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    let silenceStart = null;
    let hasSpokenYet = false;
    const startTime = Date.now();

    const checkSilence = () => {
      if (mediaRecorderRef.current?.state !== 'recording') return;

      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const elapsed = Date.now() - startTime;

      if (volume >= SILENCE_THRESHOLD) {
        hasSpokenYet = true;
        silenceStart = null;
      } else if (hasSpokenYet && elapsed > GRACE_PERIOD) {
        if (silenceStart === null) silenceStart = Date.now();
        if (Date.now() - silenceStart > SILENCE_DURATION && elapsed > MIN_RECORDING_TIME) {
          mediaRecorderRef.current.stop();
          return;
        }
      } else if (!hasSpokenYet && elapsed > NO_SPEECH_TIMEOUT) {
        mediaRecorderRef.current.stop();
        return;
      }

      if (elapsed > MAX_RECORDING_TIME) {
        mediaRecorderRef.current.stop();
        return;
      }

      requestAnimationFrame(checkSilence);
    };
    requestAnimationFrame(checkSilence);
  };

  const handleCandidateAnswer = async (audioBlob) => {
    setStatus('processing');

    const formData = new FormData();
    formData.append('file', audioBlob, 'answer.webm');

    try {
      const sttResponse = await api.post('/interview/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const candidateText = sttResponse.data.transcript;

      // Handle silence / empty answer — don't let it get stuck
      if (!candidateText || candidateText.trim().length < 2) {
        conversationHistoryRef.current.push({ role: 'user', content: '(No response given)' });
        followUpCountRef.current = MAX_FOLLOWUPS_PER_QUESTION; // force progression below
      } else {
        conversationHistoryRef.current.push({ role: 'user', content: candidateText });
      }

      const timeElapsed = Date.now() - interviewStartTimeRef.current;
      const timeUp = timeElapsed >= INTERVIEW_TIME_LIMIT;
      const noQuestionsLeft = remainingQuestionsRef.current.length === 0 && followUpCountRef.current >= MAX_FOLLOWUPS_PER_QUESTION;

      if (timeUp || noQuestionsLeft) {
        const closing = "Thank you for your time today. That concludes our interview. We'll be in touch soon!";
        conversationHistoryRef.current.push({ role: 'assistant', content: closing });
        setStatus('ai_speaking');
        setCurrentMessage(closing);
        await api.post('/interview/speak', { text: closing }, { responseType: 'blob' });
        onInterviewEnd(conversationHistoryRef.current);
        return;
      }

      if (followUpCountRef.current >= MAX_FOLLOWUPS_PER_QUESTION) {
        followUpCountRef.current = 0;
        const nextQ = remainingQuestionsRef.current.shift();

        if (!nextQ) {
          const closing = "Thank you for your time today. That concludes our interview. We'll be in touch soon!";
          conversationHistoryRef.current.push({ role: 'assistant', content: closing });
          await speakAndListen(closing);
          onInterviewEnd(conversationHistoryRef.current);
          return;
        }

        conversationHistoryRef.current.push({ role: 'assistant', content: nextQ });
        await speakAndListen(nextQ);
        return;
      }

      const nextResponse = await api.post('/interview/next-response', {
        conversation_history: conversationHistoryRef.current,
        remaining_questions: remainingQuestionsRef.current,
      });

      const { type, message } = nextResponse.data;

      if (type === 'followup') {
        followUpCountRef.current += 1;
      } else {
        followUpCountRef.current = 0;
        remainingQuestionsRef.current.shift();
      }

      conversationHistoryRef.current.push({ role: 'assistant', content: message });
      await speakAndListen(message);
    } catch (err) {
      console.error('Error processing answer', err);
      setStatus('listening');
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <audio ref={audioRef} style={{ display: 'none' }} />

      <div style={{ padding: '20px', border: '1px solid #444', borderRadius: '8px', minHeight: '150px' }}>
        {status === 'starting' && <p>Starting interview...</p>}
        {status === 'ai_speaking' && (
          <>
            <p style={{ fontWeight: 'bold' }}>🎙️ Interviewer:</p>
            <p>{currentMessage}</p>
          </>
        )}
        {status === 'listening' && <p style={{ color: '#4CAF50' }}>🔴 Listening... please answer now.</p>}
        {status === 'processing' && <p>Processing your answer...</p>}
      </div>
    </div>
  );
}

export default InterviewSession;