import * as React from "react";
import { AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <AlertOctagon className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl text-foreground">The broadcast dropped out</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            An unexpected error interrupted this screen. Reloading usually fixes it — your progress on the server is safe.
          </p>
          <Button onClick={() => window.location.reload()}>Reload the app</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
