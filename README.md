# SmartHire AI

SmartHire AI is a production-focused, AI-powered mock interview and candidate assessment platform. It combines real-time speech transcription, MediaPipe face/body-language analysis, dynamic question generation, and multi-model LLM evaluation to deliver deep, actionable interview feedback to candidates — while giving recruiters and administrators full-platform control through role-scoped dashboards.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Architecture](#project-architecture)
3. [Simplified App Workflow](#simplified-app-workflow)
4. [AI Models Used](#ai-models-used)
   - [1. Google Gemini 3.1 Flash-Lite (Primary LLM)](#1-google-gemini-31-flash-lite--primary-evaluator)
   - [2. Groq llama-3.3-70b-versatile (Fallback LLM)](#2-groq-llama-33-70b-versatile--automatic-fallback)
   - [3. MediaPipe Face Landmarker (Computer Vision)](#3-mediapipe-face-landmarker--in-browser-vision-analysis)
   - [4. Web Speech API (Speech Recognition STT)](#4-web-speech-api--real-time-speech-recognition-stt)
   - [5. Web Speech API & Kokoro TTS (Voice Engine)](#5-web-speech-api--kokoro-tts--speech-synthesis--voice-engine)
   - [6. AIRA Avatar Engine (Interactive AI Recruiter)](#6-aira-avatar-engine--interactive-ai-recruiter-character)
5. [Latest Implementation & Features](#latest-implementation--features)
   - [High-Level Overview](#high-level-overview)
   - [Phase 1 — Auth & Database Resilience](#phase-1--auth--database-resilience)
   - [Phase 2 — Interview Analysis Pipeline](#phase-2--interview-analysis-pipeline)
   - [Phase 3 — Gemini 2.5 + Groq Dual-Model Integration](#phase-3--gemini-25--groq-dual-model-integration)
   - [Phase 4 — Frontend Interview Pipeline](#phase-4--frontend-interview-pipeline)
   - [Phase 5 — Admin Control Panel](#phase-5--admin-control-panel)
   - [Phase 6 — Role-Based Access & Navigation](#phase-6--role-based-access--navigation)
   - [Phase 7 — Dynamic Questioning, Timer Gating & Suitability Reporting](#phase-7--dynamic-questioning-timer-gating--suitability-reporting)
   - [Phase 8 — Robust Real-Time Speech Transcription & Automated Interview Flow](#phase-8--robust-real-time-speech-transcription--automated-interview-flow)
   - [Phase 9 — Continuous Dynamic Questioning, Resume Parsing & Candidate Dashboard Overhaul](#phase-9--continuous-dynamic-questioning-resume-parsing--candidate-dashboard-overhaul)
6. [Folder Structure](#folder-structure)
7. [Getting Started](#getting-started)
8. [Environment Variables](#environment-variables)
9. [Database Migration Workflow](#database-migration-workflow)
10. [Admin Credentials](#admin-credentials)
11. [Branch Strategy](#branch-strategy)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI 0.115, Python 3.12, `uv`, SQLAlchemy 2.0 Async, Alembic, asyncpg |
| **Database** | PostgreSQL 18 (asyncpg driver, connection-pool health probes) |
| **Primary LLM** | Google Gemini 3.1 Flash-Lite (`gemini-3.1-flash-lite`) via `google-genai` SDK |
| **Fallback LLM** | Groq `llama-3.3-70b-versatile` via `groq` async SDK |
| **Vision / CV** | MediaPipe Face Landmarker (WASM, runs 100 % in-browser) |
| **Speech STT** | Web Speech API (browser-native continuous SpeechRecognition) |
| **Speech TTS** | Web Speech API SpeechSynthesis & Kokoro TTS Integration |
| **Avatar Engine** | AIRA Animated Recruiter Avatar (State-driven SVG / THA3 with lipsync) |
| **Frontend** | React 18, Vite, TypeScript 5, Framer Motion, Vanilla CSS |
| **Auth** | JWT access + refresh tokens (RS256 via `python-jose`), HTTPOnly cookie refresh |
| **DevOps** | Docker, Docker Compose, GitHub Actions |

---

## Project Architecture

```text
smarthire-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # REST endpoints (auth, admin, interview, ats, resumes)
│   │   ├── core/               # Config, security (JWT, deps), lifespan, logging
│   │   ├── db/                 # SQLAlchemy engine, session, enums
│   │   ├── models/             # ORM models (User, Role)
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic (auth, ATS, interview_analysis, interview_finalizer, interview_question_generator)
│   │   ├── repositories/       # DB data-access layer
│   │   ├── middleware/         # CORS, request logging
│   │   └── main.py
│   ├── scripts/                # One-shot admin seeding script
│   ├── alembic/                # Database migrations
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── app/                # Router, providers
│   │   ├── components/         # Layout (DashboardLayout, Sidebar), AIRAAvatar, shared UI
│   │   ├── features/auth/      # AuthContext, useAuth hook
│   │   ├── hooks/              # useAutoInterviewSession, useAIRAVoice, useVideoAnalysis, useSpeechTranscription
│   │   ├── pages/              # Landing, Login, Register, Dashboard (3 roles), Interview, Report
│   │   ├── services/           # apiClient wrappers (auth, interview, ats)
│   │   └── types/              # TypeScript interfaces
│   └── vite.config.ts
├── docs/
├── docker/
└── docker-compose.yml
```

---

## Simplified App Workflow

Below is the complete, high-level workflow illustrating how candidate data, computer vision, real-time speech transcription, and multi-model LLMs interact during an interview session:

```mermaid
flowchart TD
    A[Candidate Starts Session] --> B[Upload Resume & Target Job Description]
    B --> C[Backend PDF/Text Parser & Candidate Profiler]
    C --> D[Dynamic Question Generation\nGemini 3.1 Flash-Lite / Groq Fallback]
    
    D --> E[Interview Room Loaded\nAIRA Avatar & MediaPipe CV Initialized]
    
    subgraph Interview_Loop [Automated Dynamic Interview Loop]
        E --> F[AIRA Avatar Reads Question Aloud\nWeb Speech API / Kokoro TTS]
        F --> G[Candidate Responds via Speech & Video]
        
        G --> H1[Continuous Speech Transcription STT\nWeb Speech API]
        G --> H2[MediaPipe Face Landmarker WASM\n10 fps Gaze, Attention, Smile, Pose]
        
        H1 --> I[2.5s Silence Pause Auto-Submitted]
        H2 --> I
        
        I --> J[Per-Question Multi-Model Evaluation\nGemini 3.1 Flash-Lite / Groq Fallback]
        J --> K{Timer Expired or\nInterview Completed?}
        K -- No --> F
    end
    
    K -- Yes --> L[Holistic Interview Finalizer\nGemini 3.1 Flash-Lite / Groq Fallback]
    L --> M[Candidate Suitability & Assessment Report\nScores, Strengths, Weaknesses, Next Steps]
    M --> N[Candidate & Recruiter Dashboards]
```

### Workflow Steps Overview

```
[Resume & JD Ingestion] ──> [LLM Question Synthesis] ──> [AIRA Avatar Voice Delivery]
                                                                  │
[Candidate Report & Insights] <── [Dual-LLM Evaluation] <── [2.5s Silence STT + WASM CV]
```

1. **Candidate Setup & Resume Parsing**: The candidate selects a target role and uploads a resume (or enters text). The FastAPI backend parses the document using PyMuPDF/pdfplumber to extract key skills and experience.
2. **AI-Driven Question Generation**: Google Gemini 3.1 Flash-Lite (or Groq Fallback) generates tailored, personalized technical and behavioral interview questions specific to the candidate's background.
3. **Avatar & Vision Initialization**: Upon entering the interview room, MediaPipe Face Landmarker launches directly in-browser (WASM) alongside AIRA (AI Recruitment Assistant), initiating camera and microphone access.
4. **Interactive Spoken Interview Loop**:
   - **TTS Delivery**: AIRA reads the question aloud using text-to-speech with natural lip-sync animations.
   - **Multimodal Capture**: Candidate speech is transcribed in real-time via Web Speech API continuous mode while MediaPipe captures non-verbal metrics (eye contact %, attention %, smile intensity, head pose) at 10 fps.
   - **Hands-Free Auto-Submit**: A 2.5-second pause detection automatically submits the answer without requiring manual button interaction.
5. **Per-Question Multi-Model Evaluation**: Each answer is scored across 6 dimensions (*Answer Quality, Communication, Body Language, Confidence, Relevance, Overall Score*).
6. **Executive Assessment Reporting**: The finalizer engine compiles a holistic assessment report featuring candidate suitability notes, score gauges, strengths, weak question callouts, and actionable improvement recommendations.

---

## AI Models Used

SmartHire AI leverages a hybrid architecture combining cloud-based Large Language Models (LLMs), client-side Computer Vision (CV), continuous Speech-to-Text (STT), Text-to-Speech (TTS), and state-driven vector animation:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 SmartHire AI Model Architecture         │
                  └─────────────────────────────────────────────────────────┘
                                               │
         ┌───────────────────────┬─────────────┴─────────────┬───────────────────────┐
         ▼                       ▼                           ▼                       ▼
 ┌──────────────┐        ┌──────────────┐           ┌──────────────────┐    ┌──────────────────┐
 │ Primary LLM  │        │ Fallback LLM │           │ Computer Vision  │    │ Speech & Avatar  │
 │ Gemini 3.1   │        │ Groq Llama   │           │ MediaPipe WASM   │    │ Web Speech API   │
 │  Flash-Lite  │        │  3.3-70b     │           │ Face Landmarker  │    │   & AIRA Engine  │
 └──────────────┘        └──────────────┘           └──────────────────┘    └──────────────────┘
```

---

### 1. Google Gemini 3.1 Flash-Lite — Primary Evaluator

| Property | Value |
|----------|-------|
| **Model Identifier** | `gemini-3.1-flash-lite` (Configurable via `GEMINI_MODEL` in `.env`) |
| **SDK / Runtime** | `google-genai` (Python 1.0+ async client) |
| **Role in App** | Personalized question generation, per-question answer evaluation, resume analysis, and full-interview report finalization |
| **Output Format** | Structured JSON via `response_mime_type="application/json"` |
| **Temperature** | 0.3 (per-question analysis) · 0.4 (final report compilation) · 0.7 (question generation) |
| **Token Budget** | 1,024 tokens (per question) · 2,048 tokens (final report & question synthesis) |

**Evaluation Capabilities:**
- **`answer_quality_score`** — Technical accuracy, STAR structure, and depth
- **`communication_score`** — Speech clarity, vocabulary, and articulation
- **`body_language_score`** — Eye contact consistency, posture stability, and affect
- **`confidence_score`** — Composite signal derived from verbal and visual cues
- **`relevance_score`** — Direct alignment between answer and prompt
- **`overall_score`** — Weighted aggregate scoring (0–100)

**Final Report Output:**
- `recommendation` (`Strong Recommend | Recommend | Neutral | Do Not Recommend`)
- `candidate_suitability_notes` (Behavioral traits & domain readiness)
- `top_strengths` & `top_improvements`
- `communication_summary` & `body_language_summary`
- `weak_question_indices` (Questions scoring below 60/100)

---

### 2. Groq llama-3.3-70b-versatile — Automatic Fallback

| Property | Value |
|----------|-------|
| **Model Identifier** | `llama-3.3-70b-versatile` |
| **SDK / Runtime** | `groq` async Python SDK |
| **Role in App** | High-speed, low-latency automatic fallback evaluator & generator |
| **Output Format** | Structured JSON via `response_format={"type": "json_object"}` |
| **Activation Triggers** | `GOOGLE_API_KEY` missing · Rate limit (429) · Quota exhaustion · Network/API exception |

**Fallback Architecture Guarantee:** Groq uses identical system prompts, scoring rubrics, temperature settings, and Pydantic schemas. Fallbacks occur transparently to the user within milliseconds.

---

### 3. MediaPipe Face Landmarker — In-Browser Vision Analysis

| Property | Value |
|----------|-------|
| **Runtime Engine** | WebAssembly (WASM), 100% client-side (zero server video streaming) |
| **Model Asset** | `face_landmarker.task` |
| **Sampling Rate** | 10 frames per second (fps) continuous tracking |
| **Metrics Calculated** | Eye contact %, attention %, blink rate/min, smile score %, head pose (yaw/pitch/roll mean & std-dev), face presence %, body-language confidence score |

These metrics are aggregated across each answer window and supplied directly to the LLMs for holistic multimodal scoring.

---

### 4. Web Speech API — Real-Time Speech Recognition (STT)

| Property | Value |
|----------|-------|
| **Runtime Engine** | Browser-native (Chromium/Edge) SpeechRecognition API |
| **Mode** | Continuous recognition (`continuous = true`) with interim & final transcript buffering |
| **Feature Set** | Real-time live caption overlay, transcript accumulation, and 2.5s silence pause detection for hands-free auto-submission |
| **Compatibility Guard** | Automatic warning banner displayed for unsupported browsers (Firefox, Safari) |

---

### 5. Web Speech API & Kokoro TTS — Speech Synthesis & Voice Engine

| Property | Value |
|----------|-------|
| **Runtime Engine** | Browser SpeechSynthesis API & Kokoro TTS integration |
| **Voice Persona** | Preferred female HR recruiter voices (*Google UK/US English Female, Microsoft Zira/Aria*) |
| **Speech Tuning** | Rate: `0.92` (measured pacing) · Pitch: `1.05` (professional & engaging) |
| **Dynamic Duration** | Automatic sentence/word-count estimation preventing speech cutoff during long questions |

---

### 6. AIRA Avatar Engine — Interactive AI Recruiter Character

| Property | Value |
|----------|-------|
| **Component Name** | AIRA (AI Recruitment Assistant) |
| **Architecture** | State-driven vector SVG / THA3 animated character (`AIRAAvatar.tsx`) |
| **Expression States** | 😊 Greeting · 👄 Speaking · 👂 Listening · 🤔 Thinking · 🎉 Encouraging |
| **Animations** | 4-frame cycling lipsync (120ms intervals), random blinking (2.5s–4.5s), ambient floating idle loop, glowing state rings, and encouraging particle effects |

---

## Latest Implementation & Features

### High-Level Overview

Today's session took the project from a functional auth scaffold to a fully integrated, AI-powered interview assessment platform with a complete admin control panel. Work spanned 9 sequential phases:

```
Auth hardening → Interview pipeline design → Dual-LLM integration
→ Frontend wiring → Admin panel → RBAC cleanup → Dynamic Questioning & Timer Gating
→ Robust Real-Time Speech STT → Continuous Questioning & Resume Parsing
```

---

### Phase 1 — Auth & Database Resilience

**Problem:** Windows PostgreSQL 18 intermittently enters recovery mode during checkpoints, causing `CannotConnectNowError` on startup.

**Solutions implemented:**

- **`backend/app/core/lifespan.py`** — Added `_wait_for_db()` with exponential backoff (retries up to 10 × with 1 s → 30 s delay). The app won't accept requests until the DB is confirmed healthy.
- **`backend/app/db/database.py`** — Added `connect_args` (`command_timeout=60`, `statement_timeout=30000`) to `create_async_engine`. Reduced `pool_recycle` to 600 s.
- **`backend/.env`** — Tuned `DATABASE_POOL_TIMEOUT` and `DATABASE_POOL_RECYCLE`.
- Fixed `UnicodeEncodeError` on Windows cp1252 terminals by replacing UTF-8 checkmark characters in log output with ASCII equivalents.

---

### Phase 2 — Interview Analysis Pipeline

**Architecture design:**

```
User speaks answer
       ↓
Web Speech API → live transcript
       ↓                           ↘
MediaPipe (10 fps)          transcript text
       ↓
VisionMetrics struct
       ↓
POST /interview/analyze-question  ← one call per question
       ↓
InterviewAnalysisService → Gemini 3.1 / Groq fallback
       ↓
QuestionAnalysisResult (6 scores + feedback)
       ↓ (after all questions)
POST /interview/finalize
       ↓
InterviewFinalizerService → Gemini 3.1 / Groq fallback
       ↓
InterviewFinalizeResponse (overall report + weak questions)
       ↓
ReportPage (full visual report)
```

**New files created:**
- `backend/app/services/interview_analysis.py` — Per-question LLM service
- `backend/app/services/interview_finalizer.py` — Full-interview report service
- `backend/app/api/v1/endpoints/interview.py` — Two REST endpoints
- `backend/app/schemas/interview.py` — All Pydantic schemas

**Auth on interview endpoints:** Uses `verify_jwt_only` (pure JWT decode, no DB round-trip) since the endpoints are fully stateless.

---

### Phase 3 — Gemini 2.5 + Groq Dual-Model Integration

**Implementation pattern** (same in both services):

```python
try:
    result = await self._call_gemini(prompt)   # Primary
except HTTPException:
    raise                                        # 422 parse errors: don't retry
except Exception as gemini_err:
    logger.warning("Gemini unavailable — falling back to Groq")
    result = await self._call_groq(prompt)      # Fallback
```

**Key implementation details:**
- Gemini uses `client.aio.models.generate_content()` with `response_mime_type="application/json"` to force structured output
- Groq uses `response_format={"type": "json_object"}` for equivalent JSON mode
- Both share identical system prompts and response schemas
- JSON extraction strips markdown fences before parsing (`_extract_json()`)
- Pydantic `model_validate()` validates all 6 score fields before returning

**New security dependency added:**
```python
# backend/app/core/security/dependencies.py
async def verify_jwt_only(token: str | None = Depends(oauth2_scheme)) -> dict:
    """Validates JWT cryptographically — no DB round-trip."""
```

---

### Phase 4 — Frontend Interview Pipeline

**401 fix:** The original `interview.ts` used `fetch()` + `localStorage.getItem("access_token")`. The app stores tokens **in-memory only** via `setAccessToken()` in `lib/axios.ts`. Fix: switched to `apiClient` (axios), which auto-injects the Bearer token via the request interceptor.

**Frontend hooks:**

| Hook | Responsibility |
|------|----------------|
| `useAutoInterviewSession` | Orchestrates full automated interview: question cycling, transcript collection, vision metric aggregation, per-question API calls, finalization |
| `useAIRAVoice` | Browser-native TTS voice engine with female voice selection, pacing controls, and mouth sync state |
| `useVideoAnalysis` | MediaPipe Face Landmarker — streams 10 fps analysis, accumulates running averages |
| `useSpeechTranscription` | Web Speech API wrapper with browser support detection and live caption state |

**Pages:**
- `InterviewPage.tsx` — Full interview UI: setup screen, webcam feed, live captions, question display, progress, timer
- `ReportPage.tsx` — Visual report: overall score gauge, per-question breakdown, strengths/improvements, weak question callouts, recommendation badge

---

### Phase 5 — Admin Control Panel

**Backend — 12 admin endpoints** (`/api/v1/admin/`):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/recruiters/pending` | Pending approval queue |
| GET | `/recruiters` | All recruiters (any status) |
| POST | `/recruiters/{id}/approve` | Approve recruiter |
| POST | `/recruiters/{id}/reject` | Suspend recruiter |
| DELETE | `/recruiters/{id}` | Hard-delete recruiter |
| GET | `/users` | All platform users |
| POST | `/users/{id}/activate` | Re-enable account |
| POST | `/users/{id}/deactivate` | Disable account |
| GET | `/stats` | Live platform counts |
| GET | `/health` | **Live DB + Gemini + Groq probes** |
| GET | `/config/keys` | Retrieve masked API key status |
| PUT | `/config/keys` | Update Gemini / Groq API keys at runtime |

**Frontend — `AdminDashboardPage.tsx` (5 tabs):**

| Tab | Features |
|-----|----------|
| **Overview** | 6 live stat cards (total users, recruiters, candidates, pending, active, suspended) · Quick-action tiles · Pending count badge |
| **Recruiters** | Search + filter (All / Pending / Active / Suspended) · Inline Approve / Suspend / Reinstate / Delete · Confirmation dialogs · Toast notifications |
| **All Users** | Search · Role badge · Activate / Deactivate toggle · Last login column |
| **System Health** | Live concurrent probes for PostgreSQL, Gemini 3.1 Flash-Lite, Groq llama-3.3-70b · Latency in ms · Color-coded status |
| **API Keys** | Runtime API key management for `GOOGLE_API_KEY` and `GROQ_API_KEY` with masked previews and `.env` persistence |

---

### Phase 6 — Role-Based Access & Navigation

**Final nav configuration per role:**

| Role | Navigation Items |
|------|-----------------|
| **Admin** | Dashboard · Recruiters · Users · System Health · API Keys |
| **Recruiter** | Dashboard · Candidates · Job Posts · Analytics |
| **Candidate** | Dashboard · Resume · Mock Interviews · AI Reports |

---

### Phase 7 — Dynamic Questioning, Timer Gating & Suitability Reporting

**Key Enhancements Implemented:**

1. **⏱️ Configurable Interview Timer & Test Mode**
   - Candidates can select interview durations: **2 min (Test), 5 min, 10 min, 15 min, 20 min, 30 min**.
2. **🛡️ Timer-Aware Question Gating & Graceful Timeout**
   - Enforced a **45-second minimum threshold**. If under 45s remain, AIRA stops generating new questions and smoothly transitions to finalization.
3. **🔊 Verbal & Visual Time Warnings**
   - AIRA verbally announces **"1 minute remaining"** and **"30 seconds left"** without interrupting ongoing speech.
4. **💬 Follow-Up Probes for Weak Answers**
   - When an answer scores below 40 or contains under 30 words, AIRA prompts for elaboration: *"I didn't quite get a complete answer there. Could you explain your answer in a bit more detail?"*
5. **📊 Candidate Suitability Reporting**
   - Generates `candidate_suitability_notes` rendered on `ReportPage.tsx`.

---

### Phase 8 — Robust Real-Time Speech Transcription & Automated Interview Flow

**Key Enhancements & Reliability Fixes:**

1. **👤 Candidate Name Personalization**: Candidate names parsed from resumes or auth state are passed to AIRA TTS greetings and LLM prompt templates.
2. **🎙️ Continuous Speech Recognition Mode**: Enabled `continuous = true` in `useSpeechTranscription` with a 3-point lifecycle guard pattern protecting recognition instances from stale `onend` loops.
3. **⚡ Hands-Free 2.5-Second Silence Auto-Submission**: Automatically submits answers after 2.5 seconds of detected pause.

---

### Phase 9 — Continuous Dynamic Questioning, Resume Parsing & Candidate Dashboard Overhaul

**Key Enhancements & Bug Fixes:**

1. **⏱️ Dynamic Interview Flow & Removal of Question Cap**: Removed fixed 5-question limit; AIRA dynamically asks questions until time expires or candidate ends early.
2. **🗣️ Intelligent Speech Duration (TTS)**: Dynamic duration estimation based on question word count prevents speech cutoff during long questions.
3. **📄 Automatic Resume Ingestion**: Endpoint `GET /api/v1/resumes/{id}/text` parses uploaded PDF resumes using PyMuPDF / pdfplumber.
4. **📊 Report Persistence**: Evaluated reports persist to `sessionStorage` (`last_interview_report`), keeping stats active across page refreshes.

---

## Folder Structure

```text
smarthire-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # REST API routes (auth, admin, interview, ats, resumes)
│   │   ├── core/               # App configuration, security, lifespan, logging
│   │   ├── db/                 # Database engine, sessions, enums
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── repositories/       # Data access layer
│   │   ├── schemas/            # Pydantic schemas
│   │   └── services/           # Business logic & LLM services
│   ├── alembic/                # Database migrations
│   └── scripts/                # Utility scripts
├── frontend/
│   ├── src/
│   │   ├── app/                # Application router & providers
│   │   ├── components/         # UI components & AIRA avatar
│   │   ├── features/           # Auth context & hooks
│   │   ├── hooks/              # Custom hooks for speech, vision, voice & interview
│   │   ├── pages/              # Role dashboards, setup, interview, & report pages
│   │   ├── services/           # Axios API services
│   │   └── types/              # TypeScript definitions
│   └── index.html
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.12+, `uv` package manager
- Node.js 20+, npm
- PostgreSQL 18

### Backend Setup

```bash
cd backend
uv sync                          # Install dependencies
cp .env.example .env             # Configure environment variables
uv run alembic upgrade head      # Run database migrations
uv run python scripts/create_admin.py   # Seed admin user
uv run uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev                      # Starts on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/smarthire
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20
DATABASE_POOL_TIMEOUT=30
DATABASE_POOL_RECYCLE=600

# JWT
SECRET_KEY=your-256-bit-secret
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI Models — at least one required
GOOGLE_API_KEY=your_gemini_key       # Primary: Gemini 3.1 Flash-Lite
GROQ_API_KEY=gsk_...                 # Fallback: llama-3.3-70b-versatile
```

If `GOOGLE_API_KEY` is blank, **all analysis requests automatically fall back to Groq** — no code change required.

---

## Database Migration Workflow

```bash
uv run alembic revision --autogenerate -m "message"
uv run alembic upgrade head
uv run alembic downgrade -1
uv run alembic current
uv run alembic history
```

---

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable, releasable work only |
| `develop` | Integration branch |
| `feature/*` | New features and enhancements |
| `fix/*` | Bug fixes and corrective changes |
| `chore/*` | Maintenance, tooling, non-product updates |

---

## License

[MIT](LICENSE)
