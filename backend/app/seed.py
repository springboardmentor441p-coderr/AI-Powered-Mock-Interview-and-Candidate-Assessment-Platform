from sqlalchemy.orm import Session
import datetime
from .database import engine, SessionLocal, Base
from .models import User, Profile, InterviewTemplate, InterviewSession, InterviewQuestion, InterviewAnswer
from .auth import get_password_hash

def seed_database():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Check if database is already seeded
        if db.query(User).first() is not None:
            print("Database already seeded.")
            return

        print("Seeding database with demo workspaces...")

        # 1. Create Users
        candidate = User(
            email="candidate@example.com",
            password_hash=get_password_hash("candidate123"),
            full_name="Alex Mercer",
            role="candidate"
        )
        recruiter = User(
            email="recruiter@example.com",
            password_hash=get_password_hash("recruiter123"),
            full_name="Sarah Connor",
            role="recruiter"
        )
        admin = User(
            email="admin@example.com",
            password_hash=get_password_hash("admin123"),
            full_name="John Miller",
            role="admin"
        )
        db.add_all([candidate, recruiter, admin])
        db.commit()
        db.refresh(candidate)
        db.refresh(recruiter)

        # 2. Create Candidate Profile
        candidate_profile = Profile(
            user_id=candidate.id,
            parsed_skills=["Python", "JavaScript", "React", "SQL", "Docker", "Git"],
            parsed_experience=[
                {
                    "role": "Frontend Developer Intern",
                    "company": "PixelCraft Inc.",
                    "duration": "2023 - 2024",
                    "description": "Implemented glassmorphic React components and integrated JSON REST endpoints."
                },
                {
                    "role": "Open Source Contributor",
                    "company": "GitHub Community",
                    "duration": "2022 - Present",
                    "description": "Contributed scripts to pipeline automations and visual theme alignments."
                }
            ],
            education=[
                {
                    "institution": "Apex Science Institute",
                    "degree": "B.Tech Computer Science",
                    "year": "2024"
                }
            ],
            summary="A passionate software developer specialized in interactive web layouts, Python backend integrations, and clean data schemas."
        )
        db.add(candidate_profile)
        db.commit()

        # 3. Create Recruiter Interview Templates
        template_se = InterviewTemplate(
            title="Software Engineer Mock Session",
            description="Core coding and engineering interview dynamically phrased around Candidate Resume and Job Description.",
            domain="Software Engineering",
            difficulty="Medium",
            questions=[],
            created_by_id=recruiter.id
        )
        template_pm = InterviewTemplate(
            title="Product Manager Evaluation",
            description="Product Management prompt dynamically phrased around Candidate Resume and Job Description.",
            domain="Product Management",
            difficulty="Hard",
            questions=[],
            created_by_id=recruiter.id
        )
        db.add_all([template_se, template_pm])
        db.commit()
        db.refresh(template_se)

        # 4. Create a Completed Sample Interview Session
        session = InterviewSession(
            candidate_id=candidate.id,
            template_id=template_se.id,
            domain="Software Engineering",
            difficulty="Medium",
            status="completed",
            total_score=83.5,
            communication_score=86.0,
            confidence_score=80.5,
            technical_score=84.0,
            professionalism_score=82.0,
            feedback={
                "strengths": [
                    "Strong grasp of frontend rendering frameworks and state lifecycles.",
                    "Excellent pacing (130 WPM average) with very few filler hesitation words."
                ],
                "weaknesses": [
                    "Database comparison response could benefit from discussing query transaction logs.",
                    "Aptitude puzzle was answered correctly but could show structured estimation steps."
                ],
                "recommendations": [
                    "Use the STAR method more explicitly to map behavioral timelines.",
                    "Practice sketching low-level database engine block indices."
                ],
                "resources": [
                    {"title": "Designing Data-Intensive Applications", "type": "Book", "url": "Focus on storage structure chapters."},
                    {"title": "System Design Primer", "type": "GitHub Repo", "url": "Reference cache indexing patterns."}
                ]
            },
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # 5. Populate Questions & Answers for this Sample Session
        q_texts = template_se.questions
        db_qs = []
        for idx, q_text in enumerate(q_texts):
            db_q = InterviewQuestion(
                session_id=session.id,
                question_text=q_text,
                category="technical" if idx < 2 else ("behavioral" if idx == 2 else ("hr" if idx == 3 else "aptitude")),
                order=idx + 1
            )
            db.add(db_q)
            db_qs.append(db_q)
        db.commit()
        
        # Populate matching Answers
        answers = [
            # React Virtual DOM
            {
                "text": "The virtual DOM is a lightweight in-memory representation of the real DOM. When state changes, React updates the virtual DOM, runs a diffing algorithm called reconciliation to check what changed, and then batched-updates only those nodes in the real DOM to improve rendering speed.",
                "duration": 48.0, "wpm": 128, "filler": 1, "eye": 92.0, "score": 88.0,
                "feedback": "Perfect summary of the virtual DOM, highlighting memory trees, reconciliation, diffing, and batching nodes."
            },
            # SQL vs NoSQL
            {
                "text": "SQL databases are relational and structured, using table layouts and enforcing ACID properties for transaction security. NoSQL databases are non-relational, like key-value or document stores, scaling horizontally and prioritizing availability. I would choose SQL for complex ledger queries, and NoSQL for rapid unstructured writes.",
                "duration": 52.0, "wpm": 115, "filler": 2, "eye": 88.0, "score": 82.0,
                "feedback": "Good explanation of ACID vs BASE and vertical vs horizontal scaling. Expanding on specific index indexing trees would be a plus."
            },
            # Conflict resolution
            {
                "text": "In a previous project, my peer wanted to use MongoDB while I suggested PostgreSQL. To resolve it, I set up a simple benchmark of our key query structures. The data showed PostgreSQL performed 30 percent faster for our relational joining. We aligned based on this objective check.",
                "duration": 42.0, "wpm": 135, "filler": 1, "eye": 90.0, "score": 85.0,
                "feedback": "Great behavioral answer using objective checking metrics. Good application of STAR timeline."
            },
            # Stress deadline
            {
                "text": "I handle tight deadlines by planning tasks, breaking deliverables down into blocks, and communicating with my product owners immediately if blockers emerge. I prioritize core paths to maintain quality.",
                "duration": 30.0, "wpm": 118, "filler": 0, "eye": 95.0, "score": 80.0,
                "feedback": "Good description of sprint management and transparency. Add examples of a real delay scenario."
            },
            # 5 widgets
            {
                "text": "It takes 100 machines exactly five minutes to make 100 widgets. Since each machine operates in parallel and takes five minutes to make one widget, increasing both machines and widgets proportionally leaves the elapsed time unchanged.",
                "duration": 25.0, "wpm": 130, "filler": 0, "eye": 96.0, "score": 80.0,
                "feedback": "Correct arithmetic solution with a brief and precise logic justification."
            }
        ]

        for idx, ans_info in enumerate(answers):
            db_ans = InterviewAnswer(
                session_id=session.id,
                question_id=db_qs[idx].id,
                answer_text=ans_info["text"],
                duration_seconds=ans_info["duration"],
                filler_word_count=ans_info["filler"],
                wpm=ans_info["wpm"],
                confidence_pct=90.0,
                eye_contact_pct=ans_info["eye"],
                transcript_confidence=0.98,
                score=ans_info["score"],
                feedback_text=ans_info["feedback"]
            )
            db.add(db_ans)
        
        db.commit()
        print("Database seeded successfully with demo records!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
