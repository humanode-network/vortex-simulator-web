import { Link, useParams } from "react-router";
import { Button } from "@/components/primitives/button";
import { SectionHeader } from "@/components/SectionHeader";
import { Surface } from "@/components/Surface";
import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import { apiProposalFinishedPage } from "@/lib/apiClient";
import {
  useProposalStageSync,
  useProposalTransitionNotice,
} from "./hooks/useProposalStageSync";
import { ProposalDeliberation } from "./ProposalDeliberation";
import { ProposalPageLoadingState } from "./shared/ProposalPageLoadingState";
import { ProposalTimelineSection } from "./shared/ProposalTimelineSection";
import { useProposalPageData } from "./hooks/useProposalPageData";
import { ProposalPageShell } from "./shared/ProposalPageShell";
import { ProposalDetailsSections } from "./shared/ProposalDetailsSections";
import { ProposalStageStatus } from "./shared/ProposalStageStatus";

const ProposalFinished: React.FC = () => {
  const { id } = useParams();
  const {
    loadError,
    page: proposal,
    timeline,
    timelineError,
  } = useProposalPageData({
    id,
    loadPage: apiProposalFinishedPage,
    pageErrorFallback: "Failed to load proposal",
  });
  useProposalStageSync(id);
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

  const showFormationDetails = proposal.formationEligible;

  return (
    <ProposalPageShell transitionNotice={transitionNotice}>
      <ProposalPageHeader
        title={proposal.title}
        stage={proposal.terminalStage}
        proposalId={id}
        showFormationStage={proposal.formationEligible}
        chamber={proposal.chamber}
        proposer={proposal.proposer}
      >
        {proposal.canReconsider ? (
          <div className="flex justify-center">
            <Button asChild size="sm">
              <Link
                to={
                  proposal.reconsiderationDraftId
                    ? `/app/proposals/new?draftId=${encodeURIComponent(proposal.reconsiderationDraftId)}`
                    : `/app/proposals/new?resubmitsProposalId=${encodeURIComponent(proposal.decisionRootProposalId)}`
                }
              >
                Resubmit for reconsideration
              </Link>
            </Button>
          </div>
        ) : null}
      </ProposalPageHeader>

      <section className="space-y-3">
        <SectionHeader>{proposal.terminalLabel}</SectionHeader>
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          {proposal.terminalSummary}
        </Surface>
      </section>

      <ProposalStageStatus
        title="Outcome status"
        stageData={proposal.stageData}
      />

      <ProposalDetailsSections
        summary={proposal.summary}
        stats={proposal.stats}
        overview={proposal.overview}
        executionPlan={proposal.executionPlan}
        budgetScope={proposal.budgetScope}
        attachments={proposal.attachments}
        showExecutionPlan={proposal.formationEligible}
        showBudgetScope={proposal.formationEligible}
        teamLocked={showFormationDetails ? proposal.lockedTeam : undefined}
        openSlots={showFormationDetails ? proposal.openSlots : undefined}
        milestonesDetail={
          showFormationDetails ? proposal.milestonesDetail : undefined
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

export default ProposalFinished;
