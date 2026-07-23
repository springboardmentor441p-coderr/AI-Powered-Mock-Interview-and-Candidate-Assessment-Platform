# SmartHire AI – AI-Powered Mock Interview and Candidate Assessment Platform

## Overview

SmartHire AI is an AI-powered recruitment platform that helps candidates practice technical interviews and enables recruiters to evaluate candidate performance. The platform automatically extracts resume details, generates personalized interview questions, conducts voice-based mock interviews, evaluates responses using AI, and stores interview results for later review.

---

## Features

### Resume Upload & Parsing

* Upload resumes in PDF format.
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

### AI Question Generation

* Generates interview questions based on:

  * Candidate skills
  * Projects
  * Experience
* Uses the Groq LLM (Llama 3.1) for intelligent question generation.

### AI Voice Interview

* Conducts voice-based mock interviews using Ultravox.
* AI asks interview questions through speech.
* Candidate answers naturally using voice.
* Supports real-time voice interaction.

### AI Answer Evaluation

* Evaluates candidate responses using the Groq LLM.
* Measures:

  * Technical Knowledge
  * Communication Skills
  * Problem Solving
  * Confidence
* Generates:

  * Overall Score
  * Technical Score
  * Communication Score
  * Personalized Feedback

### Interview History

* Stores completed interview results.
* Allows candidates to view previous interview attempts.
* Maintains interview history for future reference.

### Recruiter Dashboard

* View uploaded candidate resumes.
* Access interview reports.
* Review AI-generated scores and feedback.

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* JavaScript

### Backend

* Flask
* Python
* SQLite

### AI & Voice

* Groq API
* Llama 3.1 8B Instant
* Ultravox Voice SDK

### Resume Parsing

* PyMuPDF (fitz)
* Regular Expressions (Regex)

---

## Project Structure

```text
SmartHire-AI/
│
├── backend/
│   ├── app.py
│   ├── llm_service.py
│   ├── answer_evaluator.py
│   ├── question_generator.py
│   ├── ultravox_service.py
│   ├── evaluator.py
│   ├── check_db.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Interview.jsx
│   │   │   ├── Result.jsx
│   │   │   ├── InterviewHistory.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── RecruiterDashboard.jsx
│   │   └── components/
│   └── package.json
│
└── README.md
```

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/<your-username>/AI-Powered-Mock-Interview-and-Candidate-Assessment-Platform.git
```

### Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

---

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## Environment Variables

Create a `.env` file inside the backend folder.

```env
GROQ_API_KEY=your_groq_api_key
ULTRAVOX_API_KEY=your_ultravox_api_key
```

---

## Workflow

1. Upload a resume.
2. Resume details are extracted automatically.
3. AI generates interview questions based on the resume.
4. Ultravox conducts the voice interview.
5. Candidate answers using voice.
6. Groq evaluates the responses.
7. Scores and feedback are generated.
8. Results are stored in the database.
9. Candidates and recruiters can review interview history.

---



## Author

**Kavali Deepthi Priya**

B.Tech Computer Science Engineering (2025)

GitHub: https://github.com/Deepthi0511

---

## License

This project is developed for educational and learning purposes.
