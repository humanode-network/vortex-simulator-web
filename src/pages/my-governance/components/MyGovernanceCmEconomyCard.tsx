import { Badge } from "@/components/primitives/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Kicker } from "@/components/Kicker";
import { Surface } from "@/components/Surface";
import type { CmSummaryDto } from "@/types/api";

type MyGovernanceCmEconomyCardProps = {
  cmSummary: CmSummaryDto | null;
};

export function MyGovernanceCmEconomyCard({
  cmSummary,
}: MyGovernanceCmEconomyCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>CM economy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!cmSummary ? (
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="px-4 py-3 text-sm text-muted"
          >
            CM summary unavailable.
          </Surface>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "LCM", value: cmSummary.totals.lcm },
                { label: "MCM", value: cmSummary.totals.mcm },
                { label: "ACM", value: cmSummary.totals.acm },
              ].map((tile) => (
                <Surface
                  key={tile.label}
                  variant="panelAlt"
                  radius="xl"
                  shadow="tile"
                  className="px-4 py-3 text-center"
                >
                  <Kicker align="center">{tile.label}</Kicker>
                  <p className="text-xl font-semibold text-text">
                    {tile.value.toLocaleString()}
                  </p>
                </Surface>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {cmSummary.chambers.length === 0 ? (
                <Surface
                  variant="panelAlt"
                  radius="xl"
                  shadow="tile"
                  className="px-4 py-3 text-sm text-muted"
                >
                  No CM awards yet.
                </Surface>
              ) : (
                cmSummary.chambers.map((chamber) => (
                  <Surface
                    key={chamber.chamberId}
                    variant="panelAlt"
                    radius="xl"
                    shadow="tile"
                    className="space-y-2 px-4 py-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-text">
                        {chamber.chamberTitle}
                      </p>
                      <Badge variant="outline">M × {chamber.multiplier}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted">
                      <span>LCM {chamber.lcm}</span>
                      <span>MCM {chamber.mcm}</span>
                      <span>ACM {chamber.acm}</span>
                    </div>
                  </Surface>
                ))
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
