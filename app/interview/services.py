"""
Interview session management service.
"""
from datetime import datetime
from typing import Optional

from flask import current_app

from app.ai.emotion_service import EmotionDetectionService
from app.ai.gemini_service import GeminiService
from app.ai.speech_service import SpeechAnalysisService
from app.extensions import db
from app.models import Answer, Interview, Question, Score
from app.resume.services import ResumeParserService
from app.utils.constants import (
    DEFAULT_QUESTION_COUNT,
    DOMAIN_TECHNICAL_QUESTIONS,
    INTERVIEW_CANCELLED,
    INTERVIEW_COMPLETED,
    INTERVIEW_IN_PROGRESS,
    INTERVIEW_SCHEDULED,
    MODERATION_CANCELLATION_MESSAGE,
    SESSION_DURATION_MULTIPLIER,
)
from app.utils.content_moderation import ContentModerationService
from app.utils.helpers import calculate_overall_score, save_upload_file


class InterviewService:
    """Manage interview lifecycle and evaluation."""

    @staticmethod
    def build_resume_context(resume) -> str:
        """
        Build a rich resume context string for the AI interviewer.

        Args:
            resume: Resume model instance.

        Returns:
            Formatted resume context for AI prompts.
        """
        if not resume:
            return ""

        parts: list[str] = []
        if resume.name:
            parts.append(f"Candidate Name: {resume.name}")
        if resume.summary:
            parts.append(f"Summary: {resume.summary}")
        skills = [skill.name for skill in resume.skills.all()]
        if skills:
            parts.append(f"Skills: {', '.join(skills[:25])}")
        if resume.experience:
            parts.append(f"Experience: {resume.experience[:1000]}")
        if resume.projects:
            parts.append(f"Projects: {resume.projects[:800]}")
        if resume.education:
            parts.append(f"Education: {resume.education[:500]}")
        if resume.certifications:
            parts.append(f"Certifications: {resume.certifications[:400]}")
        if resume.missing_skills:
            parts.append(f"Skill Gaps: {resume.missing_skills}")

        return "\n".join(parts)

    @staticmethod
    def resolve_resume_for_interview(
        candidate_id: int,
        resume_id: Optional[int] = None,
    ):
        """
        Resolve the resume linked to an interview.

        Args:
            candidate_id: Candidate user ID.
            resume_id: Explicitly selected resume ID.

        Returns:
            Resume instance or None.
        """
        from app.models import Resume

        if resume_id:
            resume = Resume.query.get(resume_id)
            if resume and resume.user_id == candidate_id:
                return resume
            return None

        return ResumeParserService.get_primary_resume(candidate_id)

    @staticmethod
    def create_interview(
        candidate_id: int,
        title: str,
        domain: str,
        category: str,
        difficulty: str,
        question_count: int = DEFAULT_QUESTION_COUNT,
        resume_id: Optional[int] = None,
    ) -> Interview:
        """
        Create interview with AI-generated questions.

        Args:
            candidate_id: Candidate user ID.
            title: Interview title.
            domain: Technical domain.
            category: Question category.
            difficulty: Difficulty level.
            question_count: Number of questions.
            resume_id: Optional linked resume.

        Returns:
            Created Interview instance.
        """
        resume = InterviewService.resolve_resume_for_interview(candidate_id, resume_id)
        resume_context = InterviewService.build_resume_context(resume)
        candidate_name = resume.name if resume and resume.name else ""

        interview = Interview(
            candidate_id=candidate_id,
            resume_id=resume.id if resume else None,
            title=title,
            domain=domain,
            category=category,
            difficulty=difficulty,
            status=INTERVIEW_SCHEDULED,
            duration_minutes=question_count * SESSION_DURATION_MULTIPLIER,
        )
        db.session.add(interview)
        db.session.flush()

        opening_data = GeminiService.generate_opening_message(
            domain=domain,
            category=category,
            difficulty=difficulty,
            resume_context=resume_context,
            candidate_name=candidate_name,
        )

        greeting = opening_data.get("greeting", "Hello!")
        if resume_context and "reviewed your resume" not in greeting.lower():
            greeting = f"{greeting} I've reviewed your resume and I'm excited to learn more about your background."

        opening_text = (
            f"{greeting} {opening_data.get('opening_question', 'Tell me about yourself.')}"
        ).strip()

        question = Question(
            interview_id=interview.id,
            question_text=opening_text,
            category=opening_data.get("category", category),
            difficulty=opening_data.get("difficulty", difficulty),
            order_index=0,
            time_limit_seconds=0,
        )
        db.session.add(question)

        db.session.commit()
        return interview

    @staticmethod
    def get_target_turns(interview: Interview) -> int:
        """
        Get target number of conversational exchanges for an interview.

        Args:
            interview: Interview instance.

        Returns:
            Target turn count.
        """
        if interview.duration_minutes and interview.duration_minutes > 0:
            return max(1, interview.duration_minutes // SESSION_DURATION_MULTIPLIER)
        return DEFAULT_QUESTION_COUNT

    @staticmethod
    def get_conversation_history(interview_id: int) -> list[dict]:
        """
        Build conversation history from saved questions and answers.

        Args:
            interview_id: Interview ID.

        Returns:
            List of conversation turn dictionaries.
        """
        interview = Interview.query.get_or_404(interview_id)
        history = []

        for question in interview.questions.order_by(Question.order_index):
            answer = question.answer
            history.append(
                {
                    "question_id": question.id,
                    "question": question.question_text,
                    "answer": answer.answer_text if answer else "",
                    "has_answer": answer is not None,
                    "order_index": question.order_index,
                }
            )

        return history

    @staticmethod
    def get_session_state(interview_id: int) -> dict:
        """
        Get current conversational session state for the live interview UI.

        Args:
            interview_id: Interview ID.

        Returns:
            Session state dictionary.
        """
        interview = Interview.query.get_or_404(interview_id)
        history = InterviewService.get_conversation_history(interview_id)
        target_turns = InterviewService.get_target_turns(interview)
        answered_count = sum(1 for turn in history if turn["has_answer"])

        current_question = None
        for turn in history:
            if not turn["has_answer"]:
                current_question = turn
                break

        if not current_question and history:
            current_question = history[-1]

        return {
            "interview_id": interview.id,
            "status": interview.status,
            "target_turns": target_turns,
            "completed_turns": answered_count,
            "conversation": history,
            "current_question_id": current_question["question_id"] if current_question else None,
            "current_question_text": current_question["question"] if current_question else "",
            "is_waiting_for_answer": bool(
                current_question and not current_question["has_answer"]
            ),
            "is_complete": answered_count >= target_turns and not any(
                not turn["has_answer"] for turn in history
            ),
            "is_cancelled": interview.status == INTERVIEW_CANCELLED,
        }

    @staticmethod
    def cancel_interview(interview_id: int, reason: str = "") -> Interview:
        """
        Cancel an interview due to policy violation or other reason.

        Args:
            interview_id: Interview ID.
            reason: Cancellation reason message.

        Returns:
            Updated Interview instance.
        """
        interview = Interview.query.get_or_404(interview_id)
        interview.status = INTERVIEW_CANCELLED
        interview.completed_at = datetime.utcnow()
        db.session.commit()
        current_app.logger.warning(
            f"Interview {interview_id} cancelled. Reason: {reason or 'Not specified'}"
        )
        return interview

    @staticmethod
    def submit_response(
        question_id: int,
        answer_text: str = "",
        audio_file=None,
        duration_seconds: int = 0,
        frame_data: Optional[list] = None,
    ) -> dict:
        """
        Save candidate response and generate the next interviewer message.

        Args:
            question_id: Current question ID.
            answer_text: Candidate response text.
            audio_file: Optional audio upload.
            duration_seconds: Response duration in seconds.
            frame_data: Webcam frame analysis data.

        Returns:
            Response payload with analysis and next interviewer turn.
        """
        question = Question.query.get_or_404(question_id)
        interview = question.interview

        moderation = ContentModerationService.check_text(answer_text)
        if moderation["is_violation"]:
            InterviewService.save_answer(
                question_id=question_id,
                answer_text=answer_text,
                audio_file=audio_file,
                duration_seconds=duration_seconds,
                frame_data=frame_data,
            )
            InterviewService.cancel_interview(
                interview.id,
                reason=f"Profanity/sensitive words detected: {', '.join(moderation['matched_words'])}",
            )
            return {
                "message": "Interview cancelled",
                "is_cancelled": True,
                "cancellation_reason": MODERATION_CANCELLATION_MESSAGE,
                "matched_words": moderation["matched_words"],
                "redirect_url": None,
            }

        answer = InterviewService.save_answer(
            question_id=question_id,
            answer_text=answer_text,
            audio_file=audio_file,
            duration_seconds=duration_seconds,
            frame_data=frame_data,
        )

        question = Question.query.get_or_404(question_id)
        interview = question.interview
        target_turns = InterviewService.get_target_turns(interview)
        history = InterviewService.get_conversation_history(interview.id)
        answered_count = sum(1 for turn in history if turn["has_answer"])

        resume_context = ""
        if interview.resume:
            resume_context = InterviewService.build_resume_context(interview.resume)

        qa_history = [
            {"question": turn["question"], "answer": turn["answer"]}
            for turn in history
            if turn["has_answer"]
        ]

        interviewer_response = GeminiService.generate_interviewer_response(
            conversation_history=qa_history,
            domain=interview.domain,
            category=interview.category,
            difficulty=interview.difficulty,
            current_turn=answered_count,
            max_turns=target_turns,
            resume_context=resume_context,
        )

        speech = answer.speech_analysis
        emotion = answer.emotion_analysis

        result = {
            "message": "Response saved",
            "answer_id": answer.id,
            "transcript": speech.transcript if speech else answer_text,
            "communication_score": speech.communication_score if speech else 0,
            "dominant_emotion": emotion.dominant_emotion if emotion else "Neutral",
            "confidence_score": emotion.confidence_score if emotion else 0,
            "completed_turns": answered_count,
            "target_turns": target_turns,
            "is_complete": interviewer_response.get("is_complete", False)
            or answered_count >= target_turns,
            "is_cancelled": False,
            "interviewer_message": "",
            "next_question_id": None,
        }

        if result["is_complete"]:
            closing = interviewer_response.get("closing_remarks", "")
            acknowledgment = interviewer_response.get("acknowledgment", "")
            result["interviewer_message"] = f"{acknowledgment} {closing}".strip()
            return result

        acknowledgment = interviewer_response.get("acknowledgment", "")
        next_question = interviewer_response.get("next_question", "")
        full_message = f"{acknowledgment} {next_question}".strip()

        next_order = (
            interview.questions.order_by(Question.order_index.desc()).first().order_index + 1
        )
        next_question_row = Question(
            interview_id=interview.id,
            question_text=full_message,
            category=interviewer_response.get("category", interview.category),
            difficulty=interviewer_response.get("difficulty", interview.difficulty),
            order_index=next_order,
            time_limit_seconds=0,
        )
        db.session.add(next_question_row)
        db.session.commit()

        result["interviewer_message"] = full_message
        result["next_question_id"] = next_question_row.id
        return result

    @staticmethod
    def start_interview(interview_id: int) -> Interview:
        """
        Mark interview as in progress.

        Args:
            interview_id: Interview ID.

        Returns:
            Updated Interview.
        """
        interview = Interview.query.get_or_404(interview_id)
        interview.status = INTERVIEW_IN_PROGRESS
        interview.started_at = datetime.utcnow()
        db.session.commit()
        return interview

    @staticmethod
    def save_answer(
        question_id: int,
        answer_text: str = "",
        audio_file=None,
        duration_seconds: int = 60,
        frame_data: Optional[list] = None,
    ) -> Answer:
        """
        Save candidate answer with speech and emotion analysis.

        Args:
            question_id: Question ID.
            answer_text: Text answer.
            audio_file: Optional audio upload.
            duration_seconds: Answer duration.
            frame_data: Webcam frame analysis data.

        Returns:
            Answer record.
        """
        question = Question.query.get_or_404(question_id)
        audio_path = None
        if audio_file:
            audio_path = save_upload_file(audio_file, subfolder="audio")

        existing = Answer.query.filter_by(question_id=question_id).first()
        if existing:
            answer = existing
            answer.answer_text = answer_text or existing.answer_text
            answer.duration_seconds = duration_seconds
            if audio_path:
                answer.audio_path = audio_path
        else:
            answer = Answer(
                question_id=question_id,
                answer_text=answer_text,
                audio_path=audio_path,
                duration_seconds=duration_seconds,
            )
            db.session.add(answer)

        db.session.flush()

        SpeechAnalysisService.analyze_answer(
            answer_id=answer.id,
            audio_path=audio_path,
            answer_text=answer_text,
            duration_seconds=duration_seconds,
        )

        if frame_data:
            emotion_results = EmotionDetectionService.analyze_video_frames(frame_data)
            EmotionDetectionService.save_analysis(answer.id, emotion_results)

        db.session.commit()
        return answer

    @staticmethod
    def complete_interview(interview_id: int, video_file=None, audio_file=None) -> Score:
        """
        Complete interview and run AI evaluation.

        Args:
            interview_id: Interview ID.
            video_file: Optional full session video.
            audio_file: Optional full session audio.

        Returns:
            Score record.
        """
        interview = Interview.query.get_or_404(interview_id)
        interview.status = INTERVIEW_COMPLETED
        interview.completed_at = datetime.utcnow()

        if video_file:
            interview.video_path = save_upload_file(video_file, subfolder="video")
        if audio_file:
            interview.audio_path = save_upload_file(audio_file, subfolder="audio")

        qa_pairs = []
        speech_scores = []
        confidence_scores = []

        for question in interview.questions.order_by(Question.order_index):
            answer = question.answer
            if not answer:
                continue

            speech = answer.speech_analysis
            emotion = answer.emotion_analysis

            qa_pairs.append(
                {
                    "question": question.question_text,
                    "answer": answer.answer_text or (speech.transcript if speech else ""),
                    "speech_score": speech.communication_score if speech else 70,
                    "confidence_score": emotion.confidence_score if emotion else 70,
                    "domain": interview.domain,
                }
            )
            if speech:
                speech_scores.append(speech.communication_score)
            if emotion:
                confidence_scores.append(emotion.confidence_score)

        resume_summary = ""
        if interview.resume:
            resume_summary = interview.resume.summary or ""

        evaluation = GeminiService.evaluate_interview(
            qa_pairs, interview.domain, resume_summary
        )

        avg_speech = (
            sum(speech_scores) / len(speech_scores) if speech_scores else 70
        )
        avg_confidence = (
            sum(confidence_scores) / len(confidence_scores)
            if confidence_scores
            else evaluation.get("confidence_score", 70)
        )

        technical = float(evaluation.get("technical_score", 70))
        communication = float(
            evaluation.get("communication_score", avg_speech)
        )
        confidence = float(evaluation.get("confidence_score", avg_confidence))
        professionalism = float(evaluation.get("professionalism_score", 75))

        overall = calculate_overall_score(
            communication, confidence, technical, professionalism
        )

        existing_score = Score.query.filter_by(interview_id=interview_id).first()
        if existing_score:
            score = existing_score
        else:
            score = Score(interview_id=interview_id)
            db.session.add(score)

        score.technical_score = technical
        score.communication_score = communication
        score.confidence_score = confidence
        score.professionalism_score = professionalism
        score.overall_score = overall
        score.strengths = "\n".join(evaluation.get("strengths", []))
        score.weaknesses = "\n".join(evaluation.get("weaknesses", []))
        score.suggestions = "\n".join(evaluation.get("suggestions", []))
        score.recommended_courses = "\n".join(
            evaluation.get("recommended_courses", [])
        )
        score.recommended_skills = "\n".join(
            evaluation.get("recommended_skills", [])
        )
        score.ai_feedback = evaluation.get("ai_feedback", "")

        db.session.commit()
        return score

    @staticmethod
    def get_candidate_interviews(candidate_id: int) -> list:
        """Get all interviews for a candidate."""
        return (
            Interview.query.filter_by(candidate_id=candidate_id)
            .order_by(Interview.created_at.desc())
            .all()
        )

    @staticmethod
    def get_interview_detail(interview_id: int) -> Optional[Interview]:
        """Get interview with all related data."""
        return Interview.query.get(interview_id)
