from django.db import transaction

from apps.ai.providers.emotion.interfaces import IEmotionDetectionProvider
from apps.ai.providers.eye_tracking.interfaces import IEyeContactTrackingProvider
from apps.ai.providers.speech.interfaces import (
    ICommunicationAnalysisProvider,
    ISpeechToTextProvider,
    TranscriptionResult,
)
from core.exceptions import NotFoundError
from core.services import BaseService

from apps.assessment.models import SpeechAnalysis


class SpeechAnalysisService(BaseService):
    """
    Orchestrates: transcript -> communication analysis -> emotion
    detection -> eye-contact tracking. All four collaborators are
    injected, keeping this class oblivious to which concrete provider
    is in use.

    Scripted sessions get their transcript from `stt.transcribe()`
    against the uploaded `session.audio_recording`. Realtime (Ultravox)
    sessions never upload an audio file - the call happens directly
    between the candidate's browser and the voice provider - so their
    transcript is assembled from the `ConversationTurn` rows recorded
    during the call instead. Either way `communication` gets a plain
    transcript + duration and doesn't need to know the difference.
    """

    def __init__(
        self,
        stt: ISpeechToTextProvider,
        communication: ICommunicationAnalysisProvider,
        emotion: IEmotionDetectionProvider,
        eye_contact: IEyeContactTrackingProvider,
    ):
        super().__init__()
        self._stt = stt
        self._communication = communication
        self._emotion = emotion
        self._eye_contact = eye_contact

    @transaction.atomic
    def run(self, *, session) -> SpeechAnalysis:
        analysis, _ = SpeechAnalysis.objects.get_or_create(session=session)
        analysis.status = SpeechAnalysis.Status.RUNNING
        analysis.save(update_fields=["status"])

        try:
            transcription = self._transcribe(session)
            communication = self._communication.analyze(transcription.text, transcription.duration_seconds)

            analysis.transcript = transcription.text
            analysis.transcription_confidence = transcription.confidence
            analysis.grammar_score = communication.grammar_score
            analysis.filler_word_count = communication.filler_word_count
            analysis.filler_words = communication.filler_words
            analysis.speaking_pace_wpm = communication.pace_wpm
            analysis.clarity_score = communication.clarity_score
            analysis.completeness_score = communication.completeness_score

            video_path = session.video_recording.path if session.video_recording else ""
            if video_path:
                emotion = self._emotion.analyze(video_path)
                eye = self._eye_contact.analyze(video_path)
                analysis.dominant_emotion = emotion.dominant_emotion
                analysis.emotion_breakdown = emotion.emotion_breakdown
                analysis.confidence_score = emotion.confidence_score
                analysis.eye_contact_percentage = eye.eye_contact_percentage
                analysis.attention_score = eye.attention_score
                analysis.engagement_score = eye.engagement_score
            else:
                # No video was ever captured for this session (true for
                # every realtime/voice-only call, and for a scripted
                # session the candidate simply didn't upload video for).
                # Leave the video-derived fields null rather than
                # scoring a face that was never recorded - ConfidenceStrategy
                # already treats these as 0 via `or 0`.
                analysis.dominant_emotion = ""
                analysis.emotion_breakdown = {}
                analysis.confidence_score = None
                analysis.eye_contact_percentage = None
                analysis.attention_score = None
                analysis.engagement_score = None

            analysis.status = SpeechAnalysis.Status.COMPLETED
            analysis.save()
            self.logger.info("Speech analysis completed for session %s", session.id)
        except Exception as exc:  # noqa: BLE001
            analysis.status = SpeechAnalysis.Status.FAILED
            analysis.failure_reason = str(exc)
            analysis.save(update_fields=["status", "failure_reason"])
            self.logger.exception("Speech analysis failed for session %s", session.id)
            raise

        return analysis

    def _transcribe(self, session) -> TranscriptionResult:
        from apps.interview.models import InterviewSession

        if session.mode == InterviewSession.Mode.REALTIME:
            return self._transcript_from_conversation_turns(session)

        audio_path = session.audio_recording.path if session.audio_recording else ""
        return self._stt.transcribe(audio_path)

    @staticmethod
    def _transcript_from_conversation_turns(session) -> TranscriptionResult:
        """
        Builds a transcript from the candidate's `Transcript` rows.
        ConversationTurn only stores AI turns (created by ask_next_question);
        candidate answers are stored in the Transcript model by the
        frontend relay webhook.
        """
        from apps.interview.models.transcript import Transcript

        turns = list(
            Transcript.objects
            .filter(interview=session, speaker="candidate")
            .order_by("sequence_number")
        )

        candidate_text = " ".join(
            t.text for t in turns if t.text
        ).strip()

        duration_seconds = float(session.duration_seconds or 0)

        return TranscriptionResult(
            text=candidate_text,
            confidence=1.0,
            duration_seconds=duration_seconds,
            word_timestamps=[],
        )