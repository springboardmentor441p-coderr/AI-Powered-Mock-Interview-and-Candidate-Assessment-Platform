from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.routers import auth, resume, matching

# Create all tables in SQLite on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartHire AI",
    description="AI-Powered Mock Interview & Candidate Assessment Platform",
    version="1.0.0"
)

# Allow React frontend to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(matching.router)


@app.get("/")
def root():
    return {"message": "SmartHire AI backend is running!"}