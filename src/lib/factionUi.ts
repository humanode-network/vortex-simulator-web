import { addressesReferToSameIdentity } from "@/lib/addressIdentity";
import { proposalSummaryPreview } from "@/lib/textPreview";
import type { FactionDto } from "@/types/api";

export type FactionMembership = NonNullable<FactionDto["memberships"]>[number];

export const FACTION_SUMMARY_PREVIEW_MAX = 280;

export function factionSummaryPreview(
  value: string,
  maxLength = FACTION_SUMMARY_PREVIEW_MAX,
): string {
  return proposalSummaryPreview(value, maxLength);
}

export function findViewerFactionMembership(
  memberships: FactionMembership[] | null | undefined,
  viewerAddress: string | null | undefined,
  options: { activeOnly?: boolean } = {},
): FactionMembership | null {
  if (!viewerAddress) return null;
  return (
    (memberships ?? []).find((membership) => {
      if (options.activeOnly && !membership.isActive) return false;
      return addressesReferToSameIdentity(membership.address, viewerAddress);
    }) ?? null
  );
}

export function hasActiveFactionMembership(
  memberships: FactionMembership[] | null | undefined,
  viewerAddress: string | null | undefined,
): boolean {
  return Boolean(
    findViewerFactionMembership(memberships, viewerAddress, {
      activeOnly: true,
    }),
  );
}

export function getFactionViewerPermissions(
  memberships: FactionMembership[] | null | undefined,
  viewerAddress: string | null | undefined,
) {
  const viewerMembership = findViewerFactionMembership(
    memberships,
    viewerAddress,
  );
  const viewerRole = viewerMembership?.isActive ? viewerMembership.role : null;
  const isFounderAdmin = viewerRole === "founder";
  const canModerateQueues =
    viewerRole === "founder" || viewerRole === "steward";
  const canJoin = Boolean(viewerAddress) && !viewerMembership?.isActive;
  const canLeave =
    Boolean(viewerAddress) &&
    Boolean(viewerMembership?.isActive) &&
    viewerRole !== "founder";

  return {
    canJoin,
    canLeave,
    canManageMembers: isFounderAdmin,
    canModerateQueues,
    isFounderAdmin,
    viewerMembership,
    viewerMembershipActive: Boolean(viewerMembership?.isActive),
    viewerRole,
  };
}
