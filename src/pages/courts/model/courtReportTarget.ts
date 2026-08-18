import type {
  CourtTargetReferenceV2Dto,
  CourtTargetTypeV2Dto,
} from "@/types/api";

export const COURT_REPORTABLE_TARGET_TYPES = Object.freeze([
  "human_identity",
  "protocol_action",
  "public_proposal_draft",
  "proposal",
  "proposal_thread",
  "proposal_message",
  "chamber",
  "chamber_thread",
  "chamber_message",
  "faction",
  "faction_thread",
  "faction_message",
  "faction_work_item",
  "initiative",
  "initiative_board_card",
  "initiative_thread",
  "initiative_message",
  "membership_transition",
  "formation_project",
  "formation_action",
  "delegation",
  "governance_action",
  "cm_record",
  "proof_or_status_event",
  "external_incident",
] as const satisfies readonly CourtTargetTypeV2Dto[]);

const COURT_REPORTABLE_TARGET_TYPE_SET = new Set<string>(
  COURT_REPORTABLE_TARGET_TYPES,
);

export function isCourtReportableTargetType(
  value: string,
): value is CourtTargetTypeV2Dto {
  return COURT_REPORTABLE_TARGET_TYPE_SET.has(value);
}

export function safeCourtReturnPath(
  value: string | null | undefined,
  fallback: string,
): string {
  const candidate = value?.trim();
  return candidate?.startsWith("/app/") && !candidate.startsWith("//")
    ? candidate
    : fallback;
}

export function courtReportTargetFromSearchParams(
  searchParams: Pick<URLSearchParams, "get">,
): CourtTargetReferenceV2Dto | null {
  const type = searchParams.get("targetType")?.trim();
  const id = searchParams.get("targetId")?.trim();
  if (!type || !id || !isCourtReportableTargetType(type)) return null;
  const revision = searchParams.get("revision")?.trim();
  return { type, id, ...(revision ? { revision } : {}) };
}

export function courtReportPath(
  target: CourtTargetReferenceV2Dto,
  returnTo?: string,
): string {
  const query = new URLSearchParams({
    targetType: target.type,
    targetId: target.id,
  });
  if (target.revision) query.set("revision", target.revision);
  const safeReturnTo = safeCourtReturnPath(returnTo, "");
  if (safeReturnTo) query.set("returnTo", safeReturnTo);
  return `/app/courts/reports/new?${query.toString()}`;
}

export function courtCompositeTargetId(
  parentId: string,
  recordId: string,
): string {
  return `${encodeURIComponent(parentId)}:${recordId}`;
}
