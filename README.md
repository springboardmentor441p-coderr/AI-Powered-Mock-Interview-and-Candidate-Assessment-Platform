# SmartHire AI

AI-powered mock interview and candidate assessment platform. See `SmartHire_AI_Blueprint.md` for the full architecture writeup.

## What's built (Week 1–4 of the plan)

- **Auth**: JWT register/login/refresh, role-based middleware (candidate/recruiter/admin)
- **Resume upload**: PDF upload → text extraction → AI-based skill/experience/education parsing
- **Interview generation**: AI-generated question sets by type/difficulty/domain
- **Interview room**: webcam/mic capture, per-question recording, response submission
- **Scoring engine**: weighted formula (Communication 30 / Confidence 25 / Technical 30 / Professionalism 15), unit-tested
- **Feedback + report**: AI-generated strengths/weaknesses/suggestions, radar chart report page
- **Analytics stubs**: candidate history endpoint, recruiter candidate-comparison endpoint

## What's stubbed / next to build (Week 5–8)

- Real speech-to-text (Whisper API) wiring for `speechMetrics` — currently defaults to 0
- Real eye-contact/emotion detection (MediaPipe Face Mesh client-side + DeepFace) for `visualMetrics`
- Technical/professionalism scoring currently hardcoded at 70 — needs an LLM-graded rubric against transcript + question
- Recharts dashboards for candidate history and recruiter comparison table (the report page's radar chart is built; history/comparison views are not)
- Email notifications (SendGrid)
- Google OAuth (Passport strategy is referenced but not implemented — swap the commented-out route in `auth.routes.js`)

## Running locally

### 1. Backend

```bash
cd backend
cp .env.example .env       # fill in MONGO_URI, JWT secrets, OPENAI_API_KEY
npm install
npm run dev                # requires nodemon; or `npm start` for a plain run
```

Needs a running MongoDB instance — either install locally, use MongoDB Atlas, or run `docker compose up mongo` from the repo root.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. The Vite dev server proxies `/api` to `http://localhost:5000`.

### 3. Or run everything via Docker Compose

```bash
docker compose up --build
```

## Testing

```bash
cd backend
npm test
```

Currently covers the scoring engine (`tests/scoring.test.js`) — the one piece every downstream score depends on. Add tests for auth and resume upload next.

## Project structure

See `SmartHire_AI_Blueprint.md` for the full folder layout, DB schema, and API reference.
