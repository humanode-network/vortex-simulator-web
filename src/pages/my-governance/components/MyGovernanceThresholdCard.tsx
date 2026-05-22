import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { HintLabel } from "@/components/Hint";
import { Kicker } from "@/components/Kicker";
import { Surface } from "@/components/Surface";
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

export function MyGovernanceThresholdCard({
  eraActivity,
  status,
  timeLeftValue,
}: MyGovernanceThresholdCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>
          <HintLabel termId="governing_threshold">
            Governing threshold
          </HintLabel>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-4 py-3 text-sm text-muted"
        >
          This tracks opportunities that occurred during the current era, even
          if those votes are already closed.
        </Surface>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Era", value: eraActivity?.era ?? "—" },
            { label: "Time left", value: timeLeftValue },
          ].map((tile) => (
            <Surface
              key={tile.label}
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="flex h-full flex-col items-center justify-center px-4 py-4 text-center"
            >
              <p className="text-sm text-muted">
                {tile.label === "Era" ? (
                  <HintLabel termId="governing_era">{tile.label}</HintLabel>
                ) : (
                  tile.label
                )}
              </p>
              <p className="text-xl font-semibold text-text">{tile.value}</p>
            </Surface>
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
            <Surface
              key={tile.key}
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="flex h-full flex-col items-center justify-center px-4 py-4 text-center"
            >
              <p className="text-sm text-muted">{tile.label}</p>
              <p className="text-xl font-semibold text-text">{tile.value}</p>
            </Surface>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(eraActivity?.actions ?? []).map((act) => (
            <Surface
              key={act.label}
              variant="panelAlt"
              radius="xl"
              shadow="tile"
              className="flex h-full flex-col items-center justify-center px-3 py-3 text-center"
            >
              <Kicker align="center" className="text-[0.7rem]">
                {act.label} this era
              </Kicker>
              <p className="text-base font-semibold text-text">
                {act.done} / {act.required}
              </p>
            </Surface>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
