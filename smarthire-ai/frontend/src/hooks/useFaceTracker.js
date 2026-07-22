import { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';

// Simple heuristic for eye contact: checking if irises/pupils are centered relative to the eye corners.
// MediaPipe gives 468 face landmarks.
export function useFaceTracker(videoRef) {
  const [metrics, setMetrics] = useState({
    eyeContactPct: 0,
    engagementScore: 0,
  });
  const trackingData = useRef({ totalFrames: 0, eyeContactFrames: 0, engagedFrames: 0 });

  useEffect(() => {
    if (!videoRef.current) return;

    let faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true, // Needed for iris tracking
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      trackingData.current.totalFrames++;
      
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        // Heuristic: If face is detected, candidate is somewhat engaged.
        trackingData.current.engagedFrames++;
        
        // Very basic heuristic for eye contact: Face is looking forward if nose tip is between cheeks
        // Landmarks: 1 (Nose tip), 234 (Left cheek), 454 (Right cheek)
        const nose = landmarks[1];
        const leftCheek = landmarks[234];
        const rightCheek = landmarks[454];

        if (nose && leftCheek && rightCheek) {
          const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
          const noseOffset = Math.abs(nose.x - (leftCheek.x + faceWidth / 2));
          
          // If nose is relatively centered, assume eye contact (rough proxy)
          if (noseOffset < faceWidth * 0.15) {
            trackingData.current.eyeContactFrames++;
          }
        }
      }
    });

    // In a real app, we'd use Camera from @mediapipe/camera_utils to feed frames automatically.
    // Since we already have a stream from useMediaRecorder, we'll poll the video element.
    let animationFrameId;
    const processFrame = async () => {
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        await faceMesh.send({ image: videoRef.current });
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };

    videoRef.current.addEventListener('loadeddata', () => {
      processFrame();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      faceMesh.close();
    };
  }, [videoRef]);

  // Method to extract the final metrics when submitting a response
  const getMetricsAndReset = () => {
    const { totalFrames, eyeContactFrames, engagedFrames } = trackingData.current;
    
    const eyeContactPct = totalFrames > 0 ? Math.round((eyeContactFrames / totalFrames) * 100) : 0;
    const engagementScore = totalFrames > 0 ? Math.round((engagedFrames / totalFrames) * 100) : 0;
    
    // Reset for next question
    trackingData.current = { totalFrames: 0, eyeContactFrames: 0, engagedFrames: 0 };
    setMetrics({ eyeContactPct, engagementScore });
    
    return { eyeContactPct, engagementScore };
  };

  return { getMetricsAndReset, metrics };
}
