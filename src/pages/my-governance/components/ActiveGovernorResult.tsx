import { GlassyStatusChip, GlassyTile } from "@/components/GlassySection";
import { Kicker } from "@/components/Kicker";
import { getActiveGovernorReasonCopy } from "@/lib/governorOpportunityUi";
import type { ActiveGovernorReasonDto } from "@/types/api";

export function ActiveGovernorResult({
  reason,
}: {
  reason: ActiveGovernorReasonDto;
}) {
  const copy = getActiveGovernorReasonCopy(reason);

  return (
    <GlassyTile className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Kicker>Active Governor result</Kicker>
        <p className="mt-1 text-sm leading-6 text-muted">{copy.detail}</p>
      </div>
      <GlassyStatusChip className="shrink-0" tone={copy.tone}>
        {copy.label}
      </GlassyStatusChip>
    </GlassyTile>
  );
}
