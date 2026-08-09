import { useNavigate } from "react-router-dom";
import { Copy, Inbox, Play } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime, titleCase } from "@/lib/utils";
import { useReceivedInvitations, useAcceptInvitation } from "@/features/candidate/hooks";

export default function InvitationsPage() {
  const { data, isLoading, isError, error, refetch } = useReceivedInvitations();
  const acceptInvitation = useAcceptInvitation();
  const navigate = useNavigate();

  function handleAccept(invitationId: string) {
    acceptInvitation.mutate(invitationId, {
      onSuccess: (session) => {
        navigate(`/room/${session.id}`);
      },
    });
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    }).catch(() => {
      toast.error("Could not copy — please select and copy manually");
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Recruiter Invitations"
        title="Interview invitations"
        description="Interviews sent to you by recruiters. Accept one to start immediately."
      />

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="No invitations yet"
          description="When a recruiter sends you an interview invitation, it will appear here."
        />
      )}

      {data && data.items.length > 0 && (
        <TooltipProvider>
          <div className="space-y-3">
            {data.items.map((inv) => {
              // Determine if this invitation's session failed / was abandoned so the
              // recruiter needs to re-invite or the candidate can retry
              const isAcceptedButNoSession = inv.status === "accepted" && !inv.session_id;

              return (
                <Card key={inv.id}>
                  <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-base text-foreground">
                          From {inv.recruiter_name}
                        </p>
                        {inv.status === "accepted" && inv.session_id && (
                          <Badge variant="secondary" className="text-emerald-400 border-emerald-400/30">
                            Accepted
                          </Badge>
                        )}
                        {inv.status === "pending" && (
                          <Badge variant="outline" className="text-amber-400 border-amber-400/30">
                            Pending
                          </Badge>
                        )}
                        {isAcceptedButNoSession && (
                          <Badge variant="outline" className="text-destructive border-destructive/30">
                            Session failed — contact recruiter
                          </Badge>
                        )}
                      </div>

                      {inv.template ? (
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{titleCase(inv.template.interview_type)}</Badge>
                          <Badge variant="outline">{titleCase(inv.template.difficulty)}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {inv.template.title} · {inv.template.domain}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Open interview — no specific template</p>
                      )}

                      {inv.message && (
                        <p className="text-sm text-muted-foreground italic border-l-2 border-border pl-3">
                          "{inv.message}"
                        </p>
                      )}

                      {/* Session ID — shown once accepted so candidate can share with recruiter */}
                      {inv.status === "accepted" && inv.session_id && (
                        <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-1.5 w-fit">
                          <span className="text-xs text-muted-foreground">Session ID:</span>
                          <span className="font-mono text-xs text-foreground">{inv.session_id}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => copyToClipboard(inv.session_id!, "Session ID")}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Copy session ID</TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">{formatDateTime(inv.created_at)}</p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      {inv.status === "pending" && (
                        <Button
                          onClick={() => handleAccept(inv.id)}
                          disabled={acceptInvitation.isPending}
                        >
                          {acceptInvitation.isPending ? (
                            <Spinner />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          Accept & start
                        </Button>
                      )}
                      {inv.status === "accepted" && inv.session_id && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/app/interviews/${inv.session_id}`)}
                        >
                          View results
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
