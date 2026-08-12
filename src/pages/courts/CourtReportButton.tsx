import { Link } from "react-router";

import { Button } from "@/components/primitives/button";
import type { CourtTargetReferenceV2Dto } from "@/types/api";

export function courtReportPath(target: CourtTargetReferenceV2Dto): string {
  const query = new URLSearchParams({
    targetType: target.type,
    targetId: target.id,
  });
  if (target.revision) query.set("revision", target.revision);
  return `/app/courts/reports/new?${query.toString()}`;
}

export function CourtReportButton({
  className,
  label = "Report",
  target,
}: {
  className?: string;
  label?: string;
  target: CourtTargetReferenceV2Dto;
}) {
  return (
    <Button asChild className={className} size="sm" variant="outline">
      <Link to={courtReportPath(target)}>{label}</Link>
    </Button>
  );
}
