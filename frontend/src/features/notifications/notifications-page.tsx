import { BellRing, CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDateTime } from "@/lib/utils";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/features/notifications/hooks";

export default function NotificationsPage() {
  const { data, isLoading, isError, error, refetch } = useNotifications(false);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const items = data?.items ?? [];
  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div>
      <PageHeader
        eyebrow="Broadcast Log"
        title="Notifications"
        description="Updates about your interviews, scoring, and reviews."
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && items.length === 0 && (
        <EmptyState icon={BellRing} title="Nothing here yet" description="You'll see interview and scoring updates in this feed." />
      )}

      {data && items.length > 0 && (
        <div className="space-y-2.5">
          {items.map((n) => (
            <Card
              key={n.id}
              className={cn("cursor-pointer transition-colors", !n.is_read && "border-primary/40 bg-primary/5")}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
            >
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="font-mono text-[0.65rem] text-muted-foreground/70">{formatDateTime(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
