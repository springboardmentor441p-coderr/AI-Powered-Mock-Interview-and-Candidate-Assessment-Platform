"""
Speech analysis service using SpeechRecognition and LanguageTool.
"""
import os
import re
from typing import Optional

import speech_recognition as sr
from flask import current_app
from language_tool_python import LanguageTool

from app.extensions import db
from app.models import SpeechAnalysis
from app.utils.constants import FILLER_WORDS


class SpeechAnalysisService:
    """Analyze speech from audio recordings."""

    _language_tool = None

    @staticmethod
    def transcribe_audio(audio_path: str) -> str:
        """
        Convert speech audio to text.

        Args:
            audio_path: Path to audio file.

        Returns:
            Transcribed text.
        """
        recognizer = sr.Recognizer()
        full_path = os.path.join(current_app.config["UPLOAD_FOLDER"], audio_path)

        if not os.path.exists(full_path):
            return ""

        try:
            with sr.AudioFile(full_path) as source:
                audio_data = recognizer.record(source)
                text = recognizer.recognize_google(audio_data)
                return text
        except sr.UnknownValueError:
            return ""
        except sr.RequestError as exc:
            current_app.logger.error(f"Speech recognition error: {exc}")
            return ""
        except Exception as exc:
            current_app.logger.warning(f"Audio transcription fallback: {exc}")
            try:
                with open(full_path, "rb") as audio_file:
                    with sr.AudioFile(audio_file) as source:
                        audio_data = recognizer.record(source)
                        return recognizer.recognize_sphinx(audio_data)
            except Exception:
                return ""

    @staticmethod
    def count_filler_words(text: str) -> tuple[int, list[str]]:
        """
        Count filler words in transcript.

        Args:
            text: Transcript text.

        Returns:
            Tuple of (count, found filler words).
        """
        text_lower = text.lower()
        found: list[str] = []
        for filler in FILLER_WORDS:
            pattern = r"\b" + re.escape(filler) + r"\b"
            matches = re.findall(pattern, text_lower)
            if matches:
                found.extend([filler] * len(matches))
        return len(found), found

    @staticmethod
    def calculate_speaking_pace(text: str, duration_seconds: int) -> float:
        """
        Calculate words per minute.

        Args:
            text: Transcript text.
            duration_seconds: Recording duration.

        Returns:
            Words per minute.
        """
        word_count = len(text.split())
        if duration_seconds <= 0:
            return float(word_count * 60)
        minutes = duration_seconds / 60.0
        return round(word_count / minutes, 1) if minutes > 0 else 0.0

    @staticmethod
    def check_grammar(text: str, fast: bool = False) -> tuple[float, int]:
        """
        Check grammar and return score.

        Args:
            text: Text to analyze.
            fast: When True, use a lightweight heuristic (for live interview turns).

        Returns:
            Tuple of (grammar_score, error_count).
        """
        if not text.strip():
            return 0.0, 0

        if fast:
            return SpeechAnalysisService._fast_grammar_score(text)

        try:
            tool = SpeechAnalysisService._get_language_tool()
            matches = tool.check(text)
            error_count = len(matches)
            word_count = max(len(text.split()), 1)
            error_rate = error_count / word_count
            score = max(0, min(100, 100 - (error_rate * 200)))
            return round(score, 1), error_count
        except Exception as exc:
            current_app.logger.warning(f"Grammar check fallback: {exc}")
            return SpeechAnalysisService._fast_grammar_score(text)

    @staticmethod
    def _fast_grammar_score(text: str) -> tuple[float, int]:
        """
        Estimate grammar quality without starting LanguageTool.

        Args:
            text: Text to analyze.

        Returns:
            Tuple of (grammar_score, estimated_error_count).
        """
        words = text.split()
        word_count = max(len(words), 1)
        issues = 0
        if text and text[0].islower():
            issues += 1
        if not re.search(r"[.!?]$", text.strip()):
            issues += 1
        repeated = re.findall(r"\b(\w+)\s+\1\b", text.lower())
        issues += len(repeated)
        error_rate = issues / word_count
        score = max(55.0, min(95.0, 100 - (error_rate * 180)))
        return round(score, 1), issues

    @staticmethod
    def _get_language_tool():
        """
        Reuse a single LanguageTool instance (startup is expensive).

        Returns:
            Shared LanguageTool instance.
        """
        if SpeechAnalysisService._language_tool is None:
            SpeechAnalysisService._language_tool = LanguageTool("en-US")
        return SpeechAnalysisService._language_tool

    @staticmethod
    def calculate_communication_score(
        grammar_score: float,
        pace: float,
        filler_count: int,
        word_count: int,
    ) -> float:
        """
        Calculate overall communication score.

        Args:
            grammar_score: Grammar quality score.
            pace: Words per minute.
            filler_count: Number of filler words.
            word_count: Total words spoken.

        Returns:
            Communication score 0-100.
        """
        pace_score = 100.0
        if pace < 100:
            pace_score = 60 + (pace / 100) * 30
        elif pace > 180:
            pace_score = max(50, 100 - (pace - 180))

        filler_penalty = min(30, filler_count * 3)
        filler_score = max(0, 100 - filler_penalty)

        length_bonus = min(10, word_count / 5) if word_count > 10 else 0

        score = (
            grammar_score * 0.4
            + pace_score * 0.3
            + filler_score * 0.2
            + length_bonus
        )
        return round(min(100, score), 1)

    @staticmethod
    def calculate_pronunciation_score(text: str, word_count: int) -> float:
        """
        Estimate pronunciation score from transcript quality.

        Args:
            text: Transcript text.
            word_count: Word count.

        Returns:
            Pronunciation score 0-100.
        """
        if word_count == 0:
            return 0.0
        avg_word_len = sum(len(w) for w in text.split()) / word_count
        base = 70.0
        if 4 <= avg_word_len <= 8:
            base += 15
        if word_count >= 20:
            base += 10
        return round(min(100, base), 1)

    @staticmethod
    def analyze_answer(
        answer_id: int,
        audio_path: Optional[str],
        answer_text: str = "",
        duration_seconds: int = 60,
        fast: bool = False,
    ) -> SpeechAnalysis:
        """
        Perform full speech analysis on an answer.

        Args:
            answer_id: Answer record ID.
            audio_path: Path to audio recording.
            answer_text: Pre-provided text (optional).
            duration_seconds: Recording duration.
            fast: Skip slow LanguageTool / transcription when text already exists.

        Returns:
            SpeechAnalysis record.
        """
        transcript = answer_text
        if audio_path and not transcript and not fast:
            transcript = SpeechAnalysisService.transcribe_audio(audio_path)

        word_count = len(transcript.split())
        filler_count, filler_words = SpeechAnalysisService.count_filler_words(transcript)
        pace = SpeechAnalysisService.calculate_speaking_pace(transcript, duration_seconds)
        grammar_score, _ = SpeechAnalysisService.check_grammar(transcript, fast=fast)
        comm_score = SpeechAnalysisService.calculate_communication_score(
            grammar_score, pace, filler_count, word_count
        )
        pron_score = SpeechAnalysisService.calculate_pronunciation_score(
            transcript, word_count
        )

        existing = SpeechAnalysis.query.filter_by(answer_id=answer_id).first()
        if existing:
            analysis = existing
        else:
            analysis = SpeechAnalysis(answer_id=answer_id)
            db.session.add(analysis)

        analysis.transcript = transcript
        analysis.grammar_score = grammar_score
        analysis.speaking_pace = pace
        analysis.filler_word_count = filler_count
        analysis.filler_words = ", ".join(set(filler_words))
        analysis.communication_score = comm_score
        analysis.pronunciation_score = pron_score
        analysis.word_count = word_count

        db.session.commit()
        return analysis
