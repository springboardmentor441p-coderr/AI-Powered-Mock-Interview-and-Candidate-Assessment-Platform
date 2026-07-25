import { Link } from "react-router-dom";
import { History, Mic } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatDuration, titleCase } from "@/lib/utils";
import { useSessions } from "@/features/candidate/hooks";

export default function InterviewHistoryPage() {
  const { data, isLoading, isError, error, refetch } = useSessions();

  return (
    <div>
      <PageHeader
        eyebrow="Archive"
        title="Session history"
        description="Every take, scored and ready to review."
        actions={
          <Button asChild>
            <Link to="/app/interviews/new">
              <Mic className="h-4 w-4" /> New interview
            </Link>
          </Button>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={History}
          title="No interviews yet"
          description="Start your first session to see it appear here."
          action={
            <Button asChild>
              <Link to="/app/interviews/new">Start an interview</Link>
            </Button>
          }
        />
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((session) => (
            <Link key={session.id} to={`/app/interviews/${session.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg text-foreground">{titleCase(session.interview_type)}</p>
                      <StatusBadge status={session.status} />
                      <Badge variant="outline">{titleCase(session.mode)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {session.domain} · {titleCase(session.difficulty)}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-1 sm:items-end">
                    <span className="text-xs text-muted-foreground">
                      {session.started_at ? formatDateTime(session.started_at) : formatDateTime(session.created_at)}
                    </span>
                    {session.duration_seconds !== null && (
                      <span className="font-mono-num text-xs text-muted-foreground">
                        {formatDuration(session.duration_seconds)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
