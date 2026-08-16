# AI-Powered-Mock-Interview-and-Candidate-Assessment-Platform
# SmartHire AI


SmartHire AI is an AI-based recruitment assistance and mock interview platform developed to help candidates evaluate their resumes, identify suitable job opportunities, generate interview questions, conduct an AI-powered interview, and receive an automated interview performance report.

The system combines resume analysis, ATS scoring, job recommendation, AI-generated interview questions, speech processing, and AI-based interview evaluation.

---

## Project Objectives

The main objectives of SmartHire AI are:

* Upload and analyze a candidate's resume.
* Extract important information such as skills and experience.
* Calculate an ATS score.
* Recommend suitable job roles.
* Generate interview questions using AI.
* Conduct an AI-powered mock interview.
* Record and process candidate answers.
* Save interview answers in PostgreSQL.
* Evaluate the complete interview using AI.
* Generate an interview performance report.
* Display interview results through a candidate dashboard.

---

## Main Features

### 1. User Registration

Candidates can create an account by providing:

* Name
* Email
* Password
* Role

The password is stored securely using password hashing.

### 2. User Login

Registered candidates can log in using their email and password.

After successful login, the application stores the candidate's user ID and basic session information in browser localStorage.

### 3. Resume Upload

Candidates can upload their resume in PDF format.

The backend processes the uploaded resume and extracts useful information.

The system generates:

* Resume details
* Skills
* ATS score
* ATS feedback
* Recommended jobs
* AI-generated interview questions

### 4. ATS Resume Analysis

The resume is analyzed to calculate an ATS score.

The score helps indicate how well the candidate's resume matches expected job requirements.

### 5. Job Recommendation

Based on the skills extracted from the resume, the system recommends suitable job roles.

### 6. AI Interview Question Generation

The system generates interview questions based on the candidate's resume and skills.

Questions may include:

* Resume-based questions
* Technical questions
* HR questions
* Behavioural questions
* Follow-up questions

### 7. AI Mock Interview

The candidate answers the generated questions using their microphone.

The system:

1. Displays an interview question.
2. Starts candidate listening.
3. Records the candidate's voice.
4. Sends the recorded audio for speech processing.
5. Converts the answer into text.
6. Saves the answer.
7. Moves to the next question.
8. Generates follow-up questions when required.

### 8. Interview Answer Storage

Interview answers are stored in PostgreSQL.

Each answer contains information such as:

* Interview ID
* Question number
* Question
* Candidate answer
* AI question audio
* Candidate audio

### 9. AI Interview Evaluation

After the interview is completed, the stored interview answers are sent to the AI evaluation service.

The system evaluates:

* Communication
* Technical Knowledge
* Confidence
* HR Skills
* Behavioural Skills
* Problem Solving

### 10. AI Interview Report

The system generates an overall interview report containing:

* Overall Score
* Communication Score
* Technical Score
* Confidence Score
* HR Skills Score
* Behavioural Score
* Problem Solving Score
* Strengths
* Areas for Improvement
* Final Recommendation

Possible recommendations include:

* Selected
* Recommended for Technical Round
* Recommended for HR Round
* Needs Improvement
* Rejected

### 11. Candidate Dashboard

The candidate dashboard provides quick access to:

* ATS Score
* Resume information
* Recommended jobs
* Interview questions
* AI Interview
* Interview Report

---

# System Architecture


Candidate
   |
   v
Login / Registration
   |
   v
Resume Upload
   |
   v
Resume Parser
   |
   +----> ATS Score
   |
   +----> Skill Analysis
   |
   +----> Job Recommendation
   |
   +----> AI Question Generation
   |
   v
Candidate Dashboard
   |
   v
AI Mock Interview
   |
   +----> Voice Recording
   |
   +----> Speech-to-Text
   |
   +----> Save Interview Answer
   |
   v
PostgreSQL Database
   |
   v
AI Interview Evaluation
   |
   v
Interview Report
   |
   v
Candidate Dashboard


---

# Technologies Used

## Frontend

* HTML5
* CSS3
* JavaScript
* Bootstrap
* Browser LocalStorage
* MediaRecorder API

## Backend

* Python
* FastAPI
* Uvicorn
* SQLAlchemy
* PostgreSQL

## AI / Machine Learning

* Groq API
* AI-based question generation
* AI-based interview evaluation
* Resume analysis
* ATS scoring
* Job recommendation

## Speech Processing

* Deepgram
* Browser MediaRecorder API

## Text-to-Speech

* AI text-to-speech service

---

# Backend Structure


backend/
│
├── main.py
├── database.py
├── models.py
├── schemas.py
├── auth.py
├── question_generator.py
├── groq_service.py
├── deepgram_service.py
├── tts_service.py
├── resume_parser.py
├── ai_resume_parser.py
├── ats_score.py
├── job_matcher.py
├── skill_gap.py
├── dashboard.py
├── interview_session.py
├── interview_audio/
├── templates/
├── requirements.txt
└── .env


---

# Frontend Structure

```text
frontend/
│
├── pages/
│   ├── login.html
│   ├── register.html
│   ├── resume_upload.html
│   ├── candidate_dashboard.html
│   ├── interview_v2.html
│   ├── report.html
│   └── ...
│
└── assets/
    ├── css/
    └── js/
        ├── api.js
        ├── questions_v2.js
        ├── speech_v2.js
        └── ...

---

# Important API Endpoints

| Method | Endpoint                         | Purpose                         |
| ------ | -------------------------------- | ------------------------------- |
| POST   | `/register`                      | Register candidate              |
| POST   | `/login`                         | Candidate login                 |
| POST   | `/upload_resume`                 | Upload and analyze resume       |
| POST   | `/start_interview`               | Create interview                |
| GET    | `/interview_questions`           | Get interview questions         |
| POST   | `/generate_questions`            | Generate AI questions           |
| POST   | `/followup_question`             | Generate follow-up question     |
| POST   | `/save_answer`                   | Save candidate answer           |
| POST   | `/evaluate_interview`            | Generate final AI report        |
| GET    | `/candidate_dashboard/{user_id}` | Get candidate dashboard data    |
| POST   | `/generate_voice`                | Generate AI question voice      |
| POST   | `/transcribe`                    | Convert candidate audio to text |

---

# Database

The project uses PostgreSQL with SQLAlchemy.

Important entities include:

* User
* Interview
* InterviewAnswer

The relationship is:


User
 |
 +---- Interview
          |
          +---- InterviewAnswer

---

# Environment Variables

Create a `.env` file inside the backend directory.

Example:

env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/smarthire_db

GROQ_API_KEY=YOUR_GROQ_API_KEY

DEEPGRAM_API_KEY=YOUR_DEEPGRAM_API_KEY


Do not upload the `.env` file containing real API keys to GitHub.

---

# How to Run the Project

## Step 1: Start PostgreSQL

Make sure PostgreSQL is running and the required database exists.

Example database:

smarthire_db

## Step 2: Open Backend Terminal

powershell
cd C:\Users\Varsha\OneDrive\Desktop\smarthireAI\backend

Activate the virtual environment if required:

powershell
.\venv\Scripts\Activate.ps1

## Step 3: Start FastAPI

powershell
uvicorn main:app --reload


Backend:

http://127.0.0.1:8000

Swagger documentation:

http://127.0.0.1:8000/docs

## Step 4: Start Frontend

Open the frontend using VS Code Live Server.

Example:

http://127.0.0.1:5500/frontend/

Do not open individual HTML files directly using `file:///`.

---

# Recommended User Flow

text
Register
   ↓
Login
   ↓
Resume Upload
   ↓
Resume Analysis
   ↓
ATS Score + Job Recommendation
   ↓
Candidate Dashboard
   ↓
Start AI Interview
   ↓
Answer Questions
   ↓
Save Answers
   ↓
Interview Completed
   ↓
AI Evaluation
   ↓
Interview Report
   ↓
View Report

---

# Current Project Status

The major SmartHire AI workflow has been implemented:

* User registration
* User login
* Resume upload
* Resume parsing
* ATS scoring
* Job recommendation
* AI interview question generation
* AI mock interview
* Candidate voice recording
* Interview answer storage
* AI interview evaluation
* Interview report generation
* Candidate dashboard

The remaining work mainly involves improving UI integration, navigation, validation, and presentation of the completed features.

---

# Security Notes

* API keys must be stored in `.env`.
* Passwords should never be stored as plain text.
* `.env` should be included in `.gitignore`.
* Production deployment should use HTTPS.
* CORS settings should be restricted to trusted frontend domains.

---

# Future Enhancements

Possible future improvements include:

* Admin dashboard
* Interview history
* Detailed analytics
* Resume-job matching percentage
* Candidate ranking
* Email notifications
* Better speech recognition handling
* Cloud deployment
* Authentication using JWT
* More advanced machine-learning based candidate scoring

---

# Conclusion

SmartHire AI provides an integrated platform for resume analysis and AI-powered mock interviews. It combines web technologies, FastAPI, PostgreSQL, AI services, speech processing, and automated evaluation to provide candidates with useful feedback about their interview performance.
