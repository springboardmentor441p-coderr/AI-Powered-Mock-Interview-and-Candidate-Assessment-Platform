import { useState } from "react";
import { ListOrdered, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRecruiterRankings } from "@/features/recruiter/hooks";

export default function RankingsPage() {
  const { data, isLoading, isError, error, refetch } = useRecruiterRankings();
  const [query, setQuery] = useState("");

  const filtered = (data ?? []).filter(
    (c) => c.name?.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <PageHeader eyebrow="Leaderboard" title="Candidate rankings" description="Ranked by average score across all completed sessions." />

      <div className="mb-5 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading && <Skeleton className="h-72 w-full" />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && data.length === 0 && (
        <EmptyState icon={ListOrdered} title="No rankings yet" description="Rankings appear once candidates complete interviews." />
      )}

      {data && data.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead className="text-right">Avg. score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c, i) => (
                  <TableRow key={c.candidate_id}>
                    <TableCell className="font-mono-num text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium text-foreground">{c.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="font-mono-num">{c.sessions_completed}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={c.average_score >= 75 ? "success" : c.average_score >= 45 ? "warning" : "destructive"}>
                        {Math.round(c.average_score)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
