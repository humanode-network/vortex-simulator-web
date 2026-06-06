import { TierLabel } from "@/components/TierLabel";
import {
  GlassyMetricTile,
  GlassyProgressBar,
  GlassySection,
  GlassyTile,
  GlassyTileHeading,
} from "@/components/GlassySection";
import type { TierRequirementItem } from "@/lib/tierProgress";
import type { TierProgressDto } from "@/types/api";

type ProfileTierProgressSectionProps = {
  className?: string;
  requirementItems: TierRequirementItem[];
  tierProgress: TierProgressDto | null;
};

export function ProfileTierProgressSection({
  className,
  requirementItems,
  tierProgress,
}: ProfileTierProgressSectionProps) {
  if (!tierProgress) {
    return null;
  }

  return (
    <GlassySection className={className} title="Tier progress">
      <div className="grid gap-3 sm:grid-cols-2">
        <GlassyMetricTile
          label="Current tier"
          value={<TierLabel tier={tierProgress.tier} />}
        />
        <GlassyMetricTile
          label="Next tier"
          value={
            tierProgress.nextTier ? (
              <TierLabel tier={tierProgress.nextTier} />
            ) : (
              "Max tier"
            )
          }
        />
      </div>
      {requirementItems.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {requirementItems.map((item) => (
            <GlassyTile
              key={item.key}
              className="grid min-h-28 gap-2 px-3 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <GlassyTileHeading>{item.label}</GlassyTileHeading>
                <p className="text-sm font-semibold text-text">
                  {item.done} / {item.required}
                </p>
              </div>
              <GlassyProgressBar value={item.percent} />
              <p className="text-xs text-muted">{item.percent}% complete</p>
            </GlassyTile>
          ))}
        </div>
      ) : (
        <GlassyTile className="text-sm text-muted">
          You have reached the highest available tier.
        </GlassyTile>
      )}
    </GlassySection>
  );
}
