import React, { useEffect, useRef, useState } from 'react';
import Button from '../Button/Button.jsx';
import Loader from '../Loader/Loader.jsx';
import { createVoiceStreamSocket } from '../../services/voiceService.js';
import './AudioRecorder.css';

const SILENCE_THRESHOLD = 0.025;
const SILENCE_MS = 1400;
const MIN_SPEECH_MS = 600;
const CHUNK_MS = 250;

function encodePcmWav(audioBuffer) {
  const channelCount = audioBuffer.numberOfChannels;
  const sampleCount = audioBuffer.length;
  const bytesPerSample = 2;
  const dataSize = sampleCount * channelCount * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeText = (offset, value) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeText(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * channelCount * bytesPerSample, true);
  view.setUint16(32, channelCount * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeText(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels = Array.from(
    { length: channelCount },
    (_, index) => audioBuffer.getChannelData(index),
  );
  let offset = 44;
  for (let frame = 0; frame < sampleCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channels[channel][frame]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return buffer;
}

function AudioRecorder({
  sessionId,
  onVoiceStreamResponse,
  onTextSubmit,
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

  const [error, setError] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [hasOpenTurn, setHasOpenTurn] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('Microphone ready');
  const [textAnswer, setTextAnswer] = useState('');
  const [mode, setMode] = useState('voice');

  useEffect(() => {
    return () => stopStreaming();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cleanupAudio = () => {
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
    setHasOpenTurn(false);
    speakingStartedAtRef.current = null;
    silenceStartedAtRef.current = null;
    recordedChunksRef.current = [];
    shouldSubmitRecordingRef.current = false;
  };

  const closeSocket = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
    socketRef.current = null;
  };

  const stopStreaming = () => {
    cleanupAudio();
    closeSocket();
    setIsStreaming(false);
    isStreamingRef.current = false;
    setIsSpeaking(false);
    setIsAiThinking(false);
    isAiThinkingRef.current = false;
    setPermissionStatus('Microphone ready');
  };

  const sendControl = (payload) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  };

  const endCurrentTurn = () => {
    if (!isTurnOpenRef.current || isAiThinkingRef.current) return;
    isTurnOpenRef.current = false;
    setHasOpenTurn(false);
    isAiThinkingRef.current = true;
    setIsAiThinking(true);
    setIsSpeaking(false);
    setPermissionStatus('Answer captured. AI is thinking...');
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
    if (!stream || socket?.readyState !== WebSocket.OPEN) return;

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
    setHasOpenTurn(true);
    speakingStartedAtRef.current = null;
    silenceStartedAtRef.current = null;
    recordedChunksRef.current = [];
    shouldSubmitRecordingRef.current = false;
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
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
        const audioContext = audioContextRef.current;
        if (!audioContext || recordedBlob.size === 0) {
          throw new Error('No decodable audio was recorded.');
        }
        const decodedAudio = await audioContext.decodeAudioData(
          await recordedBlob.arrayBuffer(),
        );
        activeSocket.send(new Blob([encodePcmWav(decodedAudio)], { type: 'audio/wav' }));
        sendControl({ type: 'end_utterance' });
      } catch (err) {
        isAiThinkingRef.current = false;
        setIsAiThinking(false);
        setError('The recorded audio could not be prepared. Please try the answer again.');
        setPermissionStatus('Ready for another answer.');
        sendControl({ type: 'cancel_utterance' });
      }
    };

    sendControl({
      type: 'start_utterance',
      mime_type: 'audio/wav',
    });
    mediaRecorder.start(CHUNK_MS);
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

    if (!isAiThinkingRef.current && rms > SILENCE_THRESHOLD) {
      if (!speakingStartedAtRef.current) {
        speakingStartedAtRef.current = now;
        ensureTurnOpen();
      }
      silenceStartedAtRef.current = null;
      setIsSpeaking(true);
      setPermissionStatus('Listening... keep speaking naturally.');
    }

    if (
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
    setPermissionStatus('Connecting realtime voice interview...');

    try {
      const socket = createVoiceStreamSocket(sessionId);
      socketRef.current = socket;

      socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'ready') {
          setPermissionStatus('Connected. Start speaking when you are ready.');
          return;
        }
        if (data.type === 'processing') {
          setPermissionStatus('Processing your answer...');
          return;
        }
        if (data.type === 'error') {
          isAiThinkingRef.current = false;
          setIsAiThinking(false);
          setError(data.message || 'Realtime voice interview failed.');
          setPermissionStatus('Listening paused after an error.');
          return;
        }
        if (data.type === 'interviewer_turn') {
          isAiThinkingRef.current = false;
          setIsAiThinking(false);
          setPermissionStatus('AI responded. Speak when you are ready.');
          if (onVoiceStreamResponse) {
            await onVoiceStreamResponse(data);
          }
        }
      };

      socket.onerror = () => {
        setError('Realtime voice connection failed.');
        stopStreaming();
      };

      socket.onclose = () => {
        setIsStreaming(false);
        isStreamingRef.current = false;
        setIsSpeaking(false);
        setIsAiThinking(false);
        isAiThinkingRef.current = false;
        setPermissionStatus('Realtime voice disconnected.');
      };

      await new Promise((resolve, reject) => {
        socket.onopen = resolve;
        socket.onerror = reject;
      });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      setIsStreaming(true);
      isStreamingRef.current = true;
      setPermissionStatus('Connected. Start speaking when you are ready.');
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
        await onTextSubmit(textAnswer.trim());
        setTextAnswer('');
      } catch (err) {
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
                Start Realtime Interview
              </Button>
            ) : (
              <>
                <Button onClick={endCurrentTurn} disabled={isAiThinking || !hasOpenTurn}>
                  Finish Answer
                </Button>
                <Button onClick={stopStreaming} variant="danger">
                  Stop Voice
                </Button>
              </>
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
            {isSubmitting ? 'Evaluating Answer...' : 'Submit Text Answer'}
          </Button>
        </form>
      )}

      {(isSubmitting || isAiThinking) && <Loader label="Evaluating answer and generating next question..." />}
      {error && <p className="audio-recorder__error">{error}</p>}
    </div>
  );
}

export default AudioRecorder;
