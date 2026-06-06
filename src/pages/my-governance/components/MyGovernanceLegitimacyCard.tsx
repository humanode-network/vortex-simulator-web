import {
  GlassyCompactMetric,
  GlassyCompactRow,
  GlassyKeyValue,
  GlassySection,
  GlassyStatusChip,
} from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import type { GetMyGovernanceResponse } from "@/types/api";

type Legitimacy = GetMyGovernanceResponse["legitimacy"];

type MyGovernanceLegitimacyCardProps = {
  legitimacy: Legitimacy;
  legitimacyError: string | null;
  legitimacyPending: boolean;
  onToggleLegitimacy: () => void;
};

export function MyGovernanceLegitimacyCard({
  legitimacy,
  legitimacyError,
  legitimacyPending,
  onToggleLegitimacy,
}: MyGovernanceLegitimacyCardProps) {
  return (
    <GlassySection title="System legitimacy">
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "Legitimacy",
            value: `${legitimacy.percent}%`,
          },
          {
            label: "Objectors",
            value: `${legitimacy.objectingHumanNodes} / ${legitimacy.eligibleHumanNodes}`,
          },
          {
            label: "Trigger",
            value: `< ${legitimacy.triggerThresholdPercent}%`,
          },
        ].map((tile) => (
          <GlassyCompactMetric
            key={tile.label}
            label={tile.label}
            value={tile.value}
          />
        ))}
      </div>
      <GlassyCompactRow
        title="Illegitimacy objection"
        actions={
          <Button
            type="button"
            size="compact"
            variant={legitimacy.objecting ? "outline" : "ghost"}
            className="border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white"
            disabled={legitimacyPending}
            onClick={onToggleLegitimacy}
          >
            {legitimacy.objecting ? "Withdraw" : "Object"}
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <GlassyStatusChip tone={legitimacy.objecting ? "danger" : "neutral"}>
            {legitimacy.objecting ? "Objecting" : "Not objecting"}
          </GlassyStatusChip>
          <GlassyKeyValue
            className="glassy-key-value--stacked glassy-key-value--metric"
            label="Rule"
            value="1 objector = one active-node share."
          />
          {legitimacy.referendumTriggered ? (
            <GlassyStatusChip tone="danger">
              Referendum threshold reached
            </GlassyStatusChip>
          ) : null}
        </div>
        {legitimacyError ? (
          <p className="text-sm text-danger">{legitimacyError}</p>
        ) : null}
      </GlassyCompactRow>
    </GlassySection>
  );
}
