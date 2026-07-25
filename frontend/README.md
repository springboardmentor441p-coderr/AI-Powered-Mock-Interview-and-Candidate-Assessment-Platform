# AI Interviewr — Frontend

A full frontend for the AI Interviewr platform: candidate practice interviews (voice, via
Ultravox), recruiter/admin review tooling, résumé management, and score analytics — wired
against the Django backend in `backend/`.

## Theme — "On Air"

A late-night broadcast/recording-studio aesthetic instead of a generic SaaS look: warm
near-black background, tungsten-amber primary, cassette-tape red for "live" states, teal
accent. Type is **Fraunces** (display serif) + **JetBrains Mono** (data/timestamps) +
**Work Sans** (body) — no Inter, no purple gradients. CSS variables live in `src/index.css`;
Tailwind consumes them via `tailwind.config.ts`.

## Stack

- Vite + React 19 + TypeScript
- **Routing**: react-router v7, role-based route protection (`src/app/protected-route.tsx`)
- **Server state**: TanStack Query — one `hooks.ts` per feature folder
- **Client state**: Zustand (`src/stores/auth-store.ts`), persisted to localStorage
- **Forms**: react-hook-form + zod, via shadcn-style `Form` primitives
- **UI**: hand-written shadcn-style components in `src/components/ui` (Radix primitives +
  cva + tailwind-merge — this *is* how shadcn works, just pre-copied instead of CLI-generated)
- **Voice interviews**: `ultravox-client` SDK, lazy-loaded only on the live-interview route

## Getting started

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend
npm run dev
```

The backend must be running at the URL in `VITE_API_BASE_URL` (default
`http://localhost:8000/api/v1`) with `CORS_ALLOWED_ORIGINS` including your dev origin
(`http://localhost:5173` is already in the backend's default list).

## Architecture notes

- **`src/api/client.ts`** normalizes three different response shapes the backend actually
  returns: `{success, data}` from custom `APIView`s, `{success, pagination, results}` from
  paginated list views, and *raw* unwrapped payloads from plain DRF generic views
  (`MeView`, `SessionDetailView`, `ResumeDetailView`, and simplejwt's login/refresh views).
  `unwrap`/`unwrapList` handle all three transparently — feature code never has to think
  about which shape a given endpoint uses.
- **Auth**: access + refresh JWTs in a persisted Zustand store. An axios response
  interceptor queues concurrent 401s behind a single `/auth/token/refresh/` call.
- **Route protection**: `<ProtectedRoute roles={[...]}>` redirects unauthenticated users to
  `/login` (preserving the intended destination) and role-mismatched users back to `/app`.

## Known gaps (backend-driven)

- **No recruiter-facing session list.** The backend only exposes candidate rankings
  (`/analytics/recruiter/rankings/`) and a brief lookup by session ID
  (`/interviews/realtime/sessions/{id}/brief/`) — there's no "all sessions for candidate X"
  endpoint. The Brief Review page reflects this honestly: it's a direct session-ID lookup,
  not a browsable list. If you add a backend endpoint for this, wire it into
  `src/features/recruiter/hooks.ts` and swap the lookup box for a real table.
- **Face/video assessment is unverified**, per your note that the backend pipeline is only
  tested through the assessment stage. The Speech & Presence tab renders whatever
  `SpeechAnalysis` fields the API returns and degrades to an empty state if the endpoint
  404s — nothing will crash, but double check the eye-contact/engagement numbers once that
  pipeline is confirmed end-to-end.
- **`ultravox-client` API surface** (`joinCall`, `leaveCall`, `micMuted`, `status`,
  `transcripts`, the `"status"`/`"transcripts"` events) is implemented against the SDK's
  documented public API, but this was written without network access to pin/verify against
  the exact installed version. If `npm run build` flags type errors in
  `src/features/candidate/live-interview-room.tsx`, check
  `node_modules/ultravox-client`'s type defs for renamed members — the surrounding
  call/poll/complete flow doesn't depend on the exact names.
- **Transcript relay**: `SessionTranscriptWebhookView` and the tool-callback endpoints in
  `apps/interview/api/views/realtime_views.py` are authenticated via a static
  `X-Tool-Secret` header that Ultravox itself sends (configured server-side in
  `orchestrator_service.py`) — the frontend does **not** need to relay transcripts or hold
  that secret. It only reads back the finished transcript via the normal authenticated
  `/interviews/realtime/sessions/{id}/transcript/full/` endpoint.

## Project layout

```
src/
  api/            axios client + one module per backend app
  app/            App root, router, query client, route guards
  components/ui/  shadcn-style primitives (Radix + cva)
  components/     shared page chrome (EmptyState, ErrorState, ScoreRing, layout shell)
  features/       one folder per domain: auth, candidate, recruiter, notifications
    <feature>/hooks.ts     TanStack Query hooks
    <feature>/schemas.ts   zod schemas for that feature's forms
    <feature>/*-page.tsx   routed page components
  stores/         Zustand stores
  types/api.ts    TS types mirroring backend serializers
```
