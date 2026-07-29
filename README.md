# SmartHire AI

## AI-Powered Mock Interview and Candidate Assessment Platform

SmartHire AI is an AI-driven recruitment and candidate assessment platform designed to automate technical interviews, evaluate candidate performance, and provide intelligent insights for both candidates and recruiters.

The platform combines **resume intelligence, AI-generated interviews, voice-based interaction, speech processing, and LLM-powered evaluation** to simulate a real interview experience while reducing manual screening effort.

---

# 🚀 Features

## Candidate Features

### 📄 Resume Upload & Parsing

* Upload resumes in PDF format
* Automatically extract:

  * Name
  * Email
  * Phone number
  * Technical skills
  * Education
  * Experience
  * Projects
  * Certifications
  * Languages

### 🤖 AI-Powered Mock Interview

* Personalized interview based on candidate resume
* AI interviewer asks relevant questions
* Voice-based interaction for realistic interview experience
* Supports multiple interview attempts

### 🎤 Voice Interview System

* Real-time AI voice interaction
* Speech-to-text conversion
* AI-generated responses
* Text-to-speech output

### 📊 AI Interview Evaluation

After completion, candidates receive:

* Overall score
* Technical knowledge score
* Communication score
* AI-generated feedback
* Strengths and improvement areas
* Recommendation

### 📈 Candidate Dashboard

Candidates can view:

* Resume information
* Interview status
* AI score
* Feedback
* Interview history
* Recruiter decision

---

# Recruiter Features

## 👥 Recruiter Dashboard

Recruiters can:

* View all candidates
* Monitor interview completion status
* View candidate scores
* Analyze AI recommendations
* Review interview results

## Candidate Management

Recruiters can:

* Shortlist candidates
* Reject candidates
* Track candidate progress

Status workflow:

```
Resume Uploaded
        |
        ↓
Interview Pending
        |
        ↓
Interview Completed
        |
        ↓
Recruiter Review
        |
        ↓
Shortlisted / Rejected
```

---

# 🏗️ System Architecture

```
                    Candidate
                        |
                        |
                 Upload Resume
                        |
                        ↓
              Resume Parsing Engine
                        |
                        ↓
                 Candidate Profile
                        |
                        ↓
              AI Interview Generator
                        |
                        ↓
              Voice Interview Agent
                        |
                        ↓
              Interview Transcript
                        |
                        ↓
              LLM Evaluation Engine
                        |
                        ↓
              Candidate Feedback
                        |
                        ↓
              Recruiter Dashboard
```

---

# 🛠️ Tech Stack

## Frontend

| Technology   | Purpose             |
| ------------ | ------------------- |
| React.js     | User interface      |
| Vite         | Frontend build tool |
| Tailwind CSS | Styling             |
| React Router | Navigation          |
| JavaScript   | Frontend logic      |

---

## Backend

| Technology     | Purpose                        |
| -------------- | ------------------------------ |
| Python         | Backend development            |
| Flask          | REST API framework             |
| SQLite         | Database                       |
| PyMuPDF (fitz) | Resume text extraction         |
| REST APIs      | Frontend-backend communication |

---

## Artificial Intelligence

| Technology        | Purpose                               |
| ----------------- | ------------------------------------- |
| Groq LLM          | AI evaluation and feedback generation |
| Llama Model       | Candidate assessment                  |
| Ultravox          | AI voice interview agent              |
| Speech Processing | Voice-based interaction               |

---

# 🧠 AI Workflow

## 1. Resume Understanding

The uploaded resume is processed using document extraction techniques.

Extracted information is used to create a candidate profile.

---

## 2. Interview Generation

AI creates interview questions based on:

* Candidate skills
* Projects
* Experience
* Technical background

---

## 3. Voice Interview

The AI interviewer:

* Asks questions
* Listens to candidate responses
* Maintains interview flow

---

## 4. Candidate Evaluation

The transcript is analyzed using LLM evaluation.

Evaluation criteria:

| Category                     | Weight |
| ---------------------------- | ------ |
| Technical Knowledge          | 40%    |
| Communication Skills         | 20%    |
| Problem Solving              | 20%    |
| Confidence & Professionalism | 20%    |

---

# 📂 Project Structure

```
SmartHire-AI
│
├── backend
│   ├── app.py
│   ├── database.py
│   ├── evaluator.py
│   ├── answer_evaluator.py
│   ├── llm_service.py
│   ├── ultravox_service.py
│   └── requirements.txt
│
├── frontend
│   ├── src
│   │   ├── components
│   │   │   ├── home
│   │   │   ├── interview
│   │   │   └── layout
│   │   │
│   │   ├── pages
│   │   │   ├── Home.jsx
│   │   │   ├── Upload.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Interview.jsx
│   │   │   ├── Results.jsx
│   │   │   ├── RecruiterDashboard.jsx
│   │   │   └── InterviewHistory.jsx
│   │   │
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

# ⚙️ Installation & Setup

## Backend Setup

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to backend:

```bash
cd backend
```

Create virtual environment:

```bash
python -m venv venv
```

Activate environment:

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `.env` file:

```
GROQ_API_KEY=your_api_key
ULTRAVOX_API_KEY=your_api_key
```

Run backend:

```bash
python app.py
```

Backend runs on:

```
http://127.0.0.1:5000
```

---

# Frontend Setup

Navigate to frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run application:

```bash
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# 🗄️ Database Design

## Resume Table

Stores:

* Candidate information
* Resume details
* Current interview status
* Recruiter decision

## Interview Results Table

Stores:

* Interview score
* Technical score
* Communication score
* Feedback
* Recommendation
* Interview history

---

# 🔐 Security

Implemented:

* Environment variables for API keys
* Input validation
* File upload validation
* Controlled API communication

---

# 🎯 Future Enhancements

Possible improvements:

* Video-based emotion analysis
* Advanced cheating detection
* Multi-language interviews
* Cloud deployment
* Automated interview scheduling
* Advanced recruiter analytics

---



# ⭐ Project Highlights

✔ AI-powered recruitment automation
✔ Resume-based personalized interviews
✔ Voice-enabled AI interviewer
✔ LLM-based candidate evaluation
✔ Recruiter management dashboard
✔ Complete candidate assessment workflow

---


## 👩‍💻 Developed By

**Kavali Deepthi Priya**

* SmartHire AI Project Team

GitHub: https://github.com/Deepthi0511

---

## License

This project is developed for educational and learning purposes.
