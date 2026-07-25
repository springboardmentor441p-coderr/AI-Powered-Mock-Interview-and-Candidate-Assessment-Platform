import { cn } from "@/lib/utils";

interface ScoreRingProps {
  value: number | null | undefined;
  max?: number;
  size?: number;
  label?: string;
  className?: string;
}

export function ScoreRing({ value, max = 100, size = 96, label, className }: ScoreRingProps) {
  const pct = value === null || value === undefined ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 75 ? "hsl(var(--success))" : pct >= 45 ? "hsl(var(--primary))" : "hsl(var(--destructive))";

  return (
    <div className={cn("relative inline-flex flex-col items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={6} className="fill-none stroke-secondary" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={6}
          strokeLinecap="round"
          stroke={color}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={value === null || value === undefined ? circumference : offset}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono-num text-xl font-semibold text-foreground">
          {value === null || value === undefined ? "—" : Math.round(value)}
        </span>
        {label && <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
