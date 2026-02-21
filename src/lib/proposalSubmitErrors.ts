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
      typeof details.chamberId === "string"
        ? details.chamberId
        : "this chamber";
    return `Submission to ${formatProposalType(chamberId)} was blocked by outdated chamber-membership gating. Any eligible human node can submit to any chamber; refresh and retry.`;
  }

  if (code === "draft_not_submittable") {
    return "Draft is incomplete. Fill required fields before submitting.";
  }

  return details.message ?? (error as Error).message ?? "Submit failed.";
}
