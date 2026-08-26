import { GlassyTile, GlassyTileHeading } from "@/components/GlassySection";
import { Kicker } from "@/components/Kicker";
import type { GovernorOpportunitySummaryDto } from "@/types/api";

type GovernorOpportunitySummaryTileProps = {
  label: string;
  summary: GovernorOpportunitySummaryDto;
};

export function GovernorOpportunitySummaryTile({
  label,
  summary,
}: GovernorOpportunitySummaryTileProps) {
  return (
    <GlassyTile className="flex h-full flex-col gap-3 px-4 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <Kicker>{label}</Kicker>
        <GlassyTileHeading className="text-base">
          {summary.completed} / {summary.required}
        </GlassyTileHeading>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center text-xs text-muted">
        <div className="rounded-lg border border-border/70 px-2 py-2">
          <strong className="block text-sm text-text">
            {summary.accountable}
          </strong>
          Accountable
        </div>
        <div className="rounded-lg border border-border/70 px-2 py-2">
          <strong className="block text-sm text-text">{summary.raw}</strong>
          Raw eligible
        </div>
      </div>
    </GlassyTile>
  );
}
