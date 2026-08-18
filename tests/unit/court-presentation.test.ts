import assert from "node:assert/strict";
import { test } from "@rstest/core";

import {
  COURT_APPEAL_GROUNDS,
  compactCourtAuditValue,
  courtAppealGroundDisplay,
  courtCaseDeadline,
  courtEventFacts,
  courtCaseStateDisplay,
  courtLaneDisplay,
  courtOffenseDisplay,
  courtRemedyLabel,
  courtReportStateDisplay,
  courtRemedyExpiry,
  courtEventDisplay,
  formatCourtDuration,
  courtSeverityDisplay,
  courtStandingDisplay,
} from "../../src/pages/courts/model/courtPresentation";
import type {
  CourtCaseViewerV2Dto,
  CourtCaseStateV2Dto,
  CourtReportLaneV2Dto,
  CourtReportStateV2Dto,
} from "../../src/types/api";

function viewerTaskFixture(
  task: Pick<CourtCaseViewerV2Dto, "appellateTask" | "juryTask">,
): CourtCaseViewerV2Dto {
  return {
    publicCase: null,
    partyRecord: null,
    caseRecord: null,
    evidence: [],
    juryTask: task.juryTask,
    appellateTask: task.appellateTask,
    safetyRecord: null,
    enforcementRecord: null,
    capabilities: {},
  };
}

const reportStates: CourtReportStateV2Dto[] = [
  "submitted",
  "needs_amendment",
  "collecting",
  "routed_to_correction",
  "routed_to_moderation",
  "grouped",
  "withdrawn",
  "expired",
  "closed_without_case",
  "triggered",
];

const caseStates: CourtCaseStateV2Dto[] = [
  "case_opened",
  "awaiting_jury_capacity",
  "jury_selection",
  "notice_and_response",
  "evidence_exchange",
  "deliberation",
  "finding_ballot",
  "dismissed",
  "substantiated",
  "sentence_ballot",
  "sentence_calculation",
  "enforcement_pending",
  "substantiated_without_punitive_sentence",
  "no_enforceable_remedy",
  "appeal_window",
  "final",
  "appealed",
  "remanded",
  "reopened",
];

test("every report and case state has plain-language guidance", () => {
  for (const state of reportStates) {
    const display = courtReportStateDisplay(state);
    assert.ok(display.label.length > 2);
    assert.ok(display.description.length > 20);
    assert.doesNotMatch(display.label, /_/);
  }
  for (const state of caseStates) {
    const display = courtCaseStateDisplay(state);
    assert.ok(display.label.length > 2);
    assert.ok(display.description.length > 20);
    assert.doesNotMatch(display.label, /_/);
  }
});

test("decision vocabulary is readable while immutable codes remain available", () => {
  for (const lane of [
    "correction",
    "scoped_moderation",
    "court_report",
    "safety_or_protocol_incident",
  ] satisfies CourtReportLaneV2Dto[]) {
    assert.ok(courtLaneDisplay(lane).description.length > 20);
  }
  for (const ground of COURT_APPEAL_GROUNDS) {
    assert.ok(courtAppealGroundDisplay(ground).description.length > 20);
  }
  for (const severity of ["L1", "L2", "L3", "L4"] as const) {
    assert.match(courtSeverityDisplay(severity).label, new RegExp(severity));
  }
  assert.equal(courtOffenseDisplay("GOV-03").label, "Voter coercion");
  assert.equal(courtRemedyLabel("D-02"), "Censure");
  assert.equal(courtRemedyLabel("future-code"), "future-code");
});

test("standing copy separates the referenced legal term from its verification", () => {
  assert.deepEqual(
    courtStandingDisplay({ direct: true, source: "target_owner" }),
    {
      label: "Direct standing",
      verification: "Verified by Target Owner",
      description: "This report can be assessed on its own trigger path.",
    },
  );
  assert.equal(
    courtStandingDisplay({
      directStanding: false,
      source: "community-threshold",
    }).label,
    "Community eligibility",
  );
});

test("long audit values stay readable while preserving their identifying ends", () => {
  const digest = `sha256:${"a".repeat(64)}`;
  const compact = compactCourtAuditValue(digest);
  assert.ok(compact.length <= 32);
  assert.match(compact, /^sha256:a+/);
  assert.match(compact, /a+$/);
  assert.match(compact, /\.\.\./);
  assert.equal(compactCourtAuditValue("sha256:target"), "sha256:target");
});

test("procedural events and remedy durations are readable without losing audit values", () => {
  assert.equal(
    courtEventDisplay("party_response_submitted").label,
    "Party response submitted",
  );
  assert.equal(
    courtEventDisplay("future_procedure_event").label,
    "Future Procedure Event",
  );
  assert.equal(formatCourtDuration("90000"), "1 day 1 hour (90000 seconds)");
  assert.equal(formatCourtDuration(null), "Not time-limited");
});

test("invitation deadlines take precedence over general case schedules", () => {
  const appellateDueAt = "2026-08-18T10:00:00.000Z";
  assert.deepEqual(
    courtCaseDeadline(
      viewerTaskFixture({
        juryTask: null,
        appellateTask: {
          panelId: "panel-1",
          kind: "ordinary",
          panelState: "selection",
          seatNumber: 2,
          invitationDueAt: appellateDueAt,
          result: null,
          brief: {
            kind: "ordinary",
            appealId: "appeal-1",
            groundCode: "material_procedural_error",
            groundsDigest: "sha256:grounds",
            grounds: "The proceeding may contain a material procedural error.",
            stayState: "none",
            deadlineAt: "2026-08-21T10:00:00.000Z",
            filedAt: "2026-08-14T10:00:00.000Z",
          },
          remedies: [],
          existingVote: null,
          modificationPackages: [],
        },
      }),
    ),
    { dueAt: appellateDueAt, label: "Panel response due" },
  );

  const juryDueAt = "2026-08-17T10:00:00.000Z";
  assert.deepEqual(
    courtCaseDeadline(
      viewerTaskFixture({
        appellateTask: null,
        juryTask: {
          selectionRound: 1,
          seatNumber: null,
          conflictResult: "pending",
          state: "invited",
          selectedAt: "2026-08-14T10:00:00.000Z",
          invitationDueAt: juryDueAt,
          respondedAt: null,
          ballot: null,
        },
      }),
    ),
    { dueAt: juryDueAt, label: "Jury response due" },
  );
});

test("timeline facts expose only decision-safe procedural fields", () => {
  assert.deepEqual(
    courtEventFacts({
      operationId: "private-operation-id",
      outcome: "substantiated",
      severity: "L3",
      offenseCode: "GOV-03",
      componentCode: "G-04",
      evidenceStandard: "E2",
      support: 9,
      authorized: true,
      policyVersion: "court-codex-v1",
      privateNotice: "do not render",
    }),
    [
      { label: "Outcome", value: "Substantiated" },
      { label: "Severity", reference: "L3", value: "L3" },
      { label: "Offense", reference: "GOV-03", value: "GOV-03" },
      { label: "Remedy", reference: "G-04", value: "G-04" },
      { label: "Evidence standard", reference: "E2", value: "E2" },
      { label: "Support", value: "9 of 12" },
      { label: "Sentence authorized", value: "Yes" },
      {
        label: "Policy",
        reference: "court-codex-v1",
        value: "court-codex-v1",
      },
    ],
  );
});

test("finite remedy duration produces an auditable scheduled end", () => {
  assert.equal(
    courtRemedyExpiry({
      createdAt: "2026-08-10T00:00:00.000Z",
      durationSeconds: "86400",
    }),
    "2026-08-11T00:00:00.000Z",
  );
  assert.equal(
    courtRemedyExpiry({
      createdAt: "2026-08-10T00:00:00.000Z",
      durationSeconds: null,
    }),
    null,
  );
});
