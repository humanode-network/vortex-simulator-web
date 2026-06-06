import { CmEconomyPanel } from "@/components/CmEconomyPanel";
import { GlassySection, GlassyTile } from "@/components/GlassySection";
import type { CmSummaryDto } from "@/types/api";

type MyGovernanceCmEconomyCardProps = {
  cmSummary: CmSummaryDto | null;
};

export function MyGovernanceCmEconomyCard({
  cmSummary,
}: MyGovernanceCmEconomyCardProps) {
  if (cmSummary) {
    return (
      <CmEconomyPanel
        totals={cmSummary.totals}
        chambers={cmSummary.chambers}
        history={cmSummary.history}
        mmValue={cmSummary.totals.acm}
        totalsScope="personal"
      />
    );
  }

  return (
    <GlassySection title="CM + MM">
      <GlassyTile className="px-4 py-3 text-sm text-muted">
        CM summary unavailable.
      </GlassyTile>
    </GlassySection>
  );
}
