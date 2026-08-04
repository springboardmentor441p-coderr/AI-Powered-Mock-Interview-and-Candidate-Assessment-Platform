import { useNavigate } from "react-router-dom";
import { History, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatDuration, titleCase } from "@/lib/utils";
import { useRecruiterHistory } from "@/features/recruiter/hooks";

export default function RecruiterInterviewHistoryPage() {
  const { data, isLoading, isError, error, refetch } = useRecruiterHistory();
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        eyebrow="Results"
        title="Interview history"
        description="Sessions completed by candidates you invited. Results are available once an interview is scored."
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
          title="No completed interviews yet"
          description="Once a candidate you've invited completes their session, the result will appear here."
        />
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((item) => (
            <Card
              key={item.invitation_id}
              className="transition-colors hover:border-primary/40 cursor-pointer"
              onClick={() => {
                if (item.has_brief) {
                  navigate(`/app/brief-review?session=${item.session_id}`);
                }
              }}
            >
              <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base text-foreground">
                      {item.candidate_name ?? item.candidate_email}
                    </p>
                    {item.candidate_name && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.candidate_email}
                      </span>
                    )}
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{titleCase(item.interview_type)}</Badge>
                    <Badge variant="outline">{titleCase(item.difficulty)}</Badge>
                    <span className="text-xs text-muted-foreground">{item.domain}</span>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="text-xs text-muted-foreground">
                    {item.completed_at
                      ? formatDateTime(item.completed_at)
                      : formatDateTime(item.created_at)}
                  </span>
                  {item.duration_seconds !== null && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatDuration(item.duration_seconds)}
                    </span>
                  )}
                  {item.has_brief && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/brief-review?session=${item.session_id}`);
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View brief
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}