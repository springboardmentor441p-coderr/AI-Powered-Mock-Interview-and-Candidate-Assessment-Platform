import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

let model = null;
let isLoading = false;

const FLAGGED_OBJECTS = ['cell phone', 'laptop', 'tv', 'remote', 'tablet'];

export async function initObjectDetection() {
  if (model) return model;
  if (isLoading) return null;

  isLoading = true;
  try {
    await tf.setBackend('cpu');
    await tf.ready();
    model = await cocoSsd.load();
  } catch (err) {
    console.error('Object detection failed to load:', err);
  } finally {
    isLoading = false;
  }
  return model;
}

export async function detectObjects(videoElement) {
  if (!model || !videoElement) return [];

  try {
    const predictions = await model.detect(videoElement);
    const flagged = predictions.filter(
      (p) => FLAGGED_OBJECTS.includes(p.class.toLowerCase()) && p.score > 0.6
    );
    return flagged.map((p) => ({ class: p.class, score: p.score }));
  } catch (err) {
    console.error('Object detection error:', err);
    return [];
  }
}

export function closeObjectDetection() {
  model = null;
}