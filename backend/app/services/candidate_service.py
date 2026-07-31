from sqlalchemy import func

from app.extensions import db
from app.models.user_model import User
from app.models.resume_model import Resume
from app.models.interview_model import Interview


class CandidateService:

    @staticmethod
    def get_dashboard(user_id):

        user = User.query.get(user_id)

        if not user:
            return {
                "success": False,
                "message": "Candidate not found"
            }

        total_interviews = Interview.query.filter_by(
            candidate_id=user_id
        ).count()

        total_resumes = Resume.query.filter_by(
            candidate_id=user_id
        ).count()

        latest_resume = Resume.query.filter_by(
            candidate_id=user_id
        ).order_by(
            Resume.created_at.desc()
        ).first()

        latest_interview = Interview.query.filter_by(
            candidate_id=user_id
        ).order_by(
            Interview.created_at.desc()
        ).first()

        return {

            "success": True,

            "candidate": {

                "id": user.id,

                "name": user.full_name,

                "email": user.email,

                "phone": user.phone,

                "role": user.role.name

            },

            "statistics": {

                "total_interviews": total_interviews,

                "uploaded_resumes": total_resumes

            },

            "latest_resume":

                latest_resume.to_dict()

                if latest_resume else None,

            "latest_interview":

                latest_interview.to_dict()

                if latest_interview else None
        }


    @staticmethod
    def get_profile(user_id):

        user = User.query.get(user_id)

        if not user:

            return {
                "success": False,
                "message": "User not found"
            }

            return {

            "success": True,

            "profile": user.to_dict()

        }

    @staticmethod
    def get_interview_history(user_id):

        interviews = (
            Interview.query
            .filter_by(candidate_id=user_id)
            .order_by(Interview.created_at.desc())
            .all()
        )

        return {
            "success": True,
            "count": len(interviews),
            "history": [
                interview.to_dict()
                for interview in interviews
            ]
        }


    @staticmethod
    def get_average_score(user_id):

        average_score = (
            db.session.query(
                func.avg(Interview.score)
            )
            .filter(
                Interview.candidate_id == user_id
            )
            .scalar()
        )

        if average_score is None:
            average_score = 0

        return {
            "success": True,
            "average_score": round(
                average_score,
                2
            )
        }


    @staticmethod
    def get_performance_summary(user_id):

        interviews = Interview.query.filter_by(
            candidate_id=user_id
        ).all()

        if len(interviews) == 0:

            return {
                "success": True,
                "summary": {
                    "total_interviews": 0,
                    "highest_score": 0,
                    "lowest_score": 0,
                    "average_score": 0
                }
            }

        scores = [
            interview.score
            for interview in interviews
        ]

        return {

            "success": True,

            "summary": {

                "total_interviews": len(interviews),

                "highest_score": max(scores),

                "lowest_score": min(scores),

                "average_score": round(
                    sum(scores) / len(scores),
                    2
                )

            }

        }


    @staticmethod
    def get_recent_activity(user_id):

        interviews = (
            Interview.query
            .filter_by(candidate_id=user_id)
            .order_by(
                Interview.created_at.desc()
            )
            .limit(5)
            .all()
        )

        activity = []

        for interview in interviews:

            activity.append({

                "title": interview.job_role,

                "difficulty": interview.difficulty,

                "score": interview.score,

                "status": interview.status,

                "date": interview.created_at

            })

            return {

            "success": True,

            "activities": activity

        }

    @staticmethod
    def get_ai_analysis(user_id):
        interviews = (
            Interview.query
            .filter_by(candidate_id=user_id)
            .order_by(Interview.created_at.desc())
            .all()
        )

        if not interviews:

            return {

                "success": True,

                "strengths": [],

                "weaknesses": [],

                "feedback": "Complete your first interview to receive AI feedback.",

                "recommendations": [
                    "Start an interview.",
                    "Upload your resume.",
                    "Practice communication skills."
                ]

            }

        latest = interviews[0]

        strengths = []

        weaknesses = []

        recommendations = []

        if latest.technical_score >= 80:
            strengths.append("Strong technical knowledge.")
        else:
            weaknesses.append("Improve technical concepts.")
            recommendations.append("Practice coding and core CS subjects.")

        if latest.communication_score >= 80:
            strengths.append("Excellent communication skills.")
        else:
            weaknesses.append("Improve verbal communication.")
            recommendations.append("Practice speaking confidently.")

        if latest.confidence_score >= 80:
            strengths.append("Confident while answering.")
        else:
            weaknesses.append("Increase confidence during interviews.")
            recommendations.append("Attempt more mock interviews.")

        if latest.score >= 85:
            feedback = (
                "Excellent overall performance. "
                "Maintain your consistency."
            )

        elif latest.score >= 70:
            feedback = (
                "Good performance. Focus on improving weaker areas."
            )

        else:
            feedback = (
                "Your fundamentals need more practice. "
                "Regular mock interviews are recommended."
            )

        return {

            "success": True,

            "strengths": strengths,

            "weaknesses": weaknesses,

            "feedback": feedback,

            "recommendations": recommendations

        }


    @staticmethod
    def get_dashboard_cards(user_id):

        total_interviews = Interview.query.filter_by(
            candidate_id=user_id
        ).count()

        total_resumes = Resume.query.filter_by(
            candidate_id=user_id
        ).count()

        avg_score = (
            db.session.query(
                func.avg(Interview.score)
            )
            .filter(
                Interview.candidate_id == user_id
            )
            .scalar()
        )

        if avg_score is None:
            avg_score = 0

        latest = (
            Interview.query
            .filter_by(candidate_id=user_id)
            .order_by(
                Interview.created_at.desc()
            )
            .first()
        )

        return {

            "success": True,

            "cards": {

                "total_interviews": total_interviews,

                "uploaded_resumes": total_resumes,

                "average_score": round(
                    avg_score,
                    2
                ),

                "latest_score":
                    latest.score if latest else 0

            }

        }