from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.routers import auth, resume_jd, assessment, interview, report

# Create database tables automatically on startup
Base.metadata.create_all(bind=engine)

# Seed default candidate user (user_id = 1) if missing to guarantee foreign key integrity
from app.database import SessionLocal
from app.models.models import User
db_init = SessionLocal()
try:
    if not db_init.query(User).filter(User.id == 1).first():
        default_user = User(
            id=1,
            email="candidate@smartai.com",
            full_name="Candidate User",
            hashed_password="hashed_password_123",
            target_role="Software Engineer"
        )
        db_init.add(default_user)
        db_init.commit()
        print("Initialized default candidate user (id=1) in database!")
finally:
    db_init.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Enterprise API engine powering SmartHire AI Candidate Development Platform"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
import os

# Create uploads directory if it does not exist
os.makedirs("uploads/recordings", exist_ok=True)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(resume_jd.router, prefix=settings.API_V1_STR)
app.include_router(assessment.router, prefix=settings.API_V1_STR)
app.include_router(interview.router, prefix=settings.API_V1_STR)
app.include_router(report.router, prefix=settings.API_V1_STR)

# Serve uploaded video recordings and media statically
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "SmartHire AI Core Engine",
        "version": "1.0.0",
        "docs": "/docs"
    }
