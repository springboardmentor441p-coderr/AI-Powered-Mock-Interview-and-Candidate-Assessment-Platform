# SmartHire AI — AI-Powered Mock Interview & Candidate Assessment Platform

SmartHire AI is a full-stack web application that helps candidates practice interviews using an AI-powered interviewer and receive structured performance feedback.

The platform combines resume analysis, AI mock interviews, speech interaction, interview history, assessments, and recruiter/admin views into a single application.

---

## 🚀 Project Overview

SmartHire AI is designed to simulate a realistic interview experience while helping candidates understand their strengths and areas for improvement.

### Main Workflow

1. Candidate creates an account and logs in.
2. Candidate uploads their resume.
3. The system analyzes the uploaded resume.
4. Candidate configures a mock interview.
5. AI generates and asks interview questions.
6. Candidate answers the questions.
7. Speech can be transcribed using Deepgram.
8. Interview responses are evaluated.
9. Candidate can view interview history and assessment results.
10. Recruiters/admins can review candidate assessment information.

---

## ✨ Key Features

### 🔐 Authentication

- Candidate and recruiter account types
- User registration and login
- Protected application routes
- JWT-based authentication
- Role-based access

### 📄 Resume Management

- Resume upload
- Resume information extraction
- Resume-based interview context
- Resume-aware interview questions

### 🤖 AI Mock Interview

- AI-powered interviewer
- Configurable interview sessions
- Role-based interview questions
- Difficulty selection
- Experience-level selection
- Interview duration configuration
- Follow-up questions based on the conversation
- Conversation memory

### 🎤 Voice & Interview Experience

- Microphone support
- Webcam permission preview
- Video-call style interview interface
- Speech transcription using Deepgram
- AI interviewer interface
- Start, answer, next-question, and end-interview controls

> Camera and microphone features are used for the interview experience. The platform does not use them to make automated hiring decisions.

### 📊 Assessment & Feedback

- Interview response evaluation
- Practice scores
- Interview history
- Assessment results
- Candidate performance feedback
- Structured coaching-oriented feedback

### 👥 Recruiter / Admin Features

- Recruiter assessment dashboard
- Candidate search
- Candidate assessment information
- Candidate name and interview information
- Response completion information
- Practice scores

The assessment features are intended to support interview practice and coaching and should not be used as the sole basis for a hiring decision.

---

## 🆕 Latest UI Improvements

The latest version includes an improved application sidebar and navigation experience.

### Sidebar Improvements

- Updated application sidebar
- Cleaner navigation structure
- Candidate-oriented navigation
- Improved dashboard navigation
- Interview history navigation
- Profile and settings navigation
- Resume-related navigation
- Improved overall application layout

### Additional Interface Components

- Notification interface
- Candidate shell/layout
- Dashboard KPI components
- Interview history page
- Profile page
- Question bank page
- Settings page
- Resume studio
- Improved interview room interface

---

## 🏗️ Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS
- HTML

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication

### AI & Speech

- AI/LLM integration
- Resume analysis
- Interview question generation
- Conversation memory
- Deepgram speech transcription

### DevOps

- Docker
- Docker Compose
- PostgreSQL Docker container
- FastAPI Docker container
- React/Vite frontend Docker container

---

## 📁 Project Structure

```text
SmartHire-AI/
│
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── security.py
│   │
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── requirements-dev.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── speech/
│   │   ├── api/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── api-documentation.md
│   ├── database-schema.md
│   ├── requirements.md
│   └── wireframes.md
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md