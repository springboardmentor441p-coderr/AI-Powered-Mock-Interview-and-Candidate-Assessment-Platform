import { post, get } from "@/api/client";

// ── Types ──────────────────────────────────────────────────────────────────

export interface FaceSnapshotPayload {
  /** Monotonically increasing counter per session, assigned by the hook. */
  sequence: number;
  face_detected: boolean;
  multiple_faces_detected: boolean;
  gaze_on_screen: boolean;

  /** All scores 0–100. */
  eye_contact_score: number;
  attention_score: number;
  engagement_score: number;

  /** Emotion */
  dominant_emotion: string;
  /** Keys are emotion names, values are 0–1 probabilities summing to ~1. */
  emotion_breakdown: Record<string, number>;
  /** 0–100 confidence in the emotion classification. */
  emotion_confidence: number;

  /** Head pose angles in degrees. */
  yaw: number;
  pitch: number;
  roll: number;
}

export interface FaceSnapshotAck {
  id: string;
  sequence: number;
}

export interface FaceAssessmentSummary {
  snapshot_count: number;
  avg_eye_contact_score: number | null;
  avg_attention_score: number | null;
  avg_engagement_score: number | null;
  face_detected_pct: number | null;
  dominant_emotion: string;
  emotion_breakdown: Record<string, number> | null;
}

// ── API helpers ────────────────────────────────────────────────────────────

export const faceAssessmentApi = {
  /**
   * POST a single periodic snapshot.
   * Fire-and-forget in hot path — failures are logged, not thrown.
   */
  async ingestSnapshot(
    sessionId: string,
    payload: FaceSnapshotPayload,
  ): Promise<FaceSnapshotAck> {
    return post<FaceSnapshotAck>(
      `/assessments/sessions/${sessionId}/face-snapshots/`,
      payload,
    );
  },

  /** GET aggregated face summary for a completed (or in-progress) session. */
  async summary(sessionId: string): Promise<FaceAssessmentSummary> {
    return get<FaceAssessmentSummary>(
      `/assessments/sessions/${sessionId}/face-snapshots/summary/`,
    );
  },
};