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
  apiCitizenVetoVote,
  apiProposalCitizenVetoPage,
  apiProposalTimeline,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import type {
  CitizenVetoProposalPageDto,
  ProposalTimelineItemDto,
} from "@/types/api";
import {
  useProposalStageSync,
  useProposalTransitionNotice,
} from "./useProposalStageSync";
import { useAuth } from "@/app/auth/AuthContext";
import { ProposalDeliberation } from "./ProposalDeliberation";

const ProposalCitizenVeto: React.FC = () => {
  const { id } = useParams();
  const [proposal, setProposal] = useState<CitizenVetoProposalPageDto | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const auth = useAuth();
  const [timeline, setTimeline] = useState<ProposalTimelineItemDto[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const syncProposalStage = useProposalStageSync(id);
  const transitionNotice = useProposalTransitionNotice();

  const loadPage = useCallback(async () => {
    if (!id) return;
    const page = await apiProposalCitizenVetoPage(id);
    setProposal(page);
    setLoadError(null);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [pageResult, timelineResult] = await Promise.allSettled([
          apiProposalCitizenVetoPage(id),
          apiProposalTimeline(id),
        ]);
        if (!active) return;
        if (pageResult.status === "fulfilled") {
          setProposal(pageResult.value);
          setLoadError(null);
        } else {
          setProposal(null);
          setLoadError(
            pageResult.reason?.message ?? "Failed to load citizen veto",
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
            ? `Citizen veto unavailable: ${formatLoadError(loadError, "Failed to load citizen veto.")}`
            : "Loading citizen veto…"}
        </Surface>
      </div>
    );
  }

  const castVotes = proposal.votes.veto + proposal.votes.keep;
  const quorumPercent =
    proposal.eligibleCitizens > 0
      ? Math.round((castVotes / proposal.eligibleCitizens) * 100)
      : 0;
  const vetoPercent =
    castVotes > 0 ? Math.round((proposal.votes.veto / castVotes) * 100) : 0;
  const viewerIsProposer =
    auth.address?.trim().toLowerCase() ===
    proposal.proposerId.trim().toLowerCase();
  const stageLinks = id
    ? {
        vote: proposal.voteRoute,
        citizen_veto: `/app/proposals/${id}/citizen-veto`,
        chamber_veto: `/app/proposals/${id}/chamber-veto`,
      }
    : undefined;
  const vetoWindowOpen = proposal.timeLeft !== "Ended";
  const currentVote = proposal.viewer.currentVote;
  const vetoRecorded = currentVote === "veto";
  const keepRecorded = currentVote === "keep";

  const handleVote = async (choice: "veto" | "keep") => {
    if (
      !id ||
      submitting ||
      !vetoWindowOpen ||
      !proposal.viewer.eligible ||
      viewerIsProposer
    )
      return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiCitizenVetoVote({ proposalId: id, choice });
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
        title={`${proposal.title} — Citizen veto`}
        stage="citizen_veto"
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
          <p className="font-semibold text-text">Citizen Veto</p>
          <p className="mt-2">
            {viewerIsProposer
              ? "You proposed this decision, so you cannot vote in its Citizen Veto."
              : proposal.viewer.eligible
                ? proposal.viewer.currentVote === "veto"
                  ? "Only Citizens captured when this veto window opened can vote here. Your current vote is Veto."
                  : proposal.viewer.currentVote === "keep"
                    ? "Only Citizens captured when this veto window opened can vote here. Your current vote is Keep."
                    : "Only Citizens captured when this veto window opened can vote here. Cast Veto to send the decision back for reconsideration, or Keep to leave it in place."
                : "Only Citizens captured when this veto window opened can vote here. You were not in that group for this proposal."}
          </p>
          <p className="mt-2 text-xs text-muted">
            {vetoWindowOpen
              ? "If Veto reaches the threshold before this window ends, the proposal returns to the proposer for reconsideration."
              : "This veto window has ended."}
          </p>
        </Surface>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <VoteButton
            tone="destructive"
            label={
              submitting
                ? "Casting veto..."
                : vetoRecorded
                  ? "Veto cast"
                  : "Veto"
            }
            className={
              vetoRecorded
                ? "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)]"
                : undefined
            }
            disabled={
              submitting ||
              !vetoWindowOpen ||
              vetoRecorded ||
              !proposal.viewer.eligible ||
              viewerIsProposer
            }
            title={
              viewerIsProposer
                ? "You cannot vote on your own proposal."
                : vetoRecorded
                  ? "Your citizen veto is already recorded."
                  : !vetoWindowOpen
                    ? "Veto window ended."
                    : !proposal.viewer.eligible
                      ? "Only Citizens captured when this veto window opened can vote here."
                      : undefined
            }
            onClick={() => handleVote("veto")}
          />
          <VoteButton
            tone="neutral"
            label={
              submitting
                ? "Casting keep..."
                : keepRecorded
                  ? "Keep cast"
                  : "Keep"
            }
            className={
              keepRecorded
                ? "bg-[var(--panel-alt)] text-[var(--text)] ring-1 ring-[var(--border-strong)] hover:bg-[var(--panel-alt)]"
                : undefined
            }
            disabled={
              submitting ||
              !vetoWindowOpen ||
              keepRecorded ||
              !proposal.viewer.eligible ||
              viewerIsProposer
            }
            title={
              viewerIsProposer
                ? "You cannot vote on your own proposal."
                : keepRecorded
                  ? "Your citizen keep vote is already recorded."
                  : !vetoWindowOpen
                    ? "Veto window ended."
                    : !proposal.viewer.eligible
                      ? "Only Citizens captured when this veto window opened can vote here."
                      : undefined
            }
            onClick={() => handleVote("keep")}
          />
        </div>
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
        <h2 className="text-lg font-semibold text-text">Citizen veto window</h2>
        {castVotes === 0 ? (
          <Surface
            variant="panelAlt"
            radius="2xl"
            shadow="tile"
            className="px-5 py-4 text-sm text-muted"
          >
            No Citizen Veto votes yet.
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
            label="Participation"
            value={
              <>
                <span>
                  {castVotes} / {proposal.quorumNeeded}
                </span>
                <span className="text-xs font-semibold text-muted">
                  {quorumPercent}% of eligible Citizens
                </span>
              </>
            }
            variant="panel"
            className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
            valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
          />
          <StatTile
            label="Veto threshold"
            value={
              <>
                <span>
                  {proposal.votes.veto} / {proposal.vetoNeeded}
                </span>
                <span className="text-xs font-semibold text-muted">
                  {vetoPercent}% veto among cast votes
                </span>
              </>
            }
            variant="panel"
            className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
            valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
          />
          <StatTile
            label="Attempts left"
            value={
              <>
                <span>{proposal.attemptsRemaining}</span>
                <span className="text-xs font-semibold text-muted">
                  {proposal.attemptsUsed} of{" "}
                  {proposal.attemptsUsed + proposal.attemptsRemaining} used
                </span>
              </>
            }
            variant="panel"
            className="flex min-h-24 flex-col items-center justify-center gap-1 py-4"
            valueClassName="flex flex-col items-center gap-1 text-2xl font-semibold"
          />
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

export default ProposalCitizenVeto;
