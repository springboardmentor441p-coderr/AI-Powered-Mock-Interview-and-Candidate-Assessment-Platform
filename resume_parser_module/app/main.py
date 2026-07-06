"""
FastAPI application entrypoint.

Run with:
    uvicorn app.main:app --reload
"""

import logging

from fastapi import FastAPI

from app.routers import resume

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="Resume Parser API",
    description="Parses PDF/DOCX resumes into structured JSON using a local Ollama LLM.",
    version="1.0.0",
)

app.include_router(resume.router)


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Simple liveness check endpoint."""
    return {"status": "ok"}
