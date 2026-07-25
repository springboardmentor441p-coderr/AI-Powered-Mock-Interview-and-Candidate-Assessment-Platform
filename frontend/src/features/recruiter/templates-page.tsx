import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ClipboardList, Plus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { titleCase } from "@/lib/utils";
import { INTERVIEW_TYPES, DIFFICULTIES } from "@/lib/constants";
import { useCreateTemplate, useTemplates } from "@/features/recruiter/hooks";

const templateSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional().or(z.literal("")),
  interview_type: z.string().min(1),
  domain: z.string().min(1, "Domain is required."),
  difficulty: z.enum(["easy", "medium", "hard"]),
  question_count: z.coerce.number().int().min(1).max(20),
  duration_minutes: z.coerce.number().int().min(5).max(180),
});
type TemplateFormValues = z.infer<typeof templateSchema>;

export default function TemplatesPage() {
  const { data, isLoading, isError, error, refetch } = useTemplates();
  const createTemplate = useCreateTemplate();
  const [open, setOpen] = useState(false);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: "",
      description: "",
      interview_type: "technical",
      domain: "",
      difficulty: "medium",
      question_count: 5,
      duration_minutes: 30,
    },
  });

  function onSubmit(values: TemplateFormValues) {
    createTemplate.mutate(
      { ...values, description: values.description ?? "" },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
        },
      },
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Format Library"
        title="Interview templates"
        description="Reusable interview formats candidates can be assigned."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> New template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a template</DialogTitle>
                <DialogDescription>Defines the shape of interviews assigned from this template.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Senior Backend — System Design" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea rows={3} placeholder="What this template is designed to evaluate…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="interview_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
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
                  </div>
                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Backend Engineering" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="question_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Questions</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} max={20} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="duration_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (min)</FormLabel>
                          <FormControl>
                            <Input type="number" min={5} max={180} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createTemplate.isPending}>
                      {createTemplate.isPending && <Spinner />}
                      Create template
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading && <Skeleton className="h-64 w-full" />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && data.items.length === 0 && (
        <EmptyState icon={ClipboardList} title="No templates yet" description="Create your first interview template to get started." />
      )}

      {data && data.items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((tpl) => (
            <Card key={tpl.id}>
              <CardContent className="space-y-2.5 py-5">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{titleCase(tpl.interview_type)}</Badge>
                  <Badge variant="outline">{titleCase(tpl.difficulty)}</Badge>
                </div>
                <p className="font-display text-lg text-foreground">{tpl.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{tpl.description}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {tpl.question_count} questions · {tpl.duration_minutes} min · {tpl.domain}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
