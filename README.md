# SmartHire-AI: AI-Powered Mock Interview & Candidate Assessment Platform

SmartHire-AI is a full-stack, AI-powered mock interview platform featuring **Mira**, an autonomous AI Technical Interviewer driven by **Groq Large Language Models (LLM)** model `openai/gpt-oss-120b`. The platform provides dynamic question generation, adaptive follow-ups, resume skill extraction, live speech-to-text transcript processing, camera stream tracking, truthful system diagnostics, multi-dimensional scoring rubrics, and downloadable PDF performance report cards.

---

## 🤖 Groq LLM Integration Architecture

The platform uses **Groq LLM (`openai/gpt-oss-120b`)** for dynamic, non-hardcoded interview question generation and answer evaluation:

```
┌────────────────────────────────────────────────────────┐
│ 1. Resume Parsing & Skill Extraction                    │
│    - Extracts text from candidate resumes               │
│    - Identifies technical skills, experience & keywords  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. Dynamic Groq LLM Question Generator                  │
│    - Model: openai/gpt-oss-120b                        │
│    - Generates target domain & difficulty questions     │
│    - Repetition Filter: Rejects questions >50% similar  │
│      to previously asked session questions             │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. Autonomous AI Interviewer ("Mira")                  │
│    - Conducts Q&A interview dialogue                   │
│    - Speaks prompts via Web Speech Synthesis           │
│    - Captures candidate responses via Speech-to-Text    │
│    - Adaptive Follow-Ups: Asks relevant follow-ups     │
│      based on candidate's previous answer              │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. Groq LLM Answer Evaluation Engine                    │
│    - Evaluates technical accuracy, depth & clarity     │
│    - Logs unanswered questions as "Unanswered" (0 score)│
│    - Generates per-question breakdown & summary report │
└────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Features

1. **Mira AI Interviewer**: Professional AI hiring manager conducting dynamic, conversational technical interviews.
2. **Groq LLM Engine**: Uses Groq model `openai/gpt-oss-120b` for dynamic structured JSON question generation and candidate answer scoring.
3. **Dynamic Question Generation (No Hardcoded Bank)**: Every interview generates unique questions based on domain, difficulty, candidate skills, and previous questions (with similarity filtering).
4. **Adaptive Follow-Up Questions**: After a candidate answer, Mira generates a relevant follow-up question adaptively.
5. **Explicit Unanswered Question Handling**: Unanswered or skipped questions are explicitly stored as `Unanswered` with 0 score without hallucinating fake answers.
6. **Truthful System Readiness Check**: Hardware and API readiness tests check camera, microphone, SpeechRecognition, FastAPI backend, and Groq LLM connectivity.
7. **Comprehensive PDF Assessment**: Generates official evaluation reports with per-question breakdowns (Question, Answer, Status, Technical/Clarity scores, Feedback, Strengths, Weaknesses).

---

## 📁 Repository Sitemap & File Structure

### Backend (Python / FastAPI)
- **API Server & Routing**: [`backend/main.py`](backend/main.py)
- **Groq LLM Service**: [`backend/services/llm_service.py`](backend/services/llm_service.py)
- **Question Generator**: [`backend/services/question_service.py`](backend/services/question_service.py)
- **Resume Parser**: [`backend/services/resume_service.py`](backend/services/resume_service.py)
- **Speech Service**: [`backend/services/speech_service.py`](backend/services/speech_service.py)
- **Vision Stream Processor**: [`backend/services/vision_service.py`](backend/services/vision_service.py)
- **Assessment Scoring**: [`backend/services/scoring_service.py`](backend/services/scoring_service.py)
- **Database ORM**: [`backend/models.py`](backend/models.py) & [`backend/database.py`](backend/database.py)
- **Authentication**: [`backend/auth.py`](backend/auth.py)

### Frontend (React / Vite)
- **AI Agent Interface**: [`frontend/src/services/aiAgent.js`](frontend/src/services/aiAgent.js)
- **AI Interviewer Component**: [`frontend/src/components/AIInterviewerAgent.jsx`](frontend/src/components/AIInterviewerAgent.jsx)
- **Webcam Feed Component**: [`frontend/src/components/WebcamMonitor.jsx`](frontend/src/components/WebcamMonitor.jsx)
- **Audio Waveform**: [`frontend/src/components/AudioWaveform.jsx`](frontend/src/components/AudioWaveform.jsx)
- **Interview Setup View**: [`frontend/src/pages/InterviewSetupPage.jsx`](frontend/src/pages/InterviewSetupPage.jsx)
- **Live Interview Room**: [`frontend/src/pages/InterviewRoomPage.jsx`](frontend/src/pages/InterviewRoomPage.jsx)
- **Assessment Report View**: [`frontend/src/pages/InterviewReportPage.jsx`](frontend/src/pages/InterviewReportPage.jsx)

---

## ⚙️ Environment Variables

Create a `backend/.env` file based on `.env.example`:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
DATABASE_URL=sqlite:///./smarthire.db
SECRET_KEY=smarthire_super_secret_jwt_key_2026
```

---

## 🚀 Local Development Setup

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
FastAPI Swagger documentation will be live at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Application will be live at `http://localhost:3000`.

---

## ⚠️ Computer Vision & Hardware Limitations
- Face presence status is tracked strictly when the webcam stream is active.
- Telemetry indicators display truthful camera status (`Active`, `Initializing`, or `Camera Stream Monitored`) without fabricating fake random percentage metrics.
