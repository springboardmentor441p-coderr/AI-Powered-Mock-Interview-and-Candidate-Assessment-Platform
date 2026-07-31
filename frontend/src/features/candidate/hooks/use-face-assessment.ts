/**
 * useFaceAssessment
 *
 * Runs MediaPipe FaceLandmarker entirely in the browser via WASM.
 * Every SAMPLE_INTERVAL_MS (500ms) it:
 *   1. Grabs a frame from the candidate's webcam <video> element.
 *   2. Runs landmark detection (runningMode: "VIDEO").
 *   3. Derives eye-contact / attention / engagement + head-pose.
 *   4. Every FLUSH_EVERY_N_FRAMES frames, POSTs a snapshot to the backend.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { faceAssessmentApi, type FaceSnapshotPayload } from "@/api/face_assessment";

const SAMPLE_INTERVAL_MS = 500;
const FLUSH_EVERY_N_FRAMES = 5;

const MEDIAPIPE_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MEDIAPIPE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// Landmark indices
const LEFT_IRIS_CENTER = 468;
const RIGHT_IRIS_CENTER = 473;
const LEFT_EYE_LEFT = 33;
const LEFT_EYE_RIGHT = 133;
const RIGHT_EYE_LEFT = 362;
const RIGHT_EYE_RIGHT = 263;
const NOSE_TIP = 1;
const CHIN = 152;
const LEFT_FACE_EDGE = 234;
const RIGHT_FACE_EDGE = 454;

const clamp100 = (v: number) => Math.max(0, Math.min(100, v));

export type EmotionLabel = "neutral" | "happy" | "sad" | "angry" | "surprised" | "fearful" | "disgusted";

export interface FaceMetrics {
  faceDetected: boolean;
  multipleFacesDetected: boolean;
  gazeOnScreen: boolean;
  eyeContactScore: number;
  attentionScore: number;
  engagementScore: number;
  dominantEmotion: EmotionLabel;
  emotionBreakdown: Record<EmotionLabel, number>;
  emotionConfidence: number;
  yaw: number;
  pitch: number;
  roll: number;
}

export interface UseFaceAssessmentOptions {
  sessionId: string;
  onMetrics?: (m: FaceMetrics) => void;
  autoStart?: boolean;
  dryRun?: boolean;
}

export interface UseFaceAssessmentReturn {
  active: boolean;
  metrics: FaceMetrics | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  start: () => Promise<void>;
  stop: () => void;
  error: string | null;
}

type LandmarkPoint = { x: number; y: number; z: number };

function estimateYaw(lm: LandmarkPoint[]): number {
  const left = lm[LEFT_FACE_EDGE], right = lm[RIGHT_FACE_EDGE], nose = lm[NOSE_TIP];
  if (!left || !right || !nose) return 0;
  const w = right.x - left.x;
  if (w <= 0) return 0;
  return ((nose.x - (left.x + right.x) / 2) / w) * 90;
}

function estimatePitch(lm: LandmarkPoint[]): number {
  const chin = lm[CHIN], nose = lm[NOSE_TIP], lf = lm[LEFT_FACE_EDGE], rf = lm[RIGHT_FACE_EDGE];
  if (!chin || !nose || !lf || !rf) return 0;
  const h = Math.abs(chin.y - (lf.y + rf.y) / 2);
  if (h <= 0) return 0;
  return (((lf.y + rf.y) / 2 - nose.y) / h) * 60;
}

function computeEyeContact(lm: LandmarkPoint[]): number {
  const li = lm[LEFT_IRIS_CENTER], ri = lm[RIGHT_IRIS_CENTER];
  const ll = lm[LEFT_EYE_LEFT], lr = lm[LEFT_EYE_RIGHT];
  const rl = lm[RIGHT_EYE_LEFT], rr = lm[RIGHT_EYE_RIGHT];
  if (!li || !ri || !ll || !lr || !rl || !rr) return 50;
  const lw = Math.abs(lr.x - ll.x), rw = Math.abs(rr.x - rl.x);
  const lo = lw > 0 ? Math.abs((li.x - (ll.x + lr.x) / 2) / lw) : 0;
  const ro = rw > 0 ? Math.abs((ri.x - (rl.x + rr.x) / 2) / rw) : 0;
  return clamp100((1 - (lo + ro) / 2 * 4) * 100);
}

function estimateEmotion(yaw: number, pitch: number, ec: number) {
  const ay = Math.abs(yaw), ap = Math.abs(pitch);
  let neutral = 0.5, happy = 0.1, surprised = 0.1, sad = 0.1, fearful = 0.1, angry = 0.05, disgusted = 0.05;
  if (ay > 20 || ap > 15) { fearful += 0.2; neutral -= 0.1; }
  if (ec > 70) { happy += 0.15; neutral += 0.1; }
  else if (ec < 40) { sad += 0.1; neutral -= 0.05; }
  if (pitch > 10) surprised += 0.15;
  const raw: Record<EmotionLabel, number> = {
    neutral: Math.max(0, neutral), happy: Math.max(0, happy),
    sad: Math.max(0, sad), angry: Math.max(0, angry),
    surprised: Math.max(0, surprised), fearful: Math.max(0, fearful),
    disgusted: Math.max(0, disgusted),
  };
  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  const breakdown = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, v / total])
  ) as Record<EmotionLabel, number>;
  const dominant = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0][0] as EmotionLabel;
  return { dominant, breakdown, confidence: clamp100(breakdown[dominant] * 150) };
}

export function useFaceAssessment({ sessionId, onMetrics, autoStart = false, dryRun = false }: UseFaceAssessmentOptions): UseFaceAssessmentReturn {
  const [active, setActive] = useState(false);
  const [metrics, setMetrics] = useState<FaceMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceRef = useRef(0);
  const frameCountRef = useRef(0);
  const activeRef = useRef(false);

  const initLandmarker = useCallback(async () => {
    if (landmarkerRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { FaceLandmarker, FilesetResolver } = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs" as any);
    const resolver = await FilesetResolver.forVisionTasks(MEDIAPIPE_BASE);
    const makeOpts = (delegate: string) => ({
      baseOptions: { modelAssetPath: MEDIAPIPE_MODEL, delegate },
      runningMode: "VIDEO",
      numFaces: 2,
    });
    try {
      landmarkerRef.current = await FaceLandmarker.createFromOptions(resolver, makeOpts("GPU"));
    } catch {
      landmarkerRef.current = await FaceLandmarker.createFromOptions(resolver, makeOpts("CPU"));
    }
  }, []);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) return;

    let result: { faceLandmarks: LandmarkPoint[][] };
    try { result = landmarker.detectForVideo(video, performance.now()); }
    catch { return; }

    const faceCount = result.faceLandmarks?.length ?? 0;
    const faceDetected = faceCount > 0;
    const multipleFacesDetected = faceCount > 1;
    let m: FaceMetrics;

    if (!faceDetected) {
      m = {
        faceDetected: false, multipleFacesDetected: false, gazeOnScreen: false,
        eyeContactScore: 0, attentionScore: 0, engagementScore: 0,
        dominantEmotion: "neutral",
        emotionBreakdown: { neutral: 1, happy: 0, sad: 0, angry: 0, surprised: 0, fearful: 0, disgusted: 0 },
        emotionConfidence: 0, yaw: 0, pitch: 0, roll: 0,
      };
    } else {
      const lm = result.faceLandmarks[0];
      const yaw = estimateYaw(lm), pitch = estimatePitch(lm);
      const eyeContactScore = computeEyeContact(lm);
      const gazeOnScreen = Math.abs(yaw) < 30 && Math.abs(pitch) < 25;
      const attentionScore = clamp100(eyeContactScore * (gazeOnScreen ? 1.0 : 0.5));
      const engagementScore = clamp100(eyeContactScore * 0.6 + attentionScore * 0.4);
      const { dominant, breakdown, confidence } = estimateEmotion(yaw, pitch, eyeContactScore);
      m = { faceDetected: true, multipleFacesDetected, gazeOnScreen, eyeContactScore, attentionScore, engagementScore,
        dominantEmotion: dominant, emotionBreakdown: breakdown, emotionConfidence: confidence, yaw, pitch, roll: 0 };
    }

    setMetrics(m);
    onMetrics?.(m);

    frameCountRef.current += 1;
    if (frameCountRef.current >= FLUSH_EVERY_N_FRAMES) {
      frameCountRef.current = 0;
      const seq = sequenceRef.current++;
      if (!dryRun && sessionId) {
        const payload: FaceSnapshotPayload = {
          sequence: seq, face_detected: m.faceDetected, multiple_faces_detected: m.multipleFacesDetected, gaze_on_screen: m.gazeOnScreen,
          eye_contact_score: m.eyeContactScore, attention_score: m.attentionScore,
          engagement_score: m.engagementScore, dominant_emotion: m.dominantEmotion,
          emotion_breakdown: m.emotionBreakdown, emotion_confidence: m.emotionConfidence,
          yaw: m.yaw, pitch: m.pitch, roll: m.roll,
        };
        faceAssessmentApi.ingestSnapshot(sessionId, payload).catch((e: unknown) => {
          console.warn("[face-assessment] flush failed:", e);
        });
      }
    }
  }, [sessionId, onMetrics, dryRun]);

  const start = useCallback(async () => {
    if (activeRef.current) return;
    setError(null);
    try {
      await initLandmarker();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      intervalRef.current = setInterval(processFrame, SAMPLE_INTERVAL_MS);
      activeRef.current = true;
      setActive(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start camera.";
      setError(msg);
    }
  }, [initLandmarker, processFrame]);

  const stop = useCallback(() => {
    activeRef.current = false;
    setActive(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (autoStart) void start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { active, metrics, videoRef, start, stop, error };
}