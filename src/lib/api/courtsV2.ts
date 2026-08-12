import type {
  CourtCaseViewerV2Dto,
  CourtPrivateReportV2Dto,
  CourtReportLaneV2Dto,
  CourtReportingCapabilityV2Dto,
  CourtRuntimeStatusV2Dto,
  CourtTargetReferenceV2Dto,
  GetCourtCasesV2Response,
  GetCourtNotificationsV2Response,
  GetMyCourtReportsV2Response,
} from "@/types/api";

import { apiCommand } from "./command";
import { apiGet } from "./http";

export type CourtEvidenceInputV2 =
  | {
      kind: "vortex_reference";
      target: CourtTargetReferenceV2Dto;
      digest: string;
      provenance: string;
      access:
        | "public"
        | "parties_and_jury"
        | "jury_only_pending_summary"
        | "security_sealed";
    }
  | {
      kind: "external_url";
      url: string;
      digest: string;
      provenance: string;
      access:
        | "public"
        | "parties_and_jury"
        | "jury_only_pending_summary"
        | "security_sealed";
    }
  | {
      kind: "protocol_proof";
      proofType: string;
      verifierId: string;
      verifierVersion: string;
      digest: string;
      provenance: string;
      access:
        | "public"
        | "parties_and_jury"
        | "jury_only_pending_summary"
        | "security_sealed";
    };

export async function apiCourtRuntimeStatusV2(): Promise<CourtRuntimeStatusV2Dto> {
  return await apiGet<CourtRuntimeStatusV2Dto>("/api/reports/status");
}

export async function apiCourtReportingCapabilityV2(input: {
  target: CourtTargetReferenceV2Dto;
  incidentAt: string;
}): Promise<CourtReportingCapabilityV2Dto> {
  const query = new URLSearchParams({
    type: input.target.type,
    id: input.target.id,
    incidentAt: input.incidentAt,
  });
  if (input.target.revision) query.set("revision", input.target.revision);
  return await apiGet<CourtReportingCapabilityV2Dto>(
    `/api/reports/capability?${query}`,
  );
}

export async function apiMyCourtReportsV2(): Promise<GetMyCourtReportsV2Response> {
  return await apiGet<GetMyCourtReportsV2Response>("/api/reports/mine");
}

export async function apiCourtCasesV2(): Promise<GetCourtCasesV2Response> {
  return await apiGet<GetCourtCasesV2Response>("/api/reports/cases");
}

export async function apiCourtNotificationsV2(): Promise<GetCourtNotificationsV2Response> {
  return await apiGet<GetCourtNotificationsV2Response>(
    "/api/reports/notifications",
  );
}

export async function apiSetCourtNotificationStateV2(input: {
  notificationId: string;
  state: "read" | "dismissed";
}) {
  return await apiCommand<{ ok: true; notificationId: string; state: string }>({
    type: "court.notification.state",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

export async function apiCourtCaseV2(
  id: string,
): Promise<CourtCaseViewerV2Dto> {
  return await apiGet<CourtCaseViewerV2Dto>(
    `/api/reports/cases/${encodeURIComponent(id)}`,
  );
}

export async function apiCourtReportV2(
  id: string,
): Promise<CourtPrivateReportV2Dto> {
  return await apiGet<CourtPrivateReportV2Dto>(
    `/api/reports/mine/${encodeURIComponent(id)}`,
  );
}

export async function apiSubmitCourtReportV2(input: {
  target: CourtTargetReferenceV2Dto;
  offenseCode: string;
  lane: CourtReportLaneV2Dto;
  respondentId?: string | null;
  affectedId?: string | null;
  incidentStartsAt: string;
  incidentEndsAt?: string;
  statement: string;
  statementAccess:
    | "public"
    | "parties_and_jury"
    | "jury_only_pending_summary"
    | "security_sealed";
  evidence: CourtEvidenceInputV2[];
  immediateProtectionRequested: boolean;
  goodFaithAttested: true;
  idempotencyKey: string;
}) {
  const { idempotencyKey, ...payload } = input;
  return await apiCommand<{
    ok: true;
    type: "court.report.submit";
    reportId: string;
    reportState: string;
    caseId: string | null;
  }>({ type: "court.report.submit", payload, idempotencyKey });
}

export async function apiWithdrawCourtReportV2(input: {
  reportId: string;
  idempotencyKey: string;
}) {
  return await apiCommand<{ ok: true; reportId: string; state: string }>({
    type: "court.report.withdraw",
    payload: { reportId: input.reportId },
    idempotencyKey: input.idempotencyKey,
  });
}

export async function apiSupplementCourtReportV2(input: {
  reportId: string;
  statement: string | null;
  statementAccess: CourtEvidenceInputV2["access"];
  evidence: CourtEvidenceInputV2[];
}) {
  return await apiCommand<{ ok: true; reportId: string; state: string }>({
    type: "court.report.supplement",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

function courtIdempotencyKey(): string {
  return crypto.randomUUID();
}

export async function apiSubmitCourtResponseV2(input: {
  caseId: string;
  statement: string;
  access: "public" | "parties_and_jury";
}) {
  return await apiCommand({
    type: "court.case.respond",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

export async function apiAddCourtEvidenceV2(input: {
  caseId: string;
  statement: string | null;
  statementAccess: CourtEvidenceInputV2["access"];
  evidence: CourtEvidenceInputV2[];
}) {
  return await apiCommand({
    type: "court.case.evidence.add",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

export async function apiChallengeCourtEvidenceV2(input: {
  caseId: string;
  evidenceId: string;
  reason: string;
}) {
  return await apiCommand({
    type: "court.case.evidence.challenge",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

export async function apiRespondToCourtJuryV2(input: {
  caseId: string;
  response: "accept" | "decline";
  conflict: "clear" | "self_disclosed";
}) {
  return await apiCommand({
    type: "court.jury.respond",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

export async function apiRecuseFromCourtJuryV2(input: {
  caseId: string;
  reason: string;
}) {
  return await apiCommand({
    type: "court.jury.recuse",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

export async function apiCastCourtFindingVoteV2(
  input:
    | { caseId: string; ballotId: string; finding: "dismissed" }
    | {
        caseId: string;
        ballotId: string;
        finding: "substantiated";
        severity: "L1" | "L2" | "L3" | "L4";
      },
) {
  return await apiCommand({
    type: "court.finding.vote",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

export async function apiCastCourtRemedyVoteV2(input: {
  caseId: string;
  ballotId: string;
  authorizeSentence: boolean;
  components: {
    componentId: string;
    include: boolean;
    conditionalValue?: string | boolean;
  }[];
}) {
  return await apiCommand({
    type: "court.remedy.vote",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

export async function apiFileCourtAppealV2(input: {
  caseId: string;
  groundCode:
    | "material_procedural_error"
    | "juror_ineligibility_or_conflict"
    | "material_evidence_error"
    | "policy_or_envelope_violation"
    | "material_new_evidence"
    | "executor_mismatch";
  grounds: string;
  requestStay: boolean;
}) {
  return await apiCommand({
    type: "court.case.appeal",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

export async function apiRespondToCourtAppellateJuryV2(input: {
  panelId: string;
  response: "accept" | "decline" | "conflict";
}) {
  return await apiCommand({
    type: "court.appellate.jury.respond",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

export async function apiProposeCourtAppellateModificationV2(input: {
  panelId: string;
  retainedRemedyIds: string[];
}) {
  return await apiCommand({
    type: "court.appellate.modification.propose",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

export async function apiCastCourtAppellateVoteV2(
  input:
    | {
        panelId: string;
        result: "affirmed" | "reversed" | "remanded";
        reasoning: string;
      }
    | {
        panelId: string;
        result: "modified";
        modificationPackageId: string;
        reasoning: string;
      },
) {
  return await apiCommand({
    type: "court.appellate.vote",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

export async function apiFileCourtReopeningV2(input: {
  caseId: string;
  evidenceReference: string;
  statement: string;
}) {
  return await apiCommand({
    type: "court.reopening.file",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

export async function apiRespondToCourtReopeningJuryV2(input: {
  panelId: string;
  response: "accept" | "decline" | "conflict";
}) {
  return await apiCommand({
    type: "court.reopening.jury.respond",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}

export async function apiCastCourtReopeningVoteV2(input: {
  panelId: string;
  reopen: boolean;
  reasoning: string;
}) {
  return await apiCommand({
    type: "court.reopening.vote",
    payload: input,
    idempotencyKey: courtIdempotencyKey(),
  });
}
