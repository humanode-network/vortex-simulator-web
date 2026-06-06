import { useState } from "react";
import { useParams } from "react-router";

import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import { VoteButton } from "@/components/VoteButton";
import { apiPoolVote, apiProposalPoolPage } from "@/lib/apiClient";
import {
  getProposalPoolVotingGate,
  proposalFormationSummaryStats,
  viewerIsProposalAuthor,
} from "@/lib/proposalUi";
import { formatProposalActionError } from "@/lib/proposalSubmitErrors";
import { useAuth } from "@/app/auth/AuthContext";
import {
  useProposalStageSync,
  useProposalTransitionNotice,
} from "./hooks/useProposalStageSync";
import { ProposalDeliberation } from "./ProposalDeliberation";
import { ProposalPageLoadingState } from "./shared/ProposalPageLoadingState";
import { ProposalTimelineSection } from "./shared/ProposalTimelineSection";
import { useProposalPageData } from "./hooks/useProposalPageData";
import { ProposalPageShell } from "./shared/ProposalPageShell";
import {
  ProposalPoolRulesModal,
  type PoolVoteAction,
} from "./pool/ProposalPoolRulesModal";
import { ProposalPoolAttentionStats } from "./pool/ProposalPoolAttentionStats";
import { ProposalDetailsSections } from "./shared/ProposalDetailsSections";

const ProposalPP: React.FC = () => {
  const { id } = useParams();
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [rulesChecked, setRulesChecked] = useState(false);
  const [pendingAction, setPendingAction] = useState<PoolVoteAction | null>(
    null,
  );
  const {
    loadError,
    page: proposal,
    setPage: setProposal,
    timeline,
    timelineError,
  } = useProposalPageData({
    id,
    loadPage: apiProposalPoolPage,
    pageErrorFallback: "Failed to load proposal",
  });
  const auth = useAuth();
  const syncProposalStage = useProposalStageSync(id);
  const transitionNotice = useProposalTransitionNotice();

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

  const viewerIsProposer = viewerIsProposalAuthor(
    auth.address,
    proposal.proposerId,
  );
  const formationSummaryStats = proposalFormationSummaryStats(proposal);

  const votingGate = getProposalPoolVotingGate({ auth, viewerIsProposer });

  const activeGovernors = Math.max(1, proposal.activeGovernors);
  const engaged = proposal.upvotes + proposal.downvotes;
  const attentionPercent = Math.round((engaged / activeGovernors) * 100);
  const attentionNeededPercent = Math.round(proposal.attentionQuorum * 100);
  const upvoteFloorFractionPercent = Math.round(
    ((proposal.thresholdContext?.quorumThreshold.upvoteFloorFraction ?? 0.1) *
      1000) /
      10,
  );
  const upvoteFloorProgressPercent = Math.round(
    Math.min(
      1,
      proposal.upvoteFloor > 0 ? proposal.upvotes / proposal.upvoteFloor : 0,
    ) * upvoteFloorFractionPercent,
  );
  const handleConfirmPoolVote = async () => {
    if (!id || !pendingAction) return;
    setVoteSubmitting(true);
    setVoteError(null);
    try {
      await apiPoolVote({
        proposalId: id,
        direction: pendingAction === "upvote" ? "up" : "down",
        idempotencyKey: crypto.randomUUID(),
      });
      const redirected = await syncProposalStage();
      if (redirected) {
        setShowRules(false);
        return;
      }
      const next = await apiProposalPoolPage(id);
      setProposal(next);
      setShowRules(false);
    } catch (error) {
      setVoteError(formatProposalActionError(error, "Vote failed."));
    } finally {
      setVoteSubmitting(false);
      void syncProposalStage();
    }
  };

  return (
    <ProposalPageShell transitionNotice={transitionNotice}>
      <div className="grid items-start gap-4">
        <ProposalPageHeader
          title={proposal.title}
          stage="pool"
          proposalId={id}
          showFormationStage={proposal.formationEligible}
          chamber={proposal.chamber}
          proposer={proposal.proposer}
        >
          <div className="flex flex-wrap items-center justify-center gap-4">
            <VoteButton
              size="lg"
              tone="accent"
              icon="▲"
              label="Upvote"
              requiresEligibility={false}
              disabled={!votingGate.allowed}
              title={votingGate.allowed ? undefined : votingGate.disabledReason}
              onClick={() => {
                setPendingAction("upvote");
                setRulesChecked(false);
                setVoteError(null);
                setShowRules(true);
              }}
            />
            <VoteButton
              size="lg"
              tone="destructive"
              icon="▼"
              label="Downvote"
              requiresEligibility={false}
              disabled={!votingGate.allowed}
              title={votingGate.allowed ? undefined : votingGate.disabledReason}
              onClick={() => {
                setPendingAction("downvote");
                setRulesChecked(false);
                setVoteError(null);
                setShowRules(true);
              }}
            />
          </div>
          {viewerIsProposer ? (
            <p className="text-center text-sm text-muted">
              You cannot vote on your own proposal.
            </p>
          ) : null}
          <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-4 rounded-full border border-border bg-panel-alt px-6 py-5 text-center text-xl font-semibold text-text sm:w-fit sm:px-14 sm:py-7 sm:text-2xl">
            <span className="text-accent">{proposal.upvotes} upvotes</span>
            <span className="text-muted">·</span>
            <span className="text-destructive">
              {proposal.downvotes} downvotes
            </span>
          </div>
        </ProposalPageHeader>

        <ProposalPoolAttentionStats
          attentionNeededPercent={attentionNeededPercent}
          attentionPercent={attentionPercent}
          upvoteFloorFractionPercent={upvoteFloorFractionPercent}
          upvoteFloorProgressPercent={upvoteFloorProgressPercent}
        />
      </div>

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

      <ProposalPoolRulesModal
        checked={rulesChecked}
        error={voteError}
        open={showRules}
        onOpenChange={setShowRules}
        onCheckedChange={setRulesChecked}
        onConfirm={handleConfirmPoolVote}
        pendingAction={pendingAction}
        rules={proposal.rules}
        submitting={voteSubmitting}
      />

      <ProposalTimelineSection
        error={timelineError}
        items={timeline}
        proposalId={id}
      />
    </ProposalPageShell>
  );
};

export default ProposalPP;
