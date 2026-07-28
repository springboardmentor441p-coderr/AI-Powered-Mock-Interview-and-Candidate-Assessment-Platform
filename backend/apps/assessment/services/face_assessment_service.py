"""
FaceAssessmentService — stores and aggregates browser-sent face snapshots.

Responsibilities:
  1. Persist each inbound snapshot (create_snapshot).
  2. Aggregate all snapshots for a session into a summary dict (aggregate).
  3. Apply the aggregate to a SpeechAnalysis row (apply_to_analysis) — called
     by SpeechAnalysisService when video_path is empty but face snapshots exist.

This keeps the SpeechAnalysisService free of face-specific logic and honours
the Single Responsibility Principle: one class, one concern.
"""
import logging
from collections import Counter

from django.db import transaction
from django.db.models import Avg, Count

from apps.assessment.models.face_assessment_snapshot import FaceAssessmentSnapshot
from core.services import BaseService

logger = logging.getLogger(__name__)


class FaceAssessmentService(BaseService):

    # --------------------------------------------------------------------- #
    # Write path                                                              #
    # --------------------------------------------------------------------- #

    @transaction.atomic
    def create_snapshot(self, *, session, validated_data: dict) -> FaceAssessmentSnapshot:
        """
        Upsert a snapshot row keyed on (session, sequence).  Using
        update_or_create means duplicate POSTs from the client are idempotent.
        """
        snapshot, created = FaceAssessmentSnapshot.objects.update_or_create(
            session=session,
            sequence=validated_data["sequence"],
            defaults={
                "face_detected": validated_data["face_detected"],
                "multiple_faces_detected": validated_data.get("multiple_faces_detected", False),
                "gaze_on_screen": validated_data["gaze_on_screen"],
                "eye_contact_score": validated_data["eye_contact_score"],
                "attention_score": validated_data["attention_score"],
                "engagement_score": validated_data["engagement_score"],
                "dominant_emotion": validated_data.get("dominant_emotion", "neutral"),
                "emotion_breakdown": validated_data.get("emotion_breakdown", {}),
                "emotion_confidence": validated_data.get("emotion_confidence", 0.0),
                "yaw": validated_data.get("yaw", 0.0),
                "pitch": validated_data.get("pitch", 0.0),
                "roll": validated_data.get("roll", 0.0),
            },
        )
        return snapshot

    # --------------------------------------------------------------------- #
    # Read / aggregation path                                                 #
    # --------------------------------------------------------------------- #

    def aggregate(self, *, session) -> dict | None:
        """
        Returns a dict of aggregated face metrics for the given session, or
        None if no snapshots exist yet.
        """
        qs = FaceAssessmentSnapshot.objects.filter(session=session)
        from django.db.models import Q
        agg = qs.aggregate(
            count=Count("id"),
            avg_eye=Avg("eye_contact_score"),
            avg_att=Avg("attention_score"),
            avg_eng=Avg("engagement_score"),
            avg_conf=Avg("emotion_confidence"),
            detected_count=Count("id", filter=Q(face_detected=True)),
            multi_face_count=Count("id", filter=Q(multiple_faces_detected=True)),
        )

        if not agg["count"]:
            return None

        # Dominant emotion by majority vote across snapshots
        emotions = list(qs.values_list("dominant_emotion", flat=True))
        dominant = Counter(emotions).most_common(1)[0][0] if emotions else "neutral"

        # Average the emotion_breakdown dicts
        breakdown_totals: dict[str, float] = {}
        valid_breakdown = 0
        for snap in qs.only("emotion_breakdown"):
            if snap.emotion_breakdown:
                valid_breakdown += 1
                for k, v in snap.emotion_breakdown.items():
                    breakdown_totals[k] = breakdown_totals.get(k, 0.0) + v
        avg_breakdown = (
            {k: round(v / valid_breakdown, 4) for k, v in breakdown_totals.items()}
            if valid_breakdown
            else {}
        )

        face_detected_pct = round(
            (agg["detected_count"] / agg["count"]) * 100, 2
        )

        return {
            "snapshot_count": agg["count"],
            "avg_eye_contact_score": round(agg["avg_eye"] or 0.0, 2),
            "avg_attention_score": round(agg["avg_att"] or 0.0, 2),
            "avg_engagement_score": round(agg["avg_eng"] or 0.0, 2),
            "avg_emotion_confidence": round(agg["avg_conf"] or 0.0, 2),
            "face_detected_pct": face_detected_pct,
            "dominant_emotion": dominant,
            "emotion_breakdown": avg_breakdown,
            "multiple_faces_count": agg["multi_face_count"],
            "multiple_faces_pct": round((agg["multi_face_count"] / agg["count"]) * 100, 2),
        }

    def apply_to_analysis(self, *, session, analysis) -> bool:
        """
        Writes aggregated face metrics from browser snapshots into a
        SpeechAnalysis row.  Returns True if data was available, False if no
        snapshots existed (so the caller knows whether to skip).

        Called by SpeechAnalysisService._run_face_from_snapshots when no
        server-side video file exists.
        """
        data = self.aggregate(session=session)
        if not data:
            logger.info("No face snapshots for session %s — skipping face fields.", session.id)
            return False

        analysis.eye_contact_percentage = data["avg_eye_contact_score"]
        analysis.attention_score = data["avg_attention_score"]
        analysis.engagement_score = data["avg_engagement_score"]
        analysis.confidence_score = data["avg_emotion_confidence"]
        analysis.dominant_emotion = data["dominant_emotion"]
        analysis.emotion_breakdown = data["emotion_breakdown"]
        logger.info(
            "Applied face snapshot aggregate to analysis for session %s (%d snapshots).",
            session.id,
            data["snapshot_count"],
        )
        return True