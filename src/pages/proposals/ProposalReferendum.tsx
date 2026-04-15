import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { PageHint } from "@/components/PageHint";
import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import { VoteButton } from "@/components/VoteButton";
import { Button } from "@/components/primitives/button";
import {
  ProposalSummaryCard,
  ProposalTeamMilestonesCard,
  ProposalTimelineCard,
} from "@/components/ProposalSections";
import { StatTile } from "@/components/StatTile";
import { Surface } from "@/components/Surface";
import {
  apiProposalReferendumPage,
  apiProposalTimeline,
  apiReferendumVote,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import type {
  ChamberProposalPageDto,
  ProposalTimelineItemDto,
} from "@/types/api";
import {
  useProposalStageSync,
  useProposalTransitionNotice,
} from "./useProposalStageSync";
import { useAuth } from "@/app/auth/AuthContext";
import { apiCitizenVetoVote } from "@/lib/apiClient";
import { CitizenVetoActions } from "./CitizenVetoActions";
import { ProposalDeliberation } from "./ProposalDeliberation";

const ProposalReferendum: React.FC = () => {
  const { id } = useParams();
  const auth = useAuth();
  const [proposal, setProposal] = useState<ChamberProposalPageDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeline, setTimeline] = useState<ProposalTimelineItemDto[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const syncProposalStage = useProposalStageSync(id);
  const transitionNotice = useProposalTransitionNotice();

  const loadPage = useCallback(async () => {
    if (!id) return;
    const page = await apiProposalReferendumPage(id);
    setProposal(page);
    setLoadError(null);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [pageResult, timelineResult] = await Promise.allSettled([
          apiProposalReferendumPage(id),
          apiProposalTimeline(id),
        ]);
        if (!active) return;
        if (pageResult.status === "fulfilled") {
          setProposal(pageResult.value);
          setLoadError(null);
        } else {
          setProposal(null);
          setLoadError(
            pageResult.reason?.message ?? "Failed to load referendum",
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
            ? `Referendum unavailable: ${formatLoadError(loadError, "Failed to load referendum.")}`
            : "Loading referendum…"}
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
  const quorumRuleLabel = "33.3% + 1";
  const quorumPercent = Math.round((engaged / eligibleVoters) * 100);
  const yesPercentOfTotal =
    totalVotes > 0 ? Math.round((yesTotal / totalVotes) * 100) : 0;
  const noPercentOfTotal =
    totalVotes > 0 ? Math.round((noTotal / totalVotes) * 100) : 0;
  const abstainPercentOfTotal =
    totalVotes > 0 ? Math.round((abstainTotal / totalVotes) * 100) : 0;
  const yesPercentOfQuorum =
    engaged > 0 ? Math.round((yesTotal / engaged) * 100) : 0;
  const passingNeededPercent = 66.6;
  const viewerIsProposer =
    auth.address?.trim().toLowerCase() ===
    proposal.proposerId.trim().toLowerCase();

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
  const stageLinks = id
    ? {
        vote: `/app/proposals/${id}/referendum`,
        citizen_veto: `/app/proposals/${id}/citizen-veto`,
        chamber_veto: `/app/proposals/${id}/chamber-veto`,
      }
    : undefined;
  const vetoWindowOpen = proposal.timeLeft !== "Ended";

  const handleVote = async (choice: "yes" | "no" | "abstain") => {
    if (!id || submitting || viewerIsProposer) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await apiReferendumVote({
        proposalId: id,
        choice,
      });
      if (result.systemReset) {
        window.location.assign("/app");
        return;
      }
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
      submitting ||
      viewerIsProposer ||
      !proposal.citizenVeto.viewer.eligible
    ) {
      return;
    }
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
        title={`${proposal.title} — Referendum`}
        stage="vote"
        showFormationStage={false}
        chamber="System-wide referendum"
        proposer={proposal.proposer}
        stageLinks={stageLinks}
      >
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="mx-auto px-4 py-2 text-xs font-semibold text-muted"
        >
          All active human nodes can vote
        </Surface>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <VoteButton
            tone="accent"
            label="Vote yes"
            disabled={submitting || viewerIsProposer}
            title={
              viewerIsProposer
                ? "You cannot vote on your own proposal."
                : undefined
            }
            onClick={() => handleVote("yes")}
          />
          <VoteButton
            tone="destructive"
            label="Vote no"
            disabled={submitting || viewerIsProposer}
            title={
              viewerIsProposer
                ? "You cannot vote on your own proposal."
                : undefined
            }
            onClick={() => handleVote("no")}
          />
          <VoteButton
            tone="neutral"
            label="Abstain"
            disabled={submitting || viewerIsProposer}
            title={
              viewerIsProposer
                ? "You cannot vote on your own proposal."
                : undefined
            }
            onClick={() => handleVote("abstain")}
          />
        </div>
        <CitizenVetoActions
          citizenVeto={proposal.citizenVeto}
          viewerIsProposer={viewerIsProposer}
          windowOpen={vetoWindowOpen}
          submittingKey={submitting ? "citizen" : null}
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
          Use the Citizen Veto tab to inspect or cast Citizen Veto votes, and
          the Chamber Veto tab to inspect chamber-veto activity.
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
        <h2 className="text-lg font-semibold text-text">Referendum quorum</h2>
        <div className="grid gap-3 text-sm text-text sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Participation (%)"
            value={
              <>
                <span>
                  {quorumPercent}% / {quorumRuleLabel}
                </span>
                <span className="text-xs font-semibold text-muted">
                  {engaged} / {proposal.quorumNeeded} human nodes
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
            label="Time left"
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
                  {Math.ceil(engaged * 0.666)} yes votes needed at current
                  participation
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
        <ProposalTimelineCard items={timeline} proposalId={id ?? ""} />
      )}
    </div>
  );
};

export default ProposalReferendum;
