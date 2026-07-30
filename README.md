# 🚀 SmartHire AI
## AI-Powered Mock Interview and Candidate Assessment Platform

----

# 📌 Project Overview

SmartHire AI is a full-stack AI-powered mock interview and candidate assessment platform that automates the interview process by combining Artificial Intelligence, Large Language Models (LLMs), voice interaction, and resume analysis.

The platform allows candidates to upload resumes, participate in AI-driven voice interviews, receive intelligent performance evaluations, and download professional interview reports. Recruiters can review interview outcomes, compare candidates, and make hiring decisions through a centralized dashboard.

The objective of SmartHire AI is to streamline the recruitment process by reducing manual effort while providing candidates with realistic interview practice and detailed performance insights.

---

# 🎯 Problem Statement

Traditional recruitment processes involve multiple manual steps, including resume screening, scheduling interviews, evaluating responses, and shortlisting candidates. These processes are time-consuming, inconsistent, and difficult to scale.

Organizations often face challenges such as:

- Manual resume screening
- Time-consuming interview scheduling
- Subjective candidate evaluations
- Lack of standardized assessment
- Limited recruiter productivity
- Delayed hiring decisions
- Inconsistent interview experiences

Candidates also struggle to prepare for technical interviews due to limited access to realistic interview environments and actionable feedback.

SmartHire AI addresses these challenges by providing an intelligent AI-based interview platform capable of conducting automated voice interviews and evaluating candidate performance objectively.

---

# 🎯 Project Objectives

The primary objectives of SmartHire AI are:

- Automate candidate resume screening.
- Extract candidate information from uploaded resumes.
- Conduct AI-powered voice interviews.
- Simulate real interview conversations.
- Evaluate candidate responses using Large Language Models.
- Generate detailed interview reports.
- Provide recruiters with candidate analytics.
- Enable recruiters to shortlist or reject candidates.
- Improve interview consistency.
- Reduce recruiter workload.
- Provide realistic interview practice for candidates.

---


# 🏗️ High-Level System Architecture

```

                   SmartHire AI Platform

             ┌────────────────────────────┐
             │        Candidate            │
             └─────────────┬──────────────┘
                           │
                    Upload Resume
                           │
                           ▼
              Resume Parsing Engine
                           │
                           ▼
            Candidate Information Stored
                           │
                           ▼
               Ultravox AI Voice Agent
                           │
          ┌────────────────┴───────────────┐
          │                                │
          ▼                                ▼
    AI asks Questions                Candidate Answers
          │                                │
          └──────────────┬─────────────────┘
                         ▼
                 Speech Processing
                  (STT & TTS)
                         ▼
               Interview Transcript
                         ▼
                Groq LLM Evaluation
                         ▼
      AI Scores + Feedback + Recommendation
                         ▼
              SQLite Database Storage
                         ▼
             Candidate Result Dashboard
                         ▼
             Recruiter Dashboard Review

```

# 🛠️ Technology Stack

SmartHire AI follows a modern full-stack architecture that combines a responsive frontend, a RESTful backend, artificial intelligence services, and a lightweight relational database.

---

## Frontend Technologies

| Technology | Purpose |
|------------|---------|
| React.js | Builds reusable user interface components |
| Vite | Fast development server and build tool |
| Tailwind CSS | Responsive UI styling |
| React Router DOM | Client-side routing |
| JavaScript (ES6+) | Frontend programming language |
| HTML5 | Page structure |
| CSS3 | Additional styling |
| Framer Motion | UI animations and transitions |
| jsPDF | PDF report generation |
| jspdf-autotable | Creates structured tables inside PDF reports |

---

## Backend Technologies

| Technology | Purpose |
|------------|---------|
| Python | Backend programming language |
| Flask | REST API framework |
| Flask-CORS | Enables communication between frontend and backend |
| SQLite | Database management |
| dotenv | Environment variable management |
| JSON | Data exchange |

---

## Artificial Intelligence Technologies

| Technology | Purpose |
|------------|---------|
| Ultravox AI | AI interviewer, voice conversation, interview question generation, STT and TTS |
| Groq API | Candidate evaluation and AI feedback generation |
| Llama 3.1 8B Instant | Large Language Model used through Groq |

---

## Resume Processing Technologies

| Technology | Purpose |
|------------|---------|
| PyMuPDF (fitz) | Extracts text from uploaded PDF resumes |
| Regular Expressions (Regex) | Extracts structured candidate information |

---

## Development Tools

| Tool | Purpose |
|------|---------|
| Git | Version Control |
| GitHub | Source Code Management |
| VS Code | Code Editor |
| Postman | API Testing |
| Chrome DevTools | Frontend Debugging |

---

# 🧠 Artificial Intelligence Components

SmartHire AI integrates multiple AI services to automate different stages of the recruitment process.

---

## 1. Resume Parsing

The interview begins with resume analysis.

Candidates upload resumes in PDF format.

The backend extracts important information from resumes using:

- PyMuPDF
- Regular Expressions

The extracted information includes:

- Candidate Name
- Email Address
- Phone Number
- Skills
- Education
- Experience
- Certifications
- Languages

This information is stored in the database and is available during the interview process.

---

## 2. Ultravox AI Voice Interview

Ultravox acts as the AI interviewer.

Responsibilities include:

- Conducting the interview
- Maintaining conversation flow
- Asking interview questions
- Listening to candidate responses
- Handling voice interaction
- Performing Speech-to-Text
- Performing Text-to-Speech

Ultravox creates a natural conversational interview experience where the candidate communicates using voice instead of typing responses.

---

## 3. Speech Processing

Speech processing enables voice communication between the AI interviewer and the candidate.

### Text-to-Speech (TTS)

Ultravox converts AI-generated interview questions into spoken audio.

Workflow:

```text
Interview Question
        │
        ▼
Ultravox TTS Engine
        │
        ▼
AI Voice Output
        │
        ▼
Candidate Listens
```

---

### Speech-to-Text (STT)

Ultravox converts candidate voice responses into text.

Workflow:

```text
Candidate Speaks
        │
        ▼
Ultravox STT Engine
        │
        ▼
Interview Transcript
```

The generated transcript is later used for AI evaluation.

---

## 4. Candidate Evaluation

Once the interview is completed, the transcript is evaluated using Groq LLM.

The evaluation process analyzes:

- Technical understanding
- Communication quality
- Answer relevance
- Overall interview performance

The evaluation generates:

- Overall Score
- Technical Score
- Communication Score
- AI Feedback
- Hiring Recommendation

---

# ⚙️ End-to-End Project Workflow

The overall execution flow of SmartHire AI is shown below.

```text
Candidate Opens Website
            │
            ▼
Upload Resume
            │
            ▼
Resume Parsing
            │
            ▼
Candidate Information Stored
            │
            ▼
Start Interview
            │
            ▼
Ultravox AI Voice Interview
            │
            ▼
Speech-to-Text
            │
            ▼
Interview Transcript
            │
            ▼
Groq AI Evaluation
            │
            ▼
Overall Score Generated
            │
            ▼
AI Feedback Generated
            │
            ▼
Results Saved in Database
            │
            ▼
Candidate Dashboard
            │
            ▼
Recruiter Dashboard
```

---

# 👨‍💼 Candidate Workflow

The candidate journey consists of multiple stages.

### Step 1

Open SmartHire AI.

↓

### Step 2

Upload resume.

↓

### Step 3

Resume is parsed.

↓

### Step 4

Candidate details are extracted.

↓

### Step 5

Interview session begins.

↓

### Step 6

Ultravox conducts the interview.

↓

### Step 7

Candidate answers using voice.

↓

### Step 8

Responses are converted into text.

↓

### Step 9

Groq evaluates the transcript.

↓

### Step 10

Results are displayed.

↓

### Step 11

Candidate downloads interview report.

---

# 👩‍💼 Recruiter Workflow

Recruiters can monitor all candidate interviews from a centralized dashboard.

Workflow:

```text
Recruiter Login
        │
        ▼
Recruiter Dashboard
        │
        ▼
View Candidate List
        │
        ▼
Open Candidate Result
        │
        ▼
Review AI Evaluation
        │
        ▼
Review Scores
        │
        ▼
Review Recommendation
        │
        ▼
Shortlist / Reject Candidate
```

---

# 📂 Resume Parsing Workflow

```text
Candidate Uploads Resume
            │
            ▼
PDF File Received
            │
            ▼
PyMuPDF Extracts Text
            │
            ▼
Regex Extracts Information
            │
            ▼
Candidate Profile Created
            │
            ▼
Stored in SQLite Database
```

---

# 🎤 Voice Interview Workflow

```text
Interview Starts
        │
        ▼
Ultravox Generates Question
        │
        ▼
Question Converted to Voice
        │
        ▼
Candidate Hears Question
        │
        ▼
Candidate Speaks
        │
        ▼
Speech Converted to Text
        │
        ▼
Conversation Continues
        │
        ▼
Interview Ends
```

---

# 📊 Candidate Evaluation Workflow

```text
Interview Transcript
        │
        ▼
Groq API
        │
        ▼
Llama 3.1 8B Instant
        │
        ▼
Candidate Analysis
        │
        ▼
Technical Score
Communication Score
Overall Score
Recommendation
Feedback
        │
        ▼
Results Stored
```

---
# 🖥️ Frontend Architecture

The frontend of SmartHire AI is developed using **React.js** with **Vite** for fast development and **Tailwind CSS** for modern responsive user interfaces.

The frontend communicates with the Flask backend through REST APIs and provides separate interfaces for candidates and recruiters.

---

## Frontend Features

### 🏠 Home Page

The landing page introduces SmartHire AI and allows candidates to begin the interview process.

Features:

- Modern responsive design
- Introduction to SmartHire AI
- Navigation buttons
- Call-to-action section

---

### 📄 Resume Upload Page

The upload page allows candidates to upload their resume before starting the interview.

Features:

- PDF Resume Upload
- Resume validation
- Upload progress
- Backend integration
- Success and error notifications

API Used

```
POST /upload
```

---

### 🎤 AI Interview Page

The interview page is the core feature of SmartHire AI.

Responsibilities:

- Starts AI interview session
- Connects with Ultravox
- Handles microphone access
- AI voice conversation
- Interview controls
- Interview completion

Features

- Start Interview
- End Interview
- Real-time voice interaction
- AI interviewer
- Automatic transcript generation

---

### 📊 Results Page

The Results page displays the AI-generated interview analysis.

Implemented Features

- Candidate Information
- Interview Date
- Circular Overall Score Meter
- Professional Score Cards
- Animated Performance Progress Bars
- AI Feedback
- AI Recommendation
- Recruiter Decision Status
- Download Report
- Dashboard Navigation
- Retake Interview

---

### 👨‍💼 Recruiter Dashboard

The recruiter dashboard provides complete visibility into candidate interviews.

Features

- Total Candidates
- Completed Interviews
- Pending Interviews
- Average Score
- Candidate Table
- Recommendation Status
- Shortlist Candidate
- Reject Candidate
- View Candidate Performance

---

# ⚙️ Backend Architecture

The backend is implemented using **Flask** and exposes REST APIs for resume processing, interview management, AI evaluation, and recruiter operations.

The backend acts as the communication layer between the frontend, AI services, and the database.

Responsibilities include:

- Resume Processing
- Candidate Management
- AI Integration
- Database Operations
- Result Generation
- Recruiter Operations

---

# 📁 Backend Modules

## app.py

The main Flask application.

Responsibilities:

- API Routing
- Database Communication
- Resume Upload
- Candidate APIs
- Result APIs
- Recruiter APIs
- Ultravox Integration

---

## evaluator.py

Responsible for evaluating completed interviews.

Functions:

- Sends transcript to Groq
- Calculates scores
- Generates AI feedback
- Generates recommendation

Returns

- Overall Score
- Technical Score
- Communication Score
- Recommendation
- Recommendation Reason

---

## Resume Parser

The resume parser extracts structured candidate information from uploaded PDF resumes.

Technologies Used

- PyMuPDF
- Regular Expressions

Extracted Information

- Name
- Email
- Phone Number
- Skills
- Education
- Experience
- Certifications
- Languages

---

# 🗄️ Database Design

SmartHire AI uses **SQLite** as its database.

SQLite was selected because it is lightweight, easy to configure, and suitable for local development and academic projects.

---

## Database Tables

### Candidate Information

Stores candidate details extracted from uploaded resumes.

Fields include

- Candidate Name
- Email
- Phone
- Skills
- Education
- Experience
- Resume Path

---

### Interview Results

Stores AI-generated interview evaluation.

Fields

- Candidate Email
- Interview Date
- Overall Score
- Technical Score
- Communication Score
- AI Feedback
- Recommendation
- Recommendation Reason
- Recruiter Status

---

# 🔗 REST API Documentation

---

## Resume APIs

### Upload Resume

```
POST /upload
```

Purpose

Uploads candidate resume and extracts information.

---

## Interview APIs

### Create Ultravox Session

```
POST /ultravox/session
```

Purpose

Creates a new AI voice interview session.

---

### Save Interview

```
POST /save-interview
```

Purpose

Stores completed interview results.

---

## Candidate APIs

### Candidate Results

```
GET /candidate-results/<email>
```

Purpose

Returns complete interview report for the candidate.

---

### Candidate List

```
GET /candidates
```

Purpose

Returns all candidates.

---

## Recruiter APIs

### Update Recruiter Decision

```
POST /update-candidate-status
```

Purpose

Updates recruiter decision.

Possible Values

- Shortlisted
- Rejected
- Pending

---

# 📂 Project Folder Structure

```
SmartHire-AI
│
├── backend
│   │
│   ├── app.py
│   ├── evaluator.py
│   ├── database.py
│   ├── llm_service.py
│   ├── requirements.txt
│   ├── uploads/
│   └── smarthire.db
│
├── frontend
│   │
│   ├── public/
│   ├── src/
│   │   │
│   │   ├── components/
│   │   ├── pages/
│   │   │      Home.jsx
│   │   │      Upload.jsx
│   │   │      Interview.jsx
│   │   │      Results.jsx
│   │   │      Dashboard.jsx
│   │   │      RecruiterDashboard.jsx
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── README.md
└── .env
```

---

# ⚡ Installation Guide

Follow the steps below to set up SmartHire AI on your local machine.

---

## Prerequisites

Make sure the following software is installed before running the project.

- Python 3.10 or above
- Node.js
- npm
- Git
- Visual Studio Code (Recommended)

---

# Clone the Repository

```bash
git clone https://github.com/your-username/AI-Powered-Mock-Interview-and-Candidate-Assessment-Platform.git
```

Move into the project folder.

```bash
cd AI-Powered-Mock-Interview-and-Candidate-Assessment-Platform
```

---

# Backend Setup

Navigate to the backend directory.

```bash
cd backend
```

Create a virtual environment.

```bash
python -m venv venv
```

Activate the virtual environment.

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

Install all required dependencies.

```bash
pip install -r requirements.txt
```

Start the Flask server.

```bash
python app.py
```

Backend runs on

```
http://localhost:5000
```

---

# Frontend Setup

Open another terminal.

Navigate to the frontend folder.

```bash
cd frontend
```

Install dependencies.

```bash
npm install
```

Start the React application.

```bash
npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
GROQ_API_KEY=YOUR_GROQ_API_KEY
ULTRAVOX_API_KEY=YOUR_ULTRAVOX_API_KEY
```

These keys are required for:

- AI interview evaluation
- Voice interview session creation

---

# Project Execution Flow

The complete execution process is shown below.

```
Open Website
      │
      ▼
Upload Resume
      │
      ▼
Resume Parsing
      │
      ▼
Candidate Information Stored
      │
      ▼
Start AI Interview
      │
      ▼
Ultravox Creates Session
      │
      ▼
Voice Interview Begins
      │
      ▼
AI Asks Questions
      │
      ▼
Candidate Answers
      │
      ▼
Speech Converted Into Text
      │
      ▼
Interview Ends
      │
      ▼
Groq Evaluates Transcript
      │
      ▼
Interview Scores Generated
      │
      ▼
Database Updated
      │
      ▼
Candidate Views Results
      │
      ▼
Recruiter Reviews Candidate
```

---

# User Roles

SmartHire AI currently supports two primary user roles.

---

## Candidate

Candidates can:

- Upload Resume
- Start AI Interview
- Participate in Voice Conversation
- View AI Evaluation
- Download Interview Report
- View Recruiter Decision
- Retake Interview

---

## Recruiter

Recruiters can:

- View Dashboard
- View Candidate List
- Monitor Interview Status
- Review Candidate Scores
- Review AI Feedback
- Shortlist Candidates
- Reject Candidates

---



# Report Generation

SmartHire AI allows candidates to download a professional interview report.

Generated using

- jsPDF
- jspdf-autotable

Report Includes

- Candidate Information
- Interview Date
- Overall Score
- Technical Score
- Communication Score
- AI Feedback
- Recommendation
- Recruiter Decision

---

# Error Handling

The application includes validation and error handling for multiple scenarios.

Examples include:

- Invalid Resume Upload
- Missing Resume
- Missing Candidate Email
- Failed API Requests
- Interview Session Errors
- Database Errors
- Empty Interview Results
- Network Failures

---

# 📷 Application Screenshots

The following screenshots showcase the major modules and user interfaces of SmartHire AI.

---

## 🏠 Home Page

<p align="center">
  <img src="screenshots/home.png" width="900">
</p>

---

## 📄 Resume Upload Page

<p align="center">
  <img src="screenshots/upload.png" width="900">
</p>

---

## 🎤 AI Voice Interview

<p align="center">
  <img src="screenshots/interview.png" width="900">
</p>

---

## 📊 Candidate Results Dashboard

<p align="center">
  <img src="screenshots/results.png" width="900">
</p>

---

## 👨‍💼 Recruiter Dashboard

<p align="center">
  <img src="screenshots/recruiter-dashboard.png" width="900">
</p>

---

## 🖼️ Complete UI Gallery

<p align="center">
  <img src="screenshots/home.png" width="45%">
  <img src="screenshots/upload.png" width="45%">
</p>

<p align="center">
  <img src="screenshots/interview.png" width="45%">
  <img src="screenshots/results.png" width="45%">
</p>

<p align="center">
  <img src="screenshots/recruiter-dashboard.png" width="45%">
</p>

---
# 🧪 Testing

The following functionalities have been tested during development.

## Functional Testing

- Resume upload
- Resume parsing
- Candidate creation
- AI interview initiation
- Voice interaction
- Interview completion
- Transcript processing
- AI evaluation
- Result generation
- Recruiter review
- PDF report download

---

## API Testing

The REST APIs were tested using:

- Postman
- Browser Developer Tools

Verified scenarios include:

- Successful requests
- Invalid requests
- Missing data
- Error handling
- Database updates
- Response validation

---

# 📌 Conclusion

SmartHire AI demonstrates how modern Artificial Intelligence technologies can be integrated into the recruitment process to automate candidate assessment and improve hiring efficiency.

The platform combines resume parsing, conversational AI, speech processing, and LLM-powered evaluation into a unified workflow. Candidates receive a realistic interview experience with detailed feedback, while recruiters benefit from centralized candidate management and AI-assisted decision-making.

By integrating **Ultravox** for AI-driven voice interviews and **Groq's Llama 3.1 8B Instant** for transcript evaluation, SmartHire AI showcases a practical application of Generative AI within human resource technology.

The project also highlights full-stack development practices through a React frontend, Flask backend, SQLite database, RESTful APIs, and responsive user interface design.

SmartHire AI serves as a strong foundation for future enhancements such as multi-round interviews, video analysis, authentication, cloud deployment, advanced analytics, and enterprise-level recruitment workflows.

---

## 👩‍💻 Developed By

**Kavali Deepthi Priya**

* SmartHire AI Project Team

GitHub: https://github.com/Deepthi0511

---

## License

This project is developed for educational and learning purposes.
