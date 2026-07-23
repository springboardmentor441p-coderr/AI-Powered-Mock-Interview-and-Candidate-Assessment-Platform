import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EyeCalibration from './EyeCalibration';
import InterviewSession from './InterviewSession';
import ProctoringMonitor from './ProctoringMonitor';

const MAX_VIOLATIONS = 3;
const RETURN_TIME_LIMIT = 5;

const VIOLATION_MESSAGES = {
  multiple_faces: '⚠️ Multiple faces detected. Please ensure you are alone.',
  no_face: '⚠️ Face not detected. Please stay in view of the camera.',
  looking_away: '⚠️ Please keep your eyes on the screen.',
  object_detected: '⚠️ Unauthorized device detected. Please remove it from view.',
};

function InterviewRoom() {
  const location = useLocation();
  const navigate = useNavigate();
  const questions = location.state?.questions || [];

  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [stage, setStage] = useState('setup');

  const [violationCount, setViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(RETURN_TIME_LIMIT);
  const countdownRef = useRef(null);

  const [calibrationBaseline, setCalibrationBaseline] = useState(null);
  const [proctorViolations, setProctorViolations] = useState([]);
  const [proctorWarning, setProctorWarning] = useState(null);

  useEffect(() => {
    async function requestMediaAccess() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Camera and microphone access is required to start the interview.');
      }
    }

    requestMediaAccess();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stage, stream]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);

      if (stage !== 'setup' && !isNowFullscreen) {
        handleFullscreenExit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [stage, violationCount]);

  const handleFullscreenExit = () => {
    const newCount = violationCount + 1;
    setViolationCount(newCount);

    if (newCount > MAX_VIOLATIONS) {
      cancelInterview();
      return;
    }

    setShowWarning(true);
    setCountdown(RETURN_TIME_LIMIT);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          cancelInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (isFullscreen && showWarning) {
      setShowWarning(false);
      clearInterval(countdownRef.current);
    }
  }, [isFullscreen]);

  const cancelInterview = () => {
    clearInterval(countdownRef.current);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    alert('Interview cancelled due to repeated fullscreen violations.');
    navigate('/resume');
  };

  const handleProceed = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
    setStage('calibration');
  };

  const handleCalibrationComplete = (baseline) => {
    setCalibrationBaseline(baseline);
    setStage('interview');
  };

  const handleProctorViolation = (type, details) => {
    console.log('Proctoring violation:', type, details);
    setProctorViolations((prev) => [...prev, { type, details, timestamp: Date.now() }]);

    setProctorWarning(VIOLATION_MESSAGES[type] || '⚠️ Suspicious activity detected.');
    setTimeout(() => setProctorWarning(null), 4000);
  };

  if (!questions.length) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <p>No interview questions found. Please start from the resume upload page.</p>
        <button onClick={() => navigate('/resume')}>Go Back</button>
      </div>
    );
  }

  if (stage === 'calibration') {
    return <EyeCalibration videoElement={videoRef.current} onComplete={handleCalibrationComplete} />;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', textAlign: 'center' }}>
      <h1>SmartHire AI — Interview Room</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {showWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', color: 'white',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, fontSize: '24px'
        }}>
          <p>⚠️ You have exited fullscreen mode!</p>
          <p>Return within <strong>{countdown}</strong> seconds or the interview will be cancelled.</p>
          <p style={{ fontSize: '16px' }}>Violations: {violationCount} / {MAX_VIOLATIONS}</p>
          <button
            onClick={() => document.documentElement.requestFullscreen()}
            style={{ padding: '10px 20px', marginTop: '15px', fontSize: '16px' }}
          >
            Return to Fullscreen
          </button>
        </div>
      )}

      {proctorWarning && (
        <div style={{
          backgroundColor: '#ff4444', color: 'white', padding: '10px',
          borderRadius: '6px', marginBottom: '10px', fontWeight: 'bold'
        }}>
          {proctorWarning}
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        style={{ width: '400px', borderRadius: '8px', backgroundColor: '#000' }}
      />

      <p style={{ marginTop: '10px' }}>
        {stream ? 'Camera and microphone connected.' : 'Requesting camera access...'}
      </p>

      {stage === 'setup' && stream && (
        <button onClick={handleProceed} style={{ padding: '10px 20px', marginTop: '15px' }}>
          Proceed
        </button>
      )}

      {stage === 'interview' && (
        <>
          <ProctoringMonitor
            videoElement={videoRef.current}
            calibrationBaseline={calibrationBaseline}
            onViolation={handleProctorViolation}
          />
          <InterviewSession
            questions={questions}
            onInterviewEnd={(history) => {
              console.log('Interview ended', history);
              alert('Interview completed! Thank you.');
            }}
          />
        </>
      )}
    </div>
  );
}

export default InterviewRoom;