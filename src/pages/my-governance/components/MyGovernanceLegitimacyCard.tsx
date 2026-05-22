import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Surface } from "@/components/Surface";
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>System legitimacy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
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
              label: "Referendum trigger",
              value: `< ${legitimacy.triggerThresholdPercent}%`,
            },
          ].map((tile) => (
            <Surface
              key={tile.label}
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

        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="space-y-3 p-4"
        >
          <p className="text-sm text-muted">
            Any active human node can object to Vortex legitimacy. Each objector
            reduces legitimacy by their equal share of the active human-node
            base.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={legitimacy.objecting ? "outline" : "ghost"}
              className="border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white"
              disabled={legitimacyPending}
              onClick={onToggleLegitimacy}
            >
              {legitimacy.objecting
                ? "Withdraw illegitimacy objection"
                : "VORTEX IS ILLEGITIMATE"}
            </Button>
            <Badge variant="outline">
              {legitimacy.objecting
                ? "You are objecting"
                : "You are not objecting"}
            </Badge>
            {legitimacy.referendumTriggered ? (
              <Badge variant="outline" className="border-danger/40 text-danger">
                Referendum threshold reached
              </Badge>
            ) : null}
          </div>
          {legitimacyError ? (
            <p className="text-sm text-danger">{legitimacyError}</p>
          ) : null}
        </Surface>
      </CardContent>
    </Card>
  );
}
