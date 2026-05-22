import type { ReactNode } from "react";

import { StatTile } from "@/components/StatTile";

type ProposalVoteStatsGridProps = {
  abstainPercentOfTotal: number;
  abstainTotal: number;
  engaged: number;
  passingDetail: string;
  passingNeededPercent: number;
  quorumDetail: string;
  quorumLabel: ReactNode;
  quorumNeededLabel: string;
  quorumPercent: number;
  timeLabel: string;
  timeLeft: string;
  yesPercentOfQuorum: number;
  yesPercentOfTotal: number;
  yesTotal: number;
  noPercentOfTotal: number;
  noTotal: number;
};

export function ProposalVoteStatsGrid({
  abstainPercentOfTotal,
  abstainTotal,
  engaged,
  passingDetail,
  passingNeededPercent,
  quorumDetail,
  quorumLabel,
  quorumNeededLabel,
  quorumPercent,
  timeLabel,
  timeLeft,
  yesPercentOfQuorum,
  yesPercentOfTotal,
  yesTotal,
  noPercentOfTotal,
  noTotal,
}: ProposalVoteStatsGridProps) {
  return (
    <div className="grid gap-3 text-sm text-text sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label={quorumLabel}
        value={
          <>
            <span>
              {quorumPercent}% / {quorumNeededLabel}
            </span>
            <span className="text-xs font-semibold text-muted">
              {engaged} / {quorumDetail}
            </span>
          </>
        }
        variant="panel"
        className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
        valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
      />
      <StatTile
        label="Vote split (%)"
        value={
          <>
            <span>
              <span className="text-accent">{yesPercentOfTotal}%</span> /{" "}
              <span className="text-destructive">{noPercentOfTotal}%</span> /{" "}
              <span className="text-muted">{abstainPercentOfTotal}%</span>
            </span>
            <span className="text-xs font-semibold text-muted">
              {yesTotal} / {noTotal} / {abstainTotal}
            </span>
          </>
        }
        variant="panel"
        className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
        valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
      />
      <StatTile
        label={timeLabel}
        value={timeLeft}
        variant="panel"
        className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
        valueClassName="text-2xl font-semibold"
      />
      <StatTile
        label="Passing (%)"
        value={
          <>
            <span>
              {yesPercentOfQuorum}% / {passingNeededPercent}%
            </span>
            <span className="text-xs font-semibold text-muted">
              {passingDetail}
            </span>
          </>
        }
        variant="panel"
        className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
        valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
      />
    </div>
  );
}
