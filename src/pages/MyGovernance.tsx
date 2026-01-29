import { Check, X } from "lucide-react";
import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { AppCard } from "@/components/AppCard";
import { HintLabel } from "@/components/Hint";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { PipelineList } from "@/components/PipelineList";
import { StatGrid, makeChamberStats } from "@/components/StatGrid";
import { Surface } from "@/components/Surface";
import { PageHint } from "@/components/PageHint";
import { Kicker } from "@/components/Kicker";
import { apiChambers, apiCmMe, apiMyGovernance } from "@/lib/apiClient";
import type {
  ChamberDto,
  CmSummaryDto,
  GetMyGovernanceResponse,
} from "@/types/api";
import { cn } from "@/lib/utils";

type GoverningStatus =
  | "Ahead"
  | "Stable"
  | "Falling behind"
  | "At risk"
  | "Losing status";

type TierProgress = NonNullable<GetMyGovernanceResponse["tier"]>;

type TierKey = "Nominee" | "Ecclesiast" | "Legate" | "Consul" | "Citizen";

const proposalRightsByTier: Record<TierKey, string[]> = {
  Nominee: ["Basic proposals"],
  Ecclesiast: ["Basic proposals", "Fee distribution", "Monetary system"],
  Legate: [
    "Basic proposals",
    "Fee distribution",
    "Monetary system",
    "Core infrastructure",
  ],
  Consul: [
    "Basic proposals",
    "Fee distribution",
    "Monetary system",
    "Core infrastructure",
    "Administrative",
  ],
  Citizen: [
    "Basic proposals",
    "Fee distribution",
    "Monetary system",
    "Core infrastructure",
    "Administrative",
    "DAO core",
  ],
};

const labelForTier = (tier: TierKey): string => {
  return tier;
};

const requirementLabel: Record<
  | "governorEras"
  | "activeEras"
  | "acceptedProposals"
  | "formationParticipation",
  string
> = {
  governorEras: "Run a node as a governor (eras)",
  activeEras: "Active-governor eras",
  acceptedProposals: "Accepted proposals",
  formationParticipation: "Formation participation",
};

const getRequirementProgress = (
  key: keyof typeof requirementLabel,
  metrics: TierProgress["metrics"],
  requirements: TierProgress["requirements"],
): { done: number; required: number; percent: number } => {
  const required = Number(requirements?.[key] ?? 0);
  const done = Number(metrics[key] ?? 0);
  if (required <= 0) return { done, required, percent: 100 };
  return {
    done,
    required,
    percent: Math.min(100, Math.round((done / required) * 100)),
  };
};

const governingStatusForProgress = (
  completed: number,
  required: number,
): { label: GoverningStatus; termId: string } => {
  if (required <= 0) {
    return { label: "Stable", termId: "governing_status_stable" };
  }

  if (completed >= required + 2) {
    return { label: "Ahead", termId: "governing_status_ahead" };
  }

  if (completed >= required) {
    return { label: "Stable", termId: "governing_status_stable" };
  }

  const ratio = completed / required;
  if (ratio >= 0.75) {
    return {
      label: "Falling behind",
      termId: "governing_status_falling_behind",
    };
  }
  if (ratio >= 0.55) {
    return { label: "At risk", termId: "governing_status_at_risk" };
  }
  return {
    label: "Losing status",
    termId: "governing_status_losing_status",
  };
};

const governingStatusTermId = (label: GoverningStatus): string => {
  if (label === "Ahead") return "governing_status_ahead";
  if (label === "Stable") return "governing_status_stable";
  if (label === "Falling behind") return "governing_status_falling_behind";
  if (label === "At risk") return "governing_status_at_risk";
  return "governing_status_losing_status";
};

const MyGovernance: React.FC = () => {
  const [gov, setGov] = useState<GetMyGovernanceResponse | null>(null);
  const [chambers, setChambers] = useState<ChamberDto[] | null>(null);
  const [cmSummary, setCmSummary] = useState<CmSummaryDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [govRes, chambersRes] = await Promise.all([
          apiMyGovernance(),
          apiChambers(),
        ]);
        const cmRes = await apiCmMe().catch(() => null);
        if (!active) return;
        setGov(govRes);
        setChambers(chambersRes.items);
        setCmSummary(cmRes);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setGov(null);
        setChambers(null);
        setCmSummary(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const eraActivity = gov?.eraActivity;
  const status: { label: GoverningStatus; termId: string } = gov?.rollup
    ? {
        label: gov.rollup.status,
        termId: governingStatusTermId(gov.rollup.status),
      }
    : governingStatusForProgress(
        eraActivity?.completed ?? 0,
        eraActivity?.required ?? 0,
      );

  const myChambers = useMemo(() => {
    if (!gov || !chambers) return [];
    return chambers.filter((chamber) => gov.myChamberIds.includes(chamber.id));
  }, [gov, chambers]);

  const tierProgress = gov?.tier ?? null;
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
    <div className="flex flex-col gap-6">
      <PageHint pageId="my-governance" />
      {gov === null || chambers === null ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className={cn(
            "px-5 py-4 text-sm text-muted",
            loadError ? "text-destructive" : undefined,
          )}
        >
          {loadError ? `My governance unavailable: ${loadError}` : "Loading…"}
        </Surface>
      ) : null}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>
            <HintLabel termId="governing_threshold">
              Governing threshold
            </HintLabel>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Era", value: eraActivity?.era ?? "—" },
              { label: "Time left", value: eraActivity?.timeLeft ?? "—" },
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
                    Required actions
                  </HintLabel>
                ),
                value: eraActivity
                  ? `${eraActivity.completed} / ${eraActivity.required} completed`
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
                  {act.label}
                </Kicker>
                <p className="text-base font-semibold text-text">
                  {act.done} / {act.required}
                </p>
              </Surface>
            ))}
          </div>
        </CardContent>
      </Card>

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
                {nextTier ? labelForTier(nextTier) : "—"}
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
                        <div className="flex items-center justify-between gap-3">
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
                        className="flex items-center justify-between gap-4 px-3 py-3"
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>My chambers</CardTitle>
        </CardHeader>
        <CardContent>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {myChambers.map((chamber) => (
              <AppCard
                key={chamber.id}
                title={
                  <span className="text-xl font-bold">{chamber.name}</span>
                }
                badge={
                  <Badge
                    size="md"
                    className="border-none bg-(--primary-dim) px-4 py-1 text-center text-sm font-bold tracking-wide whitespace-nowrap text-primary uppercase"
                  >
                    M × {chamber.multiplier}
                  </Badge>
                }
                footer={
                  <div className="flex w-full justify-center">
                    <Button
                      asChild
                      size="md"
                      variant="primary"
                      className="w-56"
                    >
                      <Link to={`/app/chambers/${chamber.id}`}>Enter</Link>
                    </Button>
                  </div>
                }
              >
                <StatGrid items={makeChamberStats(chamber.stats)} />
                <PipelineList pipeline={chamber.pipeline} />
              </AppCard>
            ))}
          </section>
        </CardContent>
      </Card>

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
                      <div className="flex items-center justify-between">
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
    </div>
  );
};

export default MyGovernance;
