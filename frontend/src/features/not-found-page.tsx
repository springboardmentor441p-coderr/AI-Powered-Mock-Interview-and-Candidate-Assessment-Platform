import { Link } from "react-router-dom";
import { Disc3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <Disc3 className="h-12 w-12 text-primary animate-reel-spin" />
      <h1 className="font-display text-3xl text-foreground">Dead air — nothing on this channel</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you're looking for isn't broadcasting. Let's get you back to the studio.
      </p>
      <Button asChild>
        <Link to="/">Back to safety</Link>
      </Button>
    </div>
  );
}
