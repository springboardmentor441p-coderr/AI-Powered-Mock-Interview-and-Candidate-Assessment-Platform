SmartHire AI — AI-Powered Mock Interview & Candidate Assessment Platform

SmartHire AI is a full-stack web application designed to help candidates practice interviews with an AI interviewer, receive structured performance feedback, analyze their progress, and improve their interview readiness.

The platform also provides recruiter/admin assessment views while keeping the assessment focused on practice and coaching rather than making automated hiring decisions.

What This Project Does

SmartHire AI brings the complete interview-practice workflow into one application:

A candidate creates an account and signs in.

The candidate uploads a resume.

The platform extracts useful resume information such as skills, technologies, and project context.

The candidate configures a mock interview by selecting the target role, difficulty, experience level, and interview duration.

An AI-driven interview session asks questions and can generate follow-up questions based on the conversation.

The candidate can use webcam and microphone features during the interview.

Speech can be transcribed using Deepgram.

The candidate's answers are evaluated using a structured scoring system.

Completed interviews are stored in PostgreSQL.

The candidate can view interview history, scores, analytics, strengths, weaknesses, and recommendations.

A detailed interview report can be downloaded as a PDF.

Notifications are generated when an interview, assessment, or report becomes available.

Resume/job-description matching helps candidates identify matched skills and possible skill gaps.

Recruiter/admin users can view protected candidate assessment information.

Main Features

1. Authentication and User Roles

The backend implements authenticated users with role-based access.

Supported roles include:

Candidate

Recruiter

Admin

The authentication system uses:

FastAPI

JWT-based authentication

Password hashing

Protected API routes

Role-based authorization

Candidates can access their own interviews, resumes, feedback, reports, analytics, and notifications.

Recruiter/admin functionality is protected separately from candidate functionality.

2. Candidate Dashboard

The candidate dashboard provides a central view of interview progress.

It includes:

Interviews completed

Average score

Best score

Communication score

Technical relevance score

Confidence score

Problem-solving score

Performance trend

Recent interviews

AI-generated insights

Strengths

Weaknesses

Recommendations

Monthly practice goal

Recommended interview types

The dashboard uses stored assessment data rather than displaying fabricated interview results.

3. Candidate Practice Studio

The candidate interface is organized around a practice-studio style sidebar.

Navigation includes:

Dashboard

Mock Interview

AI Feedback

Analytics

The interface also includes:

Practice streak

AI practice tips

Profile menu

Settings

Logout

Notification bell

Responsive interview-practice layout

4. Resume Upload and Resume-Aware Interviews

Candidates can upload PDF resumes.

The backend:

Stores uploaded resumes

Extracts PDF text

Identifies useful resume information

Extracts skills and technologies

Identifies project context

Associates a resume with an interview

Resume information is used as context for interview preparation rather than being treated as proof of a candidate's abilities.

The interview agent includes safeguards to avoid presenting unsupported resume information as something the candidate has personally claimed during the conversation.

5. Resume Studio

The Resume Studio allows candidates to work with their resume and a target job description.

It provides:

Resume selection

Resume skill extraction

Job-description input

Skill matching

Matched skills

Potential skill gaps

Match score

This helps candidates identify areas they may want to improve before an interview.

6. Configurable Mock Interviews

Candidates can configure interview sessions using parameters such as:

Target role

Interview mode

Difficulty

Experience level

Interview duration

Resume context

The application supports configured interview durations of:

10 minutes

20 minutes

30 minutes

The backend associates each duration with a corresponding question limit.

7. AI Interview Engine

The interview engine is designed to behave like a structured mock interviewer rather than simply presenting a fixed list of questions.

It supports interview stages such as:

Warm-up

Introduction

Experience

Projects

Technical

Behavioral

Closing

The interview agent maintains conversation memory and tracks:

Previous questions

Previous answers

Topics explored

Topics remaining

Current interview stage

Follow-up depth

Candidate-provided context

The system can:

Ask the next question

Ask a follow-up

Transition to another topic

Avoid repetitive questions

Move toward closing

End the interview when appropriate

8. Grounded Follow-Up Questions

A major part of the interview engine is keeping follow-up questions grounded in the conversation.

The system checks whether proposed questions contain unsupported references to:

Candidate claims

Projects

Technologies

Dates

Resume phrases

Previous statements

If an AI-generated question is not sufficiently grounded, the system can replace it with a safer locally generated question.

This helps prevent the interviewer from saying that a candidate "mentioned" something when the candidate never actually said it.

9. AI Interviewer — Nova

The frontend includes a fictional AI interviewer called Nova.

Nova provides the visual interviewer experience and browser speech output.

The implementation includes:

Animated AI interviewer presence

Speaking state

Ready state

Thinking/processing states

Browser speech synthesis

Interview status updates

The live voice integration can optionally use Ultravox when an API key is configured.

The Ultravox integration keeps the API credential on the backend and creates an authenticated interview call for the current candidate session.

10. Voice Interview and Speech Transcription

The project supports voice-based interview interaction.

Deepgram

The backend includes an authenticated WebSocket relay for Deepgram live transcription.

It supports:

Microphone audio streaming

Interim transcripts

Final transcripts

Speech-start events

Utterance-end events

Confidence values

Punctuation

Smart formatting

Indian English language configuration

The Deepgram API key remains on the backend.

Ultravox

An optional Ultravox integration provides a live AI voice interviewer.

The backend creates the voice call and supplies Nova's interviewer instructions.

Both services are optional integrations and require their respective API credentials.

11. Webcam and Microphone Support

The interview room supports browser camera and microphone permissions.

The interface manages states such as:

Camera preview

Microphone preparation

Listening

Candidate speaking

Silence detection

AI speaking

Answer analysis

Follow-up required

Answer accepted

Next question

Interview completion

Camera and microphone access is controlled through browser permissions.

12. Interview Timing and Completion

Interview sessions have server-side duration configuration.

The backend tracks:

Interview start time

Current question

Interview status

Interview end time

Configured duration

Question count

The interview can transition to a completed state when the configured interview flow finishes or the time limit is reached.

Incomplete interviews are handled separately from completed interviews so that incomplete sessions do not receive misleading final feedback.

13. Answer Evaluation

Each meaningful interview answer can be evaluated using a structured rubric.

The evaluation contains categories such as:

Overall score

Relevance

Technical correctness

Completeness

Communication

Confidence

Examples

Feedback

Suggested better answer

The evaluation is persisted for individual interview questions.

This makes it possible to calculate interview-level analytics from the stored answer evaluations.

14. Practice Feedback

After a completed interview, the platform generates practice feedback.

Feedback can include:

Overall score

Communication score

Technical knowledge/relevance score

Confidence score

Problem-solving/completeness score

Strengths

Improvements

Recommended topics

Per-question evaluation breakdown

The feedback explicitly treats the result as interview practice guidance rather than an employment decision.

15. Interview History

Candidates can view their previous completed interviews.

History contains information such as:

Interview ID

Interview date

Status

Score

Assessment information

Report availability

The dashboard also shows recent completed interviews.

16. Performance Analytics

The analytics system calculates performance from stored interview assessments.

It supports:

Average score

Best score

Communication average

Confidence average

Technical relevance average

Problem-solving average

Performance trend

Recent interview history

Strengths

Weaknesses

Recommendations

This allows candidates to track improvement across multiple practice sessions.

17. Downloadable PDF Reports

Candidates can download reports for their completed interviews.

Reports can contain:

Candidate information

Interview information

Overall score

Category scores

Strengths

Weaknesses

Recommendations

Answer evaluations

Feedback

Suggested improvements

The backend generates the report as a PDF.

Recruiter/admin users can also access report functionality for authorized candidate assessments.

18. Notifications

The application includes a database-backed notification system.

Notifications can be generated for:

Interview completed

Assessment results available

Report available

The frontend provides:

Notification bell

Unread notification count

Notification list

Individual read action

Mark-all-as-read action

Automatic refresh

Email notifications are also supported as an optional best-effort feature when SMTP configuration is available.

The application continues working if SMTP is not configured.

19. Recruiter/Admin Assessment

Protected recruiter/admin functionality provides access to candidate assessment information.

Assessment information includes data such as:

Candidate name

Candidate email

Interview date

Response completion

Practice score

Category scores

Interview status

Access is protected using authentication and role checks.

The assessment system is designed for practice/coaching support and should not be used as the sole basis for hiring decisions.

Database Design

The backend uses PostgreSQL with SQLAlchemy ORM.

The main database entities include:

User
  │
  ├── Resume
  │
  ├── Interview
  │      │
  │      ├── InterviewProfile
  │      │
  │      └── InterviewQuestion
  │               │
  │               └── InterviewQuestionEvaluation
  │
  └── Notification

Important tables include:

users

resumes

interviews

interview_profiles

interview_questions

interview_question_evaluations

notifications

Relationships are implemented using SQLAlchemy ORM.

Backend API

The FastAPI backend is organized into routers for different application areas.

Major API areas include:

/auth
/users
/interviews
/assessments
/resumes
/notifications
/voice

The application also exposes interactive FastAPI documentation.

When running locally:

http://localhost:8000/docs

Frontend

The frontend is built using:

React

Vite

JavaScript / JSX

CSS

Browser Web APIs

Important frontend areas include:

frontend/src/
├── api/
├── components/
├── context/
├── pages/
└── speech/

Important pages include:

CandidateDashboard
InterviewSetup
InterviewRoom
InterviewHistoryPage
FeedbackPage
ResumeStudio
QuestionBankPage
ProfilePage
SettingsPage
RecruiterDashboard
AdminDashboard
Login
Register

Backend Architecture

The backend is organized into:

backend/app/
├── ai/
├── prompts/
├── routers/
├── services/
├── database.py
├── dependencies.py
├── main.py
├── models.py
├── schemas.py
└── security.py

Services handle responsibilities such as:

Conversation memory

Interview agent logic

LLM integration

Resume processing

Resume context

Answer evaluation

Report generation

Notifications

Prompt construction

This separation keeps interview logic, API routes, database models, and external integrations independent.

Testing

The project includes backend tests covering areas such as:

Authentication

Interview engine

Prompt building

Resume processing

Assessments

Notifications

Tests are located in:

backend/tests/

Run them with:

cd backend
pip install -r requirements-dev.txt
pytest

Technology Stack

Frontend

React

Vite

JavaScript / JSX

CSS

Ultravox Client

Browser Speech APIs

WebSocket communication

Backend

Python

FastAPI

SQLAlchemy

PostgreSQL

Pydantic

JWT authentication

ReportLab

PDF text extraction

AI / Voice Integrations

Ultravox

Deepgram

Optional Gemini-compatible LLM configuration

Deployment / Development

Docker

Docker Compose

PostgreSQL Docker container

Separate frontend and backend containers

Project Structure

SmartHire AI
│
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   ├── prompts/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── security.py
│   │
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── requirements-dev.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── speech/
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── api-documentation.md
│   ├── database-schema.md
│   ├── requirements.md
│   └── wireframes.md
│
├── docker-compose.yml
├── .env.example
└── README.md

Running the Project

1. Configure environment variables

Create a local .env file from .env.example.

Optional integrations can be configured with:

ULTRAVOX_API_KEY=
DEEPGRAM_API_KEY=
GEMINI_API_KEY=
LLM_PROVIDER=
LLM_MODEL=
LLM_TIMEOUT_SECONDS=

Do not commit real API keys or passwords.

2. Start the application with Docker

From the project root:

docker compose up --build

3. Open the application

Frontend:

http://localhost:5173

Backend API:

http://localhost:8000

FastAPI documentation:

http://localhost:8000/docs

4. Stop the application

docker compose down

Privacy and Responsible Use

SmartHire AI is an academic/practice platform.

Camera and microphone permissions are controlled by the browser.

The application is designed for interview practice.

Assessment results are intended to support coaching and self-improvement.

Automated scores should not be treated as definitive judgments about a candidate.

Assessment results should never be the sole basis for an employment decision.

External API credentials should remain in environment variables.

Secrets should never be committed to GitHub.

Project Goal

The goal of SmartHire AI is to provide a realistic, data-driven interview practice environment where candidates can:

Prepare → Practice → Get Evaluated → Understand Weaknesses → Improve → Practice Again

The platform combines resume-aware interview preparation, conversational interview logic, voice interaction, structured answer evaluation, performance analytics, reports, and personalized practice feedback into a single full-stack application.