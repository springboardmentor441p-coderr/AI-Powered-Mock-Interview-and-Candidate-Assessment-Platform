import { useEffect, useRef, useState } from "react";
import { UltravoxSession } from "ultravox-client";

const TOOL_SECRET = import.meta.env.VITE_ULTRAVOX_TOOL_SECRET as string;
const BACKEND = "http://localhost:8000/api/v1/interviews";

function App() {
  const sessionRef      = useRef<UltravoxSession | null>(null);
  const lastSentIdx     = useRef(-1);
  const currentQuestionId = useRef<string>("");
  const sessionIdRef    = useRef<string>("");

  const [status,    setStatus]    = useState("Disconnected");
  const [joinUrl,   setJoinUrl]   = useState("");
  const [sessionId, setSessionId] = useState("");

  const handleSessionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSessionId(e.target.value);
    sessionIdRef.current = e.target.value;
  };

  useEffect(() => {
    const session = new UltravoxSession();
    sessionRef.current = session;

    session.addEventListener("status", () => {
      setStatus(String(session.status));
    });

    session.addEventListener("transcripts", async () => {
      const all = session.transcripts;
      if (!all?.length) return;

      // Only poll current-topic when a new agent turn has finalized,
      // since topic only changes when AI calls ask_next_question.
      const hasNewAgentTurn = all
        .slice(lastSentIdx.current + 1)
        .some(t => t.isFinal && t.speaker === "agent");

      if (hasNewAgentTurn) {
        try {
          const qRes = await fetch(
            `${BACKEND}/realtime/sessions/${sessionIdRef.current}/current-topic/`,
            { headers: { "X-Tool-Secret": TOOL_SECRET } }
          );
          if (qRes.ok) {
            const qData = await qRes.json();
            currentQuestionId.current = qData.data?.question_id ?? "";
            console.log("[current-topic] question_id:", currentQuestionId.current);
          }
        } catch (e) {
          console.warn("current-topic fetch failed:", e);
        }
      }

      // Iterate every turn we haven't sent yet.
      for (let i = lastSentIdx.current + 1; i < all.length; i++) {
        const turn = all[i];

        // Skip non-final turns; revisit on next event firing.
        if (!turn.isFinal) break;

        lastSentIdx.current = i;

        const seq = i;
        console.log(`[transcript] seq=${seq} speaker=${turn.speaker}: ${turn.text.slice(0, 60)}`);

        fetch(`${BACKEND}/realtime/sessions/${sessionIdRef.current}/transcript/webhook/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Tool-Secret": TOOL_SECRET,
          },
          body: JSON.stringify({
            speaker:         turn.speaker === "agent" ? "assistant" : "candidate",
            text:            turn.text,
            sequence_number: seq,
            question_id:     currentQuestionId.current || undefined,
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
  }, []); // no deps — sessionIdRef keeps it current without recreating the session

  const joinCall = async () => {
    if (!sessionRef.current || !joinUrl || !sessionIdRef.current) {
      alert("Paste both the Session ID and Join URL first.");
      return;
    }
    lastSentIdx.current = -1;
    currentQuestionId.current = "";

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
        onChange={handleSessionIdChange}
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