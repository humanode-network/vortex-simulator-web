import type {
  CourtCaseStateV2Dto,
  CourtCaseViewerV2Dto,
  CourtMyReportItemV2Dto,
  CourtRemedyV2Dto,
  CourtReportLaneV2Dto,
  CourtReportStateV2Dto,
} from "@/types/api";
import {
  HUMANODE_CODEX_JURY_SIZE,
  humanodeCodexMeasuresByCode,
  humanodeCodexOffensesByCode,
} from "@/data/humanodeCodex";

type CourtDisplayEntry = {
  description: string;
  label: string;
};

function readableCourtCode(value: string): string {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function compactCourtAuditValue(value: string, limit = 32): string {
  if (value.length <= limit) return value;
  const separator = value.indexOf(":");
  const stablePrefix =
    separator > 0 && separator < 12 ? value.slice(0, separator + 1) : "";
  const available = Math.max(10, limit - stablePrefix.length - 3);
  const leading = Math.ceil(available * 0.58);
  const trailing = available - leading;
  const body = stablePrefix ? value.slice(stablePrefix.length) : value;
  return `${stablePrefix}${body.slice(0, leading)}...${body.slice(-trailing)}`;
}

export type CourtReportProcessContext = {
  basis: string;
  destination: string;
  nextStep: string;
};

export type CourtReportActionProgress = {
  current: number;
  description?: string;
  label: string;
  required: number;
  viewerCounts?: boolean;
};

export type CourtStandingDisplay = CourtDisplayEntry & {
  verification: string;
};

export function courtStandingDisplay(standing: {
  direct?: boolean;
  directStanding?: boolean;
  source: string;
}): CourtStandingDisplay {
  const direct = standing.direct ?? standing.directStanding ?? false;
  return {
    label: direct ? "Direct standing" : "Community eligibility",
    verification: `Verified by ${readableCourtCode(standing.source)}`,
    description: direct
      ? "This report can be assessed on its own trigger path."
      : "This report joins a private collection without exposing reporter counts or thresholds.",
  };
}

export function courtReportLaneChoiceLabel(lane: CourtReportLaneV2Dto): string {
  if (lane === "correction") return "Correction route";
  if (lane === "court_report") return "Court review";
  return courtLaneDisplay(lane).label;
}

export function courtReportRouteDescription(
  lane: CourtReportLaneV2Dto,
  standing: { direct?: boolean; directStanding?: boolean },
): string {
  if (lane === "correction") {
    return "This joins the private Governor correction threshold for the same record revision and reason. Reaching the threshold routes the correction without opening a Court case.";
  }
  if (lane === "scoped_moderation") {
    return "This sends the record to the authorized moderation process. It does not join a Court trigger or open a case.";
  }
  if (lane === "safety_or_protocol_incident") {
    return "This sends evidence to the authorized safety or protocol incident process instead of the community Court trigger.";
  }
  const direct = standing.direct ?? standing.directStanding ?? false;
  return direct
    ? "This enters Court review and can open a case through verified direct standing."
    : "This enters the private community trigger. A case opens only after the protected reporting threshold is reached.";
}

export function courtReportActionProgress(
  report: Pick<CourtMyReportItemV2Dto, "lane" | "state" | "triggerProgress">,
): CourtReportActionProgress | null {
  if (report.triggerProgress) {
    return {
      current: report.triggerProgress.qualifyingReports,
      label: "Governor reports",
      required: report.triggerProgress.requiredReports,
      viewerCounts: report.triggerProgress.viewerReportCounts,
    };
  }
  if (
    report.lane === "scoped_moderation" &&
    report.state === "routed_to_moderation"
  ) {
    return {
      current: 1,
      description:
        "This accepted report routed the moderation action immediately. No additional reports are required.",
      label: "Moderation action",
      required: 1,
    };
  }
  return null;
}

export function courtReportProcessContext(
  report: Pick<
    CourtMyReportItemV2Dto,
    "lane" | "state" | "standing" | "caseId"
  > & { triggerKind?: string | null },
): CourtReportProcessContext {
  const standing = courtStandingDisplay(report.standing);
  const basis = `${standing.label} ${standing.verification.toLowerCase()}`;
  if (report.state === "routed_to_correction") {
    return {
      basis,
      destination: "Target-owner correction",
      nextStep:
        "The responsible module reviews and corrects the source record.",
    };
  }
  if (report.state === "routed_to_moderation") {
    return {
      basis,
      destination: "Scoped moderation",
      nextStep: "The responsible workspace applies its moderation process.",
    };
  }
  if (report.caseId || report.state === "triggered") {
    return {
      basis,
      destination: report.triggerKind
        ? `${readableCourtCode(report.triggerKind)} Court case`
        : "Court case",
      nextStep:
        "Follow the linked case for notice, evidence, decision, and appeal.",
    };
  }
  if (report.state === "collecting" || report.state === "grouped") {
    return {
      basis,
      destination: "Private incident collection",
      nextStep:
        "The report remains active while reporter identities stay private. The aggregate Governor count updates as matching reports qualify.",
    };
  }
  if (report.state === "needs_amendment") {
    return {
      basis,
      destination: "Intake amendment",
      nextStep: "Address the requested fields before the amendment deadline.",
    };
  }
  if (report.state === "submitted") {
    return {
      basis,
      destination: "Court intake",
      nextStep: "Intake is checking jurisdiction, completeness, and routing.",
    };
  }
  return {
    basis,
    destination: courtReportStateDisplay(report.state).label,
    nextStep: courtReportStateDisplay(report.state).description,
  };
}

const REPORT_STATES: Readonly<
  Record<CourtReportStateV2Dto, CourtDisplayEntry>
> = Object.freeze({
  submitted: {
    label: "Submitted",
    description:
      "The report was received and is awaiting deterministic intake processing.",
  },
  needs_amendment: {
    label: "Needs amendment",
    description: "More information is required before this report can proceed.",
  },
  collecting: {
    label: "Collecting",
    description:
      "The report is active. You may add relevant information or withdraw it.",
  },
  routed_to_correction: {
    label: "Routed to correction",
    description:
      "The target-owning module will handle this as a correction, not a Court case.",
  },
  routed_to_moderation: {
    label: "Routed to moderation",
    description:
      "The target-owning module will review this under its scoped moderation rules.",
  },
  grouped: {
    label: "Grouped",
    description:
      "This report joined the matching private collection and is waiting for its Governor threshold.",
  },
  withdrawn: {
    label: "Withdrawn",
    description: "You withdrew this report from active consideration.",
  },
  expired: {
    label: "Expired",
    description:
      "The collection or amendment window ended without a case trigger.",
  },
  closed_without_case: {
    label: "Closed without a case",
    description: "Intake completed without opening a Court case.",
  },
  triggered: {
    label: "Case opened",
    description:
      "The report contributed to a Court case. Follow the case for procedure and decisions.",
  },
});

const CASE_STATES: Readonly<Record<CourtCaseStateV2Dto, CourtDisplayEntry>> =
  Object.freeze({
    case_opened: {
      label: "Case opened",
      description: "The case record and initial schedule are being prepared.",
    },
    awaiting_jury_capacity: {
      label: "Awaiting jury capacity",
      description:
        "The required independent Governor jury is not yet available.",
    },
    jury_selection: {
      label: "Jury selection",
      description:
        "Invited Governors are accepting seats or disclosing conflicts.",
    },
    notice_and_response: {
      label: "Notice and response",
      description:
        "Parties have been notified and the response window is open.",
    },
    evidence_exchange: {
      label: "Evidence exchange",
      description:
        "Parties may add and challenge evidence before deliberation.",
    },
    deliberation: {
      label: "Deliberation",
      description: "The seated jury is reviewing the authorized case record.",
    },
    finding_ballot: {
      label: "Finding ballot",
      description:
        "Jurors are deciding whether the allegation is substantiated.",
    },
    dismissed: {
      label: "Dismissed",
      description:
        "The allegation was not substantiated. No punitive sentence follows.",
    },
    substantiated: {
      label: "Substantiated",
      description:
        "The allegation was substantiated and the remedy stage may follow.",
    },
    sentence_ballot: {
      label: "Remedy ballot",
      description: "Jurors are voting inside the frozen sentencing envelope.",
    },
    sentence_calculation: {
      label: "Sentence calculation",
      description: "The server is calculating the bounded jury remedy package.",
    },
    enforcement_pending: {
      label: "Enforcement pending",
      description: "Approved remedies are awaiting their registered executors.",
    },
    substantiated_without_punitive_sentence: {
      label: "Substantiated without punitive sentence",
      description: "The finding stands without a punitive remedy package.",
    },
    no_enforceable_remedy: {
      label: "No enforceable remedy",
      description:
        "No approved remedy can be executed under current authority.",
    },
    appeal_window: {
      label: "Appeal window",
      description: "An eligible party may file an appeal before the deadline.",
    },
    final: {
      label: "Final",
      description:
        "Ordinary procedure is complete; only an authorized reopening can change finality.",
    },
    appealed: {
      label: "Appealed",
      description:
        "A separate appellate panel is reviewing the challenged decision.",
    },
    remanded: {
      label: "Remanded",
      description:
        "The case was returned for a new trial under the appellate decision.",
    },
    reopened: {
      label: "Reopened",
      description: "Verified new evidence opened a new trial record.",
    },
  });

export const COURT_CASE_STATE_OPTIONS = Object.freeze(
  Object.keys(CASE_STATES) as CourtCaseStateV2Dto[],
);

const LANES: Readonly<Record<CourtReportLaneV2Dto, CourtDisplayEntry>> =
  Object.freeze({
    correction: {
      label: "Correction",
      description: "Routes a correctable record to the module that owns it.",
    },
    scoped_moderation: {
      label: "Scoped moderation",
      description:
        "Routes content to the authorized moderation process for that surface.",
    },
    court_report: {
      label: "Court report",
      description:
        "Enters the report and trigger process for possible adjudication.",
    },
    safety_or_protocol_incident: {
      label: "Safety or protocol incident",
      description:
        "Routes urgent safety or protocol evidence to the authorized incident process.",
    },
  });

export const COURT_APPEAL_GROUNDS = Object.freeze([
  "material_procedural_error",
  "juror_ineligibility_or_conflict",
  "material_evidence_error",
  "policy_or_envelope_violation",
  "material_new_evidence",
  "executor_mismatch",
] as const);

const APPEAL_GROUNDS: Readonly<
  Record<(typeof COURT_APPEAL_GROUNDS)[number], CourtDisplayEntry>
> = Object.freeze({
  material_procedural_error: {
    label: "Material procedural error",
    description: "A procedural failure could have changed the result.",
  },
  juror_ineligibility_or_conflict: {
    label: "Juror ineligibility or conflict",
    description: "A seated juror was ineligible or had a material conflict.",
  },
  material_evidence_error: {
    label: "Material evidence error",
    description:
      "Evidence was wrongly admitted, excluded, or materially misread.",
  },
  policy_or_envelope_violation: {
    label: "Policy or envelope violation",
    description: "The decision or remedy exceeded the frozen policy rules.",
  },
  material_new_evidence: {
    label: "Material new evidence",
    description: "New evidence could materially change the decision.",
  },
  executor_mismatch: {
    label: "Executor mismatch",
    description: "Enforcement did not match the approved remedy package.",
  },
});

const SEVERITIES: Readonly<
  Record<"L1" | "L2" | "L3" | "L4", CourtDisplayEntry>
> = Object.freeze({
  L1: {
    label: "L1 · Low impact",
    description: "Negligent or low-impact procedural misconduct.",
  },
  L2: {
    label: "L2 · Material",
    description: "Material or repeated misconduct with bounded impact.",
  },
  L3: {
    label: "L3 · Serious",
    description:
      "Deliberate serious abuse, fraud, compromise, or coordinated manipulation.",
  },
  L4: {
    label: "L4 · Critical",
    description:
      "Catastrophic, violent, systemic, or repeated critical misconduct.",
  },
});

export function courtOffenseDisplay(
  code: string | null | undefined,
): CourtDisplayEntry {
  if (!code)
    return {
      label: "Allegation pending",
      description: "No final public finding has been recorded.",
    };
  const offense = humanodeCodexOffensesByCode.get(code);
  return offense
    ? { label: offense.title, description: offense.definition }
    : {
        label: code,
        description: "See the frozen Court policy for this offense.",
      };
}

export function courtReportStateDisplay(
  state: CourtReportStateV2Dto,
): CourtDisplayEntry {
  return REPORT_STATES[state];
}

export function courtCaseStateDisplay(
  state: CourtCaseStateV2Dto,
): CourtDisplayEntry {
  return CASE_STATES[state];
}

export function courtLaneDisplay(
  lane: CourtReportLaneV2Dto,
): CourtDisplayEntry {
  return LANES[lane];
}

export function courtAppealGroundDisplay(
  ground: (typeof COURT_APPEAL_GROUNDS)[number],
): CourtDisplayEntry {
  return APPEAL_GROUNDS[ground];
}

export function courtSeverityDisplay(
  severity: "L1" | "L2" | "L3" | "L4",
): CourtDisplayEntry {
  return SEVERITIES[severity];
}

export function courtRemedyLabel(code: string): string {
  return humanodeCodexMeasuresByCode.get(code)?.title ?? code;
}

const COURT_EVENTS: Readonly<Record<string, CourtDisplayEntry>> = Object.freeze(
  {
    case_opened: {
      label: "Case opened",
      description: "The Court created the case record and initial schedule.",
    },
    jury_candidates_selected: {
      label: "Jury invitations issued",
      description: "Eligible Governors were selected for jury service.",
    },
    jury_invitation_responded: {
      label: "Jury invitation answered",
      description: "An invited Governor answered the service request.",
    },
    jury_recused: {
      label: "Juror recused",
      description:
        "A juror left the panel after disclosing an inability to serve.",
    },
    party_service_confirmed: {
      label: "Party notice confirmed",
      description: "Delivery of the Court notice was confirmed.",
    },
    party_service_invalidated: {
      label: "Party notice invalidated",
      description:
        "A prior notice record was invalidated and requires correction.",
    },
    party_response_submitted: {
      label: "Party response submitted",
      description: "A party added a response to the protected case record.",
    },
    case_evidence_added: {
      label: "Evidence added",
      description:
        "A new evidence reference entered the authorized case record.",
    },
    evidence_challenged: {
      label: "Evidence challenged",
      description: "A party recorded a challenge to an evidence item.",
    },
    finding_closed: {
      label: "Finding ballot closed",
      description: "The Court closed the jury finding ballot.",
    },
    sentence_ballot_opened: {
      label: "Remedy ballot opened",
      description: "The bounded remedy ballot opened for the seated jury.",
    },
    sentence_ballot_closed: {
      label: "Remedy ballot closed",
      description: "The Court closed the jury remedy ballot.",
    },
    sentence_calculated: {
      label: "Remedy package calculated",
      description: "The server calculated the bounded jury remedy package.",
    },
    enforcement_settled: {
      label: "Enforcement settled",
      description:
        "Registered executors reported the approved remedies settled.",
    },
    appeal_window_opened: {
      label: "Appeal window opened",
      description: "Eligible parties may file an appeal before the deadline.",
    },
    appeal_filed: {
      label: "Appeal filed",
      description: "An eligible party requested appellate review.",
    },
    appeal_withdrawn: {
      label: "Appeal withdrawn",
      description: "The filing party withdrew the active appeal.",
    },
    appeal_decided: {
      label: "Appeal decided",
      description: "The appellate panel recorded its final result.",
    },
    reopening_requested: {
      label: "Reopening requested",
      description: "A verified new-evidence review was requested.",
    },
    reopening_denied: {
      label: "Reopening denied",
      description: "The panel kept the final decision in place.",
    },
    reopening_granted: {
      label: "Reopening granted",
      description:
        "The panel authorized a new trial based on verified evidence.",
    },
  },
);

export function courtEventDisplay(eventType: string): CourtDisplayEntry {
  return (
    COURT_EVENTS[eventType] ?? {
      label: eventType
        .split("_")
        .filter(Boolean)
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(" "),
      description:
        "A procedural event was recorded in the immutable case history.",
    }
  );
}

export function formatCourtDuration(seconds: string | null): string {
  if (!seconds || !/^\d+$/.test(seconds)) return "Not time-limited";
  const total = Number(seconds);
  if (!Number.isSafeInteger(total)) return `${seconds} seconds`;
  const units = [
    { label: "day", seconds: 86_400 },
    { label: "hour", seconds: 3_600 },
    { label: "minute", seconds: 60 },
  ] as const;
  let remainder = total;
  const parts: string[] = [];
  for (const unit of units) {
    const count = Math.floor(remainder / unit.seconds);
    if (count > 0) {
      parts.push(`${count} ${unit.label}${count === 1 ? "" : "s"}`);
      remainder %= unit.seconds;
    }
    if (parts.length === 2) break;
  }
  if (parts.length === 0)
    parts.push(`${total} second${total === 1 ? "" : "s"}`);
  return `${parts.join(" ")} (${seconds} seconds)`;
}

export function courtRemedyExpiry(
  remedy: Pick<CourtRemedyV2Dto, "createdAt" | "durationSeconds">,
): string | null {
  if (!remedy.durationSeconds || !/^\d+$/.test(remedy.durationSeconds))
    return null;
  const seconds = Number(remedy.durationSeconds);
  const createdAt = Date.parse(remedy.createdAt);
  if (!Number.isSafeInteger(seconds) || !Number.isFinite(createdAt))
    return null;
  const expiresAt = new Date(createdAt + seconds * 1_000);
  return Number.isFinite(expiresAt.getTime()) ? expiresAt.toISOString() : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function courtSnapshotTitle(
  snapshot: Record<string, unknown>,
): string | null {
  for (const key of ["title", "name", "subject", "summary"]) {
    const value = snapshot[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function courtCaseDeadline(item: CourtCaseViewerV2Dto): {
  dueAt: string;
  label: string;
} | null {
  if (item.appellateTask?.panelState === "selection") {
    return {
      dueAt: item.appellateTask.invitationDueAt,
      label: "Panel response due",
    };
  }
  if (item.juryTask?.state === "invited") {
    return {
      dueAt: item.juryTask.invitationDueAt,
      label: "Jury response due",
    };
  }
  const ballot = item.juryTask?.ballot;
  if (ballot?.closesAt) {
    return {
      dueAt: ballot.closesAt,
      label: ballot.type === "finding" ? "Finding vote due" : "Remedy vote due",
    };
  }
  const courtCase = item.publicCase;
  if (!courtCase) return null;
  const keyByState: Partial<Record<CourtCaseStateV2Dto, string>> = {
    jury_selection: "juryAcceptance",
    notice_and_response: "partyResponse",
    evidence_exchange: "evidenceExchange",
    deliberation: "deliberation",
    appeal_window: "appeal",
    awaiting_jury_capacity: "juryCapacityReview",
  };
  const key = keyByState[courtCase.state];
  if (!key) return null;
  const value = record(courtCase.schedule[key])?.dueAt;
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    return null;
  const labelByState: Partial<Record<CourtCaseStateV2Dto, string>> = {
    jury_selection: "Jury response due",
    notice_and_response: "Response due",
    evidence_exchange: "Evidence closes",
    deliberation: "Deliberation closes",
    appeal_window: "Appeal due",
    awaiting_jury_capacity: "Capacity review",
  };
  return { dueAt: value, label: labelByState[courtCase.state] ?? "Due" };
}

export function courtNotificationMessage(notification: {
  kind: string;
  payload: Record<string, unknown>;
}): string | null {
  for (const key of ["message", "summary", "reason", "title"]) {
    const value = notification.payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function courtEventFacts(
  payload: Readonly<Record<string, unknown>>,
): readonly { label: string; reference?: string; value: string }[] {
  const facts: { label: string; reference?: string; value: string }[] = [];
  const addText = (
    key: string,
    label: string,
    reference?: (value: string) => string,
  ) => {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      facts.push({
        label,
        value: reference ? value : readableCourtCode(value),
        ...(reference ? { reference: reference(value) } : {}),
      });
    }
  };
  const addBoolean = (key: string, label: string) => {
    const value = payload[key];
    if (typeof value === "boolean") {
      facts.push({ label, value: value ? "Yes" : "No" });
    }
  };
  const addCount = (key: string, label: string, total?: number) => {
    const value = payload[key];
    if (
      typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value >= 0
    ) {
      facts.push({
        label,
        value: total ? `${value} of ${total}` : String(value),
      });
    }
  };

  addText("outcome", "Outcome");
  addText("severity", "Severity", (value) => value);
  addText("offenseCode", "Offense", (value) => value);
  addText("componentCode", "Remedy", (value) => value);
  addText("evidenceStandard", "Evidence standard", (value) => value);
  addCount("support", "Support", HUMANODE_CODEX_JURY_SIZE);
  addBoolean("authorized", "Sentence authorized");
  addBoolean("enforceable", "Enforceable remedy");
  addCount("seatCount", "Seated jurors", HUMANODE_CODEX_JURY_SIZE);
  addCount("eligibleCount", "Eligible governors");
  addCount("requiredCount", "Required governors");
  addText("evidenceId", "Evidence record");
  const evidenceIds = payload.evidenceIds;
  if (Array.isArray(evidenceIds)) {
    facts.push({
      label: "Evidence records",
      value: String(evidenceIds.length),
    });
  }
  addText("requestId", "Request");
  addText("appealId", "Appeal");
  addText("basis", "Basis");
  addText("authorityBasis", "Authority");
  addText("policyVersion", "Policy", (value) => value);
  return Object.freeze(facts);
}
