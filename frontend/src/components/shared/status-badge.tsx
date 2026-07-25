import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "accent"> = {
  completed: "success",
  processed: "success",
  hire: "success",
  strong_hire: "success",
  in_progress: "accent",
  processing: "accent",
  created: "secondary",
  pending: "warning",
  no_hire: "destructive",
  strong_no_hire: "destructive",
  failed: "destructive",
  abandoned: "destructive",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <Badge variant="secondary">Unknown</Badge>;
  const variant = STATUS_VARIANTS[status.toLowerCase()] ?? "default";
  return <Badge variant={variant}>{titleCase(status)}</Badge>;
}
