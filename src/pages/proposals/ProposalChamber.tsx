import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { StatTile } from "@/components/StatTile";
import { PageHint } from "@/components/PageHint";
import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import { VoteButton } from "@/components/VoteButton";
import { AddressInline } from "@/components/AddressInline";
import { Input } from "@/components/primitives/input";
import { Button } from "@/components/primitives/button";
import {
  ProposalSummaryCard,
  ProposalTeamMilestonesCard,
  ProposalTimelineCard,
} from "@/components/ProposalSections";
import { Surface } from "@/components/Surface";
import { HintLabel } from "@/components/Hint";
import {
  apiChamberVote,
  apiCitizenVetoVote,
  apiProposalChamberPage,
  apiProposalTimeline,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import { formatDateTime } from "@/lib/dateTime";
import type {
  ChamberProposalPageDto,
  ProposalTimelineItemDto,
} from "@/types/api";
import {
  useProposalStageSync,
  useProposalTransitionNotice,
} from "./useProposalStageSync";
import { useAuth } from "@/app/auth/AuthContext";
import { CitizenVetoActions } from "./CitizenVetoActions";

const ProposalChamber: React.FC = () => {
  const { id } = useParams();
  const [proposal, setProposal] = useState<ChamberProposalPageDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittingVetoKey, setSubmittingVetoKey] = useState<string | null>(
    null,
  );
  const [timeline, setTimeline] = useState<ProposalTimelineItemDto[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [yesScore, setYesScore] = useState(5);
  const auth = useAuth();
  const syncProposalStage = useProposalStageSync(id);
  const transitionNotice = useProposalTransitionNotice();
  const loadPage = useCallback(async () => {
    if (!id) return;
    const page = await apiProposalChamberPage(id);
    setProposal(page);
    setLoadError(null);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [pageResult, timelineResult] = await Promise.allSettled([
          apiProposalChamberPage(id),
          apiProposalTimeline(id),
        ]);
        if (!active) return;
        if (pageResult.status === "fulfilled") {
          setProposal(pageResult.value);
          setLoadError(null);
        } else {
          setProposal(null);
          setLoadError(pageResult.reason?.message ?? "Failed to load proposal");
        }
        if (timelineResult.status === "fulfilled") {
          setTimeline(timelineResult.value.items);
          setTimelineError(null);
        } else {
          setTimeline([]);
          setTimelineError(
            timelineResult.reason?.message ?? "Failed to load timeline",
          );
        }
      } catch (error) {
        if (!active) return;
        setProposal(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (
      proposal?.viewerVote?.choice === "yes" &&
      typeof proposal.viewerVote.score === "number"
    ) {
      setYesScore(proposal.viewerVote.score);
    }
  }, [proposal?.viewerVote?.choice, proposal?.viewerVote?.score]);

  if (!proposal) {
    return (
      <div className="flex flex-col gap-6">
        <PageHint pageId="proposals" />
        {transitionNotice ? (
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="px-5 py-4 text-sm text-muted"
          >
            {transitionNotice}
          </Surface>
        ) : null}
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          {loadError
            ? `Proposal unavailable: ${formatLoadError(loadError, "Failed to load proposal.")}`
            : "Loading proposal…"}
        </Surface>
      </div>
    );
  }

  const yesTotal = proposal.votes.yes;
  const noTotal = proposal.votes.no;
  const abstainTotal = proposal.votes.abstain;
  const totalVotes = yesTotal + noTotal + abstainTotal;
  const engaged = proposal.engagedVoters ?? proposal.engagedGovernors;
  const eligibleVoters = Math.max(
    1,
    proposal.eligibleVoters ?? proposal.activeGovernors,
  );
  const quorumFraction =
    proposal.thresholdContext?.quorumThreshold?.quorumFraction ??
    proposal.attentionQuorum ??
    0.33;
  const quorumNeeded = proposal.quorumNeeded;
  const quorumPercent = Math.round((engaged / eligibleVoters) * 100);
  const quorumNeededPercent = Math.round(quorumFraction * 100);
  const referendumQuorumRuleLabel = "33.3% + 1";
  const yesPercentOfQuorum =
    engaged > 0 ? Math.round((yesTotal / engaged) * 100) : 0;
  const yesPercentOfTotal =
    totalVotes > 0 ? Math.round((yesTotal / totalVotes) * 100) : 0;
  const noPercentOfTotal =
    totalVotes > 0 ? Math.round((noTotal / totalVotes) * 100) : 0;
  const abstainPercentOfTotal =
    totalVotes > 0 ? Math.round((abstainTotal / totalVotes) * 100) : 0;
  const passingNeededPercent = 66.6;
  const milestoneVoteIndex =
    typeof proposal.milestoneIndex === "number" && proposal.milestoneIndex > 0
      ? proposal.milestoneIndex
      : null;
  const referendumVote = proposal.voteKind === "referendum";
  const viewerIsProposer =
    auth.address?.trim().toLowerCase() ===
    proposal.proposerId.trim().toLowerCase();
  const scoreLabel =
    proposal.scoreLabel === "MM" || milestoneVoteIndex !== null
      ? "MM"
      : proposal.scoreLabel === "CM"
        ? "CM"
        : null;
  const chamberTitle = referendumVote
    ? `${proposal.title} — Referendum`
    : milestoneVoteIndex !== null
      ? `${proposal.title} — Milestone vote (M${milestoneVoteIndex})`
      : proposal.title;
  const delegationNote = proposal.delegation?.viewer ? (
    proposal.delegation.viewer.delegateeAddress ? (
      proposal.delegation.viewer.hasDirectVote ? (
        <>
          Direct vote overrides your delegation to{" "}
          <AddressInline
            address={proposal.delegation.viewer.delegateeAddress}
            showCopy={false}
          />
          .
        </>
      ) : (
        <>
          You delegate to{" "}
          <AddressInline
            address={proposal.delegation.viewer.delegateeAddress}
            showCopy={false}
          />
          . Direct vote overrides it here.
        </>
      )
    ) : proposal.delegation.viewer.inboundDelegatedWeight > 0 ? (
      <>Your vote currently carries delegated weight.</>
    ) : null
  ) : proposal.delegation?.source === "snapshot" ? (
    <>Uses a frozen delegation snapshot.</>
  ) : proposal.delegation ? (
    <>Uses current chamber delegations.</>
  ) : null;

  const [filledSlots, totalSlots] = proposal.formationEligible
    ? proposal.teamSlots.split("/").map((v) => Number(v.trim()))
    : [0, 0];
  const openSlots = Math.max(totalSlots - filledSlots, 0);
  const formationSummaryStats = proposal.formationEligible
    ? [
        { label: "Budget ask", value: proposal.budget },
        {
          label: "Formation",
          value: "Yes",
        },
        {
          label: "Team slots",
          value: `${proposal.teamSlots} (open: ${openSlots})`,
        },
        {
          label: "Milestones",
          value: `${proposal.milestones} milestones planned`,
        },
      ]
    : [];
  const viewerVoteLabel = proposal.viewerVote
    ? proposal.viewerVote.choice === "yes"
      ? `Yes${
          typeof proposal.viewerVote.score === "number"
            ? ` (score ${proposal.viewerVote.score})`
            : ""
        }`
      : proposal.viewerVote.choice === "no"
        ? "No"
        : "Abstain"
    : null;
  const ordinaryVoteClosed = proposal.ordinaryVoteClosed;
  const stageLinks = id
    ? {
        vote: `/app/proposals/${id}/chamber`,
        citizen_veto: `/app/proposals/${id}/citizen-veto`,
        chamber_veto: `/app/proposals/${id}/chamber-veto`,
      }
    : undefined;
  const vetoWindowOpen = proposal.timeLeft !== "Ended";

  const handleVote = async (
    choice: "yes" | "no" | "abstain",
    score?: number,
  ) => {
    if (!id || submitting || ordinaryVoteClosed || viewerIsProposer) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiChamberVote({
        proposalId: id,
        choice,
        score: choice === "yes" && proposal?.scoreEnabled ? score : undefined,
      });
      const redirected = await syncProposalStage();
      if (redirected) return;
      await loadPage();
    } catch (error) {
      setSubmitError((error as Error).message);
    } finally {
      setSubmitting(false);
      void syncProposalStage();
    }
  };

  const handleCitizenVetoVote = async (choice: "veto" | "keep") => {
    if (
      !id ||
      submittingVetoKey ||
      viewerIsProposer ||
      !proposal.citizenVeto.viewer.eligible
    ) {
      return;
    }
    setSubmittingVetoKey(`citizen:${choice}`);
    setSubmitError(null);
    try {
      await apiCitizenVetoVote({ proposalId: id, choice });
      const redirected = await syncProposalStage();
      if (redirected) return;
      await loadPage();
    } catch (error) {
      setSubmitError((error as Error).message);
    } finally {
      setSubmittingVetoKey(null);
      void syncProposalStage();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      {transitionNotice ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          {transitionNotice}
        </Surface>
      ) : null}
      <ProposalPageHeader
        title={chamberTitle}
        stage="vote"
        showFormationStage={proposal.formationEligible}
        chamber={proposal.chamber}
        proposer={proposal.proposer}
        stageLinks={stageLinks}
      >
        {milestoneVoteIndex !== null ? (
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="mx-auto px-4 py-2 text-xs font-semibold text-muted"
          >
            Milestone vote: M{milestoneVoteIndex}
          </Surface>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <VoteButton
            tone="accent"
            label="Vote yes"
            disabled={submitting || ordinaryVoteClosed || viewerIsProposer}
            title={
              viewerIsProposer
                ? "You cannot vote on your own proposal."
                : ordinaryVoteClosed
                  ? "Ordinary chamber voting is closed. Only veto actions remain in this window."
                  : undefined
            }
            onClick={() => handleVote("yes", yesScore)}
          />
          {proposal.scoreEnabled && scoreLabel ? (
            <div className="flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-2 text-sm text-text">
              <span className="text-xs font-semibold text-muted uppercase">
                {scoreLabel} score
              </span>
              <Input
                type="number"
                min={0}
                max={10}
                step={1}
                value={yesScore}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isFinite(next)) {
                    setYesScore(Math.min(Math.max(Math.round(next), 0), 10));
                  }
                }}
                className="h-8 w-16"
              />
            </div>
          ) : null}
          <VoteButton
            tone="destructive"
            label="Vote no"
            disabled={submitting || ordinaryVoteClosed || viewerIsProposer}
            title={
              viewerIsProposer
                ? "You cannot vote on your own proposal."
                : ordinaryVoteClosed
                  ? "Ordinary chamber voting is closed. Only veto actions remain in this window."
                  : undefined
            }
            onClick={() => handleVote("no")}
          />
          <VoteButton
            tone="neutral"
            label="Abstain"
            disabled={submitting || ordinaryVoteClosed || viewerIsProposer}
            title={
              viewerIsProposer
                ? "You cannot vote on your own proposal."
                : ordinaryVoteClosed
                  ? "Ordinary chamber voting is closed. Only veto actions remain in this window."
                  : undefined
            }
            onClick={() => handleVote("abstain")}
          />
        </div>
        <CitizenVetoActions
          citizenVeto={proposal.citizenVeto}
          viewerIsProposer={viewerIsProposer}
          windowOpen={vetoWindowOpen}
          submittingKey={submittingVetoKey}
          onVote={() => handleCitizenVetoVote("veto")}
        />
        {id ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="sm" variant="outline">
              <Link to={`/app/proposals/${id}/citizen-veto`}>
                Open Citizen Veto
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={`/app/proposals/${id}/chamber-veto`}>
                Open Chamber Veto
              </Link>
            </Button>
          </div>
        ) : null}
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          {ordinaryVoteClosed
            ? "The ordinary vote passed. Use the veto pages above during the 24h veto window. If a veto succeeds, the proposal returns to the proposer for reconsideration."
            : "Use the Citizen Veto page for Citizen votes and the Chamber Veto page for chamber-by-chamber veto activity before the chamber vote closes."}
        </Surface>
        {submitError ? (
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="px-5 py-4 text-sm text-destructive"
          >
            {formatLoadError(submitError)}
          </Surface>
        ) : null}
        {proposal.viewerVote && !viewerIsProposer ? (
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="px-5 py-4 text-sm text-muted"
          >
            Your current vote:{" "}
            <span className="font-semibold text-text">{viewerVoteLabel}</span>
            <span className="block text-xs text-muted">
              Recorded {formatDateTime(proposal.viewerVote.updatedAt)}
            </span>
          </Surface>
        ) : null}
      </ProposalPageHeader>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text">Voting quorum</h2>
        <div className="grid gap-3 text-sm text-text sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={
              referendumVote ? (
                "Referendum quorum (%)"
              ) : (
                <HintLabel
                  termId="quorum_of_vote"
                  termText="Voting quorum"
                  suffix=" (%)"
                />
              )
            }
            value={
              <>
                <span>
                  {quorumPercent}% /{" "}
                  {referendumVote
                    ? referendumQuorumRuleLabel
                    : `${quorumNeededPercent}%`}
                </span>
                <span className="text-xs font-semibold text-muted">
                  {engaged} / {quorumNeeded} {proposal.voterLabel.toLowerCase()}
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
                  <span className="text-destructive">{noPercentOfTotal}%</span>{" "}
                  / <span className="text-muted">{abstainPercentOfTotal}%</span>
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
            label={proposal.timeContextLabel}
            value={proposal.timeLeft}
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
                  {referendumVote
                    ? `${Math.ceil(engaged * 0.666)} yes votes needed at current participation`
                    : "Yes within quorum"}
                </span>
              </>
            }
            variant="panel"
            className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
            valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
          />
        </div>
      </section>

      {proposal.delegation ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-text">
            Delegation context
          </h2>
          <div className="grid gap-3 text-sm text-text sm:grid-cols-2 lg:grid-cols-3">
            <StatTile
              label="Vote weight source"
              value={
                <>
                  <span>
                    {proposal.delegation.source === "snapshot"
                      ? "Snapshot-backed"
                      : "Live delegation"}
                  </span>
                  <span className="text-xs font-semibold text-muted">
                    {proposal.delegation.snapshotCapturedAt
                      ? formatDateTime(proposal.delegation.snapshotCapturedAt)
                      : "No captured timestamp"}
                  </span>
                </>
              }
              variant="panel"
              className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
              valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
            />
            <StatTile
              label="Delegation links"
              value={
                <>
                  <span>{proposal.delegation.activeDelegations}</span>
                  <span className="text-xs font-semibold text-muted">
                    {proposal.delegation.activeDelegatees} active delegatees
                  </span>
                </>
              }
              variant="panel"
              className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
              valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
            />
            <StatTile
              label="Your effective weight"
              value={
                proposal.delegation.viewer ? (
                  <>
                    <span>
                      {proposal.delegation.viewer.effectiveVotingWeight}
                    </span>
                    <span className="text-xs font-semibold text-muted">
                      1 base +{" "}
                      {proposal.delegation.viewer.inboundDelegatedWeight}{" "}
                      delegated
                    </span>
                  </>
                ) : (
                  <>
                    <span>—</span>
                    <span className="text-xs font-semibold text-muted">
                      Sign in to inspect your vote power
                    </span>
                  </>
                )
              }
              variant="panel"
              className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
              valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
            />
          </div>
          {delegationNote ? (
            <Surface
              variant="panelAlt"
              radius="2xl"
              shadow="tile"
              className="px-5 py-4 text-sm text-muted"
            >
              {delegationNote}
            </Surface>
          ) : null}
        </section>
      ) : null}

      <ProposalSummaryCard
        summary={proposal.summary}
        stats={formationSummaryStats}
        overview={proposal.overview}
        executionPlan={proposal.executionPlan}
        budgetScope={proposal.budgetScope}
        attachments={proposal.attachments}
        showExecutionPlan={proposal.formationEligible}
        showBudgetScope={proposal.formationEligible}
      />

      {proposal.formationEligible ? (
        <ProposalTeamMilestonesCard
          teamLocked={proposal.teamLocked}
          openSlots={proposal.openSlotNeeds}
          milestonesDetail={proposal.milestonesDetail}
        />
      ) : null}

      {timelineError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          Timeline unavailable: {formatLoadError(timelineError)}
        </Surface>
      ) : (
        <ProposalTimelineCard items={timeline} proposalId={id} />
      )}
    </div>
  );
};

export default ProposalChamber;
