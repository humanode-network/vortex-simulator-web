import { HintLabel } from "@/components/Hint";
import { StageDataTile } from "@/components/StageDataTile";
import { Surface } from "@/components/Surface";
import type {
  ProposalChamberSnapshotProps,
  ProposalPoolSnapshotProps,
} from "./ProposalListStagePanelTypes";

export function ProposalPoolSnapshot({
  downvotes,
  upvotes,
  stats,
}: ProposalPoolSnapshotProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-text">Quorum of attention</p>

      <Surface
        variant="panelAlt"
        radius="2xl"
        shadow="tile"
        className="flex flex-wrap items-center justify-center gap-4 px-6 py-5 text-lg font-semibold"
      >
        <span className="text-accent">{upvotes} upvotes</span>
        <span className="text-muted">·</span>
        <span className="text-destructive">{downvotes} downvotes</span>
        <span className="text-muted">·</span>
        <span className="text-text">
          {stats.engaged} / {stats.activeGovernors} engaged
        </span>
      </Surface>

      <div className="grid gap-3 md:grid-cols-2">
        <StageDataTile
          title={
            <HintLabel
              termId="quorum_of_attention"
              termText="Attention quorum"
            />
          }
          description={`Engaged ${stats.engaged} / ${stats.engagedNeeded} governors`}
          value={`${stats.attentionPercent}% / ${stats.attentionNeededPercent}%`}
          tone={stats.meetsAttention ? "ok" : "warn"}
        />
        <StageDataTile
          title={<HintLabel termId="upvote_floor" termText="Upvote floor" />}
          description={`Upvotes ${upvotes} / ${stats.upvoteFloor} governors`}
          value={`${stats.upvoteFloorProgressPercent}% / ${stats.upvoteFloorFractionPercent}%`}
          tone={stats.meetsUpvoteFloor ? "ok" : "warn"}
        />
      </div>

      <p className="text-xs text-muted">
        To move to chamber vote, the pool must meet both the attention quorum
        and the upvote floor.
      </p>
    </div>
  );
}

export function ProposalChamberSnapshot({
  formationEligible,
  passingRule,
  stats,
  timeLeft,
}: ProposalChamberSnapshotProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-text">Vote snapshot</p>

      <Surface
        variant="panelAlt"
        radius="2xl"
        shadow="tile"
        className="space-y-3 px-5 py-4"
      >
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div className="flex h-full w-full">
            <div
              className="h-full bg-accent"
              style={{ width: `${stats.yesWidth}%` }}
            />
            <div
              className="h-full bg-destructive"
              style={{ width: `${stats.noWidth}%` }}
            />
            <div
              className="h-full bg-muted"
              style={{ width: `${stats.abstainWidth}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Yes {stats.yesTotal}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              No {stats.noTotal}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-muted" />
              Abstain {stats.abstainTotal}
            </span>
          </div>
          <span>
            Total {stats.totalVotes} · Time left {timeLeft}
          </span>
        </div>
      </Surface>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StageDataTile
          title="Voting quorum"
          description={`Governors ${stats.engaged} / ${stats.activeGovernors} (needs ${stats.quorumNeeded})`}
          value={`${stats.quorumPercent}% / ${stats.quorumNeededPercent}%`}
          tone={stats.meetsQuorum ? "ok" : "warn"}
        />
        <StageDataTile
          title="Passing"
          description={passingRule}
          value={`${stats.yesPercentOfQuorum}% yes`}
          tone={stats.meetsPassing ? "ok" : "warn"}
        />
        <StageDataTile
          title="Time left"
          description="Voting window"
          value={timeLeft}
        />
      </div>

      <p className="text-xs text-muted">
        {formationEligible
          ? "If this passes, it moves to Formation for execution."
          : "If this passes, it stays a non-formation governance decision."}
      </p>
    </div>
  );
}
