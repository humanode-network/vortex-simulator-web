import { useState } from "react";
import { useParams } from "react-router";

import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import { Surface } from "@/components/Surface";
import {
  apiCitizenVetoVote,
  apiProposalCitizenVetoPage,
} from "@/lib/apiClient";
import { viewerIsProposalAuthor } from "@/lib/proposalUi";
import { formatLoadError } from "@/lib/errorFormatting";
import { calculateCitizenVetoSupportPercent } from "@/lib/proposalVetoUi";
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
import { ProposalCitizenVetoActions } from "./veto/ProposalCitizenVetoActions";
import { ProposalCitizenVetoStats } from "./veto/ProposalCitizenVetoStats";
import { ProposalDetailsSections } from "./shared/ProposalDetailsSections";

const ProposalCitizenVeto: React.FC = () => {
  const { id } = useParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const auth = useAuth();
  const {
    loadError,
    page: proposal,
    reloadPage: loadPage,
    timeline,
    timelineError,
  } = useProposalPageData({
    id,
    loadPage: apiProposalCitizenVetoPage,
    pageErrorFallback: "Failed to load citizen veto",
  });
  const syncProposalStage = useProposalStageSync(id);
  const transitionNotice = useProposalTransitionNotice();

  if (!proposal) {
    return (
      <ProposalPageLoadingState
        fallbackMessage="Loading citizen veto…"
        loadError={loadError}
        transitionNotice={transitionNotice}
        unavailableFallback="Failed to load citizen veto."
        unavailableLabel="Citizen veto unavailable"
      />
    );
  }

  const castVotes = proposal.votes.veto + proposal.votes.keep;
  const quorumPercent =
    proposal.eligibleCitizens > 0
      ? Math.round((castVotes / proposal.eligibleCitizens) * 100)
      : 0;
  const vetoPercent = calculateCitizenVetoSupportPercent({
    vetoVotes: proposal.votes.veto,
    eligibleCitizens: proposal.eligibleCitizens,
  });
  const viewerIsProposer = viewerIsProposalAuthor(
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
    <ProposalPageShell transitionNotice={transitionNotice}>
      <ProposalPageHeader
        title={`${proposal.title} — Citizen veto`}
        stage="citizen_veto"
        proposalId={id}
        showFormationStage={proposal.formationEligible}
        chamber={proposal.chamber}
        proposer={proposal.proposer}
        stageLinks={stageLinks}
      >
        <ProposalCitizenVetoActions
          onVote={handleVote}
          submitting={submitting}
          vetoWindowOpen={vetoWindowOpen}
          viewer={proposal.viewer}
          viewerIsProposer={viewerIsProposer}
        />
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

      <ProposalCitizenVetoStats
        attemptsRemaining={proposal.attemptsRemaining}
        attemptsUsed={proposal.attemptsUsed}
        castVotes={castVotes}
        quorumNeeded={proposal.quorumNeeded}
        quorumPercent={quorumPercent}
        timeLeft={proposal.timeLeft}
        vetoNeeded={proposal.vetoNeeded}
        vetoPercent={vetoPercent}
        vetoVotes={proposal.votes.veto}
      />

      <ProposalDetailsSections
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

      <ProposalTimelineSection
        error={timelineError}
        items={timeline}
        proposalId={id}
      />
    </ProposalPageShell>
  );
};

export default ProposalCitizenVeto;
