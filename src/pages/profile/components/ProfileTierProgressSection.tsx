import { SectionHeader } from "@/components/SectionHeader";
import { Kicker } from "@/components/Kicker";
import { Surface } from "@/components/Surface";
import { TierLabel } from "@/components/TierLabel";
import type { TierRequirementItem } from "@/lib/tierProgress";
import type { TierProgressDto } from "@/types/api";

type ProfileTierProgressSectionProps = {
  requirementItems: TierRequirementItem[];
  tierProgress: TierProgressDto | null;
};

export function ProfileTierProgressSection({
  requirementItems,
  tierProgress,
}: ProfileTierProgressSectionProps) {
  if (!tierProgress) {
    return null;
  }

  return (
    <section className="space-y-3">
      <SectionHeader>Tier progress</SectionHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="flex h-full flex-col items-center justify-center px-4 py-4 text-center"
        >
          <Kicker align="center">Current tier</Kicker>
          <p className="text-xl font-semibold text-text">
            <TierLabel tier={tierProgress.tier} />
          </p>
        </Surface>
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="flex h-full flex-col items-center justify-center px-4 py-4 text-center"
        >
          <Kicker align="center">Next tier</Kicker>
          <p className="text-xl font-semibold text-text">
            {tierProgress.nextTier ? (
              <TierLabel tier={tierProgress.nextTier} />
            ) : (
              "Max tier"
            )}
          </p>
        </Surface>
      </div>
      {requirementItems.length > 0 ? (
        <div className="grid gap-3 text-center sm:grid-cols-2">
          {requirementItems.map((item) => (
            <Surface
              key={item.key}
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="flex h-24 flex-col items-center justify-between px-3 py-3"
            >
              <Kicker align="center">{item.label}</Kicker>
              <p className="text-lg font-semibold text-text">
                {item.done} / {item.required}
              </p>
              <p className="text-xs text-muted">{item.percent}% complete</p>
            </Surface>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          You have reached the highest available tier.
        </p>
      )}
    </section>
  );
}
