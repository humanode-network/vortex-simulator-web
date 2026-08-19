import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "@rstest/core";

import type {
  CourtCaseStateV2Dto,
  CourtReportReceiptV2Dto,
  CourtTargetReferenceV2Dto,
} from "../../src/types/api";

test("Courts v2 receipt types keep report and case state separate", () => {
  const receipt: CourtReportReceiptV2Dto = {
    reportId: "report-fixture",
    lane: "court_report",
    state: "collecting",
  };
  const caseState: CourtCaseStateV2Dto = "awaiting_jury_capacity";
  const target: CourtTargetReferenceV2Dto = {
    type: "initiative_board_card",
    id: "card-fixture",
    revision: "revision-1",
  };

  assert.equal(receipt.state, "collecting");
  assert.equal(caseState, "awaiting_jury_capacity");
  assert.equal(target.type, "initiative_board_card");
});

test("blocked Court pages do not fetch or render legacy case data", () => {
  const courts = readFileSync(
    join(process.cwd(), "src/pages/courts/Courts.tsx"),
    "utf8",
  );
  const courtroom = readFileSync(
    join(process.cwd(), "src/pages/courts/Courtroom.tsx"),
    "utf8",
  );
  const combined = `${courts}\n${courtroom}`;

  assert.doesNotMatch(combined, /apiCourts|apiCourtReport|apiCourtVerdict/);
  assert.doesNotMatch(combined, /courtsBlocked|27 this week|12 seats \/ case/);
  assert.match(combined, /CourtsUnavailable/);
});
