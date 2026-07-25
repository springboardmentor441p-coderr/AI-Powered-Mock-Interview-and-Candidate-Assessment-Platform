import { Outlet } from "react-router-dom";
import { Disc3, Radio, Sparkles } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-card px-14 py-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, hsl(var(--primary)) 0px, hsl(var(--primary)) 1px, transparent 1px, transparent 64px)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <Disc3 className="h-7 w-7 text-primary animate-reel-spin" />
          <span className="font-display text-xl font-medium text-foreground">AI Interviewr</span>
        </div>

        <div className="relative max-w-md space-y-6 animate-rise-in">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-primary">
            <span className="rec-dot" /> On air, always ready
          </p>
          <h1 className="font-display text-4xl font-medium leading-[1.15] text-balance text-foreground">
            Real interviews.
            <br />
            Run by an AI that actually listens.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Practice under real pressure, get instrumented feedback on every answer, and let recruiters review
            the tape — not just the transcript.
          </p>
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Radio className="h-4 w-4 text-accent" /> Voice-native sessions
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Signal-based scoring
            </div>
          </div>
        </div>

        <p className="relative font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          Studio Session — Broadcasting Since 2026
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm animate-rise-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
