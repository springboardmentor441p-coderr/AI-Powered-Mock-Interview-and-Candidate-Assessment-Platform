# 🤖 SmartHire AI

### AI-Powered Mock Interview & Candidate Assessment Platform

**SmartHire AI** is an AI-powered mock interview and candidate assessment platform designed to simulate realistic technical and professional interview experiences. It combines a React-based interview interface with a Node.js/Express backend, MongoDB, OpenAI-powered interview generation and feedback, resume processing, webcam/microphone capture, and an extensible scoring and analytics pipeline.

---

# 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Artificial Intelligence Stack](#-artificial-intelligence-stack)
- [AI Workflow](#-ai-workflow)
- [Database Design](#-database-design)
- [Security Features](#-security-features)
- [Project Structure](#-project-structure)
- [REST API Documentation](#-rest-api-documentation)
- [Installation Guide](#-installation-guide)
- [Environment Variables](#-environment-variables)
- [Recommended Test Flow](#-recommended-test-flow)
- [Screenshots](#-screenshots)
- [Milestone Progress](#-milestone-progress)
- [Troubleshooting](#-troubleshooting)
- [Deployment](#-deployment)
- [Project Status](#-project-status)
- [Documentation](#-documentation)
- [Author](#-author)

---

# 📌 Project Overview

SmartHire AI is a full-stack AI-powered mock interview and candidate assessment platform.

The platform is designed around the complete interview loop:

- Candidate authentication and role management
- Resume upload and text extraction
- AI-based resume analysis
- AI-generated interview questions
- Role/domain and difficulty-based interview configuration
- Webcam and microphone-enabled interview room
- Per-question response recording and submission
- Automated candidate scoring
- AI-generated feedback
- Candidate history and recruiter-oriented analytics
- Extensible speech, eye-contact, emotion, and engagement analysis

The current implementation follows a **MERN-style architecture** using React, Node.js, Express, and MongoDB. The project blueprint also defines future integrations for Whisper, MediaPipe, facial/emotion analysis, Cloudinary/S3 storage, SendGrid notifications, and Google OAuth.

### Current Release Status

| Layer | Status |
|-------|--------|
| Frontend | ✅ Implemented with React + Vite |
| Backend | ✅ Implemented with Node.js + Express |
| Database | ✅ MongoDB / Mongoose |
| Authentication | ✅ JWT-based authentication and role middleware |
| Resume Upload | ✅ PDF upload and text extraction |
| AI Interview Generation | ✅ OpenAI integration |
| Interview Room | ✅ Webcam + microphone capture |
| Scoring Engine | ✅ Implemented and unit-tested |
| Feedback & Report | ✅ Implemented |
| Speech / Visual Metrics | ⏳ Extension pipeline / partial implementation |
| Candidate Analytics | ⏳ Stubbed / extensible |
| Recruiter Comparison | ⏳ Stubbed / extensible |
| Email Notifications | ⏳ Planned |
| Google OAuth | ⏳ Planned |
| Cloud Deployment | ⏳ Planned |

---

# 🎯 Objectives

The primary objectives of SmartHire AI are:

- Build a realistic AI-powered mock interview platform.
- Generate interview questions according to role, type, domain, and difficulty.
- Allow candidates to practice using webcam and microphone interaction.
- Analyze uploaded resumes and use candidate information in the interview pipeline.
- Automatically evaluate interview performance.
- Provide structured scores for communication, confidence, technical ability, and professionalism.
- Generate strengths, weaknesses, and improvement suggestions.
- Create a foundation for speech, facial, eye-contact, and engagement analysis.
- Provide candidate history and recruiter-facing assessment capabilities.
- Maintain a modular architecture that can be extended to production-scale deployment.

---

# ✨ Key Features

## 🔐 Authentication & Roles

- JWT-based authentication
- Access and refresh token support
- Candidate / Recruiter / Admin role structure
- Protected routes
- Role-based middleware
- Password hashing with BCrypt
- Google OAuth integration structure
- Secure environment-based configuration

---

## 📄 Resume Management

- PDF resume upload
- Resume text extraction
- Candidate resume storage
- Resume parsing pipeline
- AI-ready structured resume information
- Extracted skills, experience, education, and technologies
- Resume information can be used as context for interview generation

---

## 🤖 AI Interview Generation

Powered by the **OpenAI API**.

The interview generation pipeline supports:

- Role/domain-specific questions
- Difficulty-based question generation
- Interview-type-specific questioning
- Resume-aware interview preparation
- Structured question sets
- Interview session creation

The interview configuration shown in the UI allows candidates to select:

- Job Role
- Difficulty Level
- Interview session settings

---

## 🎤 Interactive Interview Room

SmartHire AI provides a dedicated interview environment with:

- Question-by-question interview flow
- Webcam access
- Microphone access
- Per-question response recording
- Response submission
- Interview timer
- Previous / Next navigation
- Real-time answer capture
- Session completion flow

The current UI is designed to resemble a realistic online interview environment.

---

## 📊 Candidate Scoring Engine

The scoring engine evaluates four major dimensions:

| Metric | Weight |
|--------|-------:|
| Communication | 30% |
| Confidence | 25% |
| Technical | 30% |
| Professionalism | 15% |

### Overall Score

```text
Overall Score =
    Communication × 0.30
  + Confidence × 0.25
  + Technical × 0.30
  + Professionalism × 0.15
```

### Rating Scale

| Score | Rating |
|------:|--------|
| 90+ | Excellent |
| 75–89 | Good |
| 60–74 | Average |
| 40–59 | Needs Improvement |
| < 40 | Poor |

The scoring function is designed as a pure, testable component so that downstream AI/analytics modules can be changed without rewriting the scoring logic.

---

## 🧠 AI Feedback & Assessment

After an interview, the platform is designed to produce:

- Overall performance score
- Category-wise scores
- Strengths
- Weaknesses
- Improvement suggestions
- Interview report
- Candidate performance history

The feedback pipeline can be extended to combine transcript data, question context, and interview metrics.

---

## 🎥 Interview Monitoring

The architecture supports an additional real-time monitoring layer.

Planned/extendable metrics include:

- Speech-to-text
- Filler-word detection
- Speaking pace
- Grammar analysis
- Eye-contact percentage
- Facial emotion signals
- Engagement score
- Visual attention metrics

The repository blueprint specifies **Whisper**, **MediaPipe Face Mesh**, and **face-api.js / DeepFace** as the intended technologies for these analysis pipelines.

---

## 📈 Analytics

The platform includes the foundation for:

- Candidate interview history
- Interview reports
- Score tracking
- Skill-level assessment
- Candidate comparison
- Recruiter analytics

The report architecture is designed to support visualizations such as radar charts and future Recharts dashboards.

---

## 🧑‍💼 Recruiter Features

The recruiter-side architecture supports:

- Viewing candidate assessment results
- Candidate comparison
- Interview report access
- Performance-based evaluation
- Candidate shortlisting workflow

The recruiter comparison functionality is currently part of the analytics extension roadmap.

---

## 🛡️ Admin Features

The role-based architecture supports administrative capabilities such as:

- User management
- Role-based access
- Platform-level visibility
- Administrative controls

---

# 🏗️ System Architecture

```text
                         +---------------------------+
                         |      React Frontend       |
                         |     Vite + Tailwind       |
                         |  Interview UI + Webcam    |
                         +-------------+-------------+
                                       |
                                       | Axios / REST API
                                       |
                         +-------------v-------------+
                         |      Express Backend      |
                         |         Node.js           |
                         |                           |
                         | Auth • Resume • Interview |
                         | Scoring • Analytics       |
                         +-------------+-------------+
                                       |
                 ----------------------+----------------------
                 |                     |                     |
        +--------v--------+   +--------v--------+   +--------v--------+
        |    MongoDB      |   |   OpenAI API    |   | AI / ML Layer   |
        |    Mongoose     |   | Questions       |   | Whisper         |
        | Users           |   | Feedback        |   | MediaPipe       |
        | Resumes         |   | Assessment      |   | face-api.js     |
        | Interviews      |   |                 |   | DeepFace        |
        +-----------------+   +-----------------+   +-----------------+
```

---

# ⚙️ Technology Stack

## Frontend

| Technology | Purpose |
|------------|---------|
| React 18 | User Interface |
| Vite | Frontend build tool |
| Tailwind CSS | Styling |
| React Router DOM | Routing |
| Axios | API communication |
| Recharts | Data visualization |
| Framer Motion | UI animation |
| Lucide React | Icons |
| MediaPipe Camera Utils | Camera processing |
| MediaPipe Face Mesh | Face landmark processing |
| face-api.js | Facial analysis extension |

---

## Backend

| Technology | Purpose |
|------------|---------|
| Node.js | Backend runtime |
| Express.js | REST API framework |
| MongoDB | Database |
| Mongoose | MongoDB ODM |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Multer | File uploads |
| pdf-parse | PDF text extraction |
| OpenAI SDK | AI integration |
| Passport | OAuth architecture |
| SendGrid | Email integration |
| Morgan | HTTP request logging |
| Jest | Testing |
| Supertest | API testing |
| Nodemon | Development server |

---

# 🤖 Artificial Intelligence Stack

## Large Language Model

**OpenAI API** is used for the AI layer, including:

- Interview question generation
- Interview-specific question sets
- AI feedback
- Candidate assessment
- Future transcript-based technical/professionalism evaluation

---

## Speech Processing

The project architecture defines:

**OpenAI Whisper**

for:

- Speech-to-text
- Interview transcripts
- Speech metrics
- Filler-word analysis
- Speaking pace calculation

---

## Eye Contact Detection

The planned visual-analysis pipeline uses:

**MediaPipe Face Mesh**

for:

- Facial landmarks
- Eye/face orientation
- Eye-contact estimation
- Attention-related metrics

---

## Emotion Recognition

The architecture supports:

- **face-api.js** for client-side facial analysis
- **DeepFace** as a possible server-side emotion-analysis option

---

# 🧠 AI Workflow

```text
Candidate Registration
        │
        ▼
Resume Upload
        │
        ▼
PDF Text Extraction
        │
        ▼
Resume Parsing / AI Context
        │
        ▼
Select Job Role + Difficulty
        │
        ▼
Generate Interview Questions
        │
        ▼
Create Interview Session
        │
        ▼
Interview Room
   ├── Webcam
   ├── Microphone
   ├── Timer
   └── Question Navigation
        │
        ▼
Record / Submit Response
        │
        ▼
Scoring Engine
   ├── Communication
   ├── Confidence
   ├── Technical
   └── Professionalism
        │
        ▼
AI Feedback
        │
        ▼
Report / Analytics
        │
        ▼
Candidate History / Recruiter Review
```

---

# 🗄️ Database Design

The MongoDB/Mongoose architecture is centered around the following entities:

| Collection / Model | Description |
|--------------------|-------------|
| Users | Candidate, recruiter and admin accounts |
| Resumes | Uploaded resume information |
| InterviewSessions | Interview session metadata |
| Questions | Generated interview questions |
| Responses | Candidate interview responses |
| ScoreReports | Interview scores and assessment |
| Analytics | Candidate and recruiter analytics |

### Resume

```text
{
  userId,
  fileUrl,
  rawText,
  parsedData: {
    skills[],
    experience[],
    education[],
    technologies[]
  },
  summary,
  createdAt
}
```

### Interview Session

```text
{
  userId,
  type,
  domain,
  difficulty,
  status,
  startedAt,
  completedAt,
  questionIds[],
  responseIds[]
}
```

### Response

```text
{
  sessionId,
  questionId,
  audioUrl,
  videoUrl,
  transcript,
  speechMetrics: {
    fillerWordCount,
    pace_wpm,
    grammarScore
  },
  visualMetrics: {
    eyeContactPct,
    emotionScores,
    engagementScore
  },
  createdAt
}
```

### Score Report

```text
{
  sessionId,
  userId,
  communicationScore,
  confidenceScore,
  technicalScore,
  professionalismScore,
  overallScore,
  rating,
  strengths[],
  weaknesses[],
  suggestions[],
  createdAt
}
```

---

# 🔒️ Security Features

- JWT authentication
- Access and refresh tokens
- BCrypt password hashing
- Role-based authorization
- Protected API routes
- Protected frontend routes
- Environment variables for secrets
- Resume upload handling
- Input validation at API boundaries
- MongoDB/Mongoose data modeling
- CORS configuration
- OAuth architecture for Google sign-in
- `.env` excluded from source control

> **Security note:** Never commit real API keys, JWT secrets, database credentials, OAuth secrets, or Cloudinary credentials to GitHub. Use `backend/.env` locally and keep only placeholder values in `.env.example`.

---

# 📁 Project Structure

```text
smarthire-ai/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── app.js
│   │
│   ├── tests/
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.jsx
│   │
│   ├── Dockerfile
│   ├── package.json
│   └── package-lock.json
│
├── screenshots/
│   ├── home.png
│   └── interview-room.png
│
├── docker-compose.yml
├── SmartHire_AI_Blueprint.md
└── README.md
```

---

# 🌐 REST API Documentation

The project blueprint defines the following core API contract.

## Authentication APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Google authentication |
| POST | `/api/auth/refresh` | Refresh access token |

---

## Resume APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/upload` | Upload resume |
| GET | `/api/resume/:id` | Get resume |

---

## Interview APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interview/generate` | Generate interview questions |
| POST | `/api/interview/:id/start` | Start interview |
| POST | `/api/interview/:id/response` | Submit response |
| POST | `/api/interview/:id/complete` | Complete interview |
| GET | `/api/interview/:id/report` | Get interview report |

---

## Analytics APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/candidate/:userId` | Candidate analytics |
| GET | `/api/analytics/recruiter/candidates` | Recruiter candidate comparison |

---

# ⚙️ Installation Guide

## Prerequisites

Install:

- Node.js
- npm
- MongoDB
- Git
- Docker Desktop (optional)

Verify:

```bash
node --version
npm --version
git --version
```

For a local MongoDB installation:

```bash
mongosh
```

---

# 📥 Clone Repository

```bash
git clone https://github.com/springboardmentor441p-coderr/AI-Powered-Mock-Interview-and-Candidate-Assessment-Platform.git
cd AI-Powered-Mock-Interview-and-Candidate-Assessment-Platform/smarthire-ai
```

Switch to the project branch if required:

```bash
git checkout Aditya_Gupta
```

---

# 🟢 Backend Setup

```bash
cd backend
npm install
```

Create your local environment file:

```bash
copy .env.example .env
```

On Linux/macOS:

```bash
cp .env.example .env
```

Add your own MongoDB URI, JWT secrets and OpenAI API key.

Start the backend:

```bash
npm run dev
```

The backend is configured around:

```text
http://localhost:5000
```

For a production-style start:

```bash
npm start
```

---

# ⚛️ Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs on:

```text
http://localhost:5173
```

Build the frontend:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

# 🐳 Docker Setup

The repository includes Docker Compose configuration for:

- MongoDB
- Backend
- Frontend

Run:

```bash
docker compose up --build
```

Stop the containers:

```bash
docker compose down
```

---

# 🔐 Environment Variables

Create:

```text
backend/.env
```

Use the following structure:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

OPENAI_API_KEY=your_openai_api_key

SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=your_sender_email

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

FRONTEND_URL=http://localhost:5173
```

Do not commit `.env`.

---

# 🧪 Testing

The backend uses **Jest** and **Supertest**.

Run:

```bash
cd backend
npm test
```

The current test suite includes coverage for the scoring engine.

Example scoring logic:

```javascript
function computeOverallScore({
  communication,
  confidence,
  technical,
  professionalism
}) {
  return (
    communication * 0.30 +
    confidence * 0.25 +
    technical * 0.30 +
    professionalism * 0.15
  );
}
```

---

# 🧪 Recommended Test Flow

1. Start MongoDB.
2. Start the backend.
3. Start the React frontend.
4. Register as a Candidate.
5. Login.
6. Upload a PDF resume.
7. Generate an interview.
8. Select job role and difficulty.
9. Allow webcam and microphone permissions.
10. Start the interview.
11. Answer each question.
12. Submit responses.
13. Complete the interview.
14. Review score and feedback.
15. Test recruiter/admin routes where available.
16. Run backend tests.

---

# 📸 Screenshots

## Home / Interview Setup

The SmartHire AI interface allows the candidate to select a job role and difficulty level before starting the interview.

<img src="screenshots/home.png" alt="SmartHire AI Interview Setup" width="100%">

---

## AI Interview Room

The interview room provides the question interface, timer, microphone/camera controls, answer capture area, and navigation controls.

<img src="screenshots/interview-room.png" alt="SmartHire AI Interview Room" width="100%">

---

# 📈 Milestone Progress

## ✅ Milestone 1 — Foundation

- Repository structure
- MongoDB/Mongoose architecture
- JWT authentication
- Role-based middleware
- React frontend shell
- Backend REST API structure

## ✅ Milestone 2 — Resume → Interview Pipeline

- Resume upload
- PDF text extraction
- Resume processing
- OpenAI interview generation
- Role/difficulty-based interview configuration
- Interview session management

## ✅ Milestone 3 — Interview Experience

- Interview room
- Webcam access
- Microphone access
- Per-question response capture
- Interview timer
- Response submission
- Interview completion

## ✅ Milestone 4 — Scoring & Feedback

- Weighted scoring engine
- Unit tests
- Communication score
- Confidence score
- Technical score
- Professionalism score
- Overall rating
- Feedback/report architecture

## ⏳ Milestone 5 — Advanced AI Monitoring

Planned extensions:

- Whisper speech-to-text
- Filler-word detection
- Speaking pace
- Grammar analysis
- MediaPipe eye-contact estimation
- Emotion analysis
- Engagement metrics

## ⏳ Milestone 6 — Production Analytics

Planned extensions:

- Candidate history dashboard
- Recruiter comparison dashboard
- Email notifications
- Google OAuth completion
- Cloud storage
- Production deployment

---

# 🛠️ Troubleshooting

### MongoDB connection error

Check:

- MongoDB is running.
- `MONGO_URI` is correct.
- Database access is allowed.
- The backend `.env` file exists.

---

### Backend does not start

Run:

```bash
cd backend
npm install
npm run dev
```

Check that port `5000` is not already occupied.

---

### Frontend installation issues

Try:

```bash
rm -rf node_modules
npm install
npm run dev
```

On Windows, delete `node_modules` manually if necessary.

---

### Camera / microphone not working

Check browser permissions for:

- Camera
- Microphone

Use a modern browser such as Chrome or Edge.

For production deployments, browser media APIs generally require a secure HTTPS context.

---

### OpenAI features not working

Check:

```text
OPENAI_API_KEY
```

Also verify:

- Backend is running.
- API key is valid.
- Network access is available.
- The request is reaching the OpenAI service.

---

### CORS errors

Verify:

```env
FRONTEND_URL=http://localhost:5173
```

Make sure the frontend origin matches the backend CORS configuration.

---

# 🚀 Deployment

## Development Architecture

```text
React + Vite
      │
      ▼
Node.js + Express
      │
      ▼
MongoDB
      │
      ├── OpenAI API
      ├── AI processing
      └── Future monitoring services
```

---

## Planned Production Architecture

```text
                    +----------------------+
                    |   Vercel / Frontend  |
                    |   React + Vite       |
                    +----------+-----------+
                               |
                               ▼
                    +----------------------+
                    | Render / AWS Backend |
                    | Node + Express       |
                    +----------+-----------+
                               |
                ---------------+----------------
                |                              |
                ▼                              ▼
       +----------------+             +----------------+
       | MongoDB Atlas  |             | External AI    |
       | Database       |             | Services       |
       +----------------+             +----------------+
```

Potential production targets from the project blueprint include:

- Vercel for frontend
- Render or AWS for backend
- MongoDB Atlas for database
- Cloudinary or AWS S3 for file storage

---

# 📊 Project Status

| Category | Status |
|----------|--------|
| React Frontend | ✅ Implemented |
| Node.js Backend | ✅ Implemented |
| MongoDB | ✅ Implemented |
| JWT Authentication | ✅ Implemented |
| Role-Based Access | ✅ Implemented |
| Resume Upload | ✅ Implemented |
| Resume Text Extraction | ✅ Implemented |
| AI Interview Generation | ✅ Implemented |
| Interview Room | ✅ Implemented |
| Webcam / Microphone | ✅ Implemented |
| Response Recording | ✅ Implemented |
| Scoring Engine | ✅ Implemented |
| Unit Tests | ✅ Implemented |
| AI Feedback Architecture | ✅ Implemented |
| Candidate Analytics | ⏳ In Progress |
| Recruiter Comparison | ⏳ In Progress |
| Speech-to-Text | ⏳ Extension |
| Eye Contact Detection | ⏳ Extension |
| Emotion Detection | ⏳ Extension |
| Email Notifications | ⏳ Planned |
| Google OAuth | ⏳ Planned |
| Cloud Deployment | ⏳ Planned |

---

# 📚 Documentation

The repository currently includes:

| Document | Description |
|----------|-------------|
| `SmartHire_AI_Blueprint.md` | Technical architecture, schema, API contract and build sequence |
| `README.md` | Project documentation and setup guide |
| `backend/tests/` | Backend tests |
| `backend/.env.example` | Environment variable template |

---

# 👨‍💻 Author

**Aditya Gupta**

B.Tech — Computer Science & Engineering

Interests:

- Artificial Intelligence
- Machine Learning
- Full-Stack Development
- Software Engineering

GitHub:

https://github.com/aditya262006

---

# ⭐ Summary

**SmartHire AI** is an AI-powered mock interview and candidate assessment platform built to provide a structured, realistic interview-practice experience.

The project combines:

- React
- Node.js
- Express
- MongoDB
- OpenAI
- JWT authentication
- Resume processing
- Webcam and microphone interaction
- Automated scoring
- AI feedback
- Candidate analytics architecture

The current implementation focuses on the complete interview loop — from authentication and resume processing to AI question generation, interactive interview sessions, response capture, scoring, and feedback — while keeping the architecture ready for advanced speech, visual analysis, recruiter analytics, and cloud deployment.

---

## 🔗 Repository

https://github.com/springboardmentor441p-coderr/AI-Powered-Mock-Interview-and-Candidate-Assessment-Platform/tree/Aditya_Gupta/smarthire-ai
