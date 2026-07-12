from sqlalchemy.orm import Session
from models import User


def get_dashboard_stats(db: Session):

    total_users = db.query(User).count()

    students = db.query(User).filter(User.role == "student").count()

    recruiters = db.query(User).filter(User.role == "recruiter").count()

    return {
        "total_users": total_users,
        "students": students,
        "recruiters": recruiters
    }