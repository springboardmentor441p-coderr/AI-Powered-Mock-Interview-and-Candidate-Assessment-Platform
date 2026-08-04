import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, CheckCircle2, Info, Radar, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { HUMAN_VERDICTS } from "@/lib/constants";
import { useSessionBriefLookup, useSetHumanVerdict } from "@/features/recruiter/hooks";

const verdictSchema = z.object({
  human_verdict: z.string().min(1, "Choose a verdict."),
  human_notes: z.string().optional().or(z.literal("")),
});
type VerdictFormValues = z.infer<typeof verdictSchema>;

export default function BriefReviewPage() {
  const [searchParams] = useSearchParams();
  const [lookupId, setLookupId] = useState(() => searchParams.get("session") ?? "");
  const [activeId, setActiveId] = useState<string | undefined>(
    () => searchParams.get("session") ?? undefined
  );

  useEffect(() => {
    const param = searchParams.get("session");
    if (param && param !== activeId) {
      setLookupId(param);
      setActiveId(param);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data: brief, isLoading, isError, error } = useSessionBriefLookup(activeId);
  const setVerdict = useSetHumanVerdict(activeId);

  const form = useForm<VerdictFormValues>({
    resolver: zodResolver(verdictSchema),
    values: { human_verdict: brief?.human_verdict ?? "", human_notes: brief?.human_notes ?? "" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Screening Room"
        title="Brief review"
        description="Look up a candidate's interview brief by session ID and record your hiring verdict."
      />

      <Card className="mb-6 max-w-xl">
        <CardContent className="flex items-center gap-3 py-5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Paste a session ID…"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setActiveId(lookupId.trim())}
          />
          <Button onClick={() => setActiveId(lookupId.trim())} disabled={!lookupId.trim()}>
            Look up
          </Button>
        </CardContent>
      </Card>

      <div className="mb-6 flex items-start gap-2 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Session IDs come from a candidate's shared results link or the rankings page. A dedicated cross-candidate
        session browser isn't wired up on the backend yet — this is the direct lookup path.
      </div>

      {!activeId && (
        <EmptyState icon={Radar} title="No session selected" description="Enter a session ID above to pull up its brief." />
      )}

      {activeId && isLoading && <Spinner className="h-6 w-6 text-primary" />}

      {activeId && isError && (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't find that brief"
          description={(error as { message?: string })?.message ?? "Double-check the session ID and try again."}
        />
      )}

      {activeId && brief && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{brief.overall_signal}</CardTitle>
              {brief.requires_human_review && <Badge variant="warning">Needs review</Badge>}
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{brief.summary}</p>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {brief.strong_signals?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-success">
                    <CheckCircle2 className="h-4 w-4" /> Strong signals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {brief.strong_signals.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {brief.red_flags?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Red flags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {brief.red_flags.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your verdict</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  className="space-y-4"
                  onSubmit={form.handleSubmit((values) => setVerdict.mutate(values))}
                >
                  <FormField
                    control={form.control}
                    name="human_verdict"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verdict</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a verdict" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {HUMAN_VERDICTS.map((v) => (
                              <SelectItem key={v.value} value={v.value}>
                                {v.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="human_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea rows={4} placeholder="Optional notes for the hiring team…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Separator />
                  <Button type="submit" disabled={setVerdict.isPending}>
                    {setVerdict.isPending && <Spinner />}
                    Save verdict
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}