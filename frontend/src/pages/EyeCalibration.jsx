import { useState, useEffect, useRef } from 'react';
import { initFaceTracking, detectFace, closeFaceTracking } from '../services/faceTracking';

const CALIBRATION_POINTS = [
  { x: 50, y: 50 },
  { x: 10, y: 10 },
  { x: 90, y: 10 },
  { x: 90, y: 90 },
  { x: 10, y: 90 },
  { x: 50, y: 50 },
];

const TIME_PER_POINT = 1500;

function EyeCalibration({ videoElement, onComplete }) {
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const gazeReadingsRef = useRef([]); // collected during calibration
  const trackingIntervalRef = useRef(null);

  // Load MediaPipe model once
  useEffect(() => {
    let cancelled = false;
    initFaceTracking().then(() => {
      if (!cancelled) setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sample gaze continuously while calibration runs
  useEffect(() => {
    if (!isReady || !videoElement || isComplete) return;

    trackingIntervalRef.current = setInterval(() => {
      const result = detectFace(videoElement, performance.now());
      if (result.faceDetected) {
        gazeReadingsRef.current.push({
          point: CALIBRATION_POINTS[currentPointIndex],
          gaze: result.eyeGaze,
        });
      }
    }, 200);

    return () => clearInterval(trackingIntervalRef.current);
  }, [isReady, currentPointIndex, isComplete, videoElement]);

  useEffect(() => {
    if (!isReady) return;

    if (currentPointIndex >= CALIBRATION_POINTS.length) {
      setIsComplete(true);
      const timer = setTimeout(() => {
        // Build a simple baseline: the most common gaze reading is treated as "center/normal"
        const baseline = buildBaseline(gazeReadingsRef.current);
        onComplete(baseline);
      }, 1000);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setCurrentPointIndex((prev) => prev + 1);
    }, TIME_PER_POINT);

    return () => clearTimeout(timer);
  }, [currentPointIndex, isReady]);

  const currentPoint = CALIBRATION_POINTS[currentPointIndex] || CALIBRATION_POINTS[CALIBRATION_POINTS.length - 1];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: '#000', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }}>
      {!isReady ? (
        <p style={{ color: 'white', fontSize: '18px' }}>Loading eye tracking...</p>
      ) : !isComplete ? (
        <>
          <p style={{ color: 'white', fontSize: '20px', marginBottom: '40px' }}>
            Follow the dot with your eyes only. Keep your head still.
          </p>
          <div style={{ position: 'relative', width: '80%', height: '60%', border: '1px solid #333' }}>
            <div
              style={{
                position: 'absolute',
                left: `${currentPoint.x}%`,
                top: `${currentPoint.y}%`,
                transform: 'translate(-50%, -50%)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                transition: `left ${TIME_PER_POINT}ms ease-in-out, top ${TIME_PER_POINT}ms ease-in-out`,
                boxShadow: '0 0 20px #4CAF50',
              }}
            />
          </div>
        </>
      ) : (
        <p style={{ color: 'white', fontSize: '24px' }}>Calibration complete.</p>
      )}
    </div>
  );
}

function buildBaseline(readings) {
  const counts = {};
  readings.forEach(({ gaze }) => {
    if (gaze) counts[gaze] = (counts[gaze] || 0) + 1;
  });

  // The most frequently detected gaze direction becomes our "normal/center" reference
  let mostCommon = 'center';
  let maxCount = 0;
  for (const [gaze, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = gaze;
    }
  }

  return { normalGaze: mostCommon, sampleCount: readings.length };
}

export default EyeCalibration;