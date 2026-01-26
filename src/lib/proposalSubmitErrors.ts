import { getApiErrorPayload } from "@/lib/apiClient";
import { formatProposalType } from "@/lib/proposalTypes";

export function formatProposalSubmitError(error: unknown): string {
  const payload = getApiErrorPayload(error);
  const details = payload?.error ?? null;
  if (!details) return (error as Error).message ?? "Submit failed.";

  const code = typeof details.code === "string" ? details.code : "";
  if (code === "proposal_type_ineligible" || code === "tier_ineligible") {
    const requiredTier =
      typeof details.requiredTier === "string"
        ? details.requiredTier
        : "a higher tier";
    const proposalType =
      typeof details.proposalType === "string"
        ? formatProposalType(details.proposalType)
        : "this";
    return `Not eligible for ${proposalType} proposals. Required tier: ${requiredTier}.`;
  }

  if (code === "proposal_submit_ineligible") {
    const chamberId =
      typeof details.chamberId === "string" ? details.chamberId : "";
    if (chamberId === "general") {
      return "General chamber proposals require voting rights in any chamber.";
    }
    if (chamberId) {
      return `Only chamber members can submit to ${formatProposalType(chamberId)}.`;
    }
  }

  if (code === "draft_not_submittable") {
    return "Draft is incomplete. Fill required fields before submitting.";
  }

  return details.message ?? (error as Error).message ?? "Submit failed.";
}
