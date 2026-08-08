import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Camera, Eye, VideoOff, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';

export type EyeGazeStatus = 'looking_at_camera' | 'looking_slightly_away' | 'looking_away' | 'face_not_detected';

export interface EyeTrackingStats {
  percentage: number;
  currentStatus: EyeGazeStatus;
  statusText: string;
  totalValidFrames: number;
  goodFrames: number;
}

interface EyeTrackerProps {
  onStatsUpdate?: (stats: EyeTrackingStats) => void;
  compact?: boolean;
}

export const EyeTracker: React.FC<EyeTrackerProps> = ({ onStatsUpdate, compact = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);

  const [currentStatus, setCurrentStatus] = useState<EyeGazeStatus>('face_not_detected');
  const [eyeContactPercentage, setEyeContactPercentage] = useState<number>(100);

  // Tracking state refs for smooth calculation
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const validFramesCountRef = useRef<number>(0);
  const goodFramesCountRef = useRef<number>(0);
  const lastStatusRef = useRef<EyeGazeStatus>('face_not_detected');
  const blinkFramesCounterRef = useRef<number>(0);
  const smoothedDeviationRef = useRef<number>(0);

  // Initialize MediaPipe Face Landmarker
  useEffect(() => {
    let isCancelled = false;

    async function initFaceLandmarker() {
      try {
        setIsModelLoading(true);
        setModelError(null);

        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (isCancelled) return;

        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
        });

        if (isCancelled) return;

        landmarkerRef.current = faceLandmarker;
        setIsModelLoading(false);
      } catch (err: any) {
        console.warn('[EyeTracker] Failed to initialize MediaPipe FaceLandmarker with GPU, retrying CPU fallback:', err);
        try {
          const filesetResolver = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          );
          if (isCancelled) return;

          const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numFaces: 1,
          });

          if (isCancelled) return;

          landmarkerRef.current = faceLandmarker;
          setIsModelLoading(false);
        } catch (cpuErr: any) {
          console.error('[EyeTracker] Error loading FaceLandmarker:', cpuErr);
          if (!isCancelled) {
            setModelError('Failed to load eye tracking model. Please check network connection.');
            setIsModelLoading(false);
          }
        }
      }
    }

    initFaceLandmarker();

    return () => {
      isCancelled = true;
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch (e) {
          // ignore cleanup error
        }
      }
    };
  }, []);

  // Initialize Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupWebcam() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((e) => console.warn('Video play error:', e));
            setHasCameraPermission(true);
          };
        }
      } catch (err) {
        console.warn('[EyeTracker] Camera access denied or unavailable:', err);
        setHasCameraPermission(false);
      }
    }

    setupWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Main Detection Loop
  useEffect(() => {
    if (!hasCameraPermission || isModelLoading || !landmarkerRef.current) {
      return;
    }

    let lastVideoTime = -1;

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (video && canvas && landmarker && video.readyState >= 2) {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;

          // Align canvas size
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          try {
            const results = landmarker.detectForVideo(video, performance.now());

            if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
              // Face Not Detected
              updateStatus('face_not_detected');
            } else {
              const landmarks = results.faceLandmarks[0];

              // Eye & Iris Analysis
              const eyeAnalysis = analyzeEyeLandmarks(landmarks, canvas.width, canvas.height);

              // Draw landmarks overlay subtly
              if (ctx && eyeAnalysis) {
                drawLandmarkOverlay(ctx, eyeAnalysis, landmarks, canvas.width, canvas.height);
              }

              if (eyeAnalysis?.isBlinking) {
                // Ignore normal blinks (keep previous valid status, do not penalize)
                blinkFramesCounterRef.current += 1;
              } else if (eyeAnalysis) {
                blinkFramesCounterRef.current = 0;
                const dev = eyeAnalysis.deviation;

                // Exponential Moving Average (EMA) smoothing to ignore tiny tremors
                const alpha = 0.3;
                smoothedDeviationRef.current =
                  alpha * dev + (1 - alpha) * smoothedDeviationRef.current;

                const smoothDev = smoothedDeviationRef.current;

                let status: EyeGazeStatus = 'looking_at_camera';
                if (smoothDev < 0.14 && eyeAnalysis.headYawAligned) {
                  status = 'looking_at_camera';
                } else if (smoothDev < 0.23 && eyeAnalysis.headYawAligned) {
                  status = 'looking_slightly_away';
                } else {
                  status = 'looking_away';
                }

                updateStatus(status);
              }
            }
          } catch (detectionErr) {
            console.warn('[EyeTracker] Frame detection exception:', detectionErr);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [hasCameraPermission, isModelLoading]);

  const updateStatus = (newStatus: EyeGazeStatus) => {
    lastStatusRef.current = newStatus;
    setCurrentStatus(newStatus);

    if (newStatus !== 'face_not_detected') {
      validFramesCountRef.current += 1;
      if (newStatus === 'looking_at_camera') {
        goodFramesCountRef.current += 1;
      } else if (newStatus === 'looking_slightly_away') {
        goodFramesCountRef.current += 0.5; // partial credit for slight gaze shift
      }

      const total = validFramesCountRef.current;
      const good = goodFramesCountRef.current;
      const pct = total > 0 ? Math.round((good / total) * 100) : 100;

      setEyeContactPercentage(pct);

      if (onStatsUpdate) {
        onStatsUpdate({
          percentage: pct,
          currentStatus: newStatus,
          statusText: getStatusLabel(newStatus),
          totalValidFrames: total,
          goodFrames: good,
        });
      }
    } else {
      if (onStatsUpdate) {
        onStatsUpdate({
          percentage: eyeContactPercentage,
          currentStatus: 'face_not_detected',
          statusText: getStatusLabel('face_not_detected'),
          totalValidFrames: validFramesCountRef.current,
          goodFrames: goodFramesCountRef.current,
        });
      }
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm relative ${compact ? 'p-3' : 'p-4'}`}>
      {/* Top Header Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-bold text-white tracking-tight">Eye Contact Tracker</span>
          <span className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-indigo-300 font-mono rounded-md border border-slate-700">
            Real-time
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
          <span>Score:</span>
          <span
            className={`font-mono text-xs ${
              eyeContactPercentage >= 75
                ? 'text-emerald-400'
                : eyeContactPercentage >= 50
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {eyeContactPercentage}%
          </span>
        </div>
      </div>

      {/* Main Video Box */}
      <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {/* Live Camera Feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${
            hasCameraPermission === false ? 'hidden' : 'block'
          }`}
        />

        {/* Overlay Canvas for Iris & Eye Highlights */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none"
        />

        {/* Loading Spinner */}
        {isModelLoading && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white p-4 text-center">
            <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-300">Initializing Eye Landmarker...</span>
          </div>
        )}

        {/* Camera Permission Error State */}
        {hasCameraPermission === false && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-4 text-center space-y-2">
            <VideoOff className="h-8 w-8 text-rose-500" />
            <span className="text-xs font-bold text-slate-200">Camera Access Disabled</span>
            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
              Please enable webcam permission in your browser to activate real-time eye contact tracking.
            </p>
          </div>
        )}

        {/* Model Error */}
        {modelError && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center text-rose-300 space-y-2">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
            <span className="text-xs font-bold">{modelError}</span>
          </div>
        )}

        {/* Overlay Live Gaze Status Bar */}
        {!isModelLoading && hasCameraPermission !== false && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <StatusBadge status={currentStatus} />
            </div>

            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>Processed locally</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info / Tip */}
      {!compact && (
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
          <span>Target: Maintain &gt;75% eye contact</span>
          <span className="text-indigo-400 font-medium">Blinks & natural pauses excluded</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS: Landmark Math & Gaze Calculation
// ============================================================================

interface EyeAnalysisResult {
  isBlinking: boolean;
  deviation: number;
  headYawAligned: boolean;
  leftIris: { x: number; y: number };
  rightIris: { x: number; y: number };
  leftEyeBox: { left: number; right: number; top: number; bottom: number };
  rightEyeBox: { left: number; right: number; top: number; bottom: number };
}

/**
 * Calculates eye ratio, blink detection, and iris deviation relative to eye contours
 */
function analyzeEyeLandmarks(landmarks: any[], width: number, height: number): EyeAnalysisResult | null {
  if (!landmarks || landmarks.length < 468) return null;

  // MediaPipe FaceMesh Landmark Indices:
  // Left eye: inner 133, outer 33, top 159, bottom 145
  // Right eye: inner 362, outer 263, top 386, bottom 374
  // Left iris: 468 (center), 469, 470, 471, 472
  // Right iris: 473 (center), 474, 475, 476, 477
  // Nose tip: 1
  // Face left bound: 234, face right bound: 454

  const lOuter = landmarks[33];
  const lInner = landmarks[133];
  const lTop = landmarks[159];
  const lBottom = landmarks[145];

  const rInner = landmarks[362];
  const rOuter = landmarks[263];
  const rTop = landmarks[386];
  const rBottom = landmarks[374];

  const nose = landmarks[1];
  const faceLeft = landmarks[234];
  const faceRight = landmarks[454];

  // Iris centers (landmarks 468 and 473 if available, or approximated)
  const lIris = landmarks[468] || getMidpoint(lOuter, lInner);
  const rIris = landmarks[473] || getMidpoint(rInner, rOuter);

  // 1. Calculate Eye Aspect Ratio (EAR) for Blink Detection
  const leftEAR = getDistance(lTop, lBottom) / Math.max(getDistance(lOuter, lInner), 0.001);
  const rightEAR = getDistance(rTop, rBottom) / Math.max(getDistance(rOuter, rInner), 0.001);
  const avgEAR = (leftEAR + rightEAR) / 2;

  const isBlinking = avgEAR < 0.18;

  // 2. Head Yaw Alignment (check if nose is centered between ears/cheeks)
  const faceWidth = Math.max(getDistance(faceLeft, faceRight), 0.001);
  const noseRelativeX = (nose.x - faceLeft.x) / (faceRight.x - faceLeft.x || 1);
  const headYawAligned = noseRelativeX >= 0.35 && noseRelativeX <= 0.65;

  // 3. Iris Relative Position inside Eye Box
  // Left Eye Ratio
  const leftXRatio = (lIris.x - lOuter.x) / Math.max(lInner.x - lOuter.x, 0.0001);
  const leftYRatio = (lIris.y - lTop.y) / Math.max(lBottom.y - lTop.y, 0.0001);

  // Right Eye Ratio
  const rightXRatio = (rIris.x - rInner.x) / Math.max(rOuter.x - rInner.x, 0.0001);
  const rightYRatio = (rIris.y - rTop.y) / Math.max(rBottom.y - rTop.y, 0.0001);

  // Ideal centered iris ratios are around ~0.48 - 0.52 horizontally and ~0.45 - 0.55 vertically
  const avgXRatio = (leftXRatio + rightXRatio) / 2;
  const avgYRatio = (leftYRatio + rightYRatio) / 2;

  const dx = Math.abs(avgXRatio - 0.5);
  const dy = Math.abs(avgYRatio - 0.5);
  const headOffset = Math.abs(noseRelativeX - 0.5);

  const deviation = dx * 1.2 + dy * 0.8 + headOffset * 0.5;

  return {
    isBlinking,
    deviation,
    headYawAligned,
    leftIris: { x: lIris.x * width, y: lIris.y * height },
    rightIris: { x: rIris.x * width, y: rIris.y * height },
    leftEyeBox: {
      left: lOuter.x * width,
      right: lInner.x * width,
      top: lTop.y * height,
      bottom: lBottom.y * height,
    },
    rightEyeBox: {
      left: rInner.x * width,
      right: rOuter.x * width,
      top: rTop.y * height,
      bottom: rBottom.y * height,
    },
  };
}

function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function getMidpoint(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

/**
 * Draws subtle iris and eye contour markers on canvas overlay
 */
function drawLandmarkOverlay(
  ctx: CanvasRenderingContext2D,
  analysis: EyeAnalysisResult,
  landmarks: any[],
  width: number,
  height: number
) {
  // Draw Left & Right Iris Centers
  ctx.fillStyle = '#6366f1'; // Indigo
  ctx.beginPath();
  ctx.arc(analysis.leftIris.x, analysis.leftIris.y, 3, 0, 2 * Math.PI);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(analysis.rightIris.x, analysis.rightIris.y, 3, 0, 2 * Math.PI);
  ctx.fill();

  // Subtle outer iris ring highlight
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(analysis.leftIris.x, analysis.leftIris.y, 6, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(analysis.rightIris.x, analysis.rightIris.y, 6, 0, 2 * Math.PI);
  ctx.stroke();
}

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

const StatusBadge: React.FC<{ status: EyeGazeStatus }> = ({ status }) => {
  switch (status) {
    case 'looking_at_camera':
      return (
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>🟢 Looking at Camera</span>
        </div>
      );
    case 'looking_slightly_away':
      return (
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>🟡 Looking Slightly Away</span>
        </div>
      );
    case 'looking_away':
      return (
        <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-[11px]">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <span>🔴 Looking Away</span>
        </div>
      );
    case 'face_not_detected':
    default:
      return (
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
          <span className="h-2 w-2 rounded-full bg-slate-500" />
          <span>Face Not Detected</span>
        </div>
      );
  }
};

function getStatusLabel(status: EyeGazeStatus): string {
  switch (status) {
    case 'looking_at_camera':
      return 'Looking at Camera';
    case 'looking_slightly_away':
      return 'Looking Slightly Away';
    case 'looking_away':
      return 'Looking Away';
    case 'face_not_detected':
    default:
      return 'Face Not Detected';
  }
}
