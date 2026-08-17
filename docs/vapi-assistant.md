# Vapi assistant configuration

Create and publish one web assistant in the Vapi dashboard, then set its ID as
`VAPI_ASSISTANT_ID` in the backend environment. Configure its **Server URL** as
`https://YOUR_BACKEND/api/vapi/webhook` (or `/api/webhooks/vapi`). If `VAPI_WEBHOOK_SECRET` is set,
configure the Vapi Server URL authentication header as:

```
Authorization: Bearer YOUR_VAPI_WEBHOOK_SECRET
```

## Local Development & Webhook Tunneling (ngrok)

When running your backend locally (e.g. on `http://localhost:5000`):

1. **Terminal 1 — Run your Express backend**:
   ```bash
   npm run dev:backend
   # Server runs at http://localhost:5000
   ```

2. **Terminal 2 — Expose port 5000 to the internet**:

   *Option A (Recommended zero-setup Node.js tool — No installer needed)*:
   ```bash
   npx localtunnel --port 5000
   ```
   This gives an instant HTTPS URL such as `https://intervio-demo.loca.lt`

   *Option B (ngrok)*:
   ```bash
   ngrok http 5000
   ```
   *(If `pyngrok` fails to download automatically, download `ngrok.exe` directly from https://ngrok.com/download)*

3. **Configure Vapi Assistant Server URL**:
   In your Vapi Assistant configuration dashboard, set **Server URL** to:
   `https://YOUR_TUNNEL_URL/api/vapi/webhook`

---

Use this system prompt. The variables are supplied by the authenticated InterVio
backend for each call.

```text
You are {{interviewer_name}}, {{interviewer_role}}, a professional AI interviewer
for InterVio. Conduct a {{interview_difficulty}} {{interview_track}} interview in
{{interview_language}}. The candidate is {{candidate_name}}.

Interview context:
- Session ID: {{interview_session_id}}
- Target duration: {{interview_duration_minutes}} minutes
- Resume summary: {{resume_summary}}
- Ordered questions:
{{interview_questions}}

Conversation policy:
1. Open warmly, introduce yourself, explain that you will ask one question at a
   time, and ask whether the candidate is ready. Do not begin the question list
   until they confirm.
2. Ask the ordered questions exactly one at a time. Never reveal an ideal answer.
   Give the candidate time to finish; do not fill silence immediately.
3. Treat short acknowledgements such as “yes”, “okay”, and “right” as
   acknowledgements, not complete answers. If an answer is unclear, ask one
   concise clarification. Ask at most one focused follow-up when it materially
   tests depth, trade-offs, or evidence.
4. When interrupted, stop and listen. Acknowledge the interruption naturally,
   then answer the candidate's question or continue only when appropriate.
5. Be supportive and neutral. Do not make hiring promises, provide scores, or
   give detailed feedback during the call. Keep spoken responses concise.
6. After the final answer, thank the candidate, explain that their responses
   will be evaluated in InterVio, say goodbye, and end the call.
```

Recommended voice-pipeline settings for English interviews:

```json
{
  "startSpeakingPlan": {
    "smartEndpointingPlan": {
      "provider": "livekit",
      "waitFunction": "2000 / (1 + exp(-10 * (x - 0.5)))"
    },
    "waitSeconds": 0.4
  },
  "stopSpeakingPlan": {
    "numWords": 0,
    "voiceSeconds": 0.2,
    "backoffSeconds": 1.0
  }
}
```

Enable the assistant server messages `assistant.started`, `conversation-update`,
`transcript[transcriptType='final']`, `status-update`, `hang`, and
`end-of-call-report`. Vapi includes the injected variable values in call
artifacts, allowing the webhook to associate every event with its InterVio
session.
