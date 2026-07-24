import { getApiErrorPayload } from "@/lib/apiClient";
import {
  firstIncompleteWizardStep,
  type WizardContext,
  type WizardPathId,
  type WizardStepId,
} from "./wizardModel";

const intentCodes = new Set([
  "invalid_preset",
  "invalid_preset_payload",
  "invalid_preset_template",
  "proposal_type_ineligible",
  "tier_ineligible",
]);

const systemCodes = new Set([
  "chamber_exists",
  "invalid_meta_chamber",
  "invalid_meta_governance",
  "invalid_meta_governor",
  "meta_governance_requires_general",
]);

const scopeCodes = new Set([
  "chamber_dissolved",
  "invalid_chamber",
  "invalid_initiative_association",
  "initiative_association_immutable",
]);

const publicationContentCodes = new Set([
  "draft_publication_title_required",
  "draft_publication_summary_required",
  "draft_publication_chamber_required",
  "draft_publication_case_required",
  "draft_publication_rationale_required",
]);

export function proposalSubmitErrorStep(
  error: unknown,
  pathId: WizardPathId,
  context: WizardContext,
): WizardStepId | null {
  const code = getApiErrorPayload(error)?.error?.code;
  if (typeof code !== "string") return null;
  if (intentCodes.has(code)) return "intent";
  if (systemCodes.has(code)) return "system-change";
  if (scopeCodes.has(code)) {
    return pathId === "system-change" ? "system-change" : "essentials";
  }
  if (publicationContentCodes.has(code)) {
    return pathId === "system-change" ? "system-change" : "essentials";
  }
  if (code === "draft_publication_system_action_required") {
    return "system-change";
  }
  if (code === "draft_publication_invalid_url") {
    return pathId === "system-change" ? "rationale" : "plan";
  }
  if (code === "draft_not_submittable") {
    return firstIncompleteWizardStep(pathId, context);
  }
  if (code === "reopen_author_mismatch" || code === "resubmission_unknown") {
    return "review";
  }
  return null;
}
