# SmartHire AI 🤖

### AI-Powered Mock Interview & Personalized Assessment Platform

SmartHire AI is an intelligent mock interview platform that conducts **real-time, personalized interviews based on a candidate's Resume and Job Description (JD)**.

Instead of using generic interview questions or ATS-style resume matching, SmartHire AI understands the candidate's background and the target role, generates relevant questions, conducts a face-to-face AI interview, evaluates every answer, and produces a detailed personalized assessment.

---

## ✨ Key Features

### 📄 Resume-Based Interview

* Upload a candidate resume.
* Extract education, skills, projects, experience, and technologies.
* Generate interview questions based on the candidate's actual background.
* Validate whether the candidate can explain the technologies and projects mentioned in the resume.

### 💼 Job Description-Based Interview

* Analyze the target Job Description.
* Identify required skills, responsibilities, and role expectations.
* Generate questions specifically for the selected JD.
* Assess whether the candidate demonstrates the capabilities required by the JD.

### 🤖 AI Interviewer

* Real-time AI interviewer experience.
* AI avatar speaks questions using Text-to-Speech.
* Avatar supports speaking animations such as:
  * Lip movement
  * Eye blinking
  * Facial movement
  * Speaking state
* AI automatically moves through the interview.

### 🎤 Voice Interaction

* Candidate answers using their microphone.
* Speech-to-Text converts the candidate's response into a transcript.
* AI analyzes the response.
* Dynamic follow-up questions can be generated based on the candidate's answer.

### 🧠 Dynamic Interview

The interview is not a fixed list of questions.

```text
Question
   ↓
Candidate Answer
   ↓
Speech-to-Text
   ↓
AI Analysis
   ↓
Follow-up Decision
   ↓
Next Question
```

The AI can adjust the next question according to the candidate's response.

### 👁️ Face Tracking & Interview Monitoring

Using computer-vision models such as MediaPipe:

* Face detection
* Face landmarks
* Face tracking
* Multiple-face detection
* Face-missing detection
* Head-pose estimation
* Looking-away detection
* Eye/blink-related signals
* Interview integrity monitoring

These signals are kept separate from the candidate's technical performance score.

### 📊 Personalized Assessment

SmartHire AI does **not** provide an ATS score.

Instead, it evaluates:

* Technical skills
* Problem solving
* Behavioral skills
* Communication
* Resume knowledge
* JD capabilities
* Question-by-question performance
* Interview integrity signals

### 📑 Final AI Report

After the interview, the candidate receives:

* Overall performance
* Skill-wise scores
* Strengths
* Areas for improvement
* Resume validation
* JD capability assessment
* Question-by-question analysis
* Personalized learning recommendations
* Interview summary

---

# 🏗️ System Architecture

```text
                         SmartHire AI
                              │
              ┌───────────────┴───────────────┐
              │                               │
           Resume                             JD
              │                               │
              ▼                               ▼
       Resume Parser                    JD Parser
              │                               │
              └───────────────┬───────────────┘
                              ▼
                    LLM Understanding
                              │
                              ▼
                  Interview Plan Generator
                              │
                              ▼
                    AI Interview Room
                              │
          ┌───────────────────┼──────────────────┐
          │                   │                  │
          ▼                   ▼                  ▼
      AI Avatar            Webcam           Microphone
          │                   │                  │
          ▼                   ▼                  ▼
        TTS             MediaPipe             Whisper
                              │                  │
                              └────────┬─────────┘
                                       ▼
                                  Transcript
                                       │
                                       ▼
                              LLM Answer Analysis
                                       │
                       ┌───────────────┼───────────────┐
                       ▼               ▼               ▼
                 Skill Analysis   Follow-up       JD Assessment
                       │           Questions            │
                       └───────────────┬───────────────┘
                                       ▼
                              Final Assessment
                                       │
                                       ▼
                                AI Report
```

---

# 🧠 AI Pipeline

## 1. Resume Parsing

```text
Resume PDF
    ↓
Text Extraction
    ↓
LLM
    ↓
Structured Candidate Profile
```

Extracts information such as:

```text
Name
Education
Experience
Skills
Projects
Technologies
Certifications
Achievements
```

---

## 2. JD Parsing

```text
Job Description
      ↓
LLM
      ↓
Structured JD Profile
```

Extracts:

```text
Role
Required Skills
Responsibilities
Technical Requirements
Experience Requirements
Expected Capabilities
```

---

## 3. Question Generation

The LLM combines:

```text
Resume
+
Job Description
+
Interview Type
+
Difficulty
```

and generates personalized questions.

Example:

```text
Resume:
FastAPI + JWT + PostgreSQL

JD:
Backend Developer

Question:
"Explain how you implemented JWT authentication
in your FastAPI project."
```

---

## 4. Real-Time Interview

```text
AI generates question
        ↓
AI Avatar speaks
        ↓
Candidate listens
        ↓
Candidate answers
        ↓
Microphone records
        ↓
Speech-to-Text
        ↓
Transcript
        ↓
AI evaluates answer
        ↓
Next question / Follow-up
```

---

# 🔄 AI Interview States

The frontend should clearly communicate what the AI is doing.

```text
SPEAKING
   ↓
LISTENING
   ↓
ANALYZING
   ↓
GENERATING
   ↓
SPEAKING
```

Example UI states:

```text
🔊 AI is speaking...

🎤 Listening to your answer...

🤖 Analyzing your answer...

🤖 Preparing the next question...
```

This makes the experience feel like a real face-to-face interview.

---

# 🎯 Assessment Engine

Every answer is evaluated against the context of the interview.

```text
Resume
   +
JD
   +
Question
   +
Expected Skills
   +
Candidate Answer
   ↓
LLM Evaluation
```

Example evaluation:

```json
{
  "technical_accuracy": 8,
  "relevance": 9,
  "clarity": 8,
  "depth": 7,
  "overall": 8
}
```

---

# 📊 Assessment Categories

### Technical Skills

```text
Python
SQL
React
FastAPI
REST APIs
Authentication
Databases
```

### Problem Solving

```text
Logical thinking
Approach
Reasoning
Solution quality
```

### Behavioral

```text
Teamwork
Ownership
Adaptability
Leadership
Decision making
```

### Communication

```text
Clarity
Relevance
Structure
Grammar
Explanation quality
```

### Resume Knowledge

Checks whether the candidate can genuinely explain the skills and projects claimed in the resume.

### JD Capability

Checks whether the candidate demonstrated the capabilities required by the target job description.

---

# 📈 Example Assessment

```text
Overall Performance
        8.2 / 10

Technical Skills
        8.4 / 10

Problem Solving
        8.0 / 10

Communication
        7.8 / 10

Behavioral
        8.5 / 10

Resume Knowledge
        8.6 / 10

JD Capabilities
        8.1 / 10
```

---

# 👁️ Computer Vision Pipeline

```text
Webcam
  │
  ▼
MediaPipe Face Landmarker
  │
  ├── Face Detection
  ├── Face Landmarks
  ├── Face Tracking
  ├── Multiple Faces
  ├── Head Pose
  ├── Looking Away
  └── Eye/Blink Signals
```

The computer-vision system operates locally in the browser where possible, reducing unnecessary transmission of camera frames.

---

# 🎙️ Speech Pipeline

```text
Candidate Voice
      ↓
Microphone
      ↓
Audio Recording
      ↓
Whisper
      ↓
Transcript
      ↓
LLM
      ↓
Answer Evaluation
```

---

# 🔊 AI Voice Pipeline

```text
LLM
 │
 ▼
Question
 │
 ▼
Text-to-Speech
 │
 ▼
AI Avatar
 │
 ▼
Lip / Speaking Animation
```

---

# 🧩 Technology Stack

## Frontend

* React
* Vite
* JavaScript
* CSS
* Lucide React
* MediaPipe Tasks Vision
* Web APIs

## AI / ML

* LLM for reasoning and assessment
* Whisper for Speech-to-Text
* Text-to-Speech for AI interviewer
* MediaPipe Face Landmarker for face tracking and interview monitoring

## Backend

The backend is responsible for:

```text
Authentication
Resume processing
JD processing
LLM orchestration
Interview sessions
Question management
Answer processing
Assessment generation
Report generation
Data persistence
```

---

# 📁 Suggested Project Structure

```text
frontend/
│
├── src/
│   ├── components/
│   │   ├── interview/
│   │   │   ├── AIInterviewer.jsx
│   │   │   ├── AIInterviewer.css
│   │   │   ├── Webcam.jsx
│   │   │   ├── Webcam.css
│   │   │   ├── Timer.jsx
│   │   │   └── Timer.css
│   │   │
│   │   ├── assessment/
│   │   │   ├── ScoreCard.jsx
│   │   │   ├── SkillBreakdown.jsx
│   │   │   ├── QuestionReview.jsx
│   │   │   └── AssessmentSummary.jsx
│   │
│   ├── pages/
│   │   ├── setup/
│   │   │   └── InterviewSetup.jsx
│   │   │
│   │   ├── interview/
│   │   │   └── InterviewRoom.jsx
│   │   │
│   │   └── assessment/
│   │       └── Assessment.jsx
│   │
│   ├── hooks/
│   │   ├── useFaceDetection.js
│   │   ├── useSpeechRecognition.js
│   │   └── useSpeechSynthesis.js
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── interviewService.js
│   │   └── assessmentService.js
│   │
│   └── App.jsx
│
├── public/
│   ├── models/
│   │   └── face_landmarker.task
│   │
│   └── wasm/
│
└── package.json
```

---

# 🔐 Interview Session Lifecycle

```text
Create Interview Session
        ↓
Upload Resume
        ↓
Add Job Description
        ↓
Analyze Resume + JD
        ↓
Generate Interview Plan
        ↓
Pre-Interview Checks
        ↓
Face Registration
        ↓
Camera + Microphone Check
        ↓
Start Interview
        ↓
Ask Question
        ↓
Listen
        ↓
Transcribe
        ↓
Evaluate
        ↓
Generate Follow-up / Next Question
        ↓
Repeat
        ↓
Interview Completed
        ↓
Generate Assessment
        ↓
Show Assessment Page
```

---

# 📝 Interview Setup

The candidate should provide:

```text
Resume
+
Job Description
+
Target Role
+
Interview Duration
+
Interview Difficulty
```

Optional:

```text
Interview Type
Technical
Behavioral
Mixed
```

The system then creates an interview session.

---

# 🛡️ Interview Integrity

During the interview, monitor:

```text
✓ Camera active
✓ Microphone active
✓ Face present
✓ Single face
✓ Looking-away events
✓ Interview duration
```

These are **integrity indicators**, not automatic proof of cheating.

---

# 🚫 What SmartHire AI Does Not Use

SmartHire AI is intentionally focused on interview performance.

It does **not** require:

* ATS score
* Generic resume matching score
* Recruiter dashboard
* Admin dashboard
* Fake candidate accounts
* Fake interview data
* Sample candidate profiles in production
* Generic interview questions unrelated to the candidate

The interview is based on:

```text
Candidate Resume
       +
Job Description
       +
Candidate's Interview Answers
```

---

# 🎯 Core Product Goal

SmartHire AI should behave like a real AI interviewer:

```text
Understand candidate
        ↓
Understand target role
        ↓
Ask relevant question
        ↓
Listen to candidate
        ↓
Understand answer
        ↓
Evaluate answer
        ↓
Ask intelligent follow-up
        ↓
Adapt interview
        ↓
Assess candidate
        ↓
Provide personalized feedback
```

---

# 🚀 Development Roadmap

## Phase 1 — Foundation

* [ ] React + Vite setup
* [ ] Application routing
* [ ] Interview setup page
* [ ] Resume upload
* [ ] JD input
* [ ] Backend API

## Phase 2 — Resume & JD Intelligence

* [ ] Resume extraction
* [ ] Resume structured data
* [ ] JD extraction
* [ ] JD structured data
* [ ] LLM integration
* [ ] Interview plan generation

## Phase 3 — Interview Room

* [ ] Live webcam
* [ ] Microphone
* [ ] Face registration
* [ ] Face tracking
* [ ] AI avatar
* [ ] AI voice
* [ ] Interview timer
* [ ] Interview states

## Phase 4 — Conversational AI

* [ ] Speech-to-text
* [ ] Question generation
* [ ] Dynamic follow-ups
* [ ] Answer evaluation
* [ ] Context management
* [ ] Interview state management

## Phase 5 — Assessment

* [ ] Technical assessment
* [ ] Behavioral assessment
* [ ] Communication assessment
* [ ] Resume validation
* [ ] JD capability assessment
* [ ] Question-level scoring
* [ ] Overall assessment

## Phase 6 — Final Report

* [ ] Strengths
* [ ] Weaknesses
* [ ] Skill breakdown
* [ ] Personalized recommendations
* [ ] Interview summary
* [ ] Assessment dashboard

## Phase 7 — Production

* [ ] Authentication
* [ ] Database
* [ ] Secure API
* [ ] Error handling
* [ ] Rate limiting
* [ ] Logging
* [ ] Monitoring
* [ ] Privacy controls
* [ ] Production deployment

---

# ⚡ Performance Principles

SmartHire AI should:

* Process webcam data efficiently.
* Avoid unnecessary camera-frame uploads.
* Keep UI responsive during AI processing.
* Use asynchronous backend processing where appropriate.
* Cache reusable interview context.
* Avoid sending the entire resume/JD repeatedly to the LLM.
* Store structured interview state.
* Keep question generation and answer evaluation deterministic where possible.

---

# 🔒 Privacy

Candidate data should be handled securely.

Important principles:

* Use HTTPS in production.
* Secure uploaded resumes.
* Protect interview transcripts.
* Don't expose API keys in the frontend.
* Keep LLM API credentials on the backend.
* Give candidates control over their interview data where applicable.
* Clearly communicate what camera, microphone, transcript, and interview-monitoring data is collected.

---

# 🧪 Development

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

# 🌟 Vision

SmartHire AI aims to make interview preparation feel like a **real one-to-one interview with an intelligent interviewer**.

Not just:

```text
Question → Answer → Score
```

But:

```text
Understand
    ↓
Ask
    ↓
Listen
    ↓
Understand
    ↓
Challenge
    ↓
Follow Up
    ↓
Evaluate
    ↓
Coach
```

### SmartHire AI

**Your Resume. Your Job. Your Interview. Your Assessment.**
