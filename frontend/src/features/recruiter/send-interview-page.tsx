import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Clock, CheckCircle2, XCircle, Mail } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatDateTime, titleCase } from "@/lib/utils";
import { useSentInvitations, useSendInvitation } from "@/features/recruiter/hooks";
import { useTemplates } from "@/features/recruiter/hooks";
import type { InvitationStatus } from "@/types/api";

const inviteSchema = z.object({
  candidate_email: z.string().email("Enter a valid email address."),
  template_id: z.string().optional(),
  message: z.string().optional().or(z.literal("")),
});
type InviteFormValues = z.infer<typeof inviteSchema>;

function statusConfig(s: InvitationStatus) {
  if (s === "accepted")
    return { label: "Accepted", icon: CheckCircle2, class: "text-emerald-400" };
  if (s === "expired")
    return { label: "Expired", icon: XCircle, class: "text-red-400" };
  return { label: "Pending", icon: Clock, class: "text-amber-400" };
}

export default function SendInterviewPage() {
  const { data: invitations, isLoading, isError, error, refetch } = useSentInvitations();
  const { data: templates } = useTemplates();
  const sendInvitation = useSendInvitation();
  const [open, setOpen] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { candidate_email: "", template_id: "", message: "" },
  });

  function onSubmit(values: InviteFormValues) {
    sendInvitation.mutate(
      {
        candidate_email: values.candidate_email,
        template_id: values.template_id || undefined,
        message: values.message || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        },
      }
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Outreach"
        title="Send interviews"
        description="Invite candidates by email to take a specific interview on SmartHire."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4" /> Send invitation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a candidate</DialogTitle>
                <DialogDescription>
                  The candidate will receive an in-app notification and can start the interview
                  immediately.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="candidate_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Candidate email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="candidate@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="template_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template (optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="No template — candidate chooses" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No template</SelectItem>
                            {templates?.items.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.title}
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
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personal note (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="e.g. Hi! We'd love to see how you handle system design questions…"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={sendInvitation.isPending}>
                      {sendInvitation.isPending && <Spinner />}
                      Send invitation
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {invitations && invitations.items.length === 0 && (
        <EmptyState
          icon={Mail}
          title="No invitations sent yet"
          description="Send your first invitation to start tracking candidates."
        />
      )}

      {invitations && invitations.items.length > 0 && (
        <div className="space-y-3">
          {invitations.items.map((inv) => {
            const cfg = statusConfig(inv.status);
            const Icon = cfg.icon;
            return (
              <Card key={inv.id}>
                <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-base text-foreground">
                        {inv.candidate_name ?? inv.candidate_email}
                      </p>
                      {inv.candidate_name && (
                        <span className="font-mono text-xs text-muted-foreground">
                          {inv.candidate_email}
                        </span>
                      )}
                      <span className={`flex items-center gap-1 text-xs font-medium ${cfg.class}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </span>
                    </div>
                    {inv.template && (
                      <div className="flex gap-2">
                        <Badge variant="secondary">{titleCase(inv.template.interview_type)}</Badge>
                        <Badge variant="outline">{inv.template.title}</Badge>
                      </div>
                    )}
                    {inv.session_status && (
                      <p className="text-xs text-muted-foreground">
                        Session:{" "}
                        <span className="text-foreground/80 capitalize">
                          {inv.session_status.replace("_", " ")}
                        </span>
                        {inv.has_result && (
                          <span className="ml-2 text-emerald-400">· Results available</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-start gap-1 sm:items-end">
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(inv.created_at)}
                    </span>
                    {inv.has_result && inv.session_id && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/app/brief-review?session=${inv.session_id}`}>
                          View brief
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}