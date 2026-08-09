import { useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, MessageSquareText, Mic2, ShieldAlert, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ScoreRing } from "@/components/shared/score-ring";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatDateTime, formatDuration, titleCase } from "@/lib/utils";
import {
  useFinalScore,
  useFullTranscript,
  useSessionDetail,
  useSessionFeedback,
  useSpeechAnalysis,
  useThreadEvaluations,
  useBrief,
} from "@/features/candidate/hooks";

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session, isLoading } = useSessionDetail(sessionId);

  if (isLoading || !session) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Session Tape"
        title={`${titleCase(session.interview_type)} · ${session.domain}`}
        description={`${titleCase(session.difficulty)} difficulty · ${formatDateTime(session.started_at ?? session.created_at)}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={session.status} />
            {session.duration_seconds !== null && (
              <Badge variant="outline" className="font-mono-num">
                {formatDuration(session.duration_seconds)}
              </Badge>
            )}
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="threads">Thread Evaluations</TabsTrigger>
          <TabsTrigger value="speech">Speech &amp; Presence</TabsTrigger>
          <TabsTrigger value="brief">Interview Brief</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab sessionId={session.id} />
        </TabsContent>
        <TabsContent value="transcript">
          <TranscriptTab sessionId={session.id} />
        </TabsContent>
        <TabsContent value="threads">
          <ThreadsTab sessionId={session.id} />
        </TabsContent>
        <TabsContent value="speech">
          <SpeechTab sessionId={session.id} />
        </TabsContent>
        <TabsContent value="brief">
          <BriefTab sessionId={session.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ sessionId }: { sessionId: string }) {
  const { data: session } = useSessionDetail(sessionId);
  const { data: score, isLoading, isError } = useFinalScore(sessionId);
  const { data: feedback } = useSessionFeedback(sessionId);

  if (isLoading) return <Skeleton className="h-56 w-full" />;

  if (session?.status === "abandoned") {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Session abandoned"
        description="This session was abandoned before completion. Scores and evaluations are only generated for completed interviews."
      />
    );
  }

  if (isError || !score) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Scoring isn't ready yet"
        description="Final scores are compiled shortly after your session ends. Check back in a moment."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Overall</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <ScoreRing value={score.overall} size={140} label={score.rating} />
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MiniScore label="Communication" value={score.communication} />
          <MiniScore label="Confidence" value={score.confidence} />
          <MiniScore label="Technical" value={score.technical_relevance} />
          <MiniScore label="Professionalism" value={score.professionalism} />
        </CardContent>
      </Card>

      {feedback && (
        <>
          <FeedbackCard title="Strengths" icon={CheckCircle2} items={feedback.strengths} tone="success" />
          <FeedbackCard title="Areas to improve" icon={AlertTriangle} items={feedback.weaknesses} tone="warning" />
          <FeedbackCard title="Suggestions" icon={Sparkles} items={feedback.improvement_suggestions} tone="default" />
        </>
      )}
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-secondary/40 p-3 text-center">
      <p className="font-mono-num text-2xl font-semibold text-foreground">{Math.round(value)}</p>
      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function FeedbackCard({
  title,
  icon: Icon,
  items,
  tone,
}: {
  title: string;
  icon: typeof CheckCircle2;
  items: string[];
  tone: "success" | "warning" | "default";
}) {
  if (!items || items.length === 0) return null;
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-primary";
  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-2 text-base", toneClass)}>
          <Icon className="h-4 w-4" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TranscriptTab({ sessionId }: { sessionId: string }) {
  const { data, isLoading, isError } = useFullTranscript(sessionId);

  if (isLoading) return <Skeleton className="h-72 w-full" />;
  if (isError || !data || data.length === 0) {
    return <EmptyState icon={MessageSquareText} title="No transcript available" description="This session doesn't have a recorded transcript." />;
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        {data.map((line) => (
          <div key={line.id} className={cn("flex flex-col gap-1", line.speaker === "candidate" && "items-end")}>
            <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {line.speaker === "assistant" ? "Interviewer" : "You"}
            </span>
            <p
              className={cn(
                "max-w-2xl rounded-lg px-3.5 py-2.5 text-sm",
                line.speaker === "assistant" ? "bg-secondary/70 text-foreground" : "bg-primary/15 text-foreground",
              )}
            >
              {line.text}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ThreadsTab({ sessionId }: { sessionId: string }) {
  const { data, isLoading, isError } = useThreadEvaluations(sessionId);

  if (isLoading) return <Skeleton className="h-56 w-full" />;
  if (isError || !data || data.length === 0) {
    return <EmptyState icon={ShieldAlert} title="No thread evaluations yet" description="Deep-dive topic evaluations will appear here once scoring finishes." />;
  }

  return (
    <div className="space-y-4">
      {data.map((thread) => (
        <Card key={thread.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{thread.seed_topic_text || thread.seed_topic}</CardTitle>
            <Badge variant={thread.overall_score >= 70 ? "success" : thread.overall_score >= 40 ? "warning" : "destructive"}>
              {thread.verdict || `${Math.round(thread.overall_score)}`}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniScore label="Depth" value={thread.depth_under_pressure} />
              <MiniScore label="Accuracy" value={thread.conceptual_accuracy} />
              <MiniScore label="Specificity" value={thread.specificity} />
              <MiniScore label="Recovery" value={thread.recovery} />
            </div>
            {thread.strong_signals?.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-success">Strong signals</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {thread.strong_signals.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {thread.red_flags?.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-destructive">Red flags</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {thread.red_flags.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SpeechTab({ sessionId }: { sessionId: string }) {
  const { data, isLoading, isError } = useSpeechAnalysis(sessionId);

  if (isLoading) return <Skeleton className="h-56 w-full" />;
  if (isError || !data) {
    return (
      <EmptyState
        icon={Mic2}
        title="Speech analysis not available"
        description="This session may not have audio/video captured, or analysis is still processing."
      />
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Delivery</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <MiniScore label="Grammar" value={data.grammar_score ?? 0} />
          <MiniScore label="Clarity" value={data.clarity_score ?? 0} />
          <MiniScore label="Completeness" value={data.completeness_score ?? 0} />
          <MiniScore label="Pace (wpm)" value={data.speaking_pace_wpm ?? 0} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Presence</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <MiniScore label="Confidence" value={data.confidence_score ?? 0} />
          <MiniScore label="Engagement" value={data.engagement_score ?? 0} />
          <MiniScore label="Attention" value={data.attention_score ?? 0} />
          <MiniScore label="Eye contact %" value={data.eye_contact_percentage ?? 0} />
        </CardContent>
      </Card>
      {data.dominant_emotion && (
        <Card className="md:col-span-2">
          <CardContent className="flex items-center gap-3 py-5">
            <Badge variant="accent">{titleCase(data.dominant_emotion)}</Badge>
            <span className="text-sm text-muted-foreground">Dominant emotion detected during the session</span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BriefTab({ sessionId }: { sessionId: string }) {
  const { data, isLoading, isError } = useBrief(sessionId);

  if (isLoading) return <Skeleton className="h-56 w-full" />;
  if (isError || !data) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No interview brief yet"
        description="Briefs are generated for realtime voice interviews once evaluation completes."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{data.overall_signal}</CardTitle>
          {data.human_verdict && <Badge variant="outline">{titleCase(data.human_verdict)}</Badge>}
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
          <Separator className="my-4" />
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <SignalPill label="Performs under pressure" value={data.performs_under_pressure} />
            <SignalPill label="Specificity consistent" value={data.specificity_consistent} />
            <SignalPill label="No contradictions" value={data.self_contradictions_detected === false} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <FeedbackCard title="Strong signals" icon={CheckCircle2} items={data.strong_signals} tone="success" />
        <FeedbackCard title="Red flags" icon={AlertTriangle} items={data.red_flags} tone="warning" />
      </div>

      {data.human_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recruiter notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.human_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SignalPill({ label, value }: { label: string; value: boolean | null }) {
  const tone = value === null ? "secondary" : value ? "success" : "destructive";
  return (
    <div className="rounded-lg bg-secondary/40 p-3">
      <Badge variant={tone as "secondary" | "success" | "destructive"} className="mb-1">
        {value === null ? "Unknown" : value ? "Yes" : "No"}
      </Badge>
      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
