# SmartHire AI - Milestone 3

FastAPI + React application for authentication, resumes, AI mock interviews, practice assessments, and recruiter review.

Run `docker compose up --build`, then open `http://localhost:5173`. API documentation is at `http://localhost:8000/docs`.

## Milestones 1 and 2

- Candidate webcam and microphone permission preview
- Professional two-person video-call style interview room
- AI interviewer avatar (fictional, clearly labelled)
- Five saved mock-interview questions, linked to the candidate's latest uploaded resume
- Start, save answer/next question, and end interview controls

Camera and microphone are only used for the local browser preview. No video is recorded.

## Milestone 3

- Candidate interview-history cards with saved assessment scores
- Protected recruiter assessment dashboard with candidate name, response completion, date, and practice score
- Candidate search in the recruiter dashboard
- Clear practice-only notice: results must support coaching and never be the sole basis for a hiring decision

For this academic demo, the registration screen provides Candidate and Recruiter account types. In a real production system, recruiters must be created by an administrator or invitation flow rather than self-selecting the role.

## Milestone 4

- **Candidate analytics** — `GET /assessments/analytics` aggregates real, completed-interview data only (interviews completed, average/best score, communication/confidence/technical/problem-solving averages, performance trend, recent history, strengths, weaknesses, recommendations). No score is ever fabricated: everything is derived from the same transparent rubric already used by the practice-feedback engine (`app/services/resume_analysis.py`). The candidate dashboard and AI Feedback page were updated to consume this endpoint instead of hardcoded/fake numbers.
- **Performance visualizations** — the existing lightweight CSS bar-chart components (no new charting dependency) now render real score trends and real per-category scores, and are responsive at the existing breakpoints.
- **Downloadable interview report** — `GET /assessments/{interview_id}/report` renders a real PDF (via `reportlab`) with candidate details, overall score, category breakdown, strengths/weaknesses/recommendations, AI feedback, and a per-question summary. A **Download report** button is available on the candidate dashboard and AI Feedback history cards. Candidates can only download their own reports; recruiters/admins can download any candidate's completed report.
- **Notifications** — a lightweight, database-only in-app notification system (`app/services/notifications.py`, `app/routers/notifications.py`) creates `interview_completed`, `assessment_available`, and `report_available` notifications the moment an interview finishes. A bell icon with an unread badge was added to the candidate dashboard header. No SMTP/API credentials are required; if `SMTP_HOST` is set, a best-effort email is also sent, and any email failure is swallowed so the app keeps working without it.
- **Testing** — new backend tests cover assessment history/category scores, the analytics endpoint's real-vs-zero states, the report endpoint's PDF output and authorization rules, and notification creation/read/isolation behavior. All existing tests are unchanged.

### Running the backend tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

### Environment variables added in Milestone 4

All are optional; the app works without any of them.

```text
SMTP_HOST=            # if set, enables best-effort email notifications
SMTP_PORT=587
SMTP_FROM=no-reply@smarthire.local
SMTP_USERNAME=
SMTP_PASSWORD=
```

### Deployment notes

`docker compose up --build` continues to build the `db`, `api`, and `web` services exactly as before; no new services were introduced. The `reportlab` dependency was added to `backend/requirements.txt` and is installed automatically during the `api` image build. The Postgres healthcheck and `depends_on: condition: service_healthy` wiring are unchanged.

This project was developed in a sandboxed environment without outbound network access, so the actual `docker compose up --build` run, `pip install`, and `npm install` could not be executed here. Every change was verified as far as possible without those installs (Python files were byte-compiled with `py_compile`, the report/analytics/notification logic was exercised directly with the interpreter using the already-available `reportlab`/`pypdf` packages, and the frontend files were syntax-checked and bundled end-to-end with `esbuild`, which resolved every import with zero errors). Before deploying, run `docker compose up --build` once from the project root to confirm the containers start correctly in your environment — this is the one remaining step that could not be performed here.


## Optional Ultravox live voice interviewer

The project includes a secure Ultravox integration. Create a `.env` file beside `docker-compose.yml` and add:

```text
ULTRAVOX_API_KEY=your_real_ultravox_api_key
```

Restart with `docker compose up --build`. In the interview room, start an interview and select **Connect live AI voice**. The API key remains in Docker/FastAPI and is never sent to the browser. If you leave the key blank, the rest of SmartHire continues to work normally.
