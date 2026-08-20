import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertCircle } from 'lucide-react';
import * as faceapi from 'face-api.js';

export default function WebcamMonitor({ onMetricsUpdate }) {
  const videoRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const onMetricsUpdateRef = useRef(onMetricsUpdate);
  useEffect(() => {
    onMetricsUpdateRef.current = onMetricsUpdate;
  }, [onMetricsUpdate]);

  // Load face-api.js neural net models from /models directory
  useEffect(() => {
    let isMounted = true;
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        if (isMounted) {
          setModelsLoaded(true);
        }
      } catch (err) {
        console.warn("[face-api.js] Model loading exception:", err);
      }
    };
    loadModels();
    return () => { isMounted = false; };
  }, []);

  const startCamera = async () => {
    try {
      setPermissionDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err) {
      console.warn("Webcam access error:", err);
      setPermissionDenied(true);
      setStreamActive(false);
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Face detection interval effect — strictly depends on stable booleans [streamActive, modelsLoaded] to prevent infinite render loops
  useEffect(() => {
    if (!streamActive || !modelsLoaded) {
      if (onMetricsUpdateRef.current) {
        onMetricsUpdateRef.current({
          streamActive,
          faceDetected: streamActive ? "Initializing Models..." : "Not Detected",
          eyeContactRatio: 0.0,
          eyeContactPct: 0,
          attentionPct: 0,
          confidencePct: 0,
          emotion: "Neutral",
          cameraStatus: streamActive ? "Loading Neural Models..." : (permissionDenied ? "Permission Denied" : "Initializing Camera...")
        });
      }
      return;
    }

    const intervalId = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
          .withFaceLandmarks()
          .withFaceExpressions();

        if (detection) {
          const box = detection.detection.box;
          const score = detection.detection.score;

          // 1. Extract Dominant Expression
          const expressions = detection.expressions;
          let dominantEmotion = "neutral";
          let maxScore = 0;
          if (expressions) {
            Object.entries(expressions).forEach(([expr, val]) => {
              if (val > maxScore) {
                maxScore = val;
                dominantEmotion = expr;
              }
            });
          }
          const emotionLabel = dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1);

          // 2. Compute Eye Contact & Gaze Alignment Heuristic
          // Nose tip landmark (point 30) relative to bounding box center
          const landmarks = detection.landmarks;
          const nose = landmarks.getNose()[3]; // Tip of nose
          
          const boxCenterX = box.x + (box.width / 2);
          const devX = Math.abs(nose.x - boxCenterX) / (box.width / 2); // 0 when nose is centered horizontally
          
          const rawEyeContact = Math.max(0, 1.0 - (devX * 1.8));
          const eyeContactPct = Math.round(rawEyeContact * 100);
          const eyeContactRatio = Math.round(rawEyeContact * 100) / 100;

          // 3. Attention & Confidence Percentages
          const attentionPct = Math.min(100, Math.round((eyeContactPct * 0.7) + (score * 30)));
          const confidencePct = Math.round(score * 100);

          if (onMetricsUpdateRef.current) {
            onMetricsUpdateRef.current({
              streamActive: true,
              faceDetected: "Face Detected",
              eyeContactRatio,
              eyeContactPct,
              attentionPct,
              confidencePct,
              emotion: emotionLabel,
              cameraStatus: "AI Eye-Contact & Emotion Tracking Active"
            });
          }
        } else {
          if (onMetricsUpdateRef.current) {
            onMetricsUpdateRef.current({
              streamActive: true,
              faceDetected: "Searching Face...",
              eyeContactRatio: 0.0,
              eyeContactPct: 0,
              attentionPct: 0,
              confidencePct: 0,
              emotion: "Searching",
              cameraStatus: "Camera Stream Active (Searching Face...)"
            });
          }
        }
      } catch (err) {
        console.warn("Face detection processing error:", err);
      }
    }, 700);

    return () => clearInterval(intervalId);
  }, [streamActive, modelsLoaded]);

  return (
    <div className="relative rounded-2xl overflow-hidden glass-card border border-slate-800 bg-slate-950 aspect-video shadow-2xl group">
      
      {/* Clean Video Stream */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className={`w-full h-full object-cover transform -scale-x-100 ${streamActive ? 'block' : 'hidden'}`}
      />

      {/* Fallback View if Camera Permission Pending / Denied */}
      {!streamActive && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/95 relative p-6 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Camera className="w-8 h-8" />
          </div>
          
          <div>
            <p className="text-sm font-bold text-white">Live Camera Stream</p>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              {permissionDenied 
                ? "Camera permission denied or camera device unavailable. Click below to retry camera access." 
                : "Initializing Live Webcam Stream & AI Models..."}
            </p>
          </div>

          <button
            onClick={startCamera}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" /> Enable Live Webcam
          </button>
        </div>
      )}

      {/* Camera Live Indicator */}
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold text-white uppercase tracking-wider shadow-md flex items-center gap-1.5 border border-slate-800">
        <span className={`w-2 h-2 rounded-full ${streamActive ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`}></span>
        {streamActive ? "CAMERA LIVE" : "CAMERA OFF"}
      </div>

    </div>
  );
}
