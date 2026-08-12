import React, { useEffect, useRef, useState } from 'react';
import Button from '../Button/Button.jsx';
import { createVoiceStreamSocket } from '../../services/voiceService.js';
import './AudioRecorder.css';

const SILENCE_THRESHOLD = 0.025;
const SILENCE_MS = 1400;
const MIN_SPEECH_MS = 600;
const POST_TTS_GUARD_MS = 750;

function AudioRecorder({
  sessionId,
  onInitialQuestionPlayback,
  onVoiceStreamResponse,
  onTextSubmit,
  onProcessingChange,
  isSubmitting = false,
}) {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const monitorFrameRef = useRef(null);
  const speakingStartedAtRef = useRef(null);
  const silenceStartedAtRef = useRef(null);
  const isTurnOpenRef = useRef(false);
  const isAiThinkingRef = useRef(false);
  const isStreamingRef = useRef(false);
  const recordedChunksRef = useRef([]);
  const shouldSubmitRecordingRef = useRef(false);
  const chunkSendChainRef = useRef(Promise.resolve());
  const latencyStartedAtRef = useRef(null);
  const latencyIntervalRef = useRef(null);
  const isListeningRef = useRef(false);
  const streamRunIdRef = useRef(0);

  const [error, setError] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('Microphone ready');
  const [textAnswer, setTextAnswer] = useState('');
  const [mode, setMode] = useState('voice');
  const [latencyMs, setLatencyMs] = useState(0);
  const [lastLatencyMs, setLastLatencyMs] = useState(null);
  const [isWaitingForQuestion, setIsWaitingForQuestion] = useState(false);

  useEffect(() => {
    return () => {
      stopStreaming();
      if (latencyIntervalRef.current) window.clearInterval(latencyIntervalRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cleanupAudio = () => {
    isListeningRef.current = false;
    if (monitorFrameRef.current) {
      cancelAnimationFrame(monitorFrameRef.current);
      monitorFrameRef.current = null;
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      shouldSubmitRecordingRef.current = false;
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    isTurnOpenRef.current = false;
    speakingStartedAtRef.current = null;
    silenceStartedAtRef.current = null;
    recordedChunksRef.current = [];
    chunkSendChainRef.current = Promise.resolve();
    shouldSubmitRecordingRef.current = false;
  };

  const closeSocket = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
    socketRef.current = null;
  };

  const stopStreaming = () => {
    streamRunIdRef.current += 1;
    cleanupAudio();
    closeSocket();
    setIsStreaming(false);
    isStreamingRef.current = false;
    setIsSpeaking(false);
    setIsAiThinking(false);
    isAiThinkingRef.current = false;
    onProcessingChange?.(false);
    setPermissionStatus('Microphone ready');
  };

  const sendControl = (payload) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  };

  const setMicrophoneEnabled = (enabled) => {
    isListeningRef.current = enabled;
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  };

  const waitForPostTtsGuard = () =>
    new Promise((resolve) => window.setTimeout(resolve, POST_TTS_GUARD_MS));

  const startLatencyTimer = () => {
    const startedAt = performance.now();
    latencyStartedAtRef.current = startedAt;
    setLatencyMs(0);
    setIsWaitingForQuestion(true);
    if (latencyIntervalRef.current) window.clearInterval(latencyIntervalRef.current);
    latencyIntervalRef.current = window.setInterval(() => {
      setLatencyMs(performance.now() - startedAt);
    }, 100);
  };

  const stopLatencyTimer = () => {
    if (!latencyStartedAtRef.current) return;
    const elapsed = performance.now() - latencyStartedAtRef.current;
    latencyStartedAtRef.current = null;
    if (latencyIntervalRef.current) window.clearInterval(latencyIntervalRef.current);
    latencyIntervalRef.current = null;
    setLatencyMs(elapsed);
    setLastLatencyMs(elapsed);
    setIsWaitingForQuestion(false);
  };

  const endCurrentTurn = () => {
    if (!isTurnOpenRef.current || isAiThinkingRef.current) return;
    isTurnOpenRef.current = false;
    setMicrophoneEnabled(false);
    isAiThinkingRef.current = true;
    setIsAiThinking(true);
    onProcessingChange?.(true);
    setIsSpeaking(false);
    setPermissionStatus('Answer captured. Preparing the next question...');
    startLatencyTimer();
    if (mediaRecorderRef.current?.state === 'recording') {
      shouldSubmitRecordingRef.current = true;
      mediaRecorderRef.current.stop();
    } else {
      sendControl({ type: 'end_utterance' });
    }
  };

  const ensureTurnOpen = () => {
    if (isTurnOpenRef.current || isAiThinkingRef.current) return;
    const stream = streamRef.current;
    const socket = socketRef.current;
    if (!isListeningRef.current || !stream || socket?.readyState !== WebSocket.OPEN) return;

    const supportedMimeType = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/webm',
    ].find((candidate) => MediaRecorder.isTypeSupported(candidate));
    const mediaRecorder = supportedMimeType
      ? new MediaRecorder(stream, { mimeType: supportedMimeType })
      : new MediaRecorder(stream);

    isTurnOpenRef.current = true;
    speakingStartedAtRef.current = null;
    silenceStartedAtRef.current = null;
    recordedChunksRef.current = [];
    shouldSubmitRecordingRef.current = false;
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
        chunkSendChainRef.current = chunkSendChainRef.current.then(async () => {
          const activeSocket = socketRef.current;
          if (activeSocket?.readyState === WebSocket.OPEN) {
            activeSocket.send(await event.data.arrayBuffer());
          }
        });
      }
    };
    mediaRecorder.onstop = async () => {
      const chunks = recordedChunksRef.current;
      recordedChunksRef.current = [];
      mediaRecorderRef.current = null;

      if (!shouldSubmitRecordingRef.current) return;
      shouldSubmitRecordingRef.current = false;

      const activeSocket = socketRef.current;
      if (activeSocket?.readyState !== WebSocket.OPEN) return;

      try {
        const recordedBlob = new Blob(chunks, { type: mediaRecorder.mimeType });
        if (recordedBlob.size === 0) {
          throw new Error('No audio was recorded.');
        }
        await chunkSendChainRef.current;
        sendControl({ type: 'end_utterance' });
      } catch (err) {
        stopLatencyTimer();
        isAiThinkingRef.current = false;
        setIsAiThinking(false);
        onProcessingChange?.(false);
        setError('The recorded audio could not be prepared. Please try the answer again.');
        setPermissionStatus('Ready for another answer.');
        sendControl({ type: 'cancel_utterance' });
      }
    };

    sendControl({
      type: 'start_utterance',
      mime_type: mediaRecorder.mimeType || supportedMimeType || 'audio/webm',
    });
    // Send encoded media fragments continuously to the backend's live STT socket.
    mediaRecorder.start(250);
  };

  const monitorSilence = () => {
    const analyser = analyserRef.current;
    if (!analyser || !isStreamingRef.current) return;

    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (const value of data) {
      const normalized = (value - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / data.length);
    const now = Date.now();

    if (isListeningRef.current && !isAiThinkingRef.current && rms > SILENCE_THRESHOLD) {
      if (!speakingStartedAtRef.current) {
        speakingStartedAtRef.current = now;
        ensureTurnOpen();
      }
      silenceStartedAtRef.current = null;
      setIsSpeaking(true);
      setPermissionStatus('Listening... keep speaking naturally.');
    }

    if (
      isListeningRef.current &&
      !isAiThinkingRef.current &&
      speakingStartedAtRef.current &&
      rms <= SILENCE_THRESHOLD
    ) {
      if (!silenceStartedAtRef.current) silenceStartedAtRef.current = now;
      const speechMs = now - speakingStartedAtRef.current;
      const silenceMs = now - silenceStartedAtRef.current;
      if (speechMs >= MIN_SPEECH_MS && silenceMs >= SILENCE_MS) {
        endCurrentTurn();
      }
    }

    monitorFrameRef.current = requestAnimationFrame(monitorSilence);
  };

  const startStreaming = async () => {
    if (!sessionId) {
      setError('No active interview session found. Start the interview first.');
      return;
    }

    setError('');
    setPermissionStatus('Connecting. Microphone is off...');
    const runId = streamRunIdRef.current + 1;
    streamRunIdRef.current = runId;

    try {
      const socket = createVoiceStreamSocket(sessionId);
      socketRef.current = socket;

      socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'ready') {
          setPermissionStatus('Connected. Preparing the interviewer...');
          return;
        }
        if (data.type === 'processing') {
          setPermissionStatus('Preparing the next question...');
          return;
        }
        if (data.type === 'error') {
          stopLatencyTimer();
          isAiThinkingRef.current = false;
          setIsAiThinking(false);
          onProcessingChange?.(false);
          setError(data.message || 'Realtime voice interview failed.');
          setPermissionStatus('Listening paused after an error.');
          return;
        }
        if (data.type === 'interviewer_turn') {
          stopLatencyTimer();
          setMicrophoneEnabled(false);
          setPermissionStatus('Interviewer is speaking...');
          try {
            if (onVoiceStreamResponse) {
              await onVoiceStreamResponse(data);
            }
          } finally {
            await waitForPostTtsGuard();
            if (streamRunIdRef.current !== runId || !streamRef.current) return;
            isAiThinkingRef.current = false;
            setIsAiThinking(false);
            onProcessingChange?.(false);
            speakingStartedAtRef.current = null;
            silenceStartedAtRef.current = null;
            setMicrophoneEnabled(true);
            setPermissionStatus('Your turn. Speak naturally when you are ready.');
          }
        }
      };

      socket.onerror = () => {
        stopLatencyTimer();
        setError('Realtime voice connection failed.');
        stopStreaming();
      };

      socket.onclose = () => {
        stopLatencyTimer();
        setIsStreaming(false);
        isStreamingRef.current = false;
        setIsSpeaking(false);
        setIsAiThinking(false);
        isAiThinkingRef.current = false;
        onProcessingChange?.(false);
        setPermissionStatus('Realtime voice disconnected.');
      };

      await new Promise((resolve, reject) => {
        socket.addEventListener('open', resolve, { once: true });
        socket.addEventListener('error', reject, { once: true });
      });

      setIsStreaming(true);
      isStreamingRef.current = true;
      setPermissionStatus('Interviewer is speaking. Microphone is off...');

      if (onInitialQuestionPlayback) {
        await onInitialQuestionPlayback();
      }
      await waitForPostTtsGuard();

      if (streamRunIdRef.current !== runId || socket.readyState !== WebSocket.OPEN) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      setMicrophoneEnabled(true);
      setPermissionStatus('Your turn. Speak naturally when you are ready.');
      monitorFrameRef.current = requestAnimationFrame(monitorSilence);
    } catch (err) {
      setError('Microphone permission denied, unavailable, or realtime voice could not start.');
      stopStreaming();
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textAnswer.trim()) {
      setError('Please type your response before submitting.');
      return;
    }
    setError('');
    if (onTextSubmit) {
      try {
        startLatencyTimer();
        await onTextSubmit(textAnswer.trim());
        stopLatencyTimer();
        setTextAnswer('');
      } catch (err) {
        stopLatencyTimer();
        setError(err.message || 'Failed to submit answer.');
      }
    }
  };

  return (
    <div className="audio-recorder">
      <div className="recorder-tabs">
        <button
          type="button"
          className={`tab-btn ${mode === 'voice' ? 'is-active' : ''}`}
          onClick={() => setMode('voice')}
        >
          Realtime Voice
        </button>
        <button
          type="button"
          className={`tab-btn ${mode === 'text' ? 'is-active' : ''}`}
          onClick={() => setMode('text')}
        >
          Text Response
        </button>
      </div>

      {mode === 'voice' ? (
        <div className="voice-panel">
          <div className="audio-recorder__status">
            <span
              className={
                isSpeaking
                  ? 'audio-recorder__dot is-recording'
                  : isStreaming
                    ? 'audio-recorder__dot is-connected'
                    : 'audio-recorder__dot'
              }
            />
            <span>{permissionStatus}</span>
          </div>

          <div className="voice-meter" aria-hidden="true">
            <span className={isSpeaking ? 'voice-meter__bar is-active' : 'voice-meter__bar'} />
            <span className={isSpeaking ? 'voice-meter__bar is-active' : 'voice-meter__bar'} />
            <span className={isSpeaking ? 'voice-meter__bar is-active' : 'voice-meter__bar'} />
          </div>

          <div className="audio-recorder__actions">
            {!isStreaming ? (
              <Button disabled={isSubmitting} onClick={startStreaming}>
                Join Voice Interview
              </Button>
            ) : (
              <Button onClick={stopStreaming} variant="danger">
                Leave Voice Interview
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form className="text-panel" onSubmit={handleTextSubmit}>
          <textarea
            className="text-answer-input"
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="Type your detailed interview response here..."
            rows={4}
            disabled={isSubmitting}
          />
          <Button disabled={isSubmitting || !textAnswer.trim()} type="submit">
            {isSubmitting ? 'Sending answer...' : 'Submit Text Answer'}
          </Button>
        </form>
      )}

      {(isWaitingForQuestion || lastLatencyMs !== null) && (
        <div className={`latency-display${isWaitingForQuestion ? ' is-active' : ''}`} role="status">
          <span>{isWaitingForQuestion ? 'Waiting for next question' : 'Last response latency'}</span>
          <strong>{((isWaitingForQuestion ? latencyMs : lastLatencyMs) / 1000).toFixed(1)}s</strong>
        </div>
      )}
      {error && <p className="audio-recorder__error">{error}</p>}
    </div>
  );
}

export default AudioRecorder;
