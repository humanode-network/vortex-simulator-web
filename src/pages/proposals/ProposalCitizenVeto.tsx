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

  const handleVote = async (choice: "veto" | "keep") => {
    if (!id || submitting || !proposal.viewer.eligible || viewerIsProposer)
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
      >
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="mx-auto px-4 py-2 text-xs font-semibold text-muted"
        >
          Only snapped Citizen-tier voters can participate in this window
        </Surface>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <VoteButton
            tone="destructive"
            label="Veto"
            disabled={
              submitting || !proposal.viewer.eligible || viewerIsProposer
            }
            title={
              viewerIsProposer
                ? "You cannot vote on your own proposal."
                : !proposal.viewer.eligible
                  ? "You were not in the snapped Citizen electorate for this veto."
                  : undefined
            }
            onClick={() => handleVote("veto")}
          />
          <VoteButton
            tone="accent"
            label="Keep"
            disabled={
              submitting || !proposal.viewer.eligible || viewerIsProposer
            }
            title={
              viewerIsProposer
                ? "You cannot vote on your own proposal."
                : !proposal.viewer.eligible
                  ? "You were not in the snapped Citizen electorate for this veto."
                  : undefined
            }
            onClick={() => handleVote("keep")}
          />
        </div>
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="mx-auto px-4 py-3 text-sm text-muted"
        >
          {viewerIsProposer
            ? "You cannot vote on your own proposal."
            : proposal.viewer.eligible
              ? proposal.viewer.currentVote
                ? `Your current vote: ${proposal.viewer.currentVote === "veto" ? "Veto" : "Keep"}`
                : "You are eligible to vote in this Citizen Veto window."
              : "You are not eligible in the snapped Citizen electorate for this window."}
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
      </ProposalPageHeader>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text">Citizen veto window</h2>
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
                  {quorumPercent}% of snapped Citizens
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
            label="Breakability"
            value={
              <>
                <span>
                  {proposal.attemptsUsed} /{" "}
                  {proposal.attemptsUsed + proposal.attemptsRemaining}
                </span>
                <span className="text-xs font-semibold text-muted">
                  {proposal.attemptsRemaining} Citizen veto tries left
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

export default ProposalCitizenVeto;
