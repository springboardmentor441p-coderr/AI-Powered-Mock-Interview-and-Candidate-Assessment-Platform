# InterviewIQ – AI-Powered Live Interview and Candidate Assessment Platform

A production-ready Final Year Major Project built with **Python Flask**, featuring AI-powered mock interviews, resume parsing, speech analysis, emotion detection, and comprehensive candidate assessment.

## Features

| Module | Description |
|--------|-------------|
| **Authentication** | Registration, Login, JWT API, Google OAuth, Role-based access (Admin/Recruiter/Candidate) |
| **Resume Upload** | PDF parsing, skill extraction, AI summary, missing skills analysis |
| **AI Interview** | Gemini-powered question generation (HR/Technical/Behavioral/Aptitude) |
| **Live Session** | Webcam, microphone, timer, audio/video recording |
| **Speech Analysis** | STT, grammar check, pace, filler words, communication score |
| **Emotion Detection** | OpenCV + MediaPipe facial analysis, eye contact, confidence |
| **AI Evaluation** | Weighted scoring with strengths, weaknesses, recommendations |
| **Dashboards** | Role-specific analytics with Chart.js graphs |
| **PDF Reports** | ReportLab-generated downloadable assessment reports |

## Tech Stack

- **Backend:** Python 3.12, Flask, SQLAlchemy, Flask-JWT-Extended, Flask-Login, Flask-Migrate
- **Frontend:** HTML5, CSS3, Bootstrap 5, JavaScript, Jinja2, Chart.js
- **AI/ML:** Google Gemini, OpenCV, MediaPipe, SpeechRecognition, LanguageTool
- **Database:** SQLite (dev) / MySQL (production)
- **Deployment:** Docker, Gunicorn

## Quick Start

### 1. Clone and setup

```bash
cd SmartHireAI
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure environment

```bash
copy .env.example .env   # Windows
cp .env.example .env     # Linux/Mac
```

Edit `.env` and set your `GEMINI_API_KEY` (optional – fallback logic works without it).

### 3. Run the application

```bash
python run.py
```

Open **http://localhost:5000** in your browser.

### Default Admin Account

| Field | Value |
|-------|-------|
| Email | admin@smarthire.ai |
| Password | Admin@123 |

Register as **Candidate** or **Recruiter** from the registration page.

## Project Structure

```
SmartHireAI/
├── app/
│   ├── auth/           # Authentication (JWT, OAuth)
│   ├── admin/          # Admin dashboard
│   ├── recruiter/      # Recruiter dashboard
│   ├── candidate/      # Candidate dashboard
│   ├── interview/      # Interview sessions
│   ├── resume/         # Resume upload & parsing
│   ├── ai/             # Gemini, speech, emotion services
│   ├── analytics/      # Dashboard analytics
│   ├── reports/        # PDF report generation
│   ├── models/         # SQLAlchemy models
│   ├── templates/      # Jinja2 HTML templates
│   └── static/         # CSS, JavaScript
├── docker/             # Docker configuration
├── uploads/            # Uploaded files
├── instance/           # SQLite database
├── requirements.txt
├── run.py
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/api/login` | JWT login |
| POST | `/auth/api/refresh` | Refresh JWT token |
| GET | `/auth/api/me` | Current user profile |
| POST | `/resume/api/upload` | Upload resume PDF |
| POST | `/interview/api/save-answer` | Save interview answer |
| POST | `/interview/api/complete/<id>` | Complete interview |

### JWT Login Example

```bash
curl -X POST http://localhost:5000/auth/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

## MySQL Migration

Update `.env`:

```
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/smarthire
```

Then run:

```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

## Docker Deployment

```bash
cd docker
docker-compose up --build
```

## Google OAuth Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API / OAuth 2.0
3. Add redirect URI: `http://localhost:5000/auth/google/callback`
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

## Gemini API Setup

1. Get API key from [Google AI Studio](https://aistudio.google.com/)
2. Set `GEMINI_API_KEY` in `.env`

> Without Gemini API key, the platform uses intelligent fallback question generation and rule-based evaluation.

## Scoring Formula

```
Overall = Communication×0.30 + Confidence×0.25 + Technical×0.30 + Professionalism×0.15
```

## License

Educational project for Final Year Major Project submission.
