# SmartHire AI – AI-Powered Mock Interview & Candidate Assessment Platform

SmartHire AI is a full-stack recruitment platform that streamlines the hiring process by combining resume parsing, candidate management, and AI-powered mock interviews. It enables candidates to upload resumes, practice interviews, and receive automated evaluations, while providing recruiters with a centralized dashboard to review applicants.

---

## Features

### Candidate Features
- Upload resume (PDF)
- Automatic resume parsing
- Candidate dashboard with extracted profile details
- AI-powered mock interview
- Voice-to-text answer recording
- Interview timer and progress tracking
- Interview evaluation and feedback
- Interview results dashboard

### Recruiter Features
- Recruiter dashboard
- View all candidates
- Resume insights
- Candidate profile details
- Interview results overview

### Backend Features
- RESTful APIs using Flask
- Resume parsing
- Duplicate resume detection
- SQLite database integration
- Interview answer storage
- Candidate management APIs

---

## Tech Stack

### Frontend
- React
- React Router
- Tailwind CSS
- Vite

### Backend
- Flask
- Flask-CORS
- SQLite3
- Python

### AI & NLP
- Resume Parsing
- Speech Recognition (Web Speech API)
- Rule-based Interview Evaluation

---

## Project Structure

```
AI-Powered-Mock-Interview-and-Candidate-Assessment-Platform/

│
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── parser.py
│   ├── evaluator.py
│   ├── requirements.txt
│   ├── uploads/
│   └── static/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## Current Workflow

1. Candidate uploads a resume.
2. Flask backend parses the resume.
3. Resume information is stored in SQLite.
4. Candidate dashboard displays extracted details.
5. Candidate starts an AI mock interview.
6. Voice answers are converted into text.
7. Interview responses are saved.
8. Interview evaluation generates scores and feedback.
9. Recruiters can view candidate information through the recruiter dashboard.

---

## API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/upload` | Upload and parse resume |
| GET | `/candidate` | Get latest candidate |
| GET | `/candidates` | Get all candidates |
| POST | `/save-interview` | Save interview responses |
| GET | `/interview-results` | Get latest interview result |

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd AI-Powered-Mock-Interview-and-Candidate-Assessment-Platform
```

---

### Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

Backend runs on:

```
http://127.0.0.1:5000
```

---

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## Database

SQLite database includes:

### resumes
- Name
- Email
- Phone
- Skills
- Education
- Experience
- Projects
- Certifications
- Languages
- Resume Path

### interview_results
- Candidate Email
- Interview Answers
- Overall Score
- Technical Score
- Communication Score
- Feedback
- Timestamp

---

## Screens

- Home Page
- Resume Upload
- Candidate Dashboard
- Recruiter Dashboard
- AI Mock Interview
- Interview Results

---

## Future Enhancements

- LLM-powered interview question generation
- Resume-based dynamic interview questions
- Deepgram speech-to-text integration
- Text-to-speech AI interviewer
- AI-powered answer evaluation using LLMs
- JWT Authentication
- Recruiter login and candidate authentication
- Resume ranking and ATS scoring
- Interview analytics dashboard
- Email notifications
- Cloud database deployment

---

## Author

**Kavali Deepthi Priya**

B.Tech Computer Science Engineering (2025)

GitHub: https://github.com/Deepthi0511

---

## License

This project is developed for educational and portfolio purposes.
