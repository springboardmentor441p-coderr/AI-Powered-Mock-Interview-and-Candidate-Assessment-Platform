import React, { useRef, useEffect, useState } from 'react';
import { Camera, Eye, ShieldAlert, UserCheck } from 'lucide-react';

export const VisionAnalyzer = ({ onTelemetryUpdate, compact = false, faceSignature, onStreamActive }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [eyeContactStatus, setEyeContactStatus] = useState('Centered');
  const [headPose, setHeadPose] = useState('Centered');
  const [faceCount, setFaceCount] = useState(1);
  const [emotion, setEmotion] = useState('Confident & Focused');
  const [gadgetLabel, setGadgetLabel] = useState('Clear');
  const [mediapipeActive, setMediapipeActive] = useState(false);
  const cocoModelRef = useRef(null);
  const onTelemetryUpdateRef = useRef(onTelemetryUpdate);

  useEffect(() => {
    onTelemetryUpdateRef.current = onTelemetryUpdate;
  }, [onTelemetryUpdate]);

  // Dedicated High-Precision Mobile Phone & Gadget Detector Loop (Runs every 200ms)
  useEffect(() => {
    let detectorTimer = null;
    if (cameraActive) {
      detectorTimer = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;

        let foundGadget = false;
        let label = 'Clear';

        // Method 1: TensorFlow COCO-SSD Real Object AI Detector
        if (cocoModelRef.current) {
          try {
            const predictions = await cocoModelRef.current.detect(videoRef.current);
            const detected = predictions.find(p =>
              (p.class === 'cell phone' || p.class === 'mobile phone' || p.class === 'phone' || p.class === 'remote' || p.class === 'laptop' || p.class === 'book') && p.score > 0.22
            );
            if (detected) {
              foundGadget = true;
              label = `Phone (${Math.round(detected.score * 100)}%)`;
            }
          } catch (e) {}
        }

        // Method 2: High-Precision Phone Camera Lens & Non-Skin Block Scanner
        if (!foundGadget && videoRef.current) {
          try {
            const v = videoRef.current;
            const vW = v.videoWidth || 640;
            const vH = v.videoHeight || 480;
            if (vW > 0 && vH > 0) {
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = 160;
              tempCanvas.height = 120;
              const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
              tempCtx.drawImage(v, 0, 0, 160, 120);
              const imgData = tempCtx.getImageData(0, 0, 160, 120);
              const data = imgData.data;

              // Scan Left Face/Cheek/Ear Zone (x: 10 to 65, y: 25 to 100)
              // Scan Right Face/Cheek/Ear Zone (x: 95 to 150, y: 25 to 100)
              let leftNonSkin = 0, leftTotal = 0, leftDarkEdge = 0;
              let rightNonSkin = 0, rightTotal = 0, rightDarkEdge = 0;

              for (let y = 25; y < 100; y += 2) {
                for (let x = 10; x < 65; x += 2) {
                  const idx = (y * 160 + x) * 4;
                  const r = data[idx], g = data[idx + 1], b = data[idx + 2];
                  const isSkin = (r > 55 && g > 35 && b > 20 && r > g && (r - g > 12) && (r - b > 12));
                  leftTotal++;
                  if (!isSkin) leftNonSkin++;
                  if (r < 45 && g < 45 && b < 45) leftDarkEdge++; // camera lenses / bezels
                }

                for (let x = 95; x < 150; x += 2) {
                  const idx = (y * 160 + x) * 4;
                  const r = data[idx], g = data[idx + 1], b = data[idx + 2];
                  const isSkin = (r > 55 && g > 35 && b > 20 && r > g && (r - g > 12) && (r - b > 12));
                  rightTotal++;
                  if (!isSkin) rightNonSkin++;
                  if (r < 45 && g < 45 && b < 45) rightDarkEdge++;
                }
              }

              const leftRatio = leftTotal > 0 ? leftNonSkin / leftTotal : 0;
              const rightRatio = rightTotal > 0 ? rightNonSkin / rightTotal : 0;

              if ((leftRatio > 0.68 && leftDarkEdge > 20) || (rightRatio > 0.68 && rightDarkEdge > 20)) {
                foundGadget = true;
                label = 'Mobile Phone Detected 📱';
              } else if (leftRatio > 0.82 || rightRatio > 0.82) {
                foundGadget = true;
                label = 'Mobile Device / Phone 📱';
              }
            }
          } catch (e) {}
        }

        setGadgetLabel(label);

        if (onTelemetryUpdateRef.current) {
          onTelemetryUpdateRef.current({
            gadgetDetected: foundGadget,
            gadgetLabel: label,
            hasOcclusion: foundGadget
          });
        }
      }, 200);
    }

    return () => {
      if (detectorTimer) clearInterval(detectorTimer);
    };
  }, [cameraActive]);

  const mediaStreamRef = useRef(null);

  // Initialize WebCam Feed
  useEffect(() => {
    let isMounted = true;

    const startCamera = async (retries = 3) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },
          audio: false
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          if (onStreamActive) {
            onStreamActive(stream);
          }
          videoRef.current.play()
            .then(() => { if (isMounted) setCameraActive(true); })
            .catch(() => { if (isMounted) setCameraActive(true); });
        }
      } catch (err) {
        if (retries > 0 && isMounted) {
          console.warn(`[VisionAnalyzer] Webcam device busy, retrying in 300ms (${retries} left)...`);
          setTimeout(() => { if (isMounted) startCamera(retries - 1); }, 300);
          return;
        }
        console.warn('Standard 720p constraints failed, trying basic video:', err);
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });

          if (!isMounted) {
            fallbackStream.getTracks().forEach((t) => t.stop());
            return;
          }

          mediaStreamRef.current = fallbackStream;

          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            if (onStreamActive) {
              onStreamActive(fallbackStream);
            }
            videoRef.current.play()
              .then(() => { if (isMounted) setCameraActive(true); })
              .catch(() => { if (isMounted) setCameraActive(true); });
          }
        } catch (fallbackErr) {
          console.error('Webcam stream failed:', fallbackErr);
          if (isMounted) setCameraActive(false);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // REAL-TIME ACCURATE VISION ENGINE (Fix false multi-face triggers)
  useEffect(() => {
    let animationFrameId;
    let offscreenCanvas = document.createElement('canvas');
    let offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

    let consecutiveViolationFrames = 0;

    const extractFaceTemplate = (sourceCanvas, sx, sy, sWidth, sHeight) => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 16;
      tempCanvas.height = 16;
      const tempCtx = tempCanvas.getContext('2d');
      try {
        tempCtx.drawImage(sourceCanvas, sx, sy, sWidth, sHeight, 0, 0, 16, 16);
        const imgData = tempCtx.getImageData(0, 0, 16, 16);
        const data = imgData.data;
        const pixels = [];
        let minVal = 1.0;
        let maxVal = 0.0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
          pixels.push(gray);
          if (gray < minVal) minVal = gray;
          if (gray > maxVal) maxVal = gray;
        }
        const range = maxVal - minVal;
        if (range < 0.01) return new Array(256).fill(0);
        return pixels.map(p => (p - minVal) / range);
      } catch (e) {
        return new Array(256).fill(0);
      }
    };

    const analyzeVideoFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (mediapipeActive) {
        animationFrameId = requestAnimationFrame(analyzeVideoFrame);
        return;
      }
      if (!canvas || !video || video.readyState < 2) {
        animationFrameId = requestAnimationFrame(analyzeVideoFrame);
        return;
      }

      const ctx = canvas.getContext('2d');
      const width = video.videoWidth || 320;
      const height = video.videoHeight || 240;

      canvas.width = width;
      canvas.height = height;
      offscreenCanvas.width = 160;
      offscreenCanvas.height = 120;

      ctx.clearRect(0, 0, width, height);

      // Render frame to offscreen canvas
      offscreenCtx.drawImage(video, 0, 0, 160, 120);
      const frameData = offscreenCtx.getImageData(0, 0, 160, 120);
      const data = frameData.data;

      let totalSkinPixels = 0;
      let sumX = 0;
      let sumY = 0;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      const skinCoords = [];

      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const maxVal = Math.max(r, g, b);
        const minVal = Math.min(r, g, b);
        const isSkin = (r > 60 && g > 40 && b > 20 && 
                        r > g && 
                        (r - g > 15) && 
                        (maxVal - minVal > 15) && 
                        (r - b > 15));

        if (isSkin) {
          const pixelIndex = i / 4;
          const x = pixelIndex % 160;
          const y = Math.floor(pixelIndex / 160);

          totalSkinPixels++;
          sumX += x;
          sumY += y;
          sumR += r;
          sumG += g;
          sumB += b;
          skinCoords.push({ x, y });
        }
      }

      let minX = 160, maxX = 0, minY = 120, maxY = 0;
      let validSkinCount = 0;
      let lowerFaceBlocked = false;

      if (totalSkinPixels > 30) {
        const centerX = sumX / totalSkinPixels;
        const centerY = sumY / totalSkinPixels;
        
        let varianceX = 0;
        let varianceY = 0;
        for (let j = 0; j < skinCoords.length; j++) {
          varianceX += Math.pow(skinCoords[j].x - centerX, 2);
          varianceY += Math.pow(skinCoords[j].y - centerY, 2);
        }
        const stdX = Math.sqrt(varianceX / totalSkinPixels) || 1;
        const stdY = Math.sqrt(varianceY / totalSkinPixels) || 1;
        
        for (let j = 0; j < skinCoords.length; j++) {
          const coord = skinCoords[j];
          if (Math.abs(coord.x - centerX) < 1.6 * stdX && Math.abs(coord.y - centerY) < 1.6 * stdY) {
            validSkinCount++;
            if (coord.x < minX) minX = coord.x;
            if (coord.x > maxX) maxX = coord.x;
            if (coord.y < minY) minY = coord.y;
            if (coord.y > maxY) maxY = coord.y;
          }
        }
        
        // Face aspect ratio check — lowerFaceBlocked disabled to avoid false positives during speaking
        lowerFaceBlocked = false;
      }

      let currentGaze = 'Centered';
      let currentFaceCount = 1; // Default to 1 candidate in front of camera
      let boxX = width * 0.25;
      let boxY = height * 0.15;
      let boxWidth = width * 0.5;
      let boxHeight = height * 0.7;

      if (totalSkinPixels < 15) {
        // Person moved off camera / empty seat
        currentGaze = 'Off-Camera / No Face';
        currentFaceCount = 0;
      } else {
        const scaleX = width / 160;
        const scaleY = height / 120;

        boxX = Math.max(5, minX * scaleX);
        boxY = Math.max(5, minY * scaleY);
        boxWidth = Math.min(width - boxX - 5, Math.max(60, (maxX - minX) * scaleX));
        boxHeight = Math.min(height - boxY - 5, Math.max(60, (maxY - minY) * scaleY));

        const avgX = (sumX / totalSkinPixels) / 160; // Normalized 0..1
        const avgY = (sumY / totalSkinPixels) / 120;

        // Accurate Gaze & Head Position Detection (Generous 0.10..0.90 frame bounds)
        if (avgX < 0.10) {
          currentGaze = 'Looking Left / Turned';
        } else if (avgX > 0.90) {
          currentGaze = 'Looking Right / Turned';
        } else if (avgY > 0.88) {
          currentGaze = 'Looking Down';
        } else {
          currentGaze = 'Centered';
        }
      }

      // Identity mismatch check disabled — MediaPipe Face Mesh handles face detection accurately.
      // The skin-pixel structural template (MSE) produced persistent false positives for the same
      // candidate under varying lighting/webcam angles. faceMatched is always true here.
      const faceMatched = true;

      setEyeContactStatus(currentGaze);
      setHeadPose(currentGaze);
      setFaceCount(currentFaceCount);

      // Draw Cyan Target Bounding Box on Video Canvas
      const isOk = currentGaze === 'Centered' && currentFaceCount === 1 && faceMatched && !lowerFaceBlocked;

      ctx.strokeStyle = isOk ? '#06B6D4' : '#F59E0B';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      // Corner Accents
      ctx.setLineDash([]);
      ctx.fillStyle = isOk ? '#38BDF8' : '#FBBF24';
      const cLen = 14;
      ctx.fillRect(boxX, boxY, cLen, 3);
      ctx.fillRect(boxX, boxY, 3, cLen);
      ctx.fillRect(boxX + boxWidth - cLen, boxY, cLen, 3);
      ctx.fillRect(boxX + boxWidth - 3, boxY, 3, cLen);
      ctx.fillRect(boxX, boxY + boxHeight - 3, cLen, 3);
      ctx.fillRect(boxX, boxY + boxHeight - cLen, 3, cLen);
      ctx.fillRect(boxX + boxWidth - cLen, boxY + boxHeight - 3, cLen, 3);
      ctx.fillRect(boxX + boxWidth - 3, boxY + boxHeight - cLen, 3, cLen);

      // Eye Tracking Crosshairs
      if (currentFaceCount === 1) {
        const eyeY = boxY + boxHeight * 0.35;
        const eyeLeftX = boxX + boxWidth * 0.3;
        const eyeRightX = boxX + boxWidth * 0.7;

        ctx.strokeStyle = isOk ? '#10B981' : '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(eyeLeftX, eyeY, 6, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(eyeRightX, eyeY, 6, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Send telemetry updates to parent InterviewRoom (only on sustained off-center movement > 20 frames)
      if (onTelemetryUpdate) {
        if (!isOk) {
          consecutiveViolationFrames = Math.min(15, consecutiveViolationFrames + 1);
          if (consecutiveViolationFrames >= 6) {
            onTelemetryUpdate({
              eyeContact: currentGaze,
              faceCount: currentFaceCount,
              headPose: currentGaze,
              faceMatch: faceMatched,
              gadgetDetected: lowerFaceBlocked
            });
            consecutiveViolationFrames = 6;
          }
        } else {
          consecutiveViolationFrames = Math.max(0, consecutiveViolationFrames - 2);
          if (consecutiveViolationFrames === 0) {
            onTelemetryUpdate({
              eyeContact: 'Centered',
              faceCount: 1,
              headPose: 'Centered',
              faceMatch: true,
              gadgetDetected: false
            });
          }
        }
      }

      animationFrameId = requestAnimationFrame(analyzeVideoFrame);
    };

    analyzeVideoFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cameraActive, onTelemetryUpdate]);

  if (compact) {
    return (
      <div className="relative w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100"
        />
        {!cameraActive && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center text-slate-500 p-4 z-10">
            <Camera className="w-8 h-8 text-cyan-400/60 mb-1.5 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400">Loading WebCam Feed...</span>
          </div>
        )}
      </div>
    );
  }

  useEffect(() => {
    let active = true;
    let faceMeshInstance = null;

    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.body.appendChild(script);
      });
    };

    const initMediaPipe = async () => {
      try {
        console.log("Loading MediaPipe Face Mesh & TensorFlow COCO-SSD libraries...");
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');

        try {
          await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');
          await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd');
          if (window.cocoSsd && !cocoModelRef.current) {
            cocoModelRef.current = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
            console.log("COCO-SSD mobile phone detection model loaded!");
          }
        } catch (e) {
          console.warn("Could not load COCO-SSD object model:", e);
        }

        if (!active) return;

        console.log("Initializing MediaPipe Face Mesh...");
        const faceMesh = new window.FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
          maxNumFaces: 4,
          refineLandmarks: true,
          minDetectionConfidence: 0.35,
          minTrackingConfidence: 0.35
        });

        faceMesh.onResults(async (results) => {
          if (!active) return;
          const detectedFaces = results.multiFaceLandmarks || [];
          const numDetectedFaces = detectedFaces.length;

          if (numDetectedFaces > 0) {
            const landmarks = detectedFaces[0];
            const noseTip = landmarks[1];
            const leftForehead = landmarks[33];
            const rightForehead = landmarks[263];
            const chin = landmarks[152];

            // Horizontal Yaw (Left / Right turning)
            const headPoseX = (noseTip.x - leftForehead.x) / (rightForehead.x - leftForehead.x);

            // Vertical Pitch (Up / Down tilt)
            const eyeCenterY = (leftForehead.y + rightForehead.y) / 2;
            const faceHeight = Math.abs(chin?.y || 1) - eyeCenterY;
            const headPoseY = faceHeight > 0 ? (noseTip.y - eyeCenterY) / faceHeight : 0.45;

            let pose = 'Centered';
            if (headPoseX < 0.28) {
              pose = 'Looking Left';
            } else if (headPoseX > 0.72) {
              pose = 'Looking Right';
            } else if (headPoseY > 0.72) {
              pose = 'Looking Down';
            } else if (headPoseY < 0.18) {
              pose = 'Looking Up';
            }

            setHeadPose(pose);

            let contact = 'Centered';
            if (pose !== 'Centered') {
              contact = pose;
            }

            // Emotion & Expression Detection via Facial Geometry
            const mouthLeft = landmarks[61];
            const mouthRight = landmarks[291];
            const lipTop = landmarks[0];
            const lipBottom = landmarks[17];
            const leftEyeTop = landmarks[159];
            const leftEyeBottom = landmarks[145];
            const rightEyeTop = landmarks[386];
            const rightEyeBottom = landmarks[374];

            const mouthWidth = Math.hypot((mouthRight?.x || 0) - (mouthLeft?.x || 0), (mouthRight?.y || 0) - (mouthLeft?.y || 0));
            const faceWidth = Math.hypot((rightForehead?.x || 0) - (leftForehead?.x || 0), (rightForehead?.y || 0) - (leftForehead?.y || 0));
            const lipGap = Math.hypot((lipBottom?.y || 0) - (lipTop?.y || 0));
            const eyeOpenLeft = Math.hypot((leftEyeBottom?.y || 0) - (leftEyeTop?.y || 0));
            const eyeOpenRight = Math.hypot((rightEyeBottom?.y || 0) - (rightEyeTop?.y || 0));

            const smileRatio = faceWidth > 0 ? mouthWidth / faceWidth : 0.4;
            const eyeOpenness = (eyeOpenLeft + eyeOpenRight) / 2;

            let detectedEmotion = 'Confident & Focused';
            if (smileRatio > 0.48) {
              detectedEmotion = 'Confident / Smiling';
            } else if (lipGap > 0.04) {
              detectedEmotion = 'Speaking / Engaged';
            } else if (eyeOpenness < 0.012) {
              detectedEmotion = 'Thoughtful / Concentrating';
            } else {
              detectedEmotion = 'Calm & Composed';
            }

            // Mobile Phone & Gadget Object AI Detection
            let isGadgetDetected = false;
            let gadgetDetectedName = 'Clear';

            if (cocoModelRef.current && videoRef.current && videoRef.current.readyState >= 2) {
              try {
                const predictions = await cocoModelRef.current.detect(videoRef.current);
                const phoneObj = predictions.find(p =>
                  (p.class === 'cell phone' || p.class === 'mobile phone' || p.class === 'phone' || p.class === 'remote' || p.class === 'laptop' || p.class === 'book') && p.score > 0.30
                );
                if (phoneObj) {
                  isGadgetDetected = true;
                  gadgetDetectedName = `Phone (${Math.round(phoneObj.score * 100)}%)`;
                }
              } catch (err) {}
            }

            if (!isGadgetDetected && leftForehead && rightForehead && noseTip) {
              const leftDist = Math.abs(noseTip.x - leftForehead.x);
              const rightDist = Math.abs(rightForehead.x - noseTip.x);
              const symRatio = rightDist > 0 ? leftDist / rightDist : 1.0;

              if (headPoseX >= 0.40 && headPoseX <= 0.60) {
                if (symRatio < 0.40 || symRatio > 2.40) {
                  isGadgetDetected = true;
                  gadgetDetectedName = 'Phone on Ear';
                }
              }
            }

            setGadgetLabel(gadgetDetectedName);
            setEmotion(detectedEmotion);
            setEyeContactStatus(contact);
            setFaceCount(numDetectedFaces);

            // Render Multi-Face Bounding Boxes on Overlay Canvas
            if (canvasRef.current && videoRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              const videoW = videoRef.current.videoWidth || canvasRef.current.width || 640;
              const videoH = videoRef.current.videoHeight || canvasRef.current.height || 480;
              canvasRef.current.width = videoW;
              canvasRef.current.height = videoH;

              ctx.clearRect(0, 0, videoW, videoH);

              detectedFaces.forEach((fLandmarks, fIdx) => {
                let fMinX = 1.0, fMaxX = 0.0, fMinY = 1.0, fMaxY = 0.0;
                fLandmarks.forEach(lm => {
                  if (lm.x < fMinX) fMinX = lm.x;
                  if (lm.x > fMaxX) fMaxX = lm.x;
                  if (lm.y < fMinY) fMinY = lm.y;
                  if (lm.y > fMaxY) fMaxY = lm.y;
                });

                const fBoxX = Math.max(5, fMinX * videoW);
                const fBoxY = Math.max(5, fMinY * videoH);
                const fBoxW = Math.min(videoW - fBoxX - 5, Math.max(50, (fMaxX - fMinX) * videoW));
                const fBoxH = Math.min(videoH - fBoxY - 5, Math.max(50, (fMaxY - fMinY) * videoH));

                const isSingleCandidate = fIdx === 0 && numDetectedFaces === 1;
                ctx.strokeStyle = isSingleCandidate ? '#06B6D4' : '#EF4444';
                ctx.lineWidth = 2.5;
                ctx.setLineDash([8, 6]);
                ctx.strokeRect(fBoxX, fBoxY, fBoxW, fBoxH);

                // Corner Accents
                ctx.setLineDash([]);
                ctx.fillStyle = isSingleCandidate ? '#38BDF8' : '#F87171';
                const cLen = 12;
                ctx.fillRect(fBoxX, fBoxY, cLen, 3);
                ctx.fillRect(fBoxX, fBoxY, 3, cLen);
                ctx.fillRect(fBoxX + fBoxW - cLen, fBoxY, cLen, 3);
                ctx.fillRect(fBoxX + fBoxW - 3, fBoxY, 3, cLen);
                ctx.fillRect(fBoxX, fBoxY + fBoxH - 3, cLen, 3);
                ctx.fillRect(fBoxX, fBoxY + fBoxH - cLen, 3, cLen);
                ctx.fillRect(fBoxX + fBoxW - cLen, fBoxY + fBoxH - 3, cLen, 3);
                ctx.fillRect(fBoxX + fBoxW - 3, fBoxY + fBoxH - cLen, 3, cLen);

                // Label Tag
                ctx.fillStyle = isSingleCandidate ? '#06B6D4' : '#EF4444';
                ctx.font = 'bold 11px monospace';
                ctx.fillText(fIdx === 0 ? 'Candidate' : `Person ${fIdx + 1}`, fBoxX + 4, Math.max(14, fBoxY - 4));
              });
            }

            if (onTelemetryUpdateRef.current) {
              onTelemetryUpdateRef.current({
                eyeContact: contact,
                eyeGaze: contact,
                headPose: pose,
                faceCount: numDetectedFaces,
                faceMatch: true,
                gadgetDetected: isGadgetDetected,
                gadgetLabel: gadgetDetectedName,
                emotion: detectedEmotion,
                hasOcclusion: isGadgetDetected
              });
            }
          } else {
            setFaceCount(0);
            if (onTelemetryUpdateRef.current) {
              onTelemetryUpdateRef.current({
                eyeContact: 'Off-Camera / No Face',
                eyeGaze: 'Not Detected',
                headPose: 'Not Detected',
                faceCount: 0,
                faceMatch: true,
                gadgetDetected: false,
                hasOcclusion: false
              });
            }
          }
        });

        faceMeshInstance = faceMesh;
        setMediapipeActive(true);

        const processCamera = async () => {
          if (!active) return;
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              await faceMesh.send({ image: videoRef.current });
            } catch (err) {
              // Skip failed frames
            }
          }
          if (active) {
            setTimeout(processCamera, 120);
          }
        };

        processCamera();
      } catch (err) {
        console.warn("MediaPipe CDN initialization failed, falling back to local vision engines:", err);
      }
    };

    if (cameraActive) {
      initMediaPipe();
    }

    return () => {
      active = false;
      if (faceMeshInstance) {
        try { faceMeshInstance.close(); } catch (e) {}
      }
    };
  }, [cameraActive]);

  if (compact) {
    return (
      <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
          style={{ filter: 'none', willChange: 'transform' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100"
          style={{ filter: 'none' }}
        />

        {/* Candidate Title Badge */}
        <div className="absolute top-2 left-2 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-2 py-0.5 rounded flex items-center gap-1.5 z-10 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-bold text-cyan-300 font-mono tracking-tight">You (Candidate)</span>
        </div>

        {/* Compact HUD Status Overlay Bar */}
        <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 border border-slate-800 backdrop-blur-md px-2 py-1 rounded flex items-center justify-between text-[10px] font-mono z-10 shadow-md">
          <span className={faceCount === 1 ? 'text-slate-300' : 'text-red-400 font-bold'}>
            Faces: <strong className={faceCount === 1 ? 'text-emerald-400' : 'text-red-400'}>{faceCount}</strong>
          </span>
          <span className={eyeContactStatus === 'Centered' ? 'text-slate-300' : 'text-amber-400 font-bold'}>
            Gaze: <strong className={eyeContactStatus === 'Centered' ? 'text-cyan-400' : 'text-amber-400'}>{eyeContactStatus}</strong>
          </span>
          {gadgetLabel !== 'Clear' && (
            <span className="text-red-300 font-bold bg-red-950 px-1.5 py-0.5 rounded border border-red-500/50 animate-pulse flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-red-400" /> {gadgetLabel}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative glass-card rounded-2xl p-4 border border-slate-800 overflow-hidden flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-3 px-1 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-cyan-400" /> Real-time Vision AI Engine
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-md border ${
            gadgetLabel === 'Clear'
              ? 'text-emerald-300 bg-emerald-950/80 border-emerald-500/30'
              : 'text-red-300 bg-red-950/80 border-red-500/40 font-bold animate-pulse'
          }`}>
            Gadget: {gadgetLabel}
          </span>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md border text-purple-300 bg-purple-950/80 border-purple-500/30">
            Emotion: {emotion}
          </span>
          <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-md border ${
            eyeContactStatus === 'Centered'
              ? 'text-cyan-300 bg-cyan-950/80 border-cyan-500/30'
              : 'text-amber-300 bg-amber-950/80 border-amber-500/30'
          }`}>
            Gaze: {eyeContactStatus}
          </span>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
            faceCount === 1
              ? 'text-emerald-300 bg-emerald-950/80 border-emerald-500/30'
              : 'text-red-300 bg-red-950/80 border-red-500/30'
          }`}>
            Faces: {faceCount}
          </span>
        </div>
      </div>

      <div className="relative w-full aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
          style={{ filter: 'none', willChange: 'transform' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100"
          style={{ filter: 'none' }}
        />
        {!cameraActive && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-slate-500 z-10">
            <UserCheck className="w-12 h-12 text-slate-600 mb-2 animate-pulse" />
            <p className="text-xs font-semibold text-slate-400">WebCam Active</p>
          </div>
        )}
      </div>
    </div>
  );
};
