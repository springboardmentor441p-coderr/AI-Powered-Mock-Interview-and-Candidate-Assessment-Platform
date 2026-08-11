# SmartHire AI: AI-Powered Mock Interview & Candidate Assessment Platform

SmartHire AI is an end-to-end, state-of-the-art AI mock interview platform featuring a **Conversational LLM AI Hiring Manager Agent ("Sarah")**, webcam vision tracking, speech-to-text telemetry, resume PDF skill parsing, multi-criteria rubric evaluations, and exportable PDF report cards.

---

## 🤖 Large Language Model (LLM) Integration Architecture

The platform leverages **Large Language Model (LLM)** capabilities across 4 core stages:

```
                  ┌──────────────────────────────────────────────────────────┐
                  │ 1. LLM Resume Skill Extraction                           │
                  │    - Scans PDF text, identifies technical competencies,   │
                  │      and constructs executive candidate profiles.        │
                  └────────────────────────────┬─────────────────────────────┘
                                               │
                                               ▼
                  ┌──────────────────────────────────────────────────────────┐
                  │ 2. LLM Adaptive Question & Answer Generator             │
                  │    - Dynamically generates domain & difficulty questions  │
                  │      along with high-score sample answers.               │
                  └────────────────────────────┬─────────────────────────────┘
                                               │
                                               ▼
                  ┌──────────────────────────────────────────────────────────┐
                  │ 3. Conversational LLM AI Agent ("Sarah")                 │
                  │    - Conducts natural human-like voice interview dialogues│
                  │      with real-time conversational follow-ups.            │
                  └────────────────────────────┬─────────────────────────────┘
                                               │
                                               ▼
                  ┌──────────────────────────────────────────────────────────┐
                  │ 4. LLM Answer Evaluation & Feedback Engine               │
                  │    - Evaluates spoken transcripts against rubric factors  │
                  │      and generates strengths, weaknesses & tips.          │
                  └──────────────────────────────────────────────────────────┘
```

---

## 📌 Sitemap & Code File Index for Mentor Evaluation

Mentors can inspect and verify every module and source file directly using this index:

### 📁 Backend Core & AI Services
- **FastAPI Application Server**: [`backend/main.py`](backend/main.py)
- **Database Schemas & ORM**: [`backend/models.py`](backend/models.py)
- **JWT Auth & Passlib Security**: [`backend/auth.py`](backend/auth.py)
- **LLM Resume Skill Extractor**: [`backend/services/resume_service.py`](backend/services/resume_service.py)
- **LLM Question & Answer Engine**: [`backend/services/question_service.py`](backend/services/question_service.py)
- **Speech-to-Text & WPM Telemetry**: [`backend/services/speech_service.py`](backend/services/speech_service.py)
- **MediaPipe Vision Eye Tracking**: [`backend/services/vision_service.py`](backend/services/vision_service.py)
- **LLM Evaluation Scoring Rubric**: [`backend/services/scoring_service.py`](backend/services/scoring_service.py)

### 📁 Frontend UI & Real-Time Components
- **Conversational AI Agent Component**: [`frontend/src/components/AIInterviewerAgent.jsx`](frontend/src/components/AIInterviewerAgent.jsx)
- **MediaPipe Webcam Vision Monitor**: [`frontend/src/components/WebcamMonitor.jsx`](frontend/src/components/WebcamMonitor.jsx)
- **Microphone Audio Visualizer**: [`frontend/src/components/AudioWaveform.jsx`](frontend/src/components/AudioWaveform.jsx)
- **Interactive Interview Simulation Room**: [`frontend/src/pages/InterviewRoomPage.jsx`](frontend/src/pages/InterviewRoomPage.jsx)
- **Candidate Analytics Hub**: [`frontend/src/pages/CandidateDashboard.jsx`](frontend/src/pages/CandidateDashboard.jsx)
- **Resume AI Upload View**: [`frontend/src/pages/ResumeUploadPage.jsx`](frontend/src/pages/ResumeUploadPage.jsx)
- **Downloadable PDF Assessment Report**: [`frontend/src/pages/InterviewReportPage.jsx`](frontend/src/pages/InterviewReportPage.jsx)

---

## 🌟 Feature & Module Verification Matrix

| Module ID | Module Name | Implementation Summary & Tech Used | Verification File Reference | Status |
|---|---|---|---|---|
| **MOD-01** | Security & Auth | JWT Token Auth, bcrypt password hashing, role access control | [`backend/auth.py`](backend/auth.py) | ✅ Verified |
| **MOD-02** | Resume PDF Skill Extractor | Scans PDF binary text & extracts technical competencies | [`backend/services/resume_service.py`](backend/services/resume_service.py) | ✅ Verified |
| **MOD-03** | Adaptive Question Generator | Generates domain-matched questions across 3 difficulty levels | [`backend/services/question_service.py`](backend/services/question_service.py) | ✅ Verified |
| **MOD-04** | Conversational AI Agent | Animated AI hiring agent ("Sarah"), Web Speech voiceover & camera | [`frontend/src/components/AIInterviewerAgent.jsx`](frontend/src/components/AIInterviewerAgent.jsx) | ✅ Verified |
| **MOD-05** | Speech Telemetry & STT | Web Speech STT, WPM calculation & filler-word detection | [`backend/services/speech_service.py`](backend/services/speech_service.py) | ✅ Verified |
| **MOD-06** | MediaPipe Vision Monitor | Webcam eye-contact consistency %, head posture & facial engagement | [`frontend/src/components/WebcamMonitor.jsx`](frontend/src/components/WebcamMonitor.jsx) | ✅ Verified |
| **MOD-07** | LLM Multi-Criteria Scoring | Evaluates performance: Comm (30%), Conf (25%), Tech (30%), Prof (15%) | [`backend/services/scoring_service.py`](backend/services/scoring_service.py) | ✅ Verified |
| **MOD-08** | PDF Report & Analytics Hub | Candidate skill radar breakdown & downloadable PDF assessment report | [`frontend/src/pages/InterviewReportPage.jsx`](frontend/src/pages/InterviewReportPage.jsx) | ✅ Verified |

---

## 📐 Scoring Formula & Performance Rubric

```math
\text{Overall Score} = (0.30 \times \text{Communication}) + (0.25 \times \text{Confidence}) + (0.30 \times \text{Technical Relevance}) + (0.15 \times \text{Professionalism})
```

- **90–100**: Excellent
- **75–89**: Good
- **60–74**: Average
- **40–59**: Needs Improvement
- **Below 40**: Poor

---

## 🚀 How to Run Locally

### Option 1: 1-Click Auto-Launcher (Recommended)
Double-click **`start_app.bat`** in the project folder. It launches the backend server, frontend web app, and opens `http://localhost:3000` automatically.

### Option 2: Manual Execution

#### 1. Start Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
API Documentation available at: `http://localhost:8000/docs`

#### 2. Start Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Application running at: `http://localhost:3000`

---

## 📦 GitHub Repository Sync Instructions

To push all changes to your remote GitHub repository:
```bash
git add .
git commit -m "Update: Added conversational AI interviewer agent, LLM architecture docs, and master README sitemap"
git push origin main
```
