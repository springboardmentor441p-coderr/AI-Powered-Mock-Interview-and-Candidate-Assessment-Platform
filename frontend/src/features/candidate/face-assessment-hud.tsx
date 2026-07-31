/**
 * FaceAssessmentHUD
 *
 * Compact overlay shown during a live interview that displays:
 * - Live webcam feed (small, bottom-left)
 * - Real-time face detection indicator
 * - Eye contact / attention / engagement scores
 * - Dominant emotion
 *
 * Design principles (from the app's deep-space terminal aesthetic):
 * - Uses the existing CSS variable system (--primary, --accent, --card, etc.)
 * - Monospace labels, phosphor-green accents for "live" signals
 * - Minimal and unobtrusive — collapses to icon when not detected
 */

import { cn } from "@/lib/utils";
import type { FaceMetrics } from "./hooks/use-face-assessment";
import { Eye, EyeOff, Brain } from "lucide-react";

interface FaceAssessmentHUDProps {
  metrics: FaceMetrics | null;
  active: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  error: string | null;
  className?: string;
}

const EMOTION_EMOJI: Record<string, string> = {
  neutral: "😐",
  happy: "😊",
  sad: "😟",
  angry: "😠",
  surprised: "😲",
  fearful: "😰",
  disgusted: "🤢",
};

function ScoreBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span className="font-mono-num text-[0.6rem] text-foreground/70">
          {Math.round(value)}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-border/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function FaceAssessmentHUD({
  metrics,
  active,
  videoRef,
  error,
  className,
}: FaceAssessmentHUDProps) {
  const faceOk = metrics?.faceDetected ?? false;
  const gazeOk = metrics?.gazeOnScreen ?? false;

  // Derive a single "presence" status
  const presenceColor = !active
    ? "hsl(var(--muted-foreground))"
    : faceOk && gazeOk
      ? "#22c55e"          // green — on screen, looking forward
      : faceOk
        ? "#f59e0b"        // amber — face visible but gaze off
        : "#ef4444";       // red — no face

  const presenceLabel = !active
    ? "CAM OFF"
    : faceOk && gazeOk
      ? "ON SCREEN"
      : faceOk
        ? "LOOK FORWARD"
        : "NO FACE";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-card/80 backdrop-blur-sm p-3 w-52",
        className,
      )}
    >
      {/* Camera feed + presence dot */}
      <div className="relative rounded-lg overflow-hidden bg-black/60 aspect-video">
        <video
          ref={videoRef}
          muted
          playsInline
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            active ? "opacity-100" : "opacity-30",
          )}
        />
        {/* Presence indicator top-right */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-1.5 py-0.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: presenceColor }}
          />
          <span className="font-mono text-[0.5rem] uppercase tracking-widest" style={{ color: presenceColor }}>
            {presenceLabel}
          </span>
        </div>
        {/* Eye icon overlay when no metrics */}
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center">
            <EyeOff className="h-5 w-5 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <p className="text-[0.6rem] text-destructive font-mono leading-tight">
          ⚠ {error.slice(0, 60)}
        </p>
      )}

      {/* Scores */}
      {active && metrics && (
        <>
          <div className="flex flex-col gap-1.5">
            <ScoreBar value={metrics.eyeContactScore} label="Eye contact" color="#6366f1" />
            <ScoreBar value={metrics.attentionScore} label="Attention" color="#8b5cf6" />
            <ScoreBar value={metrics.engagementScore} label="Engagement" color="#a78bfa" />
          </div>

          {/* Emotion */}
          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-2 py-1">
            <div className="flex items-center gap-1">
              <Brain className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                Emotion
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">{EMOTION_EMOJI[metrics.dominantEmotion] ?? "😐"}</span>
              <span className="font-mono text-[0.6rem] capitalize text-foreground/80">
                {metrics.dominantEmotion}
              </span>
            </div>
          </div>

          {/* Multiple faces warning */}
          {metrics.multipleFacesDetected && (
            <div className="flex items-center gap-1.5 rounded-lg border border-destructive/50 bg-destructive/15 px-2 py-1">
              <span className="text-xs">⚠️</span>
              <p className="font-mono text-[0.58rem] text-destructive leading-tight font-semibold">
                Multiple faces detected
              </p>
            </div>
          )}

          {/* Gaze hint */}
          {!gazeOk && faceOk && (
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1">
              <Eye className="h-3 w-3 text-amber-400 shrink-0" />
              <p className="font-mono text-[0.58rem] text-amber-300 leading-tight">
                Keep your gaze on the screen
              </p>
            </div>
          )}
          {!faceOk && (
            <div className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1">
              <EyeOff className="h-3 w-3 text-destructive shrink-0" />
              <p className="font-mono text-[0.58rem] text-destructive/80 leading-tight">
                Face not detected — check lighting
              </p>
            </div>
          )}
        </>
      )}

      {/* Header label */}
      <p className="font-mono text-[0.55rem] uppercase tracking-widest text-muted-foreground/50 text-center">
        Face Assessment · Live
      </p>
    </div>
  );
}