import { useState } from "react";
import { useParams } from "react-router";

import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { apiProposalReferendumPage, apiReferendumVote } from "@/lib/apiClient";
import {
  getProposalOrdinaryVoteGate,
  proposalFormationSummaryStats,
  viewerIsProposalAuthor,
} from "@/lib/proposalUi";
import {
  useProposalStageSync,
  useProposalTransitionNotice,
} from "./hooks/useProposalStageSync";
import { useAuth } from "@/app/auth/AuthContext";
import { apiCitizenVetoVote } from "@/lib/apiClient";
import { ProposalDeliberation } from "./ProposalDeliberation";
import { ProposalPageLoadingState } from "./shared/ProposalPageLoadingState";
import { ProposalTimelineSection } from "./shared/ProposalTimelineSection";
import { useProposalPageData } from "./hooks/useProposalPageData";
import { ProposalPageShell } from "./shared/ProposalPageShell";
import { ProposalVoteStatsGrid } from "./shared/ProposalVoteStatsGrid";
import { ProposalReferendumHeaderActions } from "./referendum/ProposalReferendumHeaderActions";
import { ProposalDetailsSections } from "./shared/ProposalDetailsSections";

const ProposalReferendum: React.FC = () => {
  const { id } = useParams();
  const auth = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    loadError,
    page: proposal,
    reloadPage: loadPage,
    timeline,
    timelineError,
  } = useProposalPageData({
    id,
    loadPage: apiProposalReferendumPage,
    pageErrorFallback: "Failed to load referendum",
  });
  const syncProposalStage = useProposalStageSync(id);
  const transitionNotice = useProposalTransitionNotice();

  if (!proposal) {
    return (
      <ProposalPageLoadingState
        fallbackMessage="Loading referendum…"
        loadError={loadError}
        transitionNotice={transitionNotice}
        unavailableFallback="Failed to load referendum."
        unavailableLabel="Referendum unavailable"
      />
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
  const viewerIsProposer = viewerIsProposalAuthor(
    auth.address,
    proposal.proposerId,
  );

  const formationSummaryStats = proposalFormationSummaryStats(proposal);
  const stageLinks = id
    ? {
        vote: `/app/proposals/${id}/referendum`,
        citizen_veto: `/app/proposals/${id}/citizen-veto`,
        chamber_veto: `/app/proposals/${id}/chamber-veto`,
      }
    : undefined;
  const vetoWindowOpen = proposal.timeLeft !== "Ended";
  const ordinaryVoteGate = getProposalOrdinaryVoteGate({
    submitting,
    viewerIsProposer,
  });

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
    <ProposalPageShell transitionNotice={transitionNotice}>
      <ProposalPageHeader
        title={`${proposal.title} — Referendum`}
        stage="vote"
        proposalId={id}
        showFormationStage={false}
        chamber="System-wide referendum"
        proposer={proposal.proposer}
        stageLinks={stageLinks}
      >
        <ProposalReferendumHeaderActions
          id={id}
          onCitizenVetoVote={() => handleCitizenVetoVote("veto")}
          onVote={handleVote}
          ordinaryVoteGate={ordinaryVoteGate}
          proposal={proposal}
          submitError={submitError}
          submitting={submitting}
          vetoWindowOpen={vetoWindowOpen}
          viewerIsProposer={viewerIsProposer}
        />
      </ProposalPageHeader>

      <section className="space-y-4">
        <SectionHeader>Referendum quorum</SectionHeader>
        <ProposalVoteStatsGrid
          abstainPercentOfTotal={abstainPercentOfTotal}
          abstainTotal={abstainTotal}
          engaged={engaged}
          noPercentOfTotal={noPercentOfTotal}
          noTotal={noTotal}
          passingDetail={`${Math.ceil(engaged * 0.666)} yes votes needed at current participation`}
          passingNeededPercent={passingNeededPercent}
          quorumDetail={`${proposal.quorumNeeded} human nodes`}
          quorumLabel="Participation (%)"
          quorumNeededLabel={quorumRuleLabel}
          quorumPercent={quorumPercent}
          timeLabel="Time left"
          timeLeft={proposal.timeLeft}
          yesPercentOfQuorum={yesPercentOfQuorum}
          yesPercentOfTotal={yesPercentOfTotal}
          yesTotal={yesTotal}
        />
      </section>

      <ProposalDetailsSections
        summary={proposal.summary}
        stats={formationSummaryStats}
        overview={proposal.overview}
        executionPlan={proposal.executionPlan}
        budgetScope={proposal.budgetScope}
        attachments={proposal.attachments}
        showExecutionPlan={proposal.formationEligible}
        showBudgetScope={proposal.formationEligible}
        teamLocked={
          proposal.formationEligible ? proposal.teamLocked : undefined
        }
        openSlots={
          proposal.formationEligible ? proposal.openSlotNeeds : undefined
        }
        milestonesDetail={
          proposal.formationEligible ? proposal.milestonesDetail : undefined
        }
      />

      <ProposalDeliberation proposalId={id} />

      <ProposalTimelineSection
        error={timelineError}
        items={timeline}
        proposalId={id}
      />
    </ProposalPageShell>
  );
};

export default ProposalReferendum;
