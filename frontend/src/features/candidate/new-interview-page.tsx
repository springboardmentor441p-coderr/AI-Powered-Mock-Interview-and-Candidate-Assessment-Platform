import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Mic, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { newInterviewSchema, type NewInterviewFormValues } from "@/features/candidate/schemas";
import { useCreateRealtimeSession, useResumes } from "@/features/candidate/hooks";
import { INTERVIEW_TYPES, DIFFICULTIES } from "@/lib/constants";

export default function NewInterviewPage() {
  const navigate = useNavigate();
  const createSession = useCreateRealtimeSession();
  const { data: resumes } = useResumes();
  const hasPrimaryResume = (resumes?.items ?? []).some((r) => r.is_primary);

  const form = useForm<NewInterviewFormValues>({
    resolver: zodResolver(newInterviewSchema),
    defaultValues: {
      interview_type: "technical",
      domain: "",
      difficulty: "medium",
      topic_count: 6,
      use_primary_resume: true,
    },
  });

  function onSubmit(values: NewInterviewFormValues) {
    createSession.mutate(values, {
      onSuccess: (session) => navigate(`/room/${session.id}`),
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Pre-Production"
        title="Set up your interview"
        description="A live, voice-driven session with an AI interviewer that adapts follow-ups to your answers."
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" /> Session details
          </CardTitle>
          <CardDescription>This shapes the topics and pacing of your interview.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="interview_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INTERVIEW_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
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
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role / domain</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Backend Engineering, Product Marketing" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DIFFICULTIES.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
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
                  name="topic_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topics</FormLabel>
                      <FormControl>
                        <Input type="number" min={2} max={15} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="use_primary_resume"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div className="space-y-0.5">
                      <FormLabel className="normal-case tracking-normal text-foreground">
                        Tailor to my résumé
                      </FormLabel>
                      <FormDescription>
                        {hasPrimaryResume
                          ? "Uses your primary résumé to personalize questions."
                          : "No primary résumé on file yet — upload one from the Résumés page."}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value && hasPrimaryResume}
                        onCheckedChange={field.onChange}
                        disabled={!hasPrimaryResume}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" size="lg" className="w-full" disabled={createSession.isPending}>
                {createSession.isPending ? <Spinner /> : <Sparkles className="h-4 w-4" />}
                Create session &amp; go live
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
