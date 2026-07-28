from app.database import engine, Base, SessionLocal
from app.models.models import User
from sqlalchemy import text

# Ensure all database tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()
user = db.query(User).filter(User.id == 1).first()
if not user:
    print("User id 1 NOT FOUND! Creating default user id 1...")
    default_user = User(
        id=1,
        email="candidate@smartai.com",
        full_name="Candidate User",
        hashed_password="hashed_password_123",
        target_role="Software Engineer"
    )
    db.add(default_user)
    db.commit()
    print("Default user id 1 created successfully!")
else:
    print("User id 1 exists:", user.full_name, user.email)

db.close()
