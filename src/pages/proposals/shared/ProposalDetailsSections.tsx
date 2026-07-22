import {
  ProposalSummaryCard,
  ProposalTeamMilestonesCard,
} from "@/components/ProposalSections";
import type { ProposalAuthoringDetailsDto } from "@/types/api";

type ProposalSummaryStat = {
  label: string;
  value: string;
};

type ProposalDetailsSectionsProps = {
  attachments: { id: string; title: string; href?: string }[];
  authoring: ProposalAuthoringDetailsDto;
  budgetScope: string;
  executionPlan: string[];
  milestonesDetail?: { title: string; desc: string }[];
  openSlots?: { title: string; desc: string }[];
  overview: string;
  showBudgetScope?: boolean;
  showExecutionPlan?: boolean;
  stats: ProposalSummaryStat[];
  summary: string;
  teamLocked?: { name: string; role: string }[];
};

export const ProposalDetailsSections: React.FC<
  ProposalDetailsSectionsProps
> = ({
  attachments,
  authoring,
  budgetScope,
  executionPlan,
  milestonesDetail,
  openSlots,
  overview,
  showBudgetScope,
  showExecutionPlan,
  stats,
  summary,
  teamLocked,
}) => {
  const showTeamMilestones =
    Boolean(teamLocked) && Boolean(openSlots) && Boolean(milestonesDetail);
  const authoredTimelineVisible =
    authoring.kind === "project" && authoring.timeline.length > 0;

  return (
    <>
      <ProposalSummaryCard
        summary={summary}
        stats={stats}
        overview={overview}
        executionPlan={executionPlan}
        budgetScope={budgetScope}
        attachments={attachments}
        authoring={authoring}
        showExecutionPlan={showExecutionPlan}
        showBudgetScope={showBudgetScope}
      />

      {showTeamMilestones ? (
        <ProposalTeamMilestonesCard
          teamLocked={teamLocked ?? []}
          openSlots={openSlots ?? []}
          milestonesDetail={milestonesDetail ?? []}
          sectionTitle={authoredTimelineVisible ? "Team" : undefined}
          showMilestones={!authoredTimelineVisible}
        />
      ) : null}
    </>
  );
};
