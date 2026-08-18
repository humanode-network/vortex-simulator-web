import { getApiErrorPayload } from "@/lib/api/http";
import { formatLoadError } from "@/lib/errorFormatting";

export type CourtErrorCategory =
  | "authorization"
  | "deadline"
  | "runtime"
  | "stale_state"
  | "validation";

export type CourtErrorIssue = {
  category: CourtErrorCategory;
  code: string | null;
  fields: readonly string[];
  message: string;
};

const COURT_ERROR_MESSAGES: Readonly<Record<string, string>> = Object.freeze({
  COURT_APPEAL_STANDING_INVALID:
    "Your role cannot appeal this outcome under the frozen Court policy.",
  COURT_APPEAL_WINDOW_CLOSED: "The appeal deadline has passed.",
  COURT_AMENDMENT_REQUEST_INVALID:
    "This amendment request is incomplete. Reload the report before trying again.",
  COURT_AMENDMENT_FIELD_REQUIRED:
    "Complete every correction requested by Court intake before resubmitting this report.",
  COURT_BALLOT_WINDOW_CLOSED: "This ballot has closed.",
  COURT_CASE_PARTY_REQUIRED: "Only a served party may take this action.",
  COURT_CASE_STATE_CONFLICT:
    "The case moved to another step. Reload the record before trying again.",
  COURT_CASE_FINAL: "This Court record is final and can no longer be changed.",
  COURT_DEADLINE_EXPIRED: "The deadline for this Court action has passed.",
  COURT_EVIDENCE_VERIFIER_UNREGISTERED:
    "The selected proof verifier is not registered for this Court policy.",
  COURT_FINDING_SEVERITY_NOT_ALLOWED:
    "That severity is outside the frozen range for this offense.",
  COURT_JURY_INVITATION_EXPIRED: "This jury invitation has expired.",
  COURT_PARTY_SERVICE_REQUIRED:
    "The Court must record service before this party action is available.",
  COURT_PROTECTIVE_REVIEW_UNAVAILABLE:
    "Immediate protective review is not authorized for this report.",
  COURT_REPORT_REASON_UNAVAILABLE:
    "That reason is not available for this record and incident time.",
  COURT_REPORT_EVIDENCE_ACCESS_BROADENED:
    "An amendment cannot make protected report material visible to a wider audience.",
  COURT_REPORT_BUNDLE_FIELDS_LOCKED:
    "The respondent and incident window are locked after this report joins a Court case bundle.",
  COURT_REPORT_STATE_CONFLICT:
    "The report moved to another state. Reload it before trying again.",
  COURT_REOPENING_LIMIT_REACHED:
    "This case has reached the policy limit for reopening requests.",
  COURT_REOPENING_WINDOW_CLOSED: "The reopening window has closed.",
  COURT_SENTENCE_VALUE_INVALID:
    "One or more remedy values are outside the frozen sentence envelope.",
});

const COURT_REPORTING_UNAVAILABLE_MESSAGES: Readonly<Record<string, string>> =
  Object.freeze({
    adapter_failure:
      "The Court could not verify this record. Try again after the record reloads.",
    policy_unavailable:
      "The active Court policy does not accept reports for this record.",
    population_unavailable:
      "The Court could not verify the eligible reporter population for this incident time.",
    reporter_not_eligible:
      "You do not have reporting standing for this record and incident time.",
    request_invalid: "The record or incident time could not be verified.",
    standing_not_verified:
      "The Court could not verify your standing for the available reasons.",
    target_not_found: "This record no longer exists.",
    target_not_visible: "You no longer have access to this record.",
    target_unsupported:
      "This type of record cannot be reported through the Court.",
  });

export function courtReportingUnavailableMessage(reason: string): string {
  return (
    COURT_REPORTING_UNAVAILABLE_MESSAGES[reason] ??
    "Reporting is unavailable for this record right now."
  );
}

function stringArray(value: unknown): readonly string[] {
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && Boolean(item.trim()),
      )
    : [];
}

function categoryFor(
  code: string | null,
  status: number | null,
): CourtErrorCategory {
  if (status === 401 || status === 403 || code?.includes("AUTHORIZATION")) {
    return "authorization";
  }
  if (code?.includes("WINDOW_CLOSED") || code?.includes("EXPIRED")) {
    return "deadline";
  }
  if (status === 409 || code?.includes("STATE_CONFLICT")) return "stale_state";
  if (
    status === 503 ||
    code?.includes("UNAVAILABLE") ||
    code?.includes("DISABLED")
  ) {
    return "runtime";
  }
  return "validation";
}

export function courtErrorIssue(error: unknown): CourtErrorIssue {
  const payload = getApiErrorPayload(error)?.error;
  const code = typeof payload?.code === "string" ? payload.code : null;
  const status =
    error && typeof error === "object" && "status" in error
      ? Number((error as { status?: unknown }).status)
      : null;
  const fields = stringArray(payload?.fields ?? payload?.field);
  const raw = error instanceof Error ? error.message : String(error);
  return Object.freeze({
    category: categoryFor(code, Number.isFinite(status) ? status : null),
    code,
    fields: Object.freeze([...fields]),
    message:
      (code ? COURT_ERROR_MESSAGES[code] : null) ??
      formatLoadError(raw, "The Court action could not be completed."),
  });
}
