import { useEffect, useRef, useState } from 'react';

import Button from '../Button/Button.jsx';
import './AudioRecorder.css';

function AudioRecorder() {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('Microphone idle');

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      streamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const nextAudioUrl = URL.createObjectURL(audioBlob);

        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }

        setAudioUrl(nextAudioUrl);
        setPermissionStatus('Recording complete');
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setPermissionStatus('Recording in progress');
    } catch (recordingError) {
      setError('Microphone permission is required to record audio.');
      setPermissionStatus('Microphone unavailable');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <section className="audio-recorder" aria-label="Audio recorder">
      <div className="audio-recorder__status">
        <span className={isRecording ? 'audio-recorder__dot is-recording' : 'audio-recorder__dot'} />
        <span>{permissionStatus}</span>
      </div>

      <div className="audio-recorder__actions">
        <Button disabled={isRecording} onClick={startRecording}>
          Start Recording
        </Button>
        <Button disabled={!isRecording} onClick={stopRecording} variant="danger">
          Stop Recording
        </Button>
      </div>

      {audioUrl && <audio className="audio-recorder__player" controls src={audioUrl} />}
      {error && <p className="audio-recorder__error">{error}</p>}
    </section>
  );
}

export default AudioRecorder;
