import { useEffect, useMemo, useState } from "react";

import {
  GlassyCompactGrid,
  GlassyCompactMetric,
  GlassyCompactRow,
  GlassyKeyValue,
  GlassyMetricTile,
  GlassySection,
  GlassyStatusChip,
  GlassyTile,
} from "@/components/GlassySection";
import { HintLabel } from "@/components/Hint";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHint } from "@/components/PageHint";
import { apiFactions, apiInvision } from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import type {
  FactionDto,
  GetInvisionResponse,
  InvisionDecentralizationDto,
  InvisionStabilityDto,
  InvisionStabilityComponentDto,
} from "@/types/api";

type EngineDto = InvisionDecentralizationDto | InvisionStabilityDto;
type StatusTone = "danger" | "neutral" | "ok" | "primary" | "warn";

function toneForScore(tone: InvisionStabilityComponentDto["tone"]) {
  if (tone === "critical") return "danger";
  if (tone === "watch") return "primary";
  return "ok";
}

function toneForHealthScore(score: number): StatusTone {
  if (score >= 67) return "ok";
  if (score >= 34) return "warn";
  return "danger";
}

function toneForMetricValue(value: string): StatusTone {
  const percentValue = Number(value.replace("%", "").trim());
  if (!Number.isFinite(percentValue)) return "neutral";
  return toneForHealthScore(percentValue);
}

function toneForRiskStatus(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "critical") return "danger";
  if (normalized === "ok" || normalized === "healthy") return "ok";
  return "primary";
}

function toneForSystemState(
  tone?: GetInvisionResponse["governanceState"]["tone"],
) {
  if (tone === "critical") return "danger";
  if (tone === "strong" || tone === "stable") return "ok";
  if (tone === "watch") return "warn";
  return "neutral";
}

function EngineSection({
  engine,
  title,
}: {
  engine: EngineDto;
  title: string;
}) {
  return (
    <GlassySection className="h-full" title={title}>
      <GlassyCompactGrid className="lg:grid-cols-4">
        <GlassyCompactMetric
          label="Score"
          value={
            <GlassyStatusChip tone={toneForHealthScore(engine.score)}>
              {engine.score}%
            </GlassyStatusChip>
          }
        />
        <GlassyCompactMetric
          label="Band"
          value={
            <GlassyStatusChip tone={toneForHealthScore(engine.score)}>
              {engine.band}
            </GlassyStatusChip>
          }
        />
        <GlassyCompactMetric
          label="Evidence coverage"
          value={
            <GlassyStatusChip tone="neutral">
              {engine.confidence}% · {engine.confidenceBand}
            </GlassyStatusChip>
          }
        />
        <GlassyCompactMetric label="Timeframe" value={engine.windowLabel} />
      </GlassyCompactGrid>

      <GlassyCompactGrid className="lg:grid-cols-2">
        {engine.components.map((component) => (
          <GlassyCompactRow
            key={component.label}
            title={component.label}
            actions={
              <GlassyStatusChip tone={toneForScore(component.tone)}>
                {component.score}%
              </GlassyStatusChip>
            }
          >
            <p className="m-0 text-xs text-muted">{component.detail}</p>
          </GlassyCompactRow>
        ))}
      </GlassyCompactGrid>
    </GlassySection>
  );
}

function FactionCard({ faction }: { faction: FactionDto }) {
  return (
    <GlassyCompactRow
      title={faction.name}
      actions={
        <GlassyStatusChip tone="neutral">
          {faction.members} members
        </GlassyStatusChip>
      }
    >
      <p className="m-0 text-xs text-muted">{faction.description}</p>
      <div className="grid grid-cols-2 gap-2">
        <GlassyKeyValue
          className="glassy-key-value--stacked glassy-key-value--metric"
          label="Members"
          value={faction.members}
        />
        <GlassyKeyValue
          className="glassy-key-value--stacked glassy-key-value--metric"
          label={<HintLabel termId="acm" prefix="Members'" termText="ACM" />}
          value={faction.acm}
        />
      </div>
    </GlassyCompactRow>
  );
}

const Invision: React.FC = () => {
  const [invision, setInvision] = useState<GetInvisionResponse | null>(null);
  const [factions, setFactions] = useState<FactionDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [invRes, factionsRes] = await Promise.all([
          apiInvision(),
          apiFactions(),
        ]);
        if (!active) return;
        setInvision(invRes);
        setFactions(factionsRes.items);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setInvision(null);
        setFactions([]);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filteredFactions = useMemo(() => {
    return [...(factions ?? [])].sort((a, b) => b.members - a.members);
  }, [factions]);

  const hasInvisionContent =
    Boolean(invision?.governanceState.metrics.length) ||
    Boolean(invision?.economicIndicators.length) ||
    Boolean(invision?.riskSignals.length);
  const primaryGovernanceMetrics = (
    invision?.governanceState.metrics ?? []
  ).slice(0, 3);
  const secondaryGovernanceMetrics = (
    invision?.governanceState.metrics ?? []
  ).slice(3);

  return (
    <div className="flex flex-col gap-5">
      <PageHint pageId="invision" />

      {invision === null && !loadError ? (
        <GlassyTile className="px-4 py-6 text-center text-sm text-muted">
          Loading Invision…
        </GlassyTile>
      ) : null}

      {loadError ? (
        <GlassyTile className="px-4 py-6 text-center text-sm text-destructive">
          Invision unavailable: {formatLoadError(loadError)}
        </GlassyTile>
      ) : null}

      {invision !== null &&
      factions !== null &&
      factions.length === 0 &&
      !hasInvisionContent &&
      !loadError ? (
        <NoDataYetBar label="Invision data" />
      ) : null}

      <GlassySection title="System state">
        <GlassyTile className="px-6 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="m-0 text-xs font-semibold text-muted uppercase">
                Governance model
              </p>
              <h1 className="m-0 mt-1 text-2xl font-semibold text-text">
                {invision?.governanceState.label ?? "—"}
              </h1>
              {invision?.governanceState.summary ? (
                <p className="m-0 mt-2 max-w-3xl text-sm text-muted">
                  {invision.governanceState.summary}
                </p>
              ) : null}
            </div>
            <GlassyStatusChip
              tone={toneForSystemState(invision?.governanceState.tone)}
            >
              {invision?.governanceState.tone ?? "unknown"}
            </GlassyStatusChip>
          </div>
          {(invision?.governanceState.drivers ?? []).length > 0 ? (
            <GlassyCompactGrid className="mt-4 lg:grid-cols-3">
              {(invision?.governanceState.drivers ?? []).map((driver) => (
                <GlassyCompactMetric
                  key={driver}
                  label="Driver"
                  value={driver}
                />
              ))}
            </GlassyCompactGrid>
          ) : null}
        </GlassyTile>
        <GlassyCompactGrid className="lg:grid-cols-3">
          {primaryGovernanceMetrics.map((metric) => (
            <GlassyMetricTile
              key={metric.label}
              label={metric.label}
              value={
                <GlassyStatusChip tone={toneForMetricValue(metric.value)}>
                  {metric.value}
                </GlassyStatusChip>
              }
            />
          ))}
        </GlassyCompactGrid>
      </GlassySection>

      {secondaryGovernanceMetrics.length > 0 ? (
        <GlassySection title="Governance signals">
          <GlassyCompactGrid className="lg:grid-cols-3">
            {secondaryGovernanceMetrics.map((metric) => (
              <GlassyCompactMetric
                key={metric.label}
                label={metric.label}
                value={metric.value}
              />
            ))}
          </GlassyCompactGrid>
        </GlassySection>
      ) : null}

      {invision?.decentralization && invision.stability ? (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          <EngineSection
            engine={invision.decentralization}
            title="Decentralization engine"
          />
          <EngineSection engine={invision.stability} title="Stability engine" />
        </div>
      ) : null}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <GlassySection className="h-full" title="Largest factions">
          <GlassyCompactGrid>
            {filteredFactions.map((faction) => (
              <FactionCard key={faction.id} faction={faction} />
            ))}
          </GlassyCompactGrid>
        </GlassySection>

        <GlassySection className="h-full" title="Treasury & economy">
          <GlassyCompactGrid>
            {(invision?.economicIndicators ?? []).map((indicator) => (
              <GlassyCompactRow key={indicator.label} title={indicator.label}>
                <GlassyKeyValue
                  className="glassy-key-value--stacked glassy-key-value--metric"
                  label="Value"
                  value={indicator.value}
                />
                <p className="m-0 text-xs text-muted">{indicator.detail}</p>
              </GlassyCompactRow>
            ))}
          </GlassyCompactGrid>
        </GlassySection>
      </div>

      <GlassySection title="Risk dashboard">
        <GlassyCompactGrid className="lg:grid-cols-3">
          {(invision?.riskSignals ?? []).map((signal) => (
            <GlassyCompactRow
              key={signal.title}
              title={signal.title}
              actions={
                <GlassyStatusChip tone={toneForRiskStatus(signal.status)}>
                  {signal.status}
                </GlassyStatusChip>
              }
            >
              <p className="m-0 text-xs text-muted">{signal.detail}</p>
            </GlassyCompactRow>
          ))}
        </GlassyCompactGrid>
      </GlassySection>
    </div>
  );
};

export default Invision;
