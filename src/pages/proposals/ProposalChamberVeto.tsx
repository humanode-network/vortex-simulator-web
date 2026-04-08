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

  const viewerIsProposer =
    auth.address?.trim().toLowerCase() ===
    proposal.proposerId.trim().toLowerCase();

  const handleVote = async (
    chamberId: string,
    choice: "veto" | "keep" | "abstain",
  ) => {
    if (!id || submittingKey || viewerIsProposer) return;
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
      >
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="mx-auto px-4 py-2 text-xs font-semibold text-muted"
        >
          All snapped active chambers may separately decide whether to veto
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
                    label="Electorate"
                    value={String(chamber.eligibleVoters)}
                    className="px-3 py-3"
                  />
                  <StatTile
                    label="Quorum needed"
                    value={String(chamber.quorumNeeded)}
                    className="px-3 py-3"
                  />
                  <StatTile
                    label="Vote split"
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
                    label="Veto"
                    disabled={
                      submittingKey !== null ||
                      !chamber.viewer.eligible ||
                      viewerIsProposer
                    }
                    title={
                      viewerIsProposer
                        ? "You cannot vote on your own proposal."
                        : !chamber.viewer.eligible
                          ? "You are not eligible to vote in this chamber veto."
                          : undefined
                    }
                    onClick={() => handleVote(chamber.chamberId, "veto")}
                  />
                  <VoteButton
                    tone="accent"
                    label="Keep"
                    disabled={
                      submittingKey !== null ||
                      !chamber.viewer.eligible ||
                      viewerIsProposer
                    }
                    title={
                      viewerIsProposer
                        ? "You cannot vote on your own proposal."
                        : !chamber.viewer.eligible
                          ? "You are not eligible to vote in this chamber veto."
                          : undefined
                    }
                    onClick={() => handleVote(chamber.chamberId, "keep")}
                  />
                  <VoteButton
                    tone="neutral"
                    label="Abstain"
                    disabled={
                      submittingKey !== null ||
                      !chamber.viewer.eligible ||
                      viewerIsProposer
                    }
                    title={
                      viewerIsProposer
                        ? "You cannot vote on your own proposal."
                        : !chamber.viewer.eligible
                          ? "You are not eligible to vote in this chamber veto."
                          : undefined
                    }
                    onClick={() => handleVote(chamber.chamberId, "abstain")}
                  />
                </div>

                <p className="text-xs text-muted">
                  {totalVotes} votes cast so far in this chamber.
                </p>
              </Surface>
            );
          })}
        </div>
      </section>

      <ProposalSummaryCard
        summary={proposal.summary}
        stats={proposal.stats}
        overview={proposal.overview}
        executionPlan={proposal.executionPlan}
        budgetScope={proposal.budgetScope}
        attachments={proposal.attachments}
        showExecutionPlan={proposal.formationEligible}
        showBudgetScope={proposal.formationEligible}
      />

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
