import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.interview import InterviewSession, InterviewQuestion, InterviewAnswer, Evaluation, InterviewScore
from app.models.candidate_profile import CandidateProfile
from app.services.question_generator import QuestionGenerator
from app.services.evaluation_engine import EvaluationEngine
from app.services.followup_engine import FollowupEngine
from app.services.memory_service import MemoryService
from app.services.report_generator import ReportGenerator

ROUND_1_LIMIT = 3
ROUND_2_LIMIT = 3
PASSING_THRESHOLD = 5.5


class InterviewService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.q_gen = QuestionGenerator()
        self.eval_engine = EvaluationEngine()
        self.followup_engine = FollowupEngine()
        self.memory_service = MemoryService(db)
        self.report_gen = ReportGenerator(db)

    async def start_session(
        self,
        candidate_id: int,
        job_role: str,
        difficulty: str,
        interview_type: str,
    ) -> InterviewSession:
        """Initialize an interview session, parse/load candidate profile, and generate first question."""
        # Find latest resume for candidate
        from app.models.resume import Resume
        resume = (
            self.db.query(Resume)
            .filter(Resume.user_id == candidate_id)
            .order_by(Resume.uploaded_at.desc())
            .first()
        )

        profile = self.db.query(CandidateProfile).filter(CandidateProfile.user_id == candidate_id).first()
        skills = []
        if profile:
            try:
                skills = json.loads(profile.strong_skills or "[]") + json.loads(profile.weak_skills or "[]")
            except Exception:
                pass

        # Create session
        session = InterviewSession(
            candidate_id=candidate_id,
            resume_id=resume.id if resume else None,
            job_role=job_role,
            difficulty=difficulty,
            interview_type=interview_type,
            status="IN_PROGRESS",
            current_round=1,
            cumulative_score=0.0
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

        # Initialize memory
        self.memory_service.initialize_memory(session.id, skills)

        # Generate first question
        first_q_text = await self.q_gen.generate_question(
            profile=profile,
            job_role=job_role,
            difficulty=difficulty,
            round_number=1,
            question_number=1,
            previous_questions=[],
            previous_answers=[],
            topics_covered=[]
        )

        question = InterviewQuestion(
            session_id=session.id,
            round_number=1,
            question_number=1,
            question_text=first_q_text
        )
        self.db.add(question)
        self.db.commit()

        return session

    async def submit_and_evaluate(
        self,
        session_id: int,
        question_id: int,
        answer_text: str,
    ) -> dict:
        """
        Submit a candidate response, trigger score evaluation,
        update memory, and determine what the next step should be.
        """
        session = self.db.get(InterviewSession, session_id)
        if not session or session.status != "IN_PROGRESS":
            raise ValueError("Interview session is either completed or not found.")

        question = self.db.get(InterviewQuestion, question_id)
        if not question:
            raise ValueError("Question not found.")

        # Save candidate answer
        answer = InterviewAnswer(
            question_id=question_id,
            answer_text=answer_text
        )
        self.db.add(answer)
        self.db.commit()
        self.db.refresh(answer)

        # Evaluate answer
        eval_data = await self.eval_engine.evaluate_answer(
            question=question.question_text,
            answer=answer_text,
            difficulty=session.difficulty,
            job_role=session.job_role,
        )

        evaluation = Evaluation(
            answer_id=answer.id,
            score=eval_data["score"],
            technical_accuracy=eval_data["technical_accuracy"],
            concept_understanding=eval_data["concept_understanding"],
            communication=eval_data["communication"],
            problem_solving=eval_data["problem_solving"],
            confidence=eval_data["confidence"],
            completeness=eval_data["completeness"],
            practical_knowledge=eval_data["practical_knowledge"],
            strengths=eval_data["strengths"],
            weaknesses=eval_data["weaknesses"],
            reasoning=eval_data["reasoning"]
        )
        self.db.add(evaluation)
        self.db.commit()
        self.db.refresh(evaluation)

        # Update cumulative score for session
        evaluations = (
            self.db.query(Evaluation)
            .join(InterviewAnswer)
            .join(InterviewQuestion)
            .filter(InterviewQuestion.session_id == session_id)
            .all()
        )
        scores_sum = sum(e.score for e in evaluations)
        session.cumulative_score = scores_sum / len(evaluations)
        self.db.commit()

        # Update memory state
        self.memory_service.update_memory(
            session_id=session_id,
            new_topic=question.question_text[:30],  # use prefix as topic label
            confidence_score=evaluation.score,
            answer_length=len(answer_text.split())
        )

        # Determine next steps based on round progress
        next_action, next_q_text, next_q_id = await self._transition_logic(session, evaluations)
        
        return {
            "session_id": session_id,
            "question_id": question_id,
            "evaluation": evaluation,
            "next_action": next_action,
            "next_question": next_q_text,
            "next_question_id": next_q_id,
        }

    async def _transition_logic(self, session: InterviewSession, evaluations: list[Evaluation]) -> tuple[str, str | None, int | None]:
        profile = self.db.query(CandidateProfile).filter(CandidateProfile.user_id == session.candidate_id).first()

        # Get round list
        r1_evals = [e for e in evaluations if e.answer.question.round_number == 1]
        r2_evals = [e for e in evaluations if e.answer.question.round_number == 2]

        # -------------------------------------------------------------
        # ROUND 1 TRANSITION LOGIC
        # -------------------------------------------------------------
        if session.current_round == 1:
            if len(r1_evals) < ROUND_1_LIMIT:
                # Keep asking Round 1 questions
                next_q_num = len(r1_evals) + 1
                next_q_text = await self._generate_new_question(session, profile, 1, next_q_num)
                next_question = InterviewQuestion(
                    session_id=session.id,
                    round_number=1,
                    question_number=next_q_num,
                    question_text=next_q_text
                )
                self.db.add(next_question)
                self.db.commit()
                self.db.refresh(next_question)
                return "NEXT_QUESTION", next_q_text, next_question.id
            
            else:
                # Round 1 finished: evaluate if candidate passes
                r1_score = sum(e.score for e in r1_evals) / len(r1_evals)
                
                # Check threshold
                if r1_score < PASSING_THRESHOLD:
                    # Skip Round 2, record failed score and generate report
                    score_record = InterviewScore(
                        session_id=session.id,
                        round_number=1,
                        score=r1_score,
                        passing_status="FAIL"
                    )
                    self.db.add(score_record)
                    self.db.commit()

                    await self.report_gen.generate_report(session.id)
                    session.finished_at = datetime.now(timezone.utc)
                    self.db.commit()
                    return "GENERATE_REPORT", None, None
                
                else:
                    # Proceed to Round 2
                    score_record = InterviewScore(
                        session_id=session.id,
                        round_number=1,
                        score=r1_score,
                        passing_status="PASS"
                    )
                    self.db.add(score_record)
                    session.current_round = 2
                    self.db.commit()

                    # Generate first Round 2 question
                    next_q_text = await self._generate_new_question(session, profile, 2, 1)
                    next_question = InterviewQuestion(
                        session_id=session.id,
                        round_number=2,
                        question_number=1,
                        question_text=next_q_text
                    )
                    self.db.add(next_question)
                    self.db.commit()
                    self.db.refresh(next_question)
                    return "PROCEED_TO_ROUND_2", next_q_text, next_question.id

        # -------------------------------------------------------------
        # ROUND 2 TRANSITION LOGIC
        # -------------------------------------------------------------
        else:
            # Round 2 supports follow-ups
            # Scheme: Question 1 -> Follow-up 1 -> Question 2 -> Follow-up 2 -> Question 3 -> Report
            total_r2_steps = len(r2_evals)
            
            if total_r2_steps >= 5:
                # Round 2 fully completed!
                r2_score = sum(e.score for e in r2_evals) / len(r2_evals)
                score_record = InterviewScore(
                    session_id=session.id,
                    round_number=2,
                    score=r2_score,
                    passing_status="PASS"
                )
                self.db.add(score_record)
                self.db.commit()

                await self.report_gen.generate_report(session.id)
                session.finished_at = datetime.now(timezone.utc)
                self.db.commit()
                return "GENERATE_REPORT", None, None
            
            else:
                # Ask a follow-up or new question in Round 2
                next_q_num = total_r2_steps + 1
                
                # Check if this should be a follow-up step
                # Step 2 and 4 are follow-up questions to Step 1 and 3 answers respectively
                if next_q_num in (2, 4):
                    last_eval = r2_evals[-1]
                    prev_questions = [q.question_text for q in session.questions]
                    
                    next_q_text = await self.followup_engine.generate_followup(
                        question=last_eval.answer.question.question_text,
                        answer=last_eval.answer.answer_text,
                        job_role=session.job_role,
                        difficulty=session.difficulty,
                        previous_questions=prev_questions
                    )
                else:
                    # New topic question in Round 2
                    next_q_text = await self._generate_new_question(session, profile, 2, next_q_num)

                next_question = InterviewQuestion(
                    session_id=session.id,
                    round_number=2,
                    question_number=next_q_num,
                    question_text=next_q_text
                )
                self.db.add(next_question)
                self.db.commit()
                self.db.refresh(next_question)
                return "NEXT_QUESTION", next_q_text, next_question.id

    async def _generate_new_question(
        self,
        session: InterviewSession,
        profile: CandidateProfile | None,
        round_number: int,
        question_number: int
    ) -> str:
        prev_questions = [q.question_text for q in session.questions]
        prev_answers = [q.answer.answer_text for q in session.questions if q.answer]
        
        # Load covered topics
        topics = []
        memory = self.memory_service.get_memory(session.id)
        if memory:
            try:
                topics = json.loads(memory.topics_covered or "[]")
            except Exception:
                pass

        # Adaptive difficulty scaling:
        # If candidate is performing very well in recent answers, increase difficulty
        # If performing poorly, decrease difficulty
        adjusted_difficulty = session.difficulty
        if prev_answers:
            recent_evals = (
                self.db.query(Evaluation)
                .join(InterviewAnswer)
                .join(InterviewQuestion)
                .filter(InterviewQuestion.session_id == session.id)
                .order_by(InterviewAnswer.answered_at.desc())
                .limit(2)
                .all()
            )
            if recent_evals:
                avg_recent = sum(e.score for e in recent_evals) / len(recent_evals)
                if avg_recent >= 8.0:
                    # Increase difficulty
                    if session.difficulty == "Beginner":
                        adjusted_difficulty = "Intermediate"
                    elif session.difficulty == "Intermediate":
                        adjusted_difficulty = "Advanced"
                elif avg_recent < 5.0:
                    # Decrease difficulty
                    if session.difficulty == "Advanced":
                        adjusted_difficulty = "Intermediate"
                    elif session.difficulty == "Intermediate":
                        adjusted_difficulty = "Beginner"

        return await self.q_gen.generate_question(
            profile=profile,
            job_role=session.job_role,
            difficulty=adjusted_difficulty,
            round_number=round_number,
            question_number=question_number,
            previous_questions=prev_questions,
            previous_answers=prev_answers,
            topics_covered=topics
        )
