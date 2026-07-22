import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export function useEmotionTracker(videoRef) {
  const [emotionScores, setEmotionScores] = useState({});
  const trackingData = useRef({
    emotionsCount: {},
    totalFrames: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadModels() {
      // Models should be served from the public/models directory
      // Download weights from face-api.js repo and place them in /public/models
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models')
        ]);
        setIsLoaded(true);
      } catch (err) {
        console.warn('Failed to load face-api models. Ensure models exist in /public/models.', err);
      }
    }
    loadModels();
  }, []);

  useEffect(() => {
    if (!videoRef.current || !isLoaded) return;

    let intervalId;
    const processFrame = async () => {
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        const detections = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions();

        if (detections) {
          trackingData.current.totalFrames++;
          const expressions = detections.expressions;
          
          // Determine the dominant emotion in this frame
          let dominantEmotion = '';
          let maxScore = 0;
          for (const [emotion, score] of Object.entries(expressions)) {
            if (score > maxScore) {
              maxScore = score;
              dominantEmotion = emotion;
            }
          }

          if (dominantEmotion) {
            trackingData.current.emotionsCount[dominantEmotion] = 
              (trackingData.current.emotionsCount[dominantEmotion] || 0) + 1;
          }
        }
      }
    };

    videoRef.current.addEventListener('loadeddata', () => {
      // Sample emotion every 1 second instead of every frame to save CPU
      intervalId = setInterval(processFrame, 1000);
    });

    return () => clearInterval(intervalId);
  }, [videoRef, isLoaded]);

  const getMetricsAndReset = () => {
    const { emotionsCount, totalFrames } = trackingData.current;
    
    // Normalize counts to percentages
    const scores = {};
    if (totalFrames > 0) {
      for (const [emotion, count] of Object.entries(emotionsCount)) {
        scores[emotion] = Math.round((count / totalFrames) * 100);
      }
    }

    setEmotionScores(scores);
    
    // Reset for next question
    trackingData.current = { emotionsCount: {}, totalFrames: 0 };
    
    return scores;
  };

  return { getMetricsAndReset, emotionScores, isLoaded };
}
