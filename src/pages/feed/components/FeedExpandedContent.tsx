import { Button } from "@/components/primitives/button";
import { CardActionsRow } from "@/components/CardActionsRow";
import { DashedStatItem } from "@/components/DashedStatItem";
import { StageDataTile } from "@/components/StageDataTile";
import { Surface } from "@/components/Surface";
import { formatDateTime } from "@/lib/dateTime";
import { hasFinishedRoute, normalizeAppHref } from "@/lib/feedUi";
import type {
  ChamberProposalPageDto,
  ChamberVetoProposalPageDto,
  CitizenVetoProposalPageDto,
  FeedItemDto,
  FeedStatDto,
  FormationProposalPageDto,
  PoolProposalPageDto,
  ProposalFinishedPageDto,
} from "@/types/api";
import type {
  getFeedChamberStats,
  getFeedFormationStats,
  getFeedPoolStats,
} from "@/lib/feedStageStats";

type FeedExpandedContentProps = {
  chamberPage: ChamberProposalPageDto | null | undefined;
  chamberStats: ReturnType<typeof getFeedChamberStats> | null;
  chamberVetoPage: ChamberVetoProposalPageDto | null | undefined;
  citizenVetoPage: CitizenVetoProposalPageDto | null | undefined;
  finishedPage: ProposalFinishedPageDto | null;
  formationPage: FormationProposalPageDto | null | undefined;
  formationStats: ReturnType<typeof getFeedFormationStats> | null;
  inviteActionBusy: boolean;
  item: FeedItemDto;
  keyStats: FeedStatDto[];
  onInviteAccept: () => void;
  onInviteDecline: () => void;
  poolPage: PoolProposalPageDto | null | undefined;
  poolStats: ReturnType<typeof getFeedPoolStats> | null;
};

export const FeedExpandedContent: React.FC<FeedExpandedContentProps> = ({
  chamberPage,
  chamberStats,
  chamberVetoPage,
  citizenVetoPage,
  finishedPage,
  formationPage,
  formationStats,
  inviteActionBusy,
  item,
  keyStats,
  onInviteAccept,
  onInviteDecline,
  poolPage,
  poolStats,
}) => {
  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-text">Summary</p>
        <p className="text-sm text-muted">{item.summary}</p>
      </div>

      {finishedPage ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-text">Outcome status</p>

          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="px-5 py-4 text-sm text-muted"
          >
            {finishedPage.terminalSummary}
          </Surface>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {finishedPage.stageData.map((entry, idx) => (
              <StageDataTile
                key={`${item.id}-finished-${idx}`}
                title={entry.title}
                description={entry.description}
                value={entry.value}
              />
            ))}
          </div>
        </div>
      ) : hasFinishedRoute(item.href) ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          Loading outcome details...
        </Surface>
      ) : item.stage === "pool" && poolPage && poolStats ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-text">Quorum of attention</p>

          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="flex flex-wrap items-center justify-center gap-4 px-6 py-5 text-lg font-semibold"
          >
            <span className="text-accent">{poolPage.upvotes} upvotes</span>
            <span className="text-muted">·</span>
            <span className="text-destructive">
              {poolPage.downvotes} downvotes
            </span>
            <span className="text-muted">·</span>
            <span className="text-text">
              {poolStats.engaged} / {poolStats.activeGovernors} engaged
            </span>
          </Surface>

          <div className="grid gap-3 sm:grid-cols-2">
            <StageDataTile
              title="Attention quorum"
              description={`Engaged ${poolStats.engaged} / ${poolStats.engagedNeeded} governors`}
              value={`${poolStats.attentionPercent}% / ${poolStats.attentionNeededPercent}%`}
              tone={poolStats.meetsAttention ? "ok" : "warn"}
            />
            <StageDataTile
              title="Upvote floor"
              description={`Upvotes ${poolPage.upvotes} / ${poolStats.upvoteFloor} governors`}
              value={`${poolStats.upvoteFloorProgressPercent}% / ${poolStats.upvoteFloorFractionPercent}%`}
              tone={poolStats.meetsUpvoteFloor ? "ok" : "warn"}
            />
          </div>
        </div>
      ) : item.stage === "vote" && chamberPage && chamberStats ? (
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
                  style={{ width: `${chamberStats.yesWidth}%` }}
                />
                <div
                  className="h-full bg-destructive"
                  style={{ width: `${chamberStats.noWidth}%` }}
                />
                <div
                  className="h-full bg-muted"
                  style={{ width: `${chamberStats.abstainWidth}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-accent" />
                  Yes {chamberStats.yesTotal}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  No {chamberStats.noTotal}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-muted" />
                  Abstain {chamberStats.abstainTotal}
                </span>
              </div>
              <span>
                Total {chamberStats.totalVotes} · Time left{" "}
                {chamberPage.timeLeft}
              </span>
            </div>
          </Surface>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <StageDataTile
              title="Voting quorum"
              description={`Governors ${chamberStats.engaged} / ${chamberStats.activeGovernors} (needs ${chamberStats.quorumNeeded})`}
              value={`${chamberStats.quorumPercent}% / ${chamberStats.quorumNeededPercent}%`}
              tone={chamberStats.meetsQuorum ? "ok" : "warn"}
            />
            <StageDataTile
              title="Passing"
              description={chamberPage.passingRule}
              value={`${chamberStats.yesPercentOfQuorum}% yes`}
              tone={chamberStats.meetsPassing ? "ok" : "warn"}
            />
            <StageDataTile
              title="Time left"
              description="Voting window"
              value={chamberPage.timeLeft}
            />
          </div>
        </div>
      ) : item.stage === "citizen_veto" && citizenVetoPage ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-text">
            Citizen veto snapshot
          </p>
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="space-y-2 px-5 py-4"
          >
            <p className="text-sm text-text">
              Eligible Citizens: {citizenVetoPage.eligibleCitizens}
            </p>
            <p className="text-xs text-muted">
              Attempts used: {citizenVetoPage.attemptsUsed} · Remaining:{" "}
              {citizenVetoPage.attemptsRemaining}
            </p>
          </Surface>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {citizenVetoPage.stageData.map((entry, idx) => (
              <StageDataTile
                key={`${item.id}-citizen-veto-${idx}`}
                title={entry.title}
                description={entry.description}
                value={entry.value}
                tone={entry.tone}
              />
            ))}
          </div>
        </div>
      ) : item.stage === "chamber_veto" && chamberVetoPage ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-text">
            Chamber veto snapshot
          </p>
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="space-y-2 px-5 py-4"
          >
            <p className="text-sm text-text">
              Vetoing chambers: {chamberVetoPage.vetoingChambers} /{" "}
              {chamberVetoPage.chamberThreshold}
            </p>
            <p className="text-xs text-muted">
              Active chambers: {chamberVetoPage.activeChambers}
            </p>
          </Surface>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {chamberVetoPage.stageData.map((entry, idx) => (
              <StageDataTile
                key={`${item.id}-chamber-veto-${idx}`}
                title={entry.title}
                description={entry.description}
                value={entry.value}
                tone={entry.tone}
              />
            ))}
          </div>
        </div>
      ) : item.stage === "build" && formationPage && formationStats ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-text">Execution snapshot</p>

          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="space-y-3 px-5 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-text">Progress</span>
              <span className="font-semibold text-text">
                {formationPage.progress}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-accent"
                style={{
                  width: `${Math.min(
                    Math.max(formationStats.progressValue, 0),
                    100,
                  )}%`,
                }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
              <span>
                Milestones {formationStats.milestones.a} /{" "}
                {formationStats.milestones.b}
              </span>
              <span>
                Team {formationStats.team.a} / {formationStats.team.b}
              </span>
              <span>Time left {formationPage.timeLeft}</span>
            </div>
          </Surface>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {formationPage.stageData.slice(0, 3).map((entry, idx) => (
              <StageDataTile
                key={`${item.id}-formation-${idx}`}
                title={entry.title}
                description={entry.description}
                value={entry.value}
              />
            ))}
          </div>
        </div>
      ) : item.stage === "courts" ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-text">Courts status</p>

          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="space-y-2 px-5 py-4"
          >
            <p className="text-sm text-text">
              Courts are still quarantined for release hardening.
            </p>
            <p className="text-xs text-muted">
              Court items remain visible in history, but detailed courtroom
              views are intentionally blocked until the courts module is ready
              to ship as a live surface.
            </p>
          </Surface>
        </div>
      ) : item.stage === "thread" ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-text">Thread snapshot</p>

          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="space-y-2 px-5 py-4"
          >
            <p className="text-xs font-semibold text-muted">Context</p>
            <p className="text-sm font-semibold text-text">
              {item.meta.replace(/\s*·\s*Thread\s*$/i, "")}
            </p>
            <p className="mt-1 text-sm text-muted">{item.summary}</p>
          </Surface>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <StageDataTile
              title="Type"
              description="Where it lives"
              value={
                item.href?.includes("/app/chambers/")
                  ? "Chamber thread"
                  : item.href?.includes("/app/factions/")
                    ? "Faction thread"
                    : "Thread"
              }
            />
            <StageDataTile
              title="Activity"
              description="Latest"
              value={
                typeof item.summary === "string" &&
                item.summary.toLowerCase().includes("new replies")
                  ? "New replies"
                  : "Update"
              }
            />
            <StageDataTile
              title="Updated"
              description="Feed timestamp"
              value={formatDateTime(item.timestamp)}
            />
          </div>
        </div>
      ) : item.stageData ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text">Stage data</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {item.stageData.map((entry) => (
              <StageDataTile
                key={entry.title}
                title={entry.title}
                description={entry.description}
                value={entry.value}
                tone={entry.tone}
              />
            ))}
          </div>
        </div>
      ) : null}

      {keyStats.length > 0 &&
      item.stage !== "courts" &&
      item.stage !== "thread" ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text">Key stats</p>
          <ul className="grid gap-2 text-sm text-text sm:grid-cols-2">
            {keyStats.map((stat) => (
              <DashedStatItem
                key={stat.label}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {item.stage === "faction" &&
      item.summaryPill === "Cofounder invitation" &&
      item.actionable ? (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={inviteActionBusy}
            onClick={onInviteAccept}
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={inviteActionBusy}
            onClick={onInviteDecline}
          >
            Decline
          </Button>
        </div>
      ) : null}

      <CardActionsRow
        proposer={item.proposer}
        proposerId={item.proposerId}
        primaryHref={normalizeAppHref(item.href)}
        primaryLabel={item.ctaPrimary}
      />
    </section>
  );
};
