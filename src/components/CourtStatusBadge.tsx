import { cn } from "@/lib/utils";
import { Badge } from "@/components/primitives/badge";
import type { CourtCase } from "@/data/mock/types";

const statusClasses: Record<CourtCase["status"], string> = {
  jury: "bg-[color:var(--accent)]/15 text-[var(--accent)]",
  live: "bg-[color:var(--pagehint)]/15 text-[color:var(--pagehint)]",
  ended: "bg-panel-alt text-muted",
};

const statusLabels: Record<CourtCase["status"], string> = {
  jury: "Jury forming",
  live: "Session live",
  ended: "Ended",
};

type CourtStatusBadgeProps = {
  status: CourtCase["status"];
  className?: string;
};

export function CourtStatusBadge({ status, className }: CourtStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(statusClasses[status], className)}>
      {statusLabels[status]}
    </Badge>
  );
}

export default CourtStatusBadge;
