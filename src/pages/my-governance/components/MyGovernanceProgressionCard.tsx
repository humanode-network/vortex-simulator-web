import {
  GlassyMetricTile,
  GlassyProgressBar,
  GlassySection,
  GlassyTile,
  GlassyTileHeading,
} from "@/components/GlassySection";
import {
  getRequirementProgress,
  labelForTier,
  requirementLabel,
  type TierKey,
} from "@/lib/myGovernanceUi";
import type { GetMyGovernanceResponse } from "@/types/api";

type MyGovernanceProgressionCardProps = {
  tierProgress: GetMyGovernanceResponse["tier"] | null;
};

export const MyGovernanceProgressionCard: React.FC<
  MyGovernanceProgressionCardProps
> = ({ tierProgress }) => {
  const currentTier = (tierProgress?.tier as TierKey | undefined) ?? "Nominee";
  const nextTier = (tierProgress?.nextTier as TierKey | null) ?? null;
  const requirements = tierProgress?.requirements ?? null;
  const metrics = tierProgress?.metrics ?? {
    governorEras: 0,
    activeEras: 0,
    acceptedProposals: 0,
    formationParticipation: 0,
  };
  const requirementKeys = requirements
    ? (Object.keys(requirements) as Array<keyof typeof requirementLabel>)
    : [];
  const overallPercent =
    requirements && requirementKeys.length > 0
      ? Math.round(
          requirementKeys.reduce((sum, key) => {
            return (
              sum + getRequirementProgress(key, metrics, requirements).percent
            );
          }, 0) / requirementKeys.length,
        )
      : 100;

  return (
    <GlassySection title="Tier progress">
      <div className="space-y-4">
        <div className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr]">
          <GlassyMetricTile
            label="Current tier"
            value={labelForTier(currentTier)}
          />
          <GlassyMetricTile
            label="Next tier"
            value={nextTier ? labelForTier(nextTier) : "-"}
          />
          <GlassyTile className="flex flex-col justify-center gap-3 px-4 py-4 sm:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between gap-3">
              <GlassyTileHeading>Progress</GlassyTileHeading>
              <p className="text-sm font-medium text-text">
                {nextTier ? `${overallPercent}%` : "Max"}
              </p>
            </div>
            <GlassyProgressBar value={overallPercent} />
            <p className="text-xs text-muted">
              {nextTier
                ? `Toward ${labelForTier(nextTier)}`
                : "Highest available tier reached"}
            </p>
          </GlassyTile>
        </div>
        {requirements && requirementKeys.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {requirementKeys.map((key) => {
              const progress = getRequirementProgress(
                key,
                metrics,
                requirements,
              );
              return (
                <GlassyTile key={key} className="grid min-h-28 gap-2 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <GlassyTileHeading>
                      {requirementLabel[key]}
                    </GlassyTileHeading>
                    <p className="text-sm font-medium text-text">
                      {progress.done} / {progress.required}
                    </p>
                  </div>
                  <GlassyProgressBar value={progress.percent} />
                  <p className="text-xs text-muted">
                    {progress.percent}% complete
                  </p>
                </GlassyTile>
              );
            })}
          </div>
        ) : (
          <GlassyTile className="text-sm text-muted">
            You have reached the highest available tier.
          </GlassyTile>
        )}
      </div>
    </GlassySection>
  );
};
