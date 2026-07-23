import { useEffect, useRef, useState } from 'react';
import { initFaceTracking, detectFace } from '../services/faceTracking';
import { initObjectDetection, detectObjects } from '../services/objectDetection';

const FACE_CHECK_INTERVAL = 500;
const OBJECT_CHECK_INTERVAL = 2000; // object detection is heavier, check less often
const LOOK_AWAY_THRESHOLD = 4000;

function ProctoringMonitor({ videoElement, calibrationBaseline, onViolation }) {
  const [isReady, setIsReady] = useState(false);
  const lookAwayStartRef = useRef(null);
  const noFaceStartRef = useRef(null);
  const faceIntervalRef = useRef(null);
  const objectIntervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([initFaceTracking(), initObjectDetection()]).then(() => {
      if (!cancelled) setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Face + gaze monitoring
  useEffect(() => {
    if (!isReady || !videoElement) return;

    faceIntervalRef.current = setInterval(() => {
      const result = detectFace(videoElement, performance.now());

      if (result.faceCount > 1) {
        onViolation('multiple_faces', { count: result.faceCount });
        lookAwayStartRef.current = null;
        noFaceStartRef.current = null;
        return;
      }

      if (!result.faceDetected) {
        if (noFaceStartRef.current === null) noFaceStartRef.current = Date.now();
        if (Date.now() - noFaceStartRef.current > LOOK_AWAY_THRESHOLD) {
          onViolation('no_face', {});
          noFaceStartRef.current = Date.now();
        }
        return;
      }
      noFaceStartRef.current = null;

      const normalGaze = calibrationBaseline?.normalGaze || 'center';
      if (result.eyeGaze && result.eyeGaze !== normalGaze) {
        if (lookAwayStartRef.current === null) lookAwayStartRef.current = Date.now();
        if (Date.now() - lookAwayStartRef.current > LOOK_AWAY_THRESHOLD) {
          onViolation('looking_away', { direction: result.eyeGaze });
          lookAwayStartRef.current = Date.now();
        }
      } else {
        lookAwayStartRef.current = null;
      }
    }, FACE_CHECK_INTERVAL);

    return () => clearInterval(faceIntervalRef.current);
  }, [isReady, videoElement, calibrationBaseline]);

  // Object detection monitoring (phone, laptop, tablet, etc.)
  useEffect(() => {
    if (!isReady || !videoElement) return;

    objectIntervalRef.current = setInterval(async () => {
      const flaggedObjects = await detectObjects(videoElement);
      if (flaggedObjects.length > 0) {
        flaggedObjects.forEach((obj) => {
          onViolation('object_detected', { object: obj.class, confidence: obj.score });
        });
      }
    }, OBJECT_CHECK_INTERVAL);

    return () => clearInterval(objectIntervalRef.current);
  }, [isReady, videoElement]);

  return null;
}

export default ProctoringMonitor;