from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routers import assessments, auth, deepgram, interviews, notifications, resumes, users, voice

Base.metadata.create_all(bind=engine)
app = FastAPI(title="SmartHire AI API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router); app.include_router(users.router); app.include_router(resumes.router); app.include_router(interviews.router); app.include_router(assessments.router); app.include_router(voice.router); app.include_router(deepgram.router); app.include_router(notifications.router)

@app.get("/health")
def health(): return {"status": "ok"}
