import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Disc3, Mic, MicOff, PhoneOff, Radio, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { VuMeter } from "@/components/shared/vu-meter";
import { cn, titleCase } from "@/lib/utils";
import { useRealtimeSessionPoll, useStartRealtimeSession } from "@/features/candidate/hooks";
import { interviewsApi } from "@/api/interviews";
import { useFaceAssessment } from "./hooks/use-face-assessment";
import { FaceAssessmentHUD } from "./face-assessment-hud";

const BACKEND = "http://localhost:8000/api/v1/interviews";
const TOOL_SECRET = import.meta.env.VITE_ULTRAVOX_TOOL_SECRET as string;

interface LiveTranscriptLine {
  speaker: "agent" | "candidate";
  text: string;
  final: boolean;
}

type CallPhase = "preparing" | "connecting" | "live" | "wrapping-up" | "ended" | "error";

export default function LiveInterviewRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const startSession = useStartRealtimeSession();

  const [phase, setPhase] = useState<CallPhase>("preparing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("idle");
  const [lines, setLines] = useState<LiveTranscriptLine[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const sessionRef = useRef<import("ultravox-client").UltravoxSession | null>(null);
  const hasStartedRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const lastSentIdxRef = useRef(-1);
  const currentQuestionIdRef = useRef<string>("");

  // ── Face assessment ──────────────────────────────────────────────────── //
  const face = useFaceAssessment({
    sessionId: sessionId ?? "",
    dryRun: !sessionId,
    // Start automatically when the interview goes live (handled in useEffect below)
    autoStart: false,
  });

  // Stop face assessment if the interview ends while the camera is running
  useEffect(() => {
    if (phase !== "live" && face.active) {
      face.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Stop face assessment on unmount (hook also does this, but belt-and-suspenders)
  useEffect(() => {
    return () => face.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Polling ──────────────────────────────────────────────────────────── //
  const { data: pollData } = useRealtimeSessionPoll(sessionId, phase === "preparing");

  useEffect(() => {
    if (!pollData || hasStartedRef.current) return;
    if (pollData.status === "abandoned") {
      setPhase("error");
      setErrorMessage("This session was abandoned. Start a new interview from the setup page.");
      return;
    }
    const ready = (pollData as unknown as { seed_topics_ready?: boolean }).seed_topics_ready;
    if (ready === true) {
      hasStartedRef.current = true;
      void beginCall();
    } else if (ready === undefined) {
      const timeout = setTimeout(() => {
        if (!hasStartedRef.current) {
          hasStartedRef.current = true;
          void beginCall();
        }
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [pollData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Timer ────────────────────────────────────────────────────────────── //
  useEffect(() => {
    const timer = setInterval(() => {
      if (phase === "live") setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // ── Transcript auto-scroll ───────────────────────────────────────────── //
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // ── Call setup ───────────────────────────────────────────────────────── //
  const beginCall = useCallback(
    async (attempt = 1) => {
      if (!sessionId) return;
      setPhase("connecting");
      lastSentIdxRef.current = -1;
      currentQuestionIdRef.current = "";

      try {
        const started = await startSession.mutateAsync(sessionId);
        if (!started.call_join_url) {
          throw new Error("The interviewer couldn't join the call. Please try again.");
        }
        const { UltravoxSession } = await import("ultravox-client");
        const uvSession = new UltravoxSession();
        sessionRef.current = uvSession;

        uvSession.addEventListener("status", () => {
          setCallStatus(uvSession.status);
          if (uvSession.status === "disconnected") {
            setPhase((p) => (p === "wrapping-up" || p === "ended" ? "ended" : p));
          }
        });

        uvSession.addEventListener("transcripts", async () => {
          const all = uvSession.transcripts;
          if (!all?.length) return;

          setLines(
            all.map((t) => ({
              speaker: t.speaker === "agent" ? "agent" : "candidate",
              text: t.text,
              final: t.isFinal,
            })),
          );

          const hasNewAgentTurn = all
            .slice(lastSentIdxRef.current + 1)
            .some((t) => t.isFinal && t.speaker === "agent");

          if (hasNewAgentTurn) {
            try {
              const res = await fetch(
                `${BACKEND}/realtime/sessions/${sessionId}/current-topic/`,
                { headers: { "X-Tool-Secret": TOOL_SECRET } },
              );
              if (res.ok) {
                const data = await res.json();
                currentQuestionIdRef.current = data.data?.question_id ?? "";
              }
            } catch (e) {
              console.warn("[relay] current-topic fetch failed:", e);
            }
          }

          for (let i = lastSentIdxRef.current + 1; i < all.length; i++) {
            const turn = all[i];
            if (!turn.isFinal) break;
            lastSentIdxRef.current = i;
            fetch(`${BACKEND}/realtime/sessions/${sessionId}/transcript/webhook/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Tool-Secret": TOOL_SECRET,
              },
              body: JSON.stringify({
                speaker: turn.speaker === "agent" ? "assistant" : "candidate",
                text: turn.text,
                sequence_number: i,
                question_id: currentQuestionIdRef.current || undefined,
                timestamp: new Date().toISOString(),
              }),
            }).catch((err) => console.error(`[relay] failed for seq=${i}:`, err));
          }
        });

        await uvSession.joinCall(started.call_join_url);
        setPhase("live");
      } catch (err) {
        if (attempt < 3) {
          setTimeout(() => void beginCall(attempt + 1), 3000);
          return;
        }
        console.error(err);
        setPhase("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Couldn't connect to the interviewer.",
        );
      }
    },
    [sessionId, startSession],
  );

  // ── End call ─────────────────────────────────────────────────────────── //
  async function handleEndCall() {
    if (!sessionId) return;
    setPhase("wrapping-up");
    face.stop();
    try { sessionRef.current?.leaveCall(); } catch { /* ignore */ }
    try {
      const detail = await interviewsApi.realtimeDetail(sessionId);
      if (detail.status !== "completed") {
        await interviewsApi.complete(sessionId).catch(() => undefined);
      }
    } finally {
      toast.success("Interview wrapped. Compiling your results…");
      navigate(`/app/interviews/${sessionId}`);
    }
  }

  function toggleMute() {
    const uv = sessionRef.current;
    if (!uv) return;
    const next = !muted;
    if (next) uv.muteMic(); else uv.unmuteMic();
    setMuted(next);
  }

  async function toggleFace() {
    if (face.active) {
      face.stop();
    } else {
      // Check permission state before calling start() so we can give a clear
      // actionable message instead of a raw browser error string.
      try {
        const perm = await navigator.permissions.query({ name: "camera" as PermissionName });
        if (perm.state === "denied") {
          toast.error(
            "Camera access is blocked for this site. Click the camera/lock icon in your browser's address bar, allow camera access, then reload the page and try again.",
            { duration: 8000 },
          );
          return;
        }
      } catch {
        // permissions API not supported (e.g. Firefox) — fall through and let getUserMedia handle it
      }
      void face.start();
    }
  }

  useEffect(() => {
    return () => {
      try { sessionRef.current?.leaveCall(); } catch { /* no-op on unmount */ }
    };
  }, []);

  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Disc3 className="h-5 w-5 text-primary animate-reel-spin" />
          <span className="font-display text-base text-foreground">AI Interviewr</span>
        </div>
        {phase === "live" && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-tape/40 bg-tape/10 px-3 py-1">
              <span className="rec-dot" />
              <span className="font-mono-num text-xs text-tape">ON AIR · {mins}:{secs}</span>
            </div>
          </div>
        )}
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-10">

        {/* Preparing / Connecting */}
        {(phase === "preparing" || phase === "connecting") && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="font-display text-xl text-foreground">
              {phase === "preparing"
                ? "Preparing your interview topics…"
                : "Connecting to the interviewer…"}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              This usually takes a few seconds. We're generating tailored topics based on your role
              and résumé.
            </p>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <PhoneOff className="h-6 w-6" />
            </div>
            <p className="font-display text-xl text-foreground">Couldn't connect</p>
            <p className="max-w-sm text-sm text-muted-foreground">{errorMessage}</p>
            <Button variant="outline" onClick={() => navigate("/app/interviews/new")}>
              Back to setup
            </Button>
          </div>
        )}

        {/* Live */}
        {phase === "live" && (
          <div className="flex w-full max-w-5xl gap-6 items-start justify-center">
            {/* Left column: voice interface */}
            <div className="flex flex-1 flex-col items-center gap-6">
              {/* AI avatar orb */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className={cn(
                    "flex h-28 w-28 items-center justify-center rounded-full border-2 transition-all",
                    callStatus === "speaking"
                      ? "border-primary shadow-[0_0_40px_-6px_hsl(var(--primary)/0.6)]"
                      : callStatus === "listening"
                        ? "border-accent shadow-[0_0_40px_-6px_hsl(var(--accent)/0.5)]"
                        : "border-border",
                  )}
                >
                  <Radio className="h-10 w-10 text-primary" />
                </div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {titleCase(callStatus)}
                </p>
                <VuMeter active={callStatus === "speaking" || callStatus === "listening"} />
              </div>

              {/* Transcript */}
              <div className="w-full max-w-2xl rounded-xl border border-border bg-card/60 p-5">
                <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                  Live transcript
                </p>
                <div className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
                  {lines.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      The interviewer will begin speaking shortly…
                    </p>
                  )}
                  {lines.map((line, i) => (
                    <div
                      key={i}
                      className={cn("flex flex-col gap-0.5", line.speaker === "candidate" && "items-end")}
                    >
                      <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                        {line.speaker === "agent" ? "Interviewer" : "You"}
                      </span>
                      <p
                        className={cn(
                          "max-w-lg rounded-lg px-3 py-2 text-sm",
                          line.speaker === "agent"
                            ? "bg-secondary/70 text-foreground"
                            : "bg-primary/15 text-foreground",
                          !line.final && "opacity-60",
                        )}
                      >
                        {line.text}
                      </p>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="lg" onClick={toggleMute}>
                  {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {muted ? "Unmute" : "Mute"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleFace}
                  title={face.active ? "Disable face assessment" : "Enable face assessment"}
                >
                  {face.active ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  {face.active ? "Camera on" : "Camera off"}
                </Button>
                <Button variant="destructive" size="lg" onClick={handleEndCall}>
                  <PhoneOff className="h-4 w-4" /> End interview
                </Button>
              </div>
            </div>

            {/* Right column: face assessment HUD */}
            <div className="shrink-0 pt-2">
              <FaceAssessmentHUD
                metrics={face.metrics}
                active={face.active}
                videoRef={face.videoRef}
                error={face.error}
              />
            </div>
          </div>
        )}

        {/* Wrapping up */}
        {phase === "wrapping-up" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="font-display text-xl text-foreground">Wrapping up the session…</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              We're saving your recording and kicking off scoring. This can take a minute.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}