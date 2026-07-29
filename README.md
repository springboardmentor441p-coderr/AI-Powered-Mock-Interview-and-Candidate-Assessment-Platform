# SmartHire AI – AI-Powered Mock Interview & Candidate Assessment Platform

> An AI-powered recruitment platform that automates resume analysis, generates personalized interview questions, conducts voice-based mock interviews, and evaluates candidate performance using Large Language Models.

---

# Table of Contents

* Overview
* Key Features
* Technology Stack
* System Architecture
* AI Technologies Used
* Project Workflow
* Folder Structure
* API Endpoints
* Getting Started
* Environment Variables
* Database
* Future Enhancements
* Contributors
* License

---

# Overview

SmartHire AI is an intelligent recruitment platform designed to improve the interview experience for both candidates and recruiters.

The platform automatically extracts candidate information from resumes, generates technical interview questions using AI, conducts real-time voice interviews, evaluates candidate responses, and stores interview reports for future analysis.

The goal is to reduce manual interview effort while providing fair, structured, and AI-assisted candidate evaluation.

---

# Key Features

## Resume Parsing

* Upload PDF resumes
* Automatically extracts:

  * Name
  * Email
  * Phone Number
  * Education
  * Skills
  * Experience
  * Projects
  * Certifications
  * Languages

---

## AI Question Generation

Interview questions are generated dynamically using the candidate's:

* Skills
* Experience
* Projects
* Education

This enables every interview to be personalized instead of using fixed question sets.

---

## Voice-Based Interview

The interview is conducted through voice interaction.

Features include:

* AI asks interview questions
* Candidate answers using speech
* Real-time speech conversation
* Natural interview experience

---

## AI Answer Evaluation

Candidate answers are evaluated using an LLM.

Evaluation includes:

* Technical Knowledge
* Communication Skills
* Confidence
* Problem Solving
* Overall Performance

The platform generates:

* Overall Score
* Technical Score
* Communication Score
* AI Feedback

---

## Interview History

Stores previous interview sessions.

Candidates can:

* View previous interviews
* Compare performance
* Track improvement

---

## Recruiter Dashboard

Recruiters can:

* View uploaded resumes
* Review interview reports
* Access AI-generated feedback
* Monitor candidate performance

---

# Technology Stack

| Layer             | Technology                  |
| ----------------- | --------------------------- |
| Frontend          | React, Vite, Tailwind CSS   |
| Backend           | Flask, Python               |
| Database          | SQLite                      |
| Resume Parsing    | PyMuPDF (fitz), Regex       |
| AI Model          | Groq (Llama 3.1 8B Instant) |
| Voice AI          | Ultravox SDK                |
| API Communication | REST APIs                   |
| Version Control   | Git & GitHub                |

---

# System Architecture

```text
                    Candidate
                        │
                        ▼
               Upload Resume (PDF)
                        │
                        ▼
              Resume Parser (Flask)
                        │
         Extract Candidate Information
                        │
                        ▼
          Groq LLM Question Generator
                        │
                        ▼
             Personalized Questions
                        │
                        ▼
        Ultravox Voice Interview Agent
        (Question ↔ Voice ↔ Candidate)
                        │
                        ▼
          Candidate Voice Responses
                        │
                        ▼
          Groq AI Answer Evaluation
                        │
                        ▼
            Interview Score & Feedback
                        │
                        ▼
              SQLite Database Storage
                        │
                        ▼
       Candidate & Recruiter Dashboard
```

---

# AI Technologies Used

## 1. Groq LLM

### Model

```
Llama 3.1 8B Instant
```

### Responsibilities

* Resume-based question generation
* Candidate answer evaluation
* Technical scoring
* Communication scoring
* Personalized feedback generation

---

## 2. Ultravox SDK

Used for:

* Voice interaction
* Asking interview questions
* Listening to candidate responses
* Real-time conversational interview experience

---

## 3. Resume Parsing

Resume information is extracted using:

* PyMuPDF (fitz)
* Python Regular Expressions

Extracted information includes:

* Contact details
* Education
* Skills
* Projects
* Certifications
* Languages

---

# Project Workflow

```
Resume Upload
      │
      ▼
Resume Parsing
      │
      ▼
Candidate Information Extraction
      │
      ▼
Groq Generates Interview Questions
      │
      ▼
Ultravox Conducts Voice Interview
      │
      ▼
Candidate Answers Questions
      │
      ▼
Groq Evaluates Responses
      │
      ▼
Score Generation
      │
      ▼
Feedback Generation
      │
      ▼
Interview History Stored
      │
      ▼
Recruiter Dashboard
```

---

# Evaluation Criteria

| Category                     | Weight |
| ---------------------------- | ------ |
| Technical Knowledge          | 40%    |
| Communication Skills         | 20%    |
| Problem Solving              | 20%    |
| Confidence & Professionalism | 20%    |

---

# Folder Structure

```text
SmartHire-AI
│
├── backend
│   ├── app.py
│   ├── llm_service.py
│   ├── evaluator.py
│   ├── answer_evaluator.py
│   ├── question_generator.py
│   ├── ultravox_service.py
│   ├── check_db.py
│   ├── requirements.txt
│   └── .env
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   │
│   │   ├── Home.jsx
│   │   ├── Upload.jsx
│   │   ├── Interview.jsx
│   │   ├── Result.jsx
│   │   ├── InterviewHistory.jsx
│   │   ├── Dashboard.jsx
│   │   ├── RecruiterDashboard.jsx
│   │   └── Feedback.jsx
│   │
│   └── package.json
│
├── README.md
└── .gitignore
```

---

# API Endpoints

## Resume

| Method | Endpoint  | Description             |
| ------ | --------- | ----------------------- |
| POST   | `/upload` | Upload and parse resume |

---

## Interview

| Method | Endpoint              | Description                  |
| ------ | --------------------- | ---------------------------- |
| POST   | `/generate-questions` | Generate interview questions |
| POST   | `/ultravox/session`   | Create Ultravox session      |
| POST   | `/ultravox/speak`     | Send question to voice agent |

---

## Evaluation

| Method | Endpoint             | Description                 |
| ------ | -------------------- | --------------------------- |
| POST   | `/save-interview`    | Save interview results      |
| GET    | `/interview-results` | View interview reports      |
| GET    | `/candidate`         | Candidate information       |
| GET    | `/results`           | Retrieve evaluation results |

---

# Getting Started

## Clone Repository

```bash
git clone https://github.com/<your-username>/AI-Powered-Mock-Interview-and-Candidate-Assessment-Platform.git
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# Environment Variables

Create a `.env` file inside the backend folder.

```env
GROQ_API_KEY=your_groq_api_key
ULTRAVOX_API_KEY=your_ultravox_api_key
```

---

# Database

Current database:

```
SQLite
```

Stores:

* Candidate Information
* Resume Data
* Interview Scores
* Technical Scores
* Communication Scores
* Feedback
* Interview History

---


## Author

**Kavali Deepthi Priya**

* SmartHire AI Project Team

GitHub: https://github.com/Deepthi0511

---

## License

This project is developed for educational and learning purposes.
