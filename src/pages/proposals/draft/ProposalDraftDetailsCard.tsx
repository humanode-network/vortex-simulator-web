import { Chip } from "@/components/Chip";
import { ProposalPageHeader } from "@/components/ProposalPageHeader";
import { TierLabel } from "@/components/TierLabel";
import type { ProposalDraftDetailDto } from "@/types/api";
import { parseRatioPair } from "@/lib/dtoParsers";
import { ProposalDetailsSections } from "../shared/ProposalDetailsSections";

type ProposalDraftDetailsCardProps = {
  draft: ProposalDraftDetailDto;
};

export const ProposalDraftDetailsCard: React.FC<
  ProposalDraftDetailsCardProps
> = ({ draft }) => {
  const { left: filledSlots, right: totalSlots } = parseRatioPair(
    draft.teamSlots,
  );
  const openSlots = Math.max(totalSlots - filledSlots, 0);
  return (
    <section className="space-y-6">
      <ProposalPageHeader
        title={draft.title}
        stage="draft"
        proposalId={draft.submittedProposalId ?? undefined}
        showFormationStage={draft.formationEligible}
        chamber={draft.chamber}
        proposer={draft.proposer}
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Chip>
            {draft.publication.status === "submitted"
              ? "Draft history"
              : "Draft"}
          </Chip>
          {draft.publication.revision ? (
            <Chip>Public revision {draft.publication.revision}</Chip>
          ) : null}
          <Chip>
            <TierLabel tier={draft.tier} />
          </Chip>
        </div>
      </ProposalPageHeader>

      <ProposalDetailsSections
        attachments={draft.attachments.map((attachment, index) => ({
          id: `draft-attachment-${index + 1}`,
          title: attachment.title,
          href: attachment.href,
        }))}
        authoring={draft.authoring}
        budgetScope={draft.budgetScope}
        executionPlan={draft.executionPlan}
        milestonesDetail={
          draft.formationEligible ? draft.milestonesDetail : undefined
        }
        openSlots={draft.formationEligible ? draft.openSlotNeeds : undefined}
        overview={draft.overview}
        showBudgetScope={draft.formationEligible}
        showExecutionPlan
        stats={[
          { label: "Budget ask", value: draft.budget },
          { label: "Formation", value: draft.formationEligible ? "Yes" : "No" },
          ...(draft.formationEligible
            ? [
                {
                  label: "Team slots",
                  value: `${draft.teamSlots} (${openSlots} available)`,
                },
                { label: "Milestones", value: draft.milestonesPlanned },
              ]
            : []),
        ]}
        summary={draft.summary}
        teamLocked={draft.formationEligible ? draft.teamLocked : undefined}
      />
    </section>
  );
};
