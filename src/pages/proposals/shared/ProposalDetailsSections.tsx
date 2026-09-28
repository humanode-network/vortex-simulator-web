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
  showTeam?: boolean;
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
  showTeam = true,
  stats,
  summary,
  teamLocked,
}) => {
  const authoredTimelineVisible =
    authoring.kind === "project" && authoring.timeline.length > 0;
  const showTeamMilestones =
    Boolean(milestonesDetail) &&
    ((showTeam && Boolean(teamLocked) && Boolean(openSlots)) ||
      (!showTeam && !authoredTimelineVisible));

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
          showTeam={showTeam}
        />
      ) : null}
    </>
  );
};
