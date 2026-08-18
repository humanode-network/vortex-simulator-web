import type { CourtTargetReferenceV2Dto } from "@/types/api";

export function courtReportPath(
  target: CourtTargetReferenceV2Dto,
  returnTo?: string,
): string {
  const query = new URLSearchParams({
    targetType: target.type,
    targetId: target.id,
  });
  if (target.revision) query.set("revision", target.revision);
  if (returnTo?.startsWith("/app/") && !returnTo.startsWith("//")) {
    query.set("returnTo", returnTo);
  }
  return `/app/courts/reports/new?${query.toString()}`;
}

export function courtCompositeTargetId(
  parentId: string,
  recordId: string,
): string {
  return `${encodeURIComponent(parentId)}:${recordId}`;
}
