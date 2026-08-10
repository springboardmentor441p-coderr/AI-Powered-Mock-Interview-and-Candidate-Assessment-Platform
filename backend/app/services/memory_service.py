import json
from sqlalchemy.orm import Session
from app.models.interview import InterviewMemory


class MemoryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def initialize_memory(self, session_id: int, skills: list[str]) -> InterviewMemory:
        """Create initial memory records for the session."""
        memory = InterviewMemory(
            session_id=session_id,
            topics_covered=json.dumps([]),
            topics_remaining=json.dumps(skills[:8] if skills else ["General Architecture", "Systems Design"]),
            candidate_confidence="MEDIUM",
            raw_memory=json.dumps({"question_history": []})
        )
        self.db.add(memory)
        self.db.commit()
        self.db.refresh(memory)
        return memory

    def get_memory(self, session_id: int) -> InterviewMemory | None:
        return self.db.query(InterviewMemory).filter(InterviewMemory.session_id == session_id).first()

    def update_memory(
        self,
        session_id: int,
        new_topic: str,
        confidence_score: float,
        answer_length: int,
    ) -> InterviewMemory:
        """Update covered/remaining lists and calculate candidate confidence state."""
        memory = self.get_memory(session_id)
        if not memory:
            memory = self.initialize_memory(session_id, [new_topic])

        try:
            covered = json.loads(memory.topics_covered or "[]")
            remaining = json.loads(memory.topics_remaining or "[]")
            raw = json.loads(memory.raw_memory or "{}")
        except Exception:
            covered = []
            remaining = []
            raw = {}

        # Update lists
        if new_topic and new_topic not in covered:
            covered.append(new_topic)
        if new_topic in remaining:
            remaining.remove(new_topic)

        # Basic confidence tracking heuristic
        # If candidate gives a long answer and scores well, confidence is HIGH
        current_confidence = "MEDIUM"
        if confidence_score >= 8.0 and answer_length > 60:
            current_confidence = "HIGH"
        elif confidence_score < 5.0 or answer_length < 15:
            current_confidence = "LOW"

        # Update raw history of scores
        scores_history = raw.setdefault("scores_history", [])
        scores_history.append(confidence_score)

        memory.topics_covered = json.dumps(covered)
        memory.topics_remaining = json.dumps(remaining)
        memory.candidate_confidence = current_confidence
        memory.raw_memory = json.dumps(raw)

        self.db.commit()
        self.db.refresh(memory)
        return memory
