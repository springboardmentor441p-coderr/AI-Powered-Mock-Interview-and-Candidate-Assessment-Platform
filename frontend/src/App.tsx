import { useEffect, useRef, useState } from "react";
import { UltravoxSession } from "ultravox-client";

const TOOL_SECRET = import.meta.env.VITE_ULTRAVOX_TOOL_SECRET as string;
const BACKEND = "http://localhost:8000/api/v1/interviews";

function App() {
  const sessionRef  = useRef<UltravoxSession | null>(null);
  // Track the highest Ultravox transcript index we've already relayed.
  // UV provides a stable 0-based index per turn; using it directly as
  // sequence_number avoids the text-dedup skips and handles the case
  // where multiple turns finalise between two event firings.
  const lastSentIdx = useRef(-1);

  const [status,    setStatus]    = useState("Disconnected");
  const [joinUrl,   setJoinUrl]   = useState("");
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    const session = new UltravoxSession();
    sessionRef.current = session;

    session.addEventListener("status", () => {
      setStatus(String(session.status));
    });

    session.addEventListener("transcripts", () => {
      const all = session.transcripts;
      if (!all?.length) return;

      // Iterate every turn we haven't sent yet — the event fires on every
      // array update, so multiple turns can accumulate between firings.
      for (let i = lastSentIdx.current + 1; i < all.length; i++) {
        const turn = all[i];

        // Skip non-final turns; a later firing will pick them up once
        // Ultravox marks them final. Do NOT advance the cursor here —
        // we need to revisit this index on the next event.
        if (!turn.isFinal) break;

        // Advance cursor only for turns we are actually sending.
        lastSentIdx.current = i;

        const seq = i; // stable Ultravox index → sequence_number
        console.log(`[transcript] seq=${seq} speaker=${turn.speaker}: ${turn.text.slice(0, 60)}`);

        fetch(`${BACKEND}/realtime/sessions/${sessionId}/transcript/webhook/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Tool-Secret": TOOL_SECRET,
          },
          body: JSON.stringify({
            speaker:         turn.speaker === "agent" ? "assistant" : "candidate",
            text:            turn.text,
            sequence_number: seq,
            timestamp:       new Date().toISOString(),
          }),
        }).catch((err) => console.error(`relay failed for seq=${seq}:`, err));
      }
    });

    session.addEventListener("error", (e: Event) => {
      console.error("UV error:", e);
    });

    return () => {
      session.leaveCall().catch(console.error);
    };
  }, [sessionId]);

  const joinCall = async () => {
    if (!sessionRef.current || !joinUrl || !sessionId) {
      alert("Paste both the Session ID and Join URL first.");
      return;
    }
    // Reset cursor for new call
    lastSentIdx.current = -1;

    try {
      await sessionRef.current.joinCall(joinUrl);
    } catch (err) {
      console.error("joinCall failed:", err);
    }
  };

  const leaveCall = async () => {
    if (!sessionRef.current) return;
    await sessionRef.current.leaveCall();
  };

  return (
    <div style={{ maxWidth: 800, margin: "60px auto", fontFamily: "Arial" }}>
      <h1>Ultravox Test</h1>

      <p><strong>Status:</strong> {status}</p>

      <input
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
        placeholder="Paste Django Session ID (UUID)"
        style={{ width: "100%", padding: 12, fontSize: 16, marginBottom: 10, display: "block", boxSizing: "border-box" }}
      />

      <input
        value={joinUrl}
        onChange={(e) => setJoinUrl(e.target.value)}
        placeholder="Paste Ultravox Join URL"
        style={{ width: "100%", padding: 12, fontSize: 16, boxSizing: "border-box" }}
      />

      <div style={{ marginTop: 20 }}>
        <button onClick={joinCall}>Join</button>
        <button onClick={leaveCall} style={{ marginLeft: 10 }}>Leave</button>
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: "#888" }}>
        Open DevTools console to see transcript relay logs.
      </p>
    </div>
  );
}

export default App;