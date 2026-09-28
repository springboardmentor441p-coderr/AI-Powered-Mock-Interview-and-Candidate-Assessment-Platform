"""
main.py — SmartHire AI FastAPI application entry point

API structure:
  /auth/*         — register, login, get current user
  /candidates/*   — resume upload, candidate management
  /interview/*    — session lifecycle, Q&A, reports
  /dashboard/*    — analytics, progress, weak areas
  /ml/*           — model training, prediction, data export
  /reports/*      — report export
  /health         — simple health check
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import auth, candidates
from backend.routers import interview, dashboard, ml_router, report_export
from backend.database import init_db

# ── Create tables on startup ─────────────────────────────────────────────────
init_db()

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = "SmartHire AI API",
    description = "AI-powered mock interview platform — backend",
    version     = "1.0.0",
    docs_url    = "/docs",      # Swagger UI
    redoc_url   = "/redoc",     # ReDoc
)

# ── CORS (allow React frontend) ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins      = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_credentials  = True,
    allow_methods      = ["*"],
    allow_headers      = ["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,          prefix="/auth",        tags=["Auth"])
app.include_router(candidates.router,    prefix="/candidates",  tags=["Candidates"])
app.include_router(interview.router,     prefix="/interview",   tags=["Interview"])
app.include_router(dashboard.router,     prefix="/dashboard",   tags=["Dashboard"])
app.include_router(ml_router.router,     prefix="/ml",          tags=["ML Training"])
app.include_router(report_export.router, prefix="/reports",     tags=["Reports"])


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "SmartHire AI API v1.0.0"}
