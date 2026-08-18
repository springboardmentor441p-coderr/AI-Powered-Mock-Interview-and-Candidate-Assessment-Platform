# SmartHire AI — AI-Powered Mock Interview & Candidate Assessment Platform

A full-stack platform that lets candidates practice technical, HR, behavioral,
and aptitude interviews with AI-generated questions, a browser-based webcam/mic
interview room with live speech-to-text, an explainable AI scoring engine
(implementing the exact rubric below), and analytics dashboards.

## What's implemented

- **Auth & roles**: JWT authentication, role-based access (Candidate, Recruiter, Admin)
- **Resume upload & skill extraction**: PDF parsing → skills, experience, education, AI summary
- **ATS score checker**: on-demand button computes an Applicant Tracking System compatibility
  score (contact info, section structure, keyword match, achievements/impact, formatting) with
  actionable tips
- **AI interview question generation**: Technical (skill/domain-aware), HR, Behavioral, Aptitude,
  with difficulty levels
- **AI voice interview experience**: the AI ("AIRA") reads each question aloud automatically
  (browser text-to-speech), and the candidate answers **entirely by voice** — the live transcript
  is shown read-only as they speak, with no typing required; auto-submits after 2.5s of silence
- **Two interview modes**:
  - **Timed AI Interview**: pick a job title (e.g. "AI Engineer", "Frontend Developer") and a
    time limit (2/3/5/10 min); AIRA adaptively generates as many questions as fit in the time,
    tailored to that role, instead of a fixed count
  - **Normal Practice**: the classic fixed number of questions, no time pressure
- **Live analysis panel**: Eye Contact / Attention / Confidence / Face Presence bars, driven by
  lightweight client-side webcam frame heuristics (brightness + motion) — see note below
- **Interview session management**: webcam + microphone capture, per-question timer
- **AI scoring engine**: implements the rubric from the spec —
  `Overall = Communication×30% + Confidence×25% + Technical×30% + Professionalism×15%`,
  with sub-scores from NLP heuristics (filler words, grammar proxy, keyword relevance,
  pacing) and client-reported engagement signals
- **AI feedback generation**: strengths, weaknesses, improvement recommendations
- **Notifications**: in-app notifications for resume uploads, interview starts, and completed
  results, with unread badge in the sidebar
- **Downloadable reports**: full text report of any completed interview (scores, feedback,
  Q&A transcript) downloadable as a `.txt` file
- **Dashboards & analytics**: score trend line chart, skill radar chart, interview history,
  recruiter candidate leaderboard
- **Dockerized**: `docker-compose up` runs the whole stack

## What's simplified vs. the original 8-week spec (and why)

The original spec calls for production computer-vision emotion/eye-tracking models
(DeepFace, MediaPipe), a Whisper-based ASR pipeline, and cloud GPU deployment on
AWS/Azure. Those require paid API keys, GPU infrastructure, and trained models that
can't be wired up in this environment. This build keeps the **exact same interfaces
and scoring rubric** so you can swap in real models later without changing the app
architecture:

- `backend/app/services/resume_parser.py` — swap keyword-based extraction for an LLM call
- `backend/app/services/question_generator.py` — swap templates for OpenAI/Claude generation
- `backend/app/services/scoring_engine.py` — swap heuristic sub-scores for Whisper transcription
  quality + DeepFace emotion output + MediaPipe eye-contact percentage
- `frontend/src/pages/InterviewRoom.jsx` — the webcam video stream is already captured client-side;
  the `eyeContact`/`confidenceSignal` values are currently simulated from response timing and are
  the exact spot to feed in real CV model output (e.g. streamed from a backend WebSocket)

## Quick start (Docker — recommended)

```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend API docs (Swagger): http://localhost:8000/docs
- **Database GUI (db-viewer)**: http://localhost:8080 — see "How to view the database" below

## How to view the database

The project uses **SQLite** — a single file (`smarthire.db`), no separate database server needed.

**Web-based GUI (like phpMyAdmin/Mongo Compass, but in-browser for SQLite):**

- **Via Docker**: `docker-compose.yml` already includes a `db-viewer` service. Just open **http://localhost:8080** — you'll see all tables, can run `SELECT * FROM users;`-style queries, filter, and edit rows, entirely in the browser.

- **Running locally without Docker** (e.g. you ran `uvicorn`/`npm run dev` directly, like in VS Code): install and run `sqlite-web` yourself, pointed at your local `backend/smarthire.db`:
  ```bash
  pip install sqlite-web
  sqlite_web backend/smarthire.db
  ```
  This opens a browser tab automatically at **http://localhost:8080** with the same full GUI — no VS Code extension needed.

- Other options: [DB Browser for SQLite](https://sqlitebrowser.org/) (free desktop GUI app) opening `backend/smarthire.db`, or the command line:
  ```bash
  cd backend
  sqlite3 smarthire.db
  .tables
  SELECT * FROM users;
  ```

## Quick start (manual / local dev)

**Backend**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

python -m venv venv
python -m venv venv
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Visit http://localhost:5173 (Vite dev server proxies `/api` to the backend on port 8000).

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy |
| Database | **SQLite** — single file, zero setup, browsable via the built-in web GUI |
| Auth | JWT (python-jose), bcrypt password hashing |
| Frontend | React 18, Vite, React Router, Recharts |
| Resume parsing | pypdf + keyword/regex extraction |
| Deployment | Docker, Docker Compose, Nginx, sqlite-web (DB GUI) |

## Scoring rubric (as specified)

| Category | Weight | Signals |
|---|---|---|
| Communication | 30% | Speech clarity, grammar, filler-word frequency, pace, completeness |
| Confidence | 25% | Eye-contact consistency, facial engagement, hesitation |
| Technical Relevance | 30% | Technical accuracy/keyword relevance, problem-solving, completeness |
| Professionalism | 15% | Time management, response organization, etiquette |

**Rating scale**: 90–100 Excellent · 75–89 Good · 60–74 Average · 40–59 Needs Improvement · <40 Poor

## API overview

All endpoints are under `/api`. See interactive docs at `/docs` once the backend is running.

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/resumes/upload`, `GET /api/resumes/`
- `POST /api/interviews/` (start), `POST /api/interviews/answer`, `POST /api/interviews/{id}/complete`
- `GET /api/interviews/`, `GET /api/interviews/{id}`
- `GET /api/dashboard/summary`, `GET /api/dashboard/recruiter/candidates` (recruiter/admin only)

## Project structure

```
smarthire-ai/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app entrypoint
│   │   ├── models.py          # SQLAlchemy models
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── auth.py            # JWT auth + role-based access
│   │   ├── database.py
│   │   ├── routers/           # auth, resume, interview, dashboard
│   │   └── services/          # resume_parser, question_generator, scoring_engine
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/              # Login, Register, Dashboard, ResumeUpload,
│   │   │                       # StartInterview, InterviewRoom, Results, History, RecruiterView
│   │   ├── api.js              # API client
│   │   └── App.jsx             # Routing & layout
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```
