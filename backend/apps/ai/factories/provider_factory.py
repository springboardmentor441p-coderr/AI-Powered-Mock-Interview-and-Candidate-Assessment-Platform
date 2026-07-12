"""
Provider factory: the only place that maps a configured provider name
(`settings.AI_SERVICE_PROVIDER`) to a concrete adapter class for each
AI capability. `core.container` calls into this factory rather than
importing adapters directly, so adding a third provider (e.g. Gemini
for question generation) means editing one branch here - no other
file changes.
"""
from apps.ai.providers.emotion.interfaces import IEmotionDetectionProvider
from apps.ai.providers.eye_tracking.interfaces import IEyeContactTrackingProvider
from apps.ai.providers.llm.interfaces import (
    IFeedbackGenerationProvider,
    IQuestionGenerationProvider,
    IResumeExtractionProvider,
    ISeedTopicGenerationProvider,
)
from apps.ai.providers.realtime_voice.interfaces import IRealtimeVoiceProvider
from apps.ai.providers.speech.interfaces import ICommunicationAnalysisProvider, ISpeechToTextProvider


class AIProviderFactory:
    """
    Resolves the active `AI_SERVICE_PROVIDER` setting to concrete adapters.

    `realtime_voice_provider` is intentionally a *separate* knob from
    `provider`: the realtime voice vendor (Ultravox, ...) and the text/LLM
    vendor (OpenAI, Gemini, ...) are orthogonal concerns that happen to both
    live behind this one factory. Coupling them to a single setting would
    make it impossible to run e.g. Gemini for seed-topic/resume extraction
    while using real Ultravox for the live call (or vice versa). Defaults
    to `provider` only for backwards compatibility with deployments that
    haven't set REALTIME_VOICE_PROVIDER explicitly.
    """

    def __init__(self, provider: str = "mock", realtime_voice_provider: str | None = None):
        self.provider = provider
        self.realtime_voice_provider = realtime_voice_provider if realtime_voice_provider is not None else provider

    def speech_to_text(self) -> ISpeechToTextProvider:
        if self.provider == "openai":
            from apps.ai.providers.speech.whisper_provider import WhisperSpeechToTextProvider

            return WhisperSpeechToTextProvider()
        from apps.ai.providers.speech.mock_provider import MockSpeechToTextProvider

        return MockSpeechToTextProvider()

    def communication_analysis(self) -> ICommunicationAnalysisProvider:
        # Rule-based; identical regardless of provider setting today, but
        # kept behind the factory so a future LLM-graded variant can be
        # swapped in for `openai` without touching callers.
        from apps.ai.providers.speech.mock_provider import MockCommunicationAnalysisProvider

        return MockCommunicationAnalysisProvider()

    def emotion_detection(self) -> IEmotionDetectionProvider:
        if self.provider != "mock":
            from apps.ai.providers.emotion.deepface_provider import DeepFaceEmotionDetectionProvider

            return DeepFaceEmotionDetectionProvider()
        from apps.ai.providers.emotion.mock_provider import MockEmotionDetectionProvider

        return MockEmotionDetectionProvider()

    def eye_contact_tracking(self) -> IEyeContactTrackingProvider:
        if self.provider != "mock":
            from apps.ai.providers.eye_tracking.mediapipe_provider import MediaPipeEyeContactProvider

            return MediaPipeEyeContactProvider()
        from apps.ai.providers.eye_tracking.mock_provider import MockEyeContactTrackingProvider

        return MockEyeContactTrackingProvider()

    def question_generation(self) -> IQuestionGenerationProvider:
        if self.provider == "openai":
            from apps.ai.providers.llm.openai_question_generator import OpenAIQuestionGenerationProvider

            return OpenAIQuestionGenerationProvider()
        from apps.ai.providers.llm.mock_question_generator import MockQuestionGenerator

        return MockQuestionGenerator()

    def seed_topic_generation(self) -> ISeedTopicGenerationProvider:
        """
        Returns a resume-aware seed topic provider.
        Gemini is the production provider; mock is used for dev/test.
        Both OpenAI and Gemini provider settings activate the Gemini seed topic provider
        since Gemini is specifically tuned for structured JSON with response_schema.
        """
        if self.provider in ("gemini", "openai", "ultravox"):
            from apps.ai.providers.llm.gemini_seed_topic_provider import GeminiSeedTopicProvider

            return GeminiSeedTopicProvider()
        from apps.ai.providers.llm.mock_seed_topic_provider import MockSeedTopicProvider

        return MockSeedTopicProvider()

    def feedback_generation(self) -> IFeedbackGenerationProvider:
        if self.provider == "openai":
            from apps.ai.providers.llm.openai_feedback_generator import OpenAIFeedbackGenerationProvider

            return OpenAIFeedbackGenerationProvider()
        from apps.ai.providers.llm.mock_feedback_generator import MockFeedbackGenerator

        return MockFeedbackGenerator()

    def resume_extraction(self) -> IResumeExtractionProvider:
        if self.provider == "openai":
            from apps.resume.providers.openai_extractor import OpenAIResumeExtractionProvider

            return OpenAIResumeExtractionProvider()
        if self.provider == "gemini":
            from apps.resume.providers.gemini_extractor import GeminiResumeExtractor

            return GeminiResumeExtractor()
        from apps.resume.providers.mock_extractor import MockResumeExtractor

        return MockResumeExtractor()

    def realtime_voice(self) -> IRealtimeVoiceProvider:
        if self.realtime_voice_provider == "ultravox":
            from apps.ai.providers.realtime_voice.ultravox_provider import UltravoxRealtimeVoiceProvider

            return UltravoxRealtimeVoiceProvider()
        from apps.ai.providers.realtime_voice.mock_provider import MockRealtimeVoiceProvider

        return MockRealtimeVoiceProvider()