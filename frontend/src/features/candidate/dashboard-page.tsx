import { Link } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, Mic, Radar, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ScoreRing } from "@/components/shared/score-ring";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { useCandidateDashboard } from "@/features/candidate/hooks";
import { formatDate } from "@/lib/utils";

export default function CandidateDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error, refetch } = useCandidateDashboard();

  return (
    <div>
      <PageHeader
        eyebrow="Studio Overview"
        title={`Welcome back, ${user?.first_name || "there"}`}
        description="Here's how your recent takes have landed — and where to focus your next session."
        actions={
          <Button asChild size="lg">
            <Link to="/app/interviews/new">
              <Mic className="h-4 w-4" /> Start new interview
            </Link>
          </Button>
        }
      />

      {isLoading && (
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-40 md:col-span-1" />
          <Skeleton className="h-40 md:col-span-2" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Overall signal</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <ScoreRing value={data.summary.average_overall} label="avg score" size={130} />
              <div className="grid w-full grid-cols-2 gap-3 text-center">
                <Metric label="Sessions" value={data.summary.total_sessions} />
                <Metric label="Best score" value={data.summary.best_score !== null ? Math.round(data.summary.best_score) : "—"} />
                <Metric label="Communication" value={fmt(data.summary.average_communication)} />
                <Metric label="Confidence" value={fmt(data.summary.average_confidence)} />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Score trend
              </CardTitle>
              {data.trend.length > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/app/interviews">
                    View all <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {data.trend.length === 0 ? (
                <EmptyState
                  icon={Radar}
                  title="No completed sessions yet"
                  description="Finish your first interview to start tracking your progress here."
                />
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend.map((t) => ({ ...t, dateLabel: formatDate(t.date) }))}>
                      <XAxis dataKey="dateLabel" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={28} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="overall_score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "hsl(var(--primary))" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Where to focus next</CardTitle>
            </CardHeader>
            <CardContent>
              {data.weak_areas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No specific weak areas flagged yet — keep interviewing to build up your signal.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.weak_areas.map((area) => (
                    <Badge key={area} variant="warning">
                      {area}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-secondary/40 px-3 py-2.5">
      <p className="font-mono-num text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function fmt(v: number | null) {
  return v === null || v === undefined ? "—" : Math.round(v);
}
