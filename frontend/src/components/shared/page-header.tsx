import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-rise-in", className)}>
      <div className="space-y-1.5">
        {eyebrow && (
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            <span className="rec-dot" /> {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-medium text-balance text-foreground sm:text-4xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
