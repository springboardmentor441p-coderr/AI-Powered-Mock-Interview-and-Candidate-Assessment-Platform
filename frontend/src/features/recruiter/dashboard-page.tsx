import { Link } from "react-router-dom";
import { ArrowUpRight, Gauge, Users, Radio, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/utils";
import { useRecruiterDashboard } from "@/features/recruiter/hooks";

export default function RecruiterDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useRecruiterDashboard();

  return (
    <div>
      <PageHeader
        eyebrow="Control Room"
        title="Recruiter overview"
        description="Platform-wide interview activity and your top-performing candidates."
        actions={
          <Button asChild variant="outline">
            <Link to="/app/rankings">
              Full rankings <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        }
      />

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Total candidates" value={data.platform_overview.total_candidates} />
            <StatCard icon={Radio} label="Total sessions" value={data.platform_overview.total_sessions} />
            <StatCard icon={Gauge} label="Completed" value={data.platform_overview.completed_sessions} />
            <StatCard
              icon={TrendingUp}
              label="Avg. score"
              value={Math.round(data.platform_overview.average_overall_score ?? 0)}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sessions by type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.platform_overview.sessions_by_type.length === 0 && (
                  <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
                )}
                {data.platform_overview.sessions_by_type.map((row) => (
                  <div key={row.interview_type} className="flex items-center justify-between">
                    <Badge variant="secondary">{titleCase(row.interview_type)}</Badge>
                    <span className="font-mono-num text-sm text-foreground">{row.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top candidates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.top_candidates.length === 0 && (
                  <p className="text-sm text-muted-foreground">No ranked candidates yet.</p>
                )}
                {data.top_candidates.slice(0, 6).map((c, i) => (
                  <div key={c.candidate_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono-num w-5 text-sm text-muted-foreground">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name || c.email}</p>
                        <p className="text-xs text-muted-foreground">{c.sessions_completed} sessions</p>
                      </div>
                    </div>
                    <Badge variant={c.average_score >= 75 ? "success" : c.average_score >= 45 ? "warning" : "destructive"}>
                      {Math.round(c.average_score)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-mono-num text-2xl font-semibold text-foreground">{value}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
