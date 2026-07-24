import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let faceLandmarker = null;

/**
 * Load the MediaPipe FaceLandmarker model. Call this once before tracking starts.
 */
export async function initFaceTracking() {
  if (faceLandmarker) return faceLandmarker;

  const filesetResolver = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU',
    },
    outputFaceBlendshapes: false,
    runningMode: 'VIDEO',
    numFaces: 2,
  });

  return faceLandmarker;
}

/**
 * Run face detection on a single video frame.
 * Returns: { faceCount, eyeGaze: 'center'|'left'|'right'|'up'|'down'|null, faceDetected: bool }
 */
export function detectFace(videoElement, timestampMs) {
  if (!faceLandmarker || !videoElement) {
    return { faceCount: 0, eyeGaze: null, faceDetected: false };
  }

  const result = faceLandmarker.detectForVideo(videoElement, timestampMs);

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    return { faceCount: 0, eyeGaze: null, faceDetected: false };
  }

  const faceCount = result.faceLandmarks.length;
  const landmarks = result.faceLandmarks[0]; // primary face

  const eyeGaze = estimateGazeDirection(landmarks);

  return { faceCount, eyeGaze, faceDetected: true };
}

/**
 * Simple gaze estimation using iris and eye-corner landmark positions.
 * MediaPipe FaceLandmarker gives 478 landmarks; specific indices below
 * correspond to left/right eye corners and iris centers.
 */
function estimateGazeDirection(landmarks) {
  // Left eye corners: 33 (outer), 133 (inner). Left iris center: 468.
  // Right eye corners: 362 (inner), 263 (outer). Right iris center: 473.
  const leftEyeOuter = landmarks[33];
  const leftEyeInner = landmarks[133];
  const leftIris = landmarks[468];

  const rightEyeInner = landmarks[362];
  const rightEyeOuter = landmarks[263];
  const rightIris = landmarks[473];

  if (!leftIris || !rightIris) return 'center';

  // Horizontal ratio: where the iris sits between the two eye corners (0 = outer, 1 = inner)
  const leftRatio = (leftIris.x - leftEyeOuter.x) / (leftEyeInner.x - leftEyeOuter.x);
  const rightRatio = (rightIris.x - rightEyeInner.x) / (rightEyeOuter.x - rightEyeInner.x);
  const avgRatio = (leftRatio + rightRatio) / 2;

  if (avgRatio < 0.35) return 'right'; // note: mirrored for selfie view
  if (avgRatio > 0.65) return 'left';
  return 'center';
}

export function closeFaceTracking() {
  if (faceLandmarker) {
    faceLandmarker.close();
    faceLandmarker = null;
  }
}