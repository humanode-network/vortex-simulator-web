import type { ProposalDraftFormPayload } from "@/lib/apiClient";
import type { ProposalDraftForm } from "./types";

export function draftToApiForm(
  draft: ProposalDraftForm,
  input?: { templateId?: "project" | "system" },
): ProposalDraftFormPayload {
  const formationEligible = draft.formationEligible !== false;
  const alignedBudgetItems = formationEligible
    ? draft.timeline
        .map((item, idx) => {
          const n = Number(item.budgetHmnd);
          if (!Number.isFinite(n) || n <= 0) return null;
          return {
            id: item.id,
            description:
              item.title.trim().length > 0
                ? item.title
                : `Milestone ${idx + 1}`,
            amount: String(Math.round(n)),
          };
        })
        .filter(
          (item): item is { id: string; description: string; amount: string } =>
            Boolean(item),
        )
    : draft.budgetItems;

  return {
    ...(input?.templateId ? { templateId: input.templateId } : {}),
    ...(draft.presetId ? { presetId: draft.presetId } : {}),
    ...(typeof draft.formationEligible === "boolean"
      ? { formationEligible: draft.formationEligible }
      : {}),
    title: draft.title,
    chamberId: draft.chamberId,
    summary: draft.summary,
    what: draft.what,
    why: draft.why,
    how: draft.how,
    proposalType: draft.proposalType,
    ...(draft.metaGovernance ? { metaGovernance: draft.metaGovernance } : {}),
    timeline: draft.timeline,
    outputs: draft.outputs,
    openSlotNeeds: draft.openSlotNeeds,
    budgetItems: alignedBudgetItems,
    aboutMe: draft.aboutMe,
    attachments: draft.attachments,
    agreeRules: draft.agreeRules,
    confirmBudget: draft.confirmBudget,
  };
}
