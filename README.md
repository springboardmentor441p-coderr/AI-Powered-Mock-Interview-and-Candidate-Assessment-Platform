# 🎙️ InterVio AI

> **Next-Generation AI-Powered Voice Mock Interview & Candidate Assessment Platform**

![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Vapi AI](https://img.shields.io/badge/Vapi_Voice_AI-Real--time-purple?style=for-the-badge)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-8E75FF?style=for-the-badge&logo=googlegemini&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

---

## 📌 Table of Contents

- [Overview](#-overview)
- [The Problem & Solution](#-the-problem--solution)
- [Key Features](#-key-features)
- [Architecture & Workflow](#-architecture--workflow)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Usage Guide](#-usage-guide)
- [Practical Use Cases](#-practical-use-cases)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)
- [Author & Acknowledgments](#-author--acknowledgments)

---

## 🔍 Overview

**InterVio AI** is a state-of-the-art, full-stack AI interview platform designed to conduct realistic, voice-based technical and behavioral interviews. By coupling real-time Speech-to-Text (STT) and Text-to-Speech (TTS) voice engines with Google Gemini LLMs, InterVio AI evaluates candidates, parses resumes, dynamically adapts questions, and delivers actionable post-interview analytical performance reports.

Whether you are a job candidate sharpening your interview skills or a recruiter streamlining preliminary candidate evaluations, InterVio AI offers a seamless end-to-end interactive experience.

---

## 🎯 The Problem & Solution

### ❌ The Problem
- **For Candidates:** Traditional text-based prep tools fail to mimic the psychological pressure, speech pacing, and conversational dynamics of live interviews.
- **For Recruiters:** Manual resume screening and initial screening phone calls consume hundreds of engineering and HR hours with inconsistent candidate evaluation standards.

### ✨ The Solution
- **Real-Time Voice AI:** Candidates interact directly with a human-like voice interviewer capable of natural conversation, real-time interruptions, and instant transcript generation.
- **Context-Aware Evaluation:** Resumes are parsed automatically, enabling AI engines to tailor interview questions specifically to the applicant's experience, skill set, and targeted job role.
- **Data-Driven Insights:** Generates comprehensive performance breakdowns, spider chart skill metrics, communication scores, and downloadable PDF reports.

---

## 🚀 Key Features

### 🎙️ 1. Real-Time AI Voice Studio
- **Bi-Directional Voice Pipeline:** Powered by the Vapi Voice AI Web SDK for low-latency Speech-to-Text (STT) and Text-to-Speech (TTS).
- **Interruption & Pacing Handling:** Voice AI intelligently handles candidate pauses, interruptions, and clarification requests naturally.
- **Live Interactive Transcript:** Displays real-time streaming transcripts during the interview session.

### 📄 2. AI Resume Parser & Skill Extractor
- **Multi-Format Document Parsing:** Ingests PDF and DOCX resumes using `pdfjs-dist` and `mammoth`.
- **Automated Skill Profiling:** Extracts key technologies, work experience highlights, domain expertise, and candidate strengths.

### 🧠 3. Adaptive Question Generator
- **Dynamic Question Tailoring:** Powered by Google Gemini AI (`@google/generative-ai`) to craft role-specific, difficulty-calibrated technical and situational questions.
- **Contextual Follow-ups:** Probes candidate answers dynamically based on earlier responses and resume details.

### 📊 4. Post-Interview Analytics & Evaluation Engine
- **Multi-Dimensional Metrics:** Evaluates technical accuracy, communication clarity, problem-solving structure, and overall confidence.
- **Visual Performance Dashboards:** Interactive radar charts, score distribution graphs, and trend analysis built with Recharts.
- **Downloadable PDF Reports:** One-click PDF report generation powered by `jspdf` for candidates and hiring managers.

### 👥 5. Dual Candidate & Recruiter Workspaces
- **Candidate Hub:** Setup mock interviews, select target roles, practice real voice rounds, and track progress over time.
- **Recruiter & Admin Portal:** Review candidate performance scores, aggregate evaluation metrics, and audit detailed session transcripts.

---

## 🏗️ Architecture & Workflow

```text
┌─────────────────────────┐               ┌──────────────────────────┐
│  Next.js 16 Web Studio  │ ────────────> │ Vapi Voice AI Web SDK    │
│   (Frontend Browser)    │ <──────────── │ (Real-Time STT/TTS Voice)│
└────────────┬────────────┘               └─────────────┬────────────┘
             │                                          │
             │ REST API / Auth                          │ Webhook Call Events
             ▼                                          ▼
┌────────────────────────────────────────────────────────────────────┐
│                       Express Node.js API                          │
│               (Session Validation & Auth Service)                  │
└────────────┬──────────────────────────────────────────┬────────────┘
             │                                          │
             ▼                                          ▼
┌─────────────────────────┐               ┌──────────────────────────┐
│ Google Gemini AI API    │               │  Prisma / In-Memory      │
│ (Resume & Evaluation)   │               │   Interview Data Store   │
└─────────────────────────┘               └──────────────────────────┘
```

### Workflow Steps:
1. **Resume Upload & Configuration:** Candidate uploads a resume and selects interview role specifications (e.g., Senior Full-Stack Engineer).
2. **Session Initialization:** Express backend authenticates the user, validates configuration, and prepares a call-scoped Vapi voice assistant session.
3. **Interactive Voice Interview:** Candidate connects to the Vapi AI Voice Studio via browser microphone audio. Real-time audio streams between browser and Vapi servers.
4. **Webhook Event Processing:** Backend captures real-time transcript events, call duration, and state markers via Vapi server webhooks.
5. **AI Evaluation & Reporting:** Post-interview, Google Gemini AI evaluates the complete transcript to generate granular feedback, scoring radar charts, and PDF reports.

---

## 🛠️ Technology Stack

| Category | Technologies & Tools |
| :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling & UI** | Tailwind CSS v4, Framer Motion, Lucide React, Canvas Confetti |
| **Data Visualization** | Recharts (Radar Charts, Bar Graphs, Progress Metrics) |
| **Document Processing** | PDF.js (`pdfjs-dist`), Mammoth (DOCX Parser), jsPDF |
| **Backend Framework** | Node.js, Express, TypeScript (`tsx`) |
| **Database & ORM** | Prisma ORM (`@prisma/client`) |
| **AI & Voice Services** | Vapi Web SDK (`@vapi-ai/web`), Vapi Server SDK (`@vapi-ai/server-sdk`), Google Gemini API (`@google/generative-ai`) |
| **Authentication & Security** | JSON Web Tokens (`jsonwebtoken`), CORS middleware, Dotenv |

---

## 📂 Project Structure

```text
intervio-ai/
├── frontend/                     # Next.js 16 Frontend Application
│   ├── src/
│   │   ├── app/                  # App Router pages (login, dashboard, interview, recruiter, report, resume)
│   │   ├── components/           # UI components (auth, dashboard, interview, landing, recruiter, resume)
│   │   ├── context/              # React Context state management
│   │   ├── services/             # Frontend API integration services
│   │   ├── types/                # TypeScript type definitions
│   │   └── utils/                # Evaluation engine, resume parser, question generator
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                      # Node.js + Express API Backend
│   ├── src/
│   │   ├── middleware/           # Auth and error middleware
│   │   ├── routes/               # Express API endpoints (/api/interview, /api/vapi/webhook, etc.)
│   │   ├── services/             # AI resume service, auth service, report service, session service
│   │   └── server.ts             # Express server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                         # Documentation & Vapi setup guides
│   └── vapi-assistant.md
│
├── .env.example                  # Environment configuration template
├── package.json                  # Root npm workspaces configuration
└── LICENSE                       # MIT License
```

---

## ⚡ Installation & Setup

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Vapi Account**: Public & Private API Keys ([vapi.ai](https://vapi.ai))
- **Google Gemini API Key**: ([Google AI Studio](https://aistudio.google.com))

### 1. Clone the Repository
```bash
git clone https://github.com/springboardmentor441p-coderr/AI-Powered-Mock-Interview-and-Candidate-Assessment-Platform.git
cd AI-Powered-Mock-Interview-and-Candidate-Assessment-Platform
```

### 2. Install Dependencies
This project uses npm workspaces to manage both frontend and backend dependencies from the root directory:
```bash
npm install
```

### 3. Environment Configuration
Create `.env.local` inside `frontend/` and `.env` inside `backend/` using `.env.example` as a reference:

#### Frontend Configuration (`frontend/.env.local`):
```env
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### Backend Configuration (`backend/.env`):
```env
PORT=5000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_secure_jwt_secret
VAPI_ASSISTANT_ID=your_vapi_assistant_id
VAPI_WEBHOOK_SECRET=your_vapi_webhook_secret
```

---

## 🏃 Running the Application

### Development Mode
Start both frontend and backend concurrently from the root directory:

```bash
# Run both frontend and backend simultaneously
npm run dev

# Or run frontend and backend independently
npm run dev:frontend
npm run dev:backend
```

- **Frontend Application:** Access at `http://localhost:3000`
- **Backend API Server:** Running on `http://localhost:5000`

### Local Webhook Setup (For Vapi Event Listener)
To receive real-time call webhooks from Vapi during local development, expose port `5000` to the web:

```bash
# Using localtunnel
npx localtunnel --port 5000

# Or using ngrok
ngrok http 5000
```
Update your Vapi Assistant Server URL in the Vapi Dashboard to:
`https://<your-subdomain>.loca.lt/api/vapi/webhook`

### Building for Production
```bash
# Build both workspaces
npm run build

# Or build individually
npm run build:frontend
npm run build:backend
```

---

## 📖 Usage Guide

### 1. Candidate Workflow
1. Navigate to `http://localhost:3000` and sign in.
2. Go to **Resume Studio** to upload your resume (PDF/DOCX) for AI parsing.
3. Configure your target role, difficulty level, and interview topic.
4. Launch the **Voice Studio**, allow microphone permissions, and press **Start Interview**.
5. Speak naturally with the AI interviewer. View live transcripts and response pacing feedback.
6. Upon conclusion, view your interactive **Evaluation Report** and download your summary PDF.

### 2. Recruiter & Admin Workflow
1. Log in with Recruiter access credentials.
2. Access the **Recruiter Dashboard** to inspect recent interview candidates.
3. Filter candidate scores by technical competencies, communication ratings, and overall score.
4. Review complete session transcripts and AI-generated hiring recommendations.

---



## 🎯 Practical Use Cases

- 💼 **Job Seekers & Software Engineers:** Practice real-time technical and behavioral interviews with conversational voice feedback before real employer screens.
- 🏢 **Corporate Hiring Teams & HR Recruiters:** Automate initial candidate screening rounds, standardizing candidate evaluation metrics and cutting interview bottlenecks.
- 🎓 **Educational Bootcamps & Universities:** Provide students with scalable, self-serve mock interview practice with instant AI coaching reports.

---

## 🔮 Future Enhancements

- [ ] **Facial & Gesture Sentiment Analysis:** Incorporate webcam-based non-verbal cue assessment during voice interviews.
- [ ] **Durable Database Persistence:** Upgrade in-memory storage services to persistent PostgreSQL / Cloud Spanner databases via Prisma ORM.
- [ ] **Multilingual Interviewing:** Support voice interviews in Spanish, French, German, Mandarin, and Hindi.
- [ ] **ATS & HRIS Integrations:** Seamless candidate data synchronization with Greenhouse, Lever, and Workday.

---

## 🤝 Contributing

Contributions are welcome! Please follow these simple steps to contribute:

1. **Fork** the repository.
2. Create a new feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**.

Please ensure your code builds cleanly (`npm run build`) before opening a pull request.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

```text
Copyright (c) 2026 springboardmentor441p-coderr
```

---

## ✉️ Author & Contact

**Project Maintainer:** `springboardmentor441p-coderr`  
**Repository:** [InterVio AI GitHub Repository](https://github.com/springboardmentor441p-coderr/AI-Powered-Mock-Interview-and-Candidate-Assessment-Platform)

---

<p center align="center">
  Made with ❤️ for candidates & engineering teams worldwide.
</p>
