import { useState } from "react";
import { useParams } from "react-router";

import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { Surface } from "@/components/Surface";
import {
  apiChamberVetoVote,
  apiProposalChamberVetoPage,
} from "@/lib/apiClient";
import { viewerIsProposalAuthor } from "@/lib/proposalUi";
import { formatLoadError } from "@/lib/errorFormatting";
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
import { ProposalChamberVetoCard } from "./veto/ProposalChamberVetoCard";
import { ProposalChamberVetoStats } from "./veto/ProposalChamberVetoStats";
import { ProposalDetailsSections } from "./shared/ProposalDetailsSections";

const ProposalChamberVeto: React.FC = () => {
  const { id } = useParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const auth = useAuth();
  const {
    loadError,
    page: proposal,
    reloadPage: loadPage,
    timeline,
    timelineError,
  } = useProposalPageData({
    id,
    loadPage: apiProposalChamberVetoPage,
    pageErrorFallback: "Failed to load chamber veto",
  });
  const syncProposalStage = useProposalStageSync(id);
  const transitionNotice = useProposalTransitionNotice();

  if (!proposal) {
    return (
      <ProposalPageLoadingState
        fallbackMessage="Loading chamber veto…"
        loadError={loadError}
        transitionNotice={transitionNotice}
        unavailableFallback="Failed to load chamber veto."
        unavailableLabel="Chamber veto unavailable"
      />
    );
  }

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
    <ProposalPageShell transitionNotice={transitionNotice}>
      <ProposalPageHeader
        title={`${proposal.title} — Chamber veto`}
        stage="chamber_veto"
        proposalId={id}
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

      <ProposalChamberVetoStats
        activeChambers={proposal.activeChambers}
        chamberThreshold={proposal.chamberThreshold}
        timeLeft={proposal.timeLeft}
        vetoingChambers={proposal.vetoingChambers}
        voteCount={chamberVetoVoteCount}
      />

      <section className="space-y-3">
        <SectionHeader>Per-chamber votes</SectionHeader>
        <div className="grid gap-3 xl:grid-cols-2">
          {proposal.chambers.map((chamber) => (
            <ProposalChamberVetoCard
              key={chamber.chamberId}
              chamber={chamber}
              onVote={handleVote}
              submitting={submittingKey !== null}
              vetoWindowOpen={vetoWindowOpen}
              viewerIsProposer={viewerIsProposer}
            />
          ))}
        </div>
      </section>

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

export default ProposalChamberVeto;
