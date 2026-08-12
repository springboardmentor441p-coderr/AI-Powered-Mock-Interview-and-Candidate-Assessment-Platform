"""
FastAPI application entrypoint.

Run with:
    uvicorn app.main:app --reload
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import interview
from app.routers import resume
from app.routers import voice
from app.websocket import voice_ws
from app.services.groq_service import close_groq_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    close_groq_client()


app = FastAPI(
    title="Verixa API",
    description="Verixa — AI-Powered Interview & Candidate Assessment Platform API.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router)
app.include_router(resume.legacy_router)
app.include_router(interview.router)
app.include_router(voice.router)
app.include_router(voice_ws.router)

@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Simple liveness check endpoint."""
    return {"status": "ok"}
