"""Speech AI port: speech-to-text + communication analysis contracts."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class TranscriptionResult:
    text: str
    confidence: float
    duration_seconds: float
    word_timestamps: list[dict] = field(default_factory=list)


@dataclass
class CommunicationAnalysis:
    grammar_score: float
    filler_word_count: int
    filler_words: list[str]
    pace_wpm: float
    clarity_score: float
    completeness_score: float


class ISpeechToTextProvider(ABC):
    @abstractmethod
    def transcribe(self, audio_file_path: str) -> TranscriptionResult:
        ...


class ICommunicationAnalysisProvider(ABC):
    @abstractmethod
    def analyze(self, transcript: str, duration_seconds: float) -> CommunicationAnalysis:
        ...
