import React, { useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { api } from '../services/api';

export default function IntegrityMonitor({ sessionId, isListening, videoElementRef }) {
  const landmarkerRef = useRef(null);
  const monitorIntervalRef = useRef(null);
  const lastFaceDetectTime = useRef(Date.now());
  const gazeAwayStartTime = useRef(null);
  const lastEventTime = useRef({ MULTIPLE_FACES: 0, NO_FACE_DETECTED: 0, GAZE_AWAY: 0 });

  useEffect(() => {
    let mounted = true;
    const initModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: true,
          runningMode: "VIDEO",
          numFaces: 2
        });
        if (mounted) landmarkerRef.current = faceLandmarker;
      } catch (err) {
        console.error("Failed to load FaceLandmarker", err);
      }
    };
    initModel();

    return () => {
      mounted = false;
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
      if (landmarkerRef.current) landmarkerRef.current.close();
    };
  }, []);

  const sendFlag = async (type, duration, description) => {
    const now = Date.now();
    // Debounce exact same events (max 1 every 5s)
    if (now - lastEventTime.current[type] < 5000) return;
    lastEventTime.current[type] = now;

    try {
      await api.logIntegrityEvent(sessionId, {
        event_type: type,
        duration_seconds: duration,
        description,
        severity: type === 'NO_FACE_DETECTED' ? 'high' : 'medium'
      });
    } catch (e) {
      console.error('Failed to log integrity event', e);
    }
  };

  useEffect(() => {
    if (!isListening || !landmarkerRef.current || !videoElementRef?.current) {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
        monitorIntervalRef.current = null;
      }
      // Reset tracking when not listening
      lastFaceDetectTime.current = Date.now();
      gazeAwayStartTime.current = null;
      return;
    }

    const video = videoElementRef.current;
    
    const monitor = () => {
      if (video.readyState < 2) return; // Need at least HAVE_CURRENT_DATA

      let results;
      try {
        results = landmarkerRef.current.detectForVideo(video, performance.now());
      } catch(err) {
        return;
      }
      const now = Date.now();

      // 1. Multiple Faces
      if (results.faceLandmarks && results.faceLandmarks.length > 1) {
        sendFlag('MULTIPLE_FACES', 1.0, 'More than one face detected in the frame.');
      }

      // 2. No Face Detected
      if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
        if (now - lastFaceDetectTime.current > 3000) {
          sendFlag('NO_FACE_DETECTED', (now - lastFaceDetectTime.current) / 1000, 'Candidate not detected in camera frame.');
        }
      } else {
        lastFaceDetectTime.current = now;
      }

      // 3. Gaze Detection (Proxy via Head Pose Matrix)
      if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
        const matrix = results.facialTransformationMatrixes[0].data;
        const yaw = Math.atan2(matrix[3], matrix[0]);
        const pitch = Math.atan2(-matrix[6], Math.sqrt(matrix[0]*matrix[0] + matrix[3]*matrix[3]));

        if (Math.abs(yaw) > 0.45 || Math.abs(pitch) > 0.45) {
          if (!gazeAwayStartTime.current) {
            gazeAwayStartTime.current = now;
          } else if (now - gazeAwayStartTime.current > 3000) {
            sendFlag('GAZE_AWAY', (now - gazeAwayStartTime.current) / 1000, 'Candidate looking away from screen for >3s.');
            gazeAwayStartTime.current = now; 
          }
        } else {
          gazeAwayStartTime.current = null;
        }
      }
    };

    // Run low-frequency to avoid blocking UI thread
    monitorIntervalRef.current = setInterval(monitor, 1000);

    return () => {
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
    };
  }, [isListening, sessionId, videoElementRef]);

  return null; // Silent component
}
