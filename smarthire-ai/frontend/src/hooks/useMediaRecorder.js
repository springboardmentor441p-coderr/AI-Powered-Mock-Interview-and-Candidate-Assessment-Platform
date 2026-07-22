import { useRef, useState, useCallback } from 'react';

/**
 * Wraps getUserMedia + MediaRecorder for capturing a candidate's video+audio
 * response to a single interview question.
 */
export function useMediaRecorder() {
  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const initStream = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      return s;
    } catch (err) {
      setError('Camera/microphone permission denied. Please allow access to continue.');
      throw err;
    }
  }, []);

  const startRecording = useCallback((activeStream) => {
    const s = activeStream || stream;
    if (!s) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(s, { mimeType: 'video/webm' });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  }, [stream]);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) return resolve(null);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecording(false);
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  const cleanup = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
  }, [stream]);

  return { stream, recording, error, initStream, startRecording, stopRecording, cleanup };
}
