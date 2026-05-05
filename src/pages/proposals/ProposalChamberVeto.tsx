import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";

import { PageHint } from "@/components/PageHint";
import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import {
  ProposalSummaryCard,
  ProposalTimelineCard,
} from "@/components/ProposalSections";
import { StatTile } from "@/components/StatTile";
import { Surface } from "@/components/Surface";
import { VoteButton } from "@/components/VoteButton";
import {
  apiChamberVetoVote,
  apiProposalChamberVetoPage,
  apiProposalTimeline,
} from "@/lib/apiClient";
import { addressesReferToSameIdentity } from "@/lib/addressIdentity";
import { formatDateTime } from "@/lib/dateTime";
import { formatLoadError } from "@/lib/errorFormatting";
import type {
  ChamberVetoProposalPageDto,
  ProposalTimelineItemDto,
} from "@/types/api";
import {
  useProposalStageSync,
  useProposalTransitionNotice,
} from "./useProposalStageSync";
import { useAuth } from "@/app/auth/AuthContext";
import { ProposalDeliberation } from "./ProposalDeliberation";

const ProposalChamberVeto: React.FC = () => {
  const { id } = useParams();
  const [proposal, setProposal] = useState<ChamberVetoProposalPageDto | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const auth = useAuth();
  const [timeline, setTimeline] = useState<ProposalTimelineItemDto[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const syncProposalStage = useProposalStageSync(id);
  const transitionNotice = useProposalTransitionNotice();

  const loadPage = useCallback(async () => {
    if (!id) return;
    const page = await apiProposalChamberVetoPage(id);
    setProposal(page);
    setLoadError(null);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [pageResult, timelineResult] = await Promise.allSettled([
          apiProposalChamberVetoPage(id),
          apiProposalTimeline(id),
        ]);
        if (!active) return;
        if (pageResult.status === "fulfilled") {
          setProposal(pageResult.value);
          setLoadError(null);
        } else {
          setProposal(null);
          setLoadError(
            pageResult.reason?.message ?? "Failed to load chamber veto",
          );
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
            ? `Chamber veto unavailable: ${formatLoadError(loadError, "Failed to load chamber veto.")}`
            : "Loading chamber veto…"}
        </Surface>
      </div>
    );
  }

  const viewerIsProposer = addressesReferToSameIdentity(
    auth.address,
    proposal.proposerId,
  );
  const stageLinks = id
    ? {
        vote: proposal.voteRoute,
        citizen_veto: `/app/proposals/${id}/citizen-veto`,
        chamber_veto: `/app/proposals/${id}/chamber-veto`,
      }
    : undefined;
  const vetoWindowOpen = proposal.timeLeft !== "Ended";
  const chamberVetoVoteCount = proposal.chambers.reduce(
    (sum, chamber) =>
      sum + chamber.votes.veto + chamber.votes.keep + chamber.votes.abstain,
    0,
  );

  const handleVote = async (
    chamberId: string,
    choice: "veto" | "keep" | "abstain",
  ) => {
    if (!id || submittingKey || !vetoWindowOpen || viewerIsProposer) return;
    setSubmittingKey(`${chamberId}:${choice}`);
    setSubmitError(null);
    try {
      await apiChamberVetoVote({
        proposalId: id,
        chamberId,
        choice,
      });
      const redirected = await syncProposalStage();
      if (redirected) return;
      await loadPage();
    } catch (error) {
      setSubmitError((error as Error).message);
    } finally {
      setSubmittingKey(null);
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
        title={`${proposal.title} — Chamber veto`}
        stage="chamber_veto"
        showFormationStage={proposal.formationEligible}
        chamber={proposal.chamber}
        proposer={proposal.proposer}
        stageLinks={stageLinks}
      >
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="mx-auto max-w-3xl px-5 py-4 text-sm text-muted"
        >
          <p className="font-semibold text-text">Chamber Veto</p>
          <p className="mt-2">
            Chambers captured for this proposal&apos;s veto process can each
            vote to veto, keep, or abstain.
          </p>
          <p className="mt-2 text-xs text-muted">
            If enough chambers cross their own internal veto thresholds before
            this window ends, the proposal returns to the proposer for
            reconsideration.
          </p>
        </Surface>
        {viewerIsProposer ? (
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="px-5 py-4 text-sm text-muted"
          >
            You cannot vote on your own proposal.
          </Surface>
        ) : null}
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
      </ProposalPageHeader>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text">Chamber veto window</h2>
        {chamberVetoVoteCount === 0 ? (
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="px-5 py-4 text-sm text-muted"
          >
            No chamber veto initiated yet.
          </Surface>
        ) : null}
        <div className="grid gap-3 text-sm text-text sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Time left"
            value={proposal.timeLeft}
            variant="panel"
            className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
            valueClassName="text-2xl font-semibold"
          />
          <StatTile
            label="Active chambers"
            value={String(proposal.activeChambers)}
            variant="panel"
            className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
            valueClassName="text-2xl font-semibold"
          />
          <StatTile
            label="Vetoing chambers"
            value={`${proposal.vetoingChambers} / ${proposal.chamberThreshold}`}
            variant="panel"
            className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
            valueClassName="text-2xl font-semibold"
          />
          <StatTile
            label="Threshold"
            value="66.6%"
            variant="panel"
            className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
            valueClassName="text-2xl font-semibold"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">Per-chamber votes</h2>
        <div className="grid gap-3 xl:grid-cols-2">
          {proposal.chambers.map((chamber) => {
            const totalVotes =
              chamber.votes.veto + chamber.votes.keep + chamber.votes.abstain;
            const chamberKey = chamber.chamberId;
            const currentVote = chamber.viewer.currentVote;
            const vetoRecorded = currentVote === "veto";
            const keepRecorded = currentVote === "keep";
            const abstainRecorded = currentVote === "abstain";
            return (
              <Surface
                key={chamberKey}
                variant="panelAlt"
                radius="2xl"
                shadow="tile"
                className="space-y-4 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-text">
                      {chamber.chamberTitle}
                    </h3>
                    <p className="text-xs text-muted">
                      {chamber.countsAsVetoing
                        ? "This chamber currently counts as vetoing."
                        : "This chamber has not yet crossed its internal veto threshold."}
                    </p>
                  </div>
                  <Surface
                    variant="panel"
                    radius="full"
                    className="px-3 py-1 text-xs font-semibold text-muted"
                  >
                    {chamber.countsAsVetoing ? "Vetoing" : "Not vetoing"}
                  </Surface>
                </div>

                <div className="grid gap-2 text-sm text-text sm:grid-cols-2">
                  <StatTile
                    label="Eligible voters"
                    value={String(chamber.eligibleVoters)}
                    className="px-3 py-3"
                  />
                  <StatTile
                    label="Quorum needed"
                    value={String(chamber.quorumNeeded)}
                    className="px-3 py-3"
                  />
                  <StatTile
                    label="Veto needed"
                    value={String(chamber.vetoNeeded)}
                    className="px-3 py-3"
                  />
                  <StatTile
                    label="Weighted split"
                    value={`${chamber.votes.veto} / ${chamber.votes.keep} / ${chamber.votes.abstain}`}
                    className="px-3 py-3"
                  />
                  <StatTile
                    label="Delegation source"
                    value={
                      chamber.delegation.snapshotCapturedAt
                        ? `${chamber.delegation.source} · ${formatDateTime(chamber.delegation.snapshotCapturedAt)}`
                        : chamber.delegation.source
                    }
                    className="px-3 py-3"
                  />
                </div>

                <p className="text-xs text-muted">
                  Eligible voters and quorum are headcount-based. Weighted
                  totals below include delegated voting weight captured for this
                  proposal.
                </p>

                <p className="text-xs text-muted">
                  {viewerIsProposer
                    ? "You cannot vote on your own proposal."
                    : chamber.viewer.eligible
                      ? chamber.viewer.currentVote
                        ? `Your current vote: ${chamber.viewer.currentVote}`
                        : "You are eligible to vote in this chamber."
                      : "You are not eligible in this chamber’s snapped electorate."}
                </p>

                <div className="flex flex-wrap gap-2">
                  <VoteButton
                    tone="destructive"
                    label={vetoRecorded ? "Veto cast" : "Veto"}
                    className={
                      vetoRecorded
                        ? "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)]"
                        : undefined
                    }
                    disabled={
                      submittingKey !== null ||
                      !vetoWindowOpen ||
                      !chamber.viewer.eligible ||
                      viewerIsProposer ||
                      vetoRecorded
                    }
                    title={
                      viewerIsProposer
                        ? "You cannot vote on your own proposal."
                        : vetoRecorded
                          ? "Your chamber veto is already recorded here."
                          : !vetoWindowOpen
                            ? "Veto window ended."
                            : !chamber.viewer.eligible
                              ? "You are not eligible to vote in this chamber veto."
                              : undefined
                    }
                    onClick={() => handleVote(chamber.chamberId, "veto")}
                  />
                  <VoteButton
                    tone="accent"
                    label={keepRecorded ? "Keep cast" : "Keep"}
                    className={
                      keepRecorded
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                        : undefined
                    }
                    disabled={
                      submittingKey !== null ||
                      !vetoWindowOpen ||
                      !chamber.viewer.eligible ||
                      viewerIsProposer ||
                      keepRecorded
                    }
                    title={
                      viewerIsProposer
                        ? "You cannot vote on your own proposal."
                        : keepRecorded
                          ? "Your chamber keep vote is already recorded here."
                          : !vetoWindowOpen
                            ? "Veto window ended."
                            : !chamber.viewer.eligible
                              ? "You are not eligible to vote in this chamber veto."
                              : undefined
                    }
                    onClick={() => handleVote(chamber.chamberId, "keep")}
                  />
                  <VoteButton
                    tone="neutral"
                    label={abstainRecorded ? "Abstaining" : "Abstain"}
                    className={
                      abstainRecorded
                        ? "bg-[var(--panel-alt)] text-[var(--text)] ring-1 ring-[var(--border-strong)] hover:bg-[var(--panel-alt)]"
                        : undefined
                    }
                    disabled={
                      submittingKey !== null ||
                      !vetoWindowOpen ||
                      !chamber.viewer.eligible ||
                      viewerIsProposer ||
                      abstainRecorded
                    }
                    title={
                      viewerIsProposer
                        ? "You cannot vote on your own proposal."
                        : abstainRecorded
                          ? "Your chamber abstain vote is already recorded here."
                          : !vetoWindowOpen
                            ? "Veto window ended."
                            : !chamber.viewer.eligible
                              ? "You are not eligible to vote in this chamber veto."
                              : undefined
                    }
                    onClick={() => handleVote(chamber.chamberId, "abstain")}
                  />
                </div>

                <p className="text-xs text-muted">
                  {totalVotes} weighted votes cast so far in this chamber.
                </p>
              </Surface>
            );
          })}
        </div>
      </section>

      <ProposalSummaryCard
        summary={proposal.summary}
        stats={[]}
        overview={proposal.overview}
        executionPlan={proposal.executionPlan}
        budgetScope={proposal.budgetScope}
        attachments={proposal.attachments}
        showExecutionPlan={proposal.formationEligible}
        showBudgetScope={proposal.formationEligible}
      />

      <ProposalDeliberation proposalId={id} />

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

export default ProposalChamberVeto;
