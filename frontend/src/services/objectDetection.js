import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

let model = null;

// Objects that should trigger a violation if detected
const FLAGGED_OBJECTS = ['cell phone', 'laptop', 'tv', 'remote', 'tablet'];

/**
 * Load the COCO-SSD object detection model. Call once before use.
 */
export async function initObjectDetection() {
  await tf.ready();
  model = await cocoSsd.load();
  return model;
}

/**
 * Run object detection on a single video frame.
 * Returns an array of flagged objects found (empty array if none).
 * Each item: { class: 'cell phone', score: 0.87 }
 */
export async function detectObjects(videoElement) {
  if (!model || !videoElement) return [];

  const predictions = await model.detect(videoElement);

  const flagged = predictions.filter(
    (p) => FLAGGED_OBJECTS.includes(p.class.toLowerCase()) && p.score > 0.6
  );

  return flagged.map((p) => ({ class: p.class, score: p.score }));
}

export function closeObjectDetection() {
  model = null;
}