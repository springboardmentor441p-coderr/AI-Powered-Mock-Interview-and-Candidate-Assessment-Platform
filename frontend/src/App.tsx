import { useEffect, useRef, useState } from "react";
import { UltravoxSession } from "ultravox-client";

function App() {
  const sessionRef = useRef<UltravoxSession | null>(null);

  const [status, setStatus] = useState("Disconnected");
  const [joinUrl, setJoinUrl] = useState("");

useEffect(() => {
  const session = new UltravoxSession();
  console.log(session);
  console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(session)));

  sessionRef.current = session;

  console.log(session);

  session.addEventListener("status", () => {
    console.log("STATUS:", session.status);
    setStatus(String(session.status));
  });

  session.addEventListener("transcripts", () => {
    console.log("TRANSCRIPTS:", session.transcripts);
  });

  session.addEventListener("error", (e: Event) => {
    console.error("ERROR EVENT", e);
  });

  return () => {
    session.leaveCall().catch(console.error);
  };
}, []);
const joinCall = async () => {
  console.log("Join button clicked");
  console.log("Join URL:", joinUrl);

  if (!sessionRef.current) {
    console.log("No session");
    return;
  }

  try {
    console.log("Calling joinCall...");
    await sessionRef.current.joinCall(joinUrl);
    console.log("joinCall resolved");
  } catch (err) {
    console.error("joinCall failed", err);
  }
};
  const leaveCall = async () => {
    if (!sessionRef.current) return;

    await sessionRef.current.leaveCall();
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "60px auto",
        fontFamily: "Arial",
      }}
    >
      <h1>Ultravox Test</h1>

      <p>
        <strong>Status:</strong> {status}
      </p>

      <input
        value={joinUrl}
        onChange={(e) => setJoinUrl(e.target.value)}
        placeholder="Paste Join URL"
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
        }}
      />

      <div style={{ marginTop: 20 }}>
        <button onClick={joinCall}>Join</button>

        <button
          onClick={leaveCall}
          style={{
            marginLeft: 10,
          }}
        >
          Leave
        </button>
      </div>
    </div>
  );
}

export default App;