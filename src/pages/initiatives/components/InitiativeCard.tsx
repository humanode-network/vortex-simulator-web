import { Link } from "react-router";

import { Chip } from "@/components/Chip";
import { GlassyCard } from "@/components/GlassyCard";
import { GlassyStatusChip } from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import { formatDateTime } from "@/lib/dateTime";
import {
  initiativePath,
  initiativeStatusLabel,
  initiativeStatusTone,
  initiativeSummaryPreview,
} from "@/lib/initiativeUi";
import { shortAddress } from "@/lib/profileUi";
import type { InitiativeDto } from "@/types/api";

type InitiativeCardProps = {
  initiative: InitiativeDto;
};

export function InitiativeCard({ initiative }: InitiativeCardProps) {
  const boardCount =
    initiative.boardCardCount ?? initiative.boardCards?.length ?? 0;
  const threadCount = initiative.threadCount ?? initiative.threads?.length ?? 0;
  const proposalCount =
    initiative.proposalCount ?? initiative.proposals?.length ?? 0;

  return (
    <GlassyCard as="article" className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h2 className="text-lg leading-tight font-semibold text-text">
            {initiative.title}
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            {initiativeSummaryPreview(initiative.summary)}
          </p>
        </div>
        <GlassyStatusChip tone={initiativeStatusTone(initiative.status)}>
          {initiativeStatusLabel[initiative.status]}
        </GlassyStatusChip>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <GlassyStatusChip
          tone={initiative.visibility === "public" ? "ok" : "neutral"}
        >
          {initiative.visibility === "public" ? "Public" : "Private"}
        </GlassyStatusChip>
        {initiative.tags.slice(0, 4).map((tag) => (
          <Chip key={tag} className="stage-chip stage-chip--system">
            {tag}
          </Chip>
        ))}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Metric label="Members" value={initiative.memberCount} />
        <Metric label="Board" value={boardCount} />
        <Metric label="Threads" value={threadCount} />
        <Metric label="Proposals" value={proposalCount} />
      </dl>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--surface-glass-border)] pt-4 text-xs text-muted">
        <span>Created by {shortAddress(initiative.createdByAddress)}</span>
        <span>Updated {formatDateTime(initiative.updatedAt)}</span>
      </div>

      <Button asChild size="sm" className="mt-4 w-full">
        <Link to={initiativePath(initiative)}>Open initiative</Link>
      </Button>
    </GlassyCard>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-[color:var(--surface-glass-border)] bg-[color:var(--surface-glass-bg)] px-3 py-2 text-center">
      <dt className="text-[0.68rem] leading-none font-semibold tracking-wide text-muted uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-base leading-none font-semibold text-text">
        {value}
      </dd>
    </div>
  );
}
