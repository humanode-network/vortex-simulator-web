import { Check, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Kicker } from "@/components/Kicker";
import { Surface } from "@/components/Surface";
import {
  getRequirementProgress,
  labelForTier,
  proposalRightsByTier,
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Progression dashboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="p-4 text-center"
          >
            <Kicker align="center">Current tier</Kicker>
            <p className="text-lg font-semibold text-text">
              {labelForTier(currentTier)}
            </p>
          </Surface>
          <div className="flex flex-col items-center justify-center gap-3 px-2">
            <Kicker align="center">Progress</Kicker>
            <div className="relative h-2 w-48 overflow-hidden rounded-full bg-muted/30">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
            <p className="text-sm font-semibold text-text">
              {nextTier
                ? `${overallPercent}% to ${labelForTier(nextTier)}`
                : "Max tier reached"}
            </p>
          </div>
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="p-4 text-center"
          >
            <Kicker align="center">Next tier</Kicker>
            <p className="text-lg font-semibold text-text">
              {nextTier ? labelForTier(nextTier) : "-"}
            </p>
          </Surface>
        </div>
        {requirements && requirementKeys.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Surface
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="p-4"
            >
              <Kicker>Requirements progress</Kicker>
              <div className="mt-3 space-y-4">
                {requirementKeys.map((key) => {
                  const progress = getRequirementProgress(
                    key,
                    metrics,
                    requirements,
                  );
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <p className="text-sm font-semibold text-text">
                          {requirementLabel[key]}
                        </p>
                        <p className="text-sm text-muted">
                          {progress.done} / {progress.required}
                        </p>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <p className="text-xs font-semibold text-text">
                        {progress.percent}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </Surface>

            <Surface
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="p-4"
            >
              <Kicker>Eligibility checklist</Kicker>
              <div className="mt-3 divide-y divide-border/60 rounded-xl border border-border/60 bg-panel/40">
                {requirementKeys.map((key) => {
                  const progress = getRequirementProgress(
                    key,
                    metrics,
                    requirements,
                  );
                  const ok =
                    progress.required === 0 ||
                    progress.done >= progress.required;
                  return (
                    <div
                      key={key}
                      className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <p className="text-sm leading-snug font-semibold text-text">
                        {requirementLabel[key]}
                      </p>
                      <span
                        className={
                          ok
                            ? "inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok/15 px-2.5 py-1 text-xs font-semibold text-ok"
                            : "inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/12 px-2.5 py-1 text-xs font-semibold text-danger"
                        }
                      >
                        {ok ? (
                          <Check
                            className="h-3.5 w-3.5 text-ok"
                            aria-hidden="true"
                          />
                        ) : (
                          <X
                            className="h-3.5 w-3.5 text-danger"
                            aria-hidden="true"
                          />
                        )}
                        {ok ? "Done" : "Missing"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Surface>
          </div>
        ) : (
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="p-4 text-sm text-muted"
          >
            You have reached the highest available tier.
          </Surface>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="p-4"
          >
            <p className="text-sm font-semibold text-text">
              Proposals available with {labelForTier(currentTier)}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
              {proposalRightsByTier[currentTier].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Surface>
          {nextTier ? (
            <Surface
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="p-4"
            >
              <p className="text-sm font-semibold text-text">
                Proposals unlocked at {labelForTier(nextTier)}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
                {proposalRightsByTier[nextTier].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Surface>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
