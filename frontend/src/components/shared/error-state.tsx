import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiError } from "@/api/client";

interface ErrorStateProps {
  error?: ApiError | Error | null;
  title?: string;
  onRetry?: () => void;
}

export function ErrorState({ error, title = "Something went sideways", onRetry }: ErrorStateProps) {
  const message = (error as ApiError)?.message ?? (error as Error)?.message ?? "Please try again.";
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-14 px-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="font-display text-lg text-foreground">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
