import {
  ProposalSummaryCard,
  ProposalTeamMilestonesCard,
} from "@/components/ProposalSections";

type ProposalSummaryStat = {
  label: string;
  value: string;
};

type ProposalDetailsSectionsProps = {
  attachments: { id: string; title: string; href?: string }[];
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

  return (
    <>
      <ProposalSummaryCard
        summary={summary}
        stats={stats}
        overview={overview}
        executionPlan={executionPlan}
        budgetScope={budgetScope}
        attachments={attachments}
        showExecutionPlan={showExecutionPlan}
        showBudgetScope={showBudgetScope}
      />

      {showTeamMilestones ? (
        <ProposalTeamMilestonesCard
          teamLocked={teamLocked ?? []}
          openSlots={openSlots ?? []}
          milestonesDetail={milestonesDetail ?? []}
        />
      ) : null}
    </>
  );
};
