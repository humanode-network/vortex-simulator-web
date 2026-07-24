import type {
  DraftPublicationSummaryDto,
  PublicProposalDraftKindDto,
} from "@/types/api";

export const proposalDraftRoutes = {
  create: "/app/proposals/new",
  mine: "/app/proposals/drafts",
  proposals: "/app/proposals",
  public: "/app/proposals/public-drafts",
} as const;

export function ownerDraftRoute(draftId: string): string {
  return `${proposalDraftRoutes.mine}/${encodeURIComponent(draftId)}`;
}

export function editDraftRoute(draftId: string): string {
  return `${proposalDraftRoutes.create}?draftId=${encodeURIComponent(draftId)}`;
}

export function reconsiderProposalRoute(proposalId: string): string {
  return `${proposalDraftRoutes.create}?resubmitsProposalId=${encodeURIComponent(proposalId)}`;
}

export function publicDraftRoute(draftId: string): string {
  return `${proposalDraftRoutes.public}/${encodeURIComponent(draftId)}`;
}

export function publicationRoute(
  draftId: string,
  publication: DraftPublicationSummaryDto,
): string {
  return publication.publicUrl ?? publicDraftRoute(draftId);
}

export function canPublishDraft(
  publication: DraftPublicationSummaryDto,
): boolean {
  return (
    publication.status === "private" ||
    publication.status === "withdrawn" ||
    (publication.status === "published" &&
      Boolean(publication.hasUnpublishedChanges))
  );
}

export function isPublicDraftVisible(
  publication: DraftPublicationSummaryDto,
): boolean {
  return (
    publication.status === "published" || publication.status === "submitted"
  );
}

export const publicDraftKindLabels: Record<PublicProposalDraftKindDto, string> =
  {
    policy: "Policy",
    formation: "Formation",
    system: "System change",
  };

export const publicDraftKindOptions = (
  Object.entries(publicDraftKindLabels) as Array<
    [PublicProposalDraftKindDto, string]
  >
).map(([value, label]) => ({ value, label }));
