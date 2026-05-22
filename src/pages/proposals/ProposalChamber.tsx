import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import { HintLabel } from "@/components/Hint";
import {
  apiChamberVote,
  apiCitizenVetoVote,
  apiProposalChamberPage,
} from "@/lib/apiClient";
import {
  getProposalChamberPageDerivation,
  getProposalOrdinaryVoteGate,
} from "@/lib/proposalUi";
import {
  useProposalStageSync,
  useProposalTransitionNotice,
} from "./hooks/useProposalStageSync";
import { useAuth } from "@/app/auth/AuthContext";
import { ProposalDeliberation } from "./ProposalDeliberation";
import { ProposalPageLoadingState } from "./shared/ProposalPageLoadingState";
import { ProposalTimelineSection } from "./shared/ProposalTimelineSection";
import { useProposalPageData } from "./hooks/useProposalPageData";
import { ProposalPageShell } from "./shared/ProposalPageShell";
import { ProposalVoteStatsGrid } from "./shared/ProposalVoteStatsGrid";
import { ProposalDelegationContext } from "./shared/ProposalDelegationContext";
import { ProposalChamberHeaderActions } from "./chamber/ProposalChamberHeaderActions";
import { ProposalDetailsSections } from "./shared/ProposalDetailsSections";

const ProposalChamber: React.FC = () => {
  const { id } = useParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittingVetoKey, setSubmittingVetoKey] = useState<string | null>(
    null,
  );
  const [yesScore, setYesScore] = useState(5);
  const {
    loadError,
    page: proposal,
    reloadPage: loadPage,
    timeline,
    timelineError,
  } = useProposalPageData({
    id,
    loadPage: apiProposalChamberPage,
    pageErrorFallback: "Failed to load proposal",
  });
  const auth = useAuth();
  const syncProposalStage = useProposalStageSync(id);
  const transitionNotice = useProposalTransitionNotice();

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
      <ProposalPageLoadingState
        fallbackMessage="Loading proposal…"
        loadError={loadError}
        transitionNotice={transitionNotice}
        unavailableFallback="Failed to load proposal."
        unavailableLabel="Proposal unavailable"
      />
    );
  }

  const chamberPage = getProposalChamberPageDerivation({
    proposal,
    viewerAddress: auth.address,
  });
  const ordinaryVoteGate = getProposalOrdinaryVoteGate({
    closedReason:
      "Ordinary chamber voting is closed. Only veto actions remain in this window.",
    submitting,
    viewerIsProposer: chamberPage.viewerIsProposer,
    votingClosed: chamberPage.ordinaryVoteClosed,
  });
  const stageLinks = id
    ? {
        vote: `/app/proposals/${id}/chamber`,
        citizen_veto: `/app/proposals/${id}/citizen-veto`,
        chamber_veto: `/app/proposals/${id}/chamber-veto`,
      }
    : undefined;

  const handleVote = async (
    choice: "yes" | "no" | "abstain",
    score?: number,
  ) => {
    if (
      !id ||
      submitting ||
      chamberPage.ordinaryVoteClosed ||
      chamberPage.viewerIsProposer
    ) {
      return;
    }
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
      chamberPage.viewerIsProposer ||
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
    <ProposalPageShell transitionNotice={transitionNotice}>
      <ProposalPageHeader
        title={chamberPage.chamberTitle}
        stage="vote"
        showFormationStage={proposal.formationEligible}
        chamber={proposal.chamber}
        proposer={proposal.proposer}
        stageLinks={stageLinks}
      >
        <ProposalChamberHeaderActions
          id={id}
          milestoneVoteIndex={chamberPage.milestoneVoteIndex}
          onCitizenVetoVote={() => handleCitizenVetoVote("veto")}
          onVote={handleVote}
          ordinaryVoteClosed={chamberPage.ordinaryVoteClosed}
          ordinaryVoteGate={ordinaryVoteGate}
          proposal={proposal}
          scoreLabel={chamberPage.scoreLabel}
          setYesScore={setYesScore}
          submitError={submitError}
          submittingVetoKey={submittingVetoKey}
          vetoWindowOpen={chamberPage.vetoWindowOpen}
          viewerIsProposer={chamberPage.viewerIsProposer}
          viewerVoteLabel={chamberPage.viewerVoteLabel}
          yesScore={yesScore}
        />
      </ProposalPageHeader>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text">Voting quorum</h2>
        <ProposalVoteStatsGrid
          abstainPercentOfTotal={chamberPage.abstainPercentOfTotal}
          abstainTotal={chamberPage.abstainTotal}
          engaged={chamberPage.engaged}
          noPercentOfTotal={chamberPage.noPercentOfTotal}
          noTotal={chamberPage.noTotal}
          passingDetail={
            chamberPage.referendumVote
              ? `${Math.ceil(chamberPage.engaged * 0.666)} yes votes needed at current participation`
              : "Yes within quorum"
          }
          passingNeededPercent={chamberPage.passingNeededPercent}
          quorumDetail={`${chamberPage.quorumNeeded} ${proposal.voterLabel.toLowerCase()}`}
          quorumLabel={
            chamberPage.referendumVote ? (
              "Referendum quorum (%)"
            ) : (
              <HintLabel
                termId="quorum_of_vote"
                termText="Voting quorum"
                suffix=" (%)"
              />
            )
          }
          quorumNeededLabel={
            chamberPage.referendumVote
              ? chamberPage.referendumQuorumRuleLabel
              : `${chamberPage.quorumNeededPercent}%`
          }
          quorumPercent={chamberPage.quorumPercent}
          timeLabel={proposal.timeContextLabel}
          timeLeft={proposal.timeLeft}
          yesPercentOfQuorum={chamberPage.yesPercentOfQuorum}
          yesPercentOfTotal={chamberPage.yesPercentOfTotal}
          yesTotal={chamberPage.yesTotal}
        />
      </section>

      {proposal.delegation ? (
        <ProposalDelegationContext delegation={proposal.delegation} />
      ) : null}

      <ProposalDetailsSections
        summary={proposal.summary}
        stats={chamberPage.formationSummaryStats}
        overview={proposal.overview}
        executionPlan={proposal.executionPlan}
        budgetScope={proposal.budgetScope}
        attachments={proposal.attachments}
        showExecutionPlan={proposal.formationEligible}
        showBudgetScope={proposal.formationEligible}
        teamLocked={proposal.formationEligible ? proposal.teamLocked : undefined}
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

export default ProposalChamber;
