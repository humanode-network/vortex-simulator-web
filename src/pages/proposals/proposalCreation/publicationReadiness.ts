import type { ProposalDraftForm, ProposalTemplateId } from "./types";
import { validateSystemDraftTarget } from "./wizardModel";

export function isProposalDraftPublicationReady(
  draft: ProposalDraftForm,
  templateId: ProposalTemplateId,
): boolean {
  if (!draft.title.trim() || !draft.summary.trim() || !draft.chamberId.trim()) {
    return false;
  }
  if (templateId === "system") {
    return validateSystemDraftTarget(draft).valid;
  }
  return Boolean(draft.what.trim() && draft.why.trim());
}
