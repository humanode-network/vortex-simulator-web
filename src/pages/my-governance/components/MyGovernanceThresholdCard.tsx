import {
  GlassyMetricTile,
  GlassySection,
  GlassyTile,
  GlassyTileHeading,
} from "@/components/GlassySection";
import { HintLabel } from "@/components/Hint";
import { Kicker } from "@/components/Kicker";
import type { GoverningStatus } from "@/lib/myGovernanceUi";
import type { GetMyGovernanceResponse } from "@/types/api";

type MyGovernanceThresholdCardProps = {
  eraActivity: GetMyGovernanceResponse["eraActivity"] | undefined;
  status: {
    label: GoverningStatus;
    termId: string;
  };
  timeLeftValue: string;
};

const masterEraActionLabels = ["Pool votes", "Chamber votes"] as const;

function formatEraActionLabel(label: string, index: number): string {
  const baseLabel =
    masterEraActionLabels[index] ?? label.replace(/\s+this era$/i, "").trim();
  return `${baseLabel} this era`;
}

export function MyGovernanceThresholdCard({
  eraActivity,
  status,
  timeLeftValue,
}: MyGovernanceThresholdCardProps) {
  return (
    <GlassySection
      title={
        <HintLabel termId="governing_threshold">Governing threshold</HintLabel>
      }
    >
      <div className="space-y-4">
        <GlassyTile className="px-4 py-3 text-sm text-muted">
          This tracks opportunities that occurred during the current era, even
          if those votes are already closed.
        </GlassyTile>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Era", value: eraActivity?.era ?? "—" },
            { label: "Time left", value: timeLeftValue },
          ].map((tile) => (
            <GlassyMetricTile
              key={tile.label}
              label={
                tile.label === "Era" ? (
                  <HintLabel termId="governing_era">{tile.label}</HintLabel>
                ) : (
                  tile.label
                )
              }
              value={tile.value}
            />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              key: "required",
              label: (
                <HintLabel termId="governing_threshold">
                  Era participation
                </HintLabel>
              ),
              value: eraActivity
                ? `${eraActivity.completed} / ${eraActivity.required} completed this era`
                : "—",
            },
            {
              key: "status",
              label: "Status",
              value: (
                <HintLabel termId={status.termId}>{status.label}</HintLabel>
              ),
            },
          ].map((tile) => (
            <GlassyMetricTile
              key={tile.key}
              label={tile.label}
              value={tile.value}
            />
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(eraActivity?.actions ?? []).map((act, index) => (
            <GlassyTile
              key={act.label}
              className="flex h-full flex-col items-center justify-center px-3 py-3 text-center"
            >
              <Kicker align="center" className="text-[0.7rem]">
                {formatEraActionLabel(act.label, index)}
              </Kicker>
              <GlassyTileHeading>
                {act.done} / {act.required}
              </GlassyTileHeading>
            </GlassyTile>
          ))}
        </div>
      </div>
    </GlassySection>
  );
}
