from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .database import engine, Base
from .routers import users, resumes, interviews
from .config import settings

# Initialize database schemas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API services for SmartHire AI Candidate Mock Assessment",
    version="1.0.0"
)

# Enable CORS for frontend local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Register routers
app.include_router(users.router)
app.include_router(resumes.router)
app.include_router(interviews.router)

# Mount local media directory for serving uploaded files (audio recordings, etc.)
from fastapi.staticfiles import StaticFiles
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "SmartHire AI API",
        "database": "SQLite (initialized)"
    }
