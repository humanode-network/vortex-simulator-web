import {
  GlassyMetricTile,
  GlassySection,
  GlassyTile,
} from "@/components/GlassySection";
import { HintLabel } from "@/components/Hint";
import {
  formatExposurePeriod,
  GOVERNOR_OPPORTUNITY_STAGES,
} from "@/lib/governorOpportunityUi";
import type { GoverningStatus } from "@/lib/myGovernanceUi";
import type {
  GetMyGovernanceResponse,
  GovernorOpportunityStageDto,
  GovernorOpportunityStateDto,
} from "@/types/api";
import { GovernorOpportunityLedger } from "./GovernorOpportunityLedger";
import { ActiveGovernorResult } from "./ActiveGovernorResult";
import { GovernorOpportunitySummaryTile } from "./GovernorOpportunitySummaryTile";

type MyGovernanceThresholdCardProps = {
  eraActivity: GetMyGovernanceResponse["eraActivity"] | undefined;
  status: {
    label: GoverningStatus;
    termId: string;
  };
  timeLeftValue: string;
  opportunityAccounting: GetMyGovernanceResponse["opportunityAccounting"];
  opportunityError: string | null;
  opportunityLoading: boolean;
  onFilterOpportunities: (
    stage: GovernorOpportunityStageDto | null,
    state: GovernorOpportunityStateDto | null,
  ) => void;
  onLoadMoreOpportunities: () => void;
};

function formatEraActionLabel(label: string): string {
  return `${label.replace(/\s+this era$/i, "").trim()} this era`;
}

export function MyGovernanceThresholdCard({
  eraActivity,
  onFilterOpportunities,
  onLoadMoreOpportunities,
  opportunityAccounting,
  opportunityError,
  opportunityLoading,
  status,
  timeLeftValue,
}: MyGovernanceThresholdCardProps) {
  const categories = opportunityAccounting
    ? GOVERNOR_OPPORTUNITY_STAGES.map((stage) => ({
        label: stage.requirementLabel,
        summary: opportunityAccounting[stage.summaryKey],
      }))
    : (eraActivity?.actions ?? []).map((action) => ({
        label: formatEraActionLabel(action.label),
        summary: {
          raw: action.required,
          accountable: action.required,
          completed: action.done,
          required: action.required,
        },
      }));

  return (
    <GlassySection
      title={
        <HintLabel termId="governing_threshold">Governing threshold</HintLabel>
      }
    >
      <div className="space-y-4">
        <GlassyTile className="px-4 py-3 text-sm text-muted">
          Eligible stages count only after the full exposure period. A stage
          that closes sooner creates no requirement, and every completed action
          stays matched to its own occurrence.
        </GlassyTile>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { key: "era", label: "Era", value: eraActivity?.era ?? "—" },
            { key: "time", label: "Time left", value: timeLeftValue },
            {
              label: (
                <HintLabel termId="governor_opportunity_exposure">
                  Exposure period
                </HintLabel>
              ),
              key: "exposure",
              value: opportunityAccounting
                ? formatExposurePeriod(opportunityAccounting.exposureSeconds)
                : "—",
            },
            {
              label: "Governing status",
              key: "status",
              value: (
                <HintLabel termId={status.termId}>{status.label}</HintLabel>
              ),
            },
          ].map((tile) => (
            <GlassyMetricTile
              key={tile.key}
              label={
                typeof tile.label === "string" && tile.label === "Era" ? (
                  <HintLabel termId="governing_era">{tile.label}</HintLabel>
                ) : (
                  tile.label
                )
              }
              value={tile.value}
            />
          ))}
        </div>
        {opportunityAccounting ? (
          <ActiveGovernorResult
            reason={opportunityAccounting.activeGovernorReason}
          />
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map(({ label, summary }) => (
            <GovernorOpportunitySummaryTile
              key={label}
              label={label}
              summary={summary}
            />
          ))}
        </div>
        {opportunityAccounting ? (
          <GovernorOpportunityLedger
            accounting={opportunityAccounting}
            error={opportunityError}
            loading={opportunityLoading}
            onFilter={onFilterOpportunities}
            onLoadMore={onLoadMoreOpportunities}
          />
        ) : null}
      </div>
    </GlassySection>
  );
}
