import type { ProposalDraftFormPayload } from "@/lib/apiClient";
import type { ProposalDraftForm } from "./types";

export function draftToApiForm(
  draft: ProposalDraftForm,
  input?: { templateId?: "project" | "system" },
): ProposalDraftFormPayload {
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
    budgetItems: draft.budgetItems,
    aboutMe: draft.aboutMe,
    attachments: draft.attachments,
    agreeRules: draft.agreeRules,
    confirmBudget: draft.confirmBudget,
  };
}
