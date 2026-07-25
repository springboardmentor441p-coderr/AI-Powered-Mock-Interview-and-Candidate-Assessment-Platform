import { useRef, useState } from "react";
import { FileText, RefreshCw, Star, UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDate } from "@/lib/utils";
import { useReprocessResume, useResumes, useUploadResume } from "@/features/candidate/hooks";

const ACCEPTED = [".pdf", ".doc", ".docx"];

export default function ResumesPage() {
  const { data, isLoading, isError, error, refetch } = useResumes();
  const upload = useUploadResume();
  const reprocess = useReprocessResume();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      return;
    }
    upload.mutate({ file, makePrimary: true });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Reel Library"
        title="Résumés"
        description="Upload your résumé so interviews can be tailored to your background."
      />

      <Card
        className={cn(
          "mb-8 cursor-pointer border-2 border-dashed transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border",
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="font-display text-lg text-foreground">
            {upload.isPending ? "Uploading…" : "Drop your résumé here"}
          </p>
          <p className="text-sm text-muted-foreground">PDF, DOC, or DOCX — or click to browse</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && data.items.length === 0 && (
        <EmptyState icon={FileText} title="No résumés yet" description="Upload one above to get started." />
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.map((resume) => (
            <Card key={resume.id}>
              <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/60 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{resume.original_filename}</p>
                      {resume.is_primary && (
                        <Badge variant="accent">
                          <Star className="h-3 w-3" /> Primary
                        </Badge>
                      )}
                      <StatusBadge status={resume.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {formatDate(resume.created_at)}
                      {resume.experience_years !== null && ` · ${resume.experience_years} yrs experience`}
                    </p>
                    {resume.status === "failed" && resume.failure_reason && (
                      <p className="text-xs text-destructive">{resume.failure_reason}</p>
                    )}
                    {resume.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {resume.skills.slice(0, 8).map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {(resume.status === "failed" || resume.status === "processed") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reprocess.mutate(resume.id)}
                    disabled={reprocess.isPending}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Reprocess
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
