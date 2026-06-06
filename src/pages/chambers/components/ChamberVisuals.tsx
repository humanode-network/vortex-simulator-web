import { Link } from "react-router";

import { HintLabel } from "@/components/Hint";
import {
  GlassyCompactGrid,
  GlassyCompactMetric,
  GlassyKeyValue,
  GlassyStatusChip,
  GlassyTile,
  GlassyTileHeading,
} from "@/components/GlassySection";
import { StageChip } from "@/components/StageChip";
import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";
import type {
  ChamberDto,
  ChamberPipelineDto,
  ChamberStatsDto,
} from "@/types/api";
import type { ProposalStage } from "@/types/stages";

type ChamberStatsTilesProps = {
  className?: string;
  stats: ChamberStatsDto;
};

type ChamberPipelineTilesProps = {
  className?: string;
  pipeline: ChamberPipelineDto;
};

type ChamberStatusChipProps = {
  status: "active" | "dissolved" | string;
};

type ChamberMultiplierChipProps = {
  multiplier: number;
};

type ChamberDirectoryCardProps = {
  chamber: ChamberDto;
};

const pipelineItems: Array<{
  key: keyof ChamberPipelineDto;
  label: string;
  stage: ProposalStage;
}> = [
  { key: "pool", label: "Proposal pool", stage: "pool" },
  { key: "vote", label: "Chamber vote", stage: "vote" },
  { key: "build", label: "Formation", stage: "build" },
];

export function formatChamberMultiplier(multiplier: number): string {
  return `M × ${Number(multiplier.toFixed(2)).toString()}`;
}

export function ChamberMultiplierChip({
  multiplier,
}: ChamberMultiplierChipProps) {
  return (
    <GlassyStatusChip tone="primary">
      {formatChamberMultiplier(multiplier)}
    </GlassyStatusChip>
  );
}

export function ChamberStatusChip({ status }: ChamberStatusChipProps) {
  return (
    <GlassyStatusChip tone={status === "active" ? "ok" : "danger"}>
      {status}
    </GlassyStatusChip>
  );
}

export function ChamberStatsTiles({
  className,
  stats,
}: ChamberStatsTilesProps) {
  return (
    <GlassyCompactGrid className={cn("sm:grid-cols-2", className)}>
      <GlassyCompactMetric label="Governors" value={stats.governors} />
      <GlassyCompactMetric
        label={<HintLabel termId="acm" prefix="Members'" termText="ACM" />}
        value={stats.acm}
      />
      <GlassyCompactMetric
        label={<HintLabel termId="lcm">LCM</HintLabel>}
        value={stats.lcm}
      />
      <GlassyCompactMetric
        label={<HintLabel termId="mcm">MCM</HintLabel>}
        value={stats.mcm}
      />
    </GlassyCompactGrid>
  );
}

export function ChamberPipelineTiles({
  className,
  pipeline,
}: ChamberPipelineTilesProps) {
  return (
    <div className={cn("grid gap-2 sm:grid-cols-3", className)}>
      {pipelineItems.map((item) => (
        <GlassyTile
          key={item.key}
          className="flex min-h-[4.25rem] items-center justify-between gap-3 px-3 py-2"
        >
          <StageChip stage={item.stage} label={item.label} />
          <span className="text-base font-semibold text-text">
            {pipeline[item.key]}
          </span>
        </GlassyTile>
      ))}
    </div>
  );
}

export function ChamberDirectoryCard({ chamber }: ChamberDirectoryCardProps) {
  return (
    <GlassyTile className="flex h-full flex-col gap-4 p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <GlassyTileHeading className="text-[0.98rem]">
            {chamber.name}
          </GlassyTileHeading>
          <p className="mt-1 mb-0 text-xs text-muted">
            Chamber governance surface
          </p>
        </div>
        <ChamberMultiplierChip multiplier={chamber.multiplier} />
      </div>

      <ChamberStatsTiles stats={chamber.stats} />

      <div className="grid gap-2">
        {pipelineItems.map((item) => (
          <GlassyKeyValue
            key={item.key}
            className="glassy-key-value--metric min-h-[2.65rem] flex-row items-center justify-between gap-3"
            label={<StageChip stage={item.stage} label={item.label} />}
            value={chamber.pipeline[item.key]}
          />
        ))}
      </div>

      <div className="mt-auto flex justify-end">
        <Button asChild size="sm">
          <Link to={`/app/chambers/${chamber.id}`}>Enter chamber</Link>
        </Button>
      </div>
    </GlassyTile>
  );
}
