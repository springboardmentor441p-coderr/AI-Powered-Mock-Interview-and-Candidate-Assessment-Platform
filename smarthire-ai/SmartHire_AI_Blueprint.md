# SmartHire AI — Technical Blueprint

## 0. Stack Decision

The original spec calls for Django REST Framework/FastAPI + PostgreSQL. Given your MERN background, this blueprint uses the **Node/Express/MongoDB substitution** — same architecture, faster execution for you. Swap notes are flagged where behavior differs (mainly: Mongoose schemas instead of Django models, Multer instead of DRF file fields).

| Layer | Choice | Why |
|---|---|---|
| Frontend | React.js + Tailwind + Redux/Context | Matches spec; you already know it |
| Backend | Node.js + Express | Matches your strength; same REST contract as Django would produce |
| Database | MongoDB (Mongoose) | Flexible schema for resume/question JSON blobs; swap to PostgreSQL if you want relational rigor later |
| Auth | JWT (access + refresh) + Passport-Google-OAuth20 | |
| AI/ML | OpenAI API (questions, feedback), Whisper API (STT), MediaPipe (client-side eye tracking), face-api.js or server-side DeepFace (emotion) | |
| Storage | Cloudinary or AWS S3 (resumes, video/audio blobs) | |
| Deployment | Frontend → Vercel; Backend → Render/AWS; DB → MongoDB Atlas | |

---

## 1. Repository Structure

```
smarthire-ai/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js, env.js, passport.js
│   │   ├── models/          # User, Resume, InterviewSession, Question, Response, ScoreReport
│   │   ├── routes/          # auth.routes.js, resume.routes.js, interview.routes.js, analytics.routes.js
│   │   ├── controllers/
│   │   ├── services/        # ai.service.js (OpenAI calls), scoring.service.js, speech.service.js
│   │   ├── middleware/       # auth.middleware.js, role.middleware.js, upload.middleware.js
│   │   ├── utils/
│   │   └── app.js
│   ├── tests/
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/            # Login, CandidateDashboard, InterviewRoom, RecruiterDashboard, AdminPanel, Report
│   │   ├── components/       # Webcam, Timer, ScoreCard, ChartPanel, QuestionCard
│   │   ├── hooks/             # useAuth, useMediaRecorder, useInterviewSession
│   │   ├── services/          # api.js (axios instance)
│   │   ├── context/            # AuthContext
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 2. Database Schema (Mongoose)

```js
// User
{ name, email, passwordHash, role: ['candidate','recruiter','admin'],
  oauthProvider, oauthId, createdAt }

// Resume
{ userId, fileUrl, rawText, parsedData: { skills[], experience[], education[], technologies[] },
  summary, createdAt }

// InterviewSession
{ userId, type: ['hr','technical','behavioral','aptitude'], domain, difficulty,
  status: ['pending','in_progress','completed'], startedAt, completedAt,
  questionIds: [Question], responseIds: [Response] }

// Question
{ sessionId, text, type, order }

// Response
{ sessionId, questionId, audioUrl, videoUrl, transcript,
  speechMetrics: { fillerWordCount, pace_wpm, grammarScore },
  visualMetrics: { eyeContactPct, emotionScores: {}, engagementScore },
  createdAt }

// ScoreReport
{ sessionId, userId,
  communicationScore, confidenceScore, technicalScore, professionalismScore,
  overallScore, rating: ['Excellent','Good','Average','Needs Improvement','Poor'],
  strengths[], weaknesses[], suggestions[], createdAt }
```

---

## 3. Core API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/google
POST   /api/auth/refresh

POST   /api/resume/upload
GET    /api/resume/:id

POST   /api/interview/generate        # body: resumeId, type, difficulty, domain
POST   /api/interview/:id/start
POST   /api/interview/:id/response     # multipart: audio/video blob + questionId
POST   /api/interview/:id/complete
GET    /api/interview/:id/report

GET    /api/analytics/candidate/:userId
GET    /api/analytics/recruiter/candidates
```

---

## 4. Scoring Function (pure, testable)

```js
function computeOverallScore({ communication, confidence, technical, professionalism }) {
  return (
    communication * 0.30 +
    confidence * 0.25 +
    technical * 0.30 +
    professionalism * 0.15
  );
}

function ratingFor(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 40) return 'Needs Improvement';
  return 'Poor';
}
```
Write this first, with unit tests, before wiring any AI pipeline — it's the one piece every other module depends on.

---

## 5. Build Sequence (8 weeks)

**Week 1–2 — Foundation**
- Init repos, Docker Compose (backend + Mongo)
- Mongoose schemas above
- JWT auth → then Google OAuth
- Role middleware (candidate/recruiter/admin)
- Resume upload (Multer → Cloudinary/S3)
- React shell: routing, Tailwind, Axios instance, AuthContext

**Week 3–4 — Resume → Interview pipeline**
- Resume text extraction (`pdf-parse`) → OpenAI structured JSON prompt → save `parsedData`
- Question generation service: prompt template per interview type + difficulty
- Interview room UI: question stepper, webcam/mic permission (`getUserMedia`)
- Session state machine: pending → in_progress → completed

**Week 5–6 — Analysis pipelines (build independently, wire in last)**
- Audio recording (`MediaRecorder`) → Whisper API → transcript
- Filler-word regex + LanguageTool API for grammar + WPM from audio duration
- MediaPipe Face Mesh (client-side) for eye-contact %; sample every 1–2s, not every frame
- Emotion signal (face-api.js client-side, or periodic server-side DeepFace call)
- Scoring service wiring all four sub-scores

**Week 7–8 — Analytics, feedback, deploy**
- LLM feedback call (transcript + scores → strengths/weaknesses/suggestions JSON)
- Recharts dashboards: score history, skill radar, weak-area list
- Recruiter: candidate comparison table
- Email notifications (SendGrid)
- Critical-path tests (auth, upload, scoring)
- Dockerize, deploy: Vercel (frontend), Render/AWS (backend), Atlas (DB), GitHub Actions CI

---

## 6. Build-Order Tip

Get one full interview loop working with a **hardcoded fake score** before polishing any single module (upload → generate questions → record → fake score → feedback page). Integrate real scoring/speech/emotion pipelines into that working skeleton one at a time, rather than perfecting each module in isolation.
