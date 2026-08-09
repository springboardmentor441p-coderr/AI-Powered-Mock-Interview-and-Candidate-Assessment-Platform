import { useNavigate } from "react-router-dom";
import { Copy, ExternalLink, History } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime, formatDuration, titleCase } from "@/lib/utils";
import { useRecruiterHistory } from "@/features/recruiter/hooks";

function CopyButton({ value, label }: { value: string; label: string }) {
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      toast.success(`${label} copied`);
    }).catch(() => {
      toast.error("Could not copy");
    });
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); copy(); }}
            className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="max-w-[160px] truncate">{value}</span>
            <Copy className="h-3 w-3 shrink-0" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Copy {label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function RecruiterInterviewHistoryPage() {
  const { data, isLoading, isError, error, refetch } = useRecruiterHistory();
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        eyebrow="Results"
        title="Interview history"
        description="Sessions from candidates you invited. Session & candidate IDs are shown for brief lookup."
      />

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={History}
          title="No interviews yet"
          description="Once a candidate you've invited accepts and completes their session, it will appear here."
        />
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((item) => (
            <Card
              key={item.invitation_id}
              className={`transition-colors ${item.has_brief ? "hover:border-primary/40 cursor-pointer" : ""}`}
              onClick={() => {
                if (item.has_brief) {
                  navigate(`/app/brief-review?session=${item.session_id}`);
                }
              }}
            >
              <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
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

                  {/* IDs row — visible to recruiter for brief lookup */}
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      Session:&nbsp;
                      <CopyButton value={item.session_id} label="session ID" />
                    </span>
                    {item.candidate_id && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        Candidate:&nbsp;
                        <CopyButton value={item.candidate_id} label="candidate ID" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="text-xs text-muted-foreground">
                    {item.completed_at
                      ? formatDateTime(item.completed_at)
                      : formatDateTime(item.created_at)}
                  </span>
                  {item.duration_seconds != null && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatDuration(item.duration_seconds)}
                    </span>
                  )}
                  {item.has_brief ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/brief-review?session=${item.session_id}`);
                      }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View brief &amp; verdict
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      {item.status === "completed"
                        ? "Brief generating…"
                        : item.status === "abandoned"
                          ? "Session abandoned"
                          : "Interview in progress"}
                    </span>
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
