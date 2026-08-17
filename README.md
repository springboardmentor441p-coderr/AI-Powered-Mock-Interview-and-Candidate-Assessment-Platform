# AI InterVio

AI InterVio is a Next.js interview platform with an Express API and a real-time
Vapi voice interviewer. The candidate signs in, chooses an interview setup,
then enters a browser-based interview room with real STT, TTS, interruption
handling, live transcripts, and an interview-history handoff.

## Architecture

```text
Next.js interview studio → Vapi Web SDK → Vapi voice pipeline
            │                    │
            └─ Express API ──────┘
                    │
       authenticated session + Vapi webhook events
                    │
             report/history APIs
```

The Vapi public key is used only by the browser SDK. The Vapi private key and
webhook secret remain in backend environment variables. The backend creates an
authenticated interview session before the browser can start a Vapi call and
associates server events using the per-call `interview_session_id` variable.

## Setup

1. Copy `.env.example` values into `frontend/.env.local` and `backend/.env`.
   Put `NEXT_PUBLIC_VAPI_PUBLIC_KEY` and `NEXT_PUBLIC_API_URL` in the frontend;
   put all remaining values in the backend.
2. Configure and publish the Vapi assistant as described in
   [docs/vapi-assistant.md](docs/vapi-assistant.md).
3. Install dependencies and start both services:

```powershell
npm.cmd --prefix backend run dev
npm.cmd --prefix frontend run dev
```

Open http://localhost:3000, sign in, configure an interview, and open the
studio. Browser microphone permission is required. Webcam permission is optional
and only controls the local preview.

## API additions

- `POST /api/interview/start` — authenticated; validates configuration and
  returns a Vapi assistant ID plus call-scoped variables.
- `POST /api/interview/complete` — authenticated; returns the candidate-owned
  session transcript/state.
- `POST /api/vapi/webhook` (or `/api/webhooks/vapi`) — Vapi Server URL endpoint; records call status and
  transcript events. Protect with `VAPI_WEBHOOK_SECRET` in production.

## Validation and deployment

```powershell
npm.cmd --prefix backend run build
npm.cmd --prefix frontend run build
```

For local development webhook testing:
1. Start your backend: `npm run dev:backend` (runs on `http://localhost:5000`).
2. Expose port 5000 to the internet:
   - `npx localtunnel --port 5000` *(Zero-config Node tool, no installer required)*
   - Or `ngrok http 5000`
3. Set your Vapi Server URL to `https://your-subdomain.loca.lt/api/vapi/webhook` (or `.ngrok-free.app`).

For production, deploy the API on an HTTPS public URL, set it as the Vapi Server
URL, restrict CORS to the frontend origin, rotate the JWT/Vapi webhook secrets,
and monitor Vapi call logs alongside backend logs. Use Vapi's call simulations
to test silence, interruptions, disconnects, unclear answers, and final-call
webhook delivery before release.

## Operational notes

- Current report storage in this project is in memory; it is suitable for local
  development only. Replace `reportService` and `interviewSessionService` with
  a durable database repository before horizontal production scaling.
- Tune endpointing only after testing with your target accents and interview
  styles. The documented starting values favor concise English interview turns.
- Do not log full transcripts or résumé content outside approved retention and
  access-control policies.
