import { Link } from "react-router";

import {
  GlassyCompactGrid,
  GlassyKeyValue,
  GlassyStatusChip,
  GlassyTile,
  GlassyTileHeading,
} from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import type { CourtCaseViewerV2Dto, CourtMyReportItemV2Dto } from "@/types/api";

export function courtLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function courtTone(
  value: string,
): "danger" | "neutral" | "ok" | "primary" | "warn" {
  if (["final", "applied", "confirmed", "accepted"].includes(value))
    return "ok";
  if (["failed", "reversed", "dismissed", "withdrawn"].includes(value))
    return "danger";
  if (
    [
      "appealed",
      "appeal_window",
      "awaiting_jury_capacity",
      "remanded",
    ].includes(value)
  ) {
    return "warn";
  }
  if (
    [
      "jury_selection",
      "finding_ballot",
      "sentence_ballot",
      "triggered",
    ].includes(value)
  ) {
    return "primary";
  }
  return "neutral";
}

export function formatCourtInstant(value: string | null): string {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleString();
}

export function CourtCaseCard({ item }: { item: CourtCaseViewerV2Dto }) {
  const courtCase = item.publicCase;
  if (!courtCase) return null;
  return (
    <GlassyTile className="flex min-h-44 flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <GlassyTileHeading>
            {courtLabel(courtCase.domain)} case
          </GlassyTileHeading>
          <p className="text-xs break-all text-muted">{courtCase.id}</p>
        </div>
        <GlassyStatusChip tone={courtTone(courtCase.state)}>
          {courtLabel(courtCase.state)}
        </GlassyStatusChip>
      </div>
      <GlassyCompactGrid className="grid-cols-2">
        <GlassyKeyValue
          label="Finding"
          value={courtCase.offenseCode ?? "Pending"}
        />
        <GlassyKeyValue
          label="Finality"
          value={courtLabel(courtCase.finalityState)}
        />
        <GlassyKeyValue
          label="Opened"
          value={formatCourtInstant(courtCase.openedAt)}
        />
        <GlassyKeyValue
          label="Updated"
          value={formatCourtInstant(courtCase.updatedAt)}
        />
      </GlassyCompactGrid>
      <div className="mt-auto flex justify-end">
        <Button asChild size="compact" variant="ghost">
          <Link to={`/app/courts/${encodeURIComponent(courtCase.id)}`}>
            Open case
          </Link>
        </Button>
      </div>
    </GlassyTile>
  );
}

export function CourtReportCard({
  report,
}: {
  report: CourtMyReportItemV2Dto;
}) {
  return (
    <GlassyTile className="flex min-h-40 flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <GlassyTileHeading>{report.offenseCode}</GlassyTileHeading>
          <p className="text-xs break-all text-muted">
            {courtLabel(report.target.type)} · {report.target.id}
          </p>
        </div>
        <GlassyStatusChip tone={courtTone(report.state)}>
          {courtLabel(report.state)}
        </GlassyStatusChip>
      </div>
      <GlassyCompactGrid className="grid-cols-2">
        <GlassyKeyValue label="Lane" value={courtLabel(report.lane)} />
        <GlassyKeyValue
          label="Updated"
          value={formatCourtInstant(report.updatedAt)}
        />
      </GlassyCompactGrid>
      <div className="mt-auto flex flex-wrap justify-end gap-2">
        {report.caseId ? (
          <Button asChild size="compact" variant="ghost">
            <Link to={`/app/courts/${encodeURIComponent(report.caseId)}`}>
              Open case
            </Link>
          </Button>
        ) : null}
        <Button asChild size="compact" variant="ghost">
          <Link to={`/app/courts/reports/${encodeURIComponent(report.id)}`}>
            View report
          </Link>
        </Button>
      </div>
    </GlassyTile>
  );
}
