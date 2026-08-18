import assert from "node:assert/strict";
import { test } from "@rstest/core";

import {
  courtCompositeTargetId,
  courtReportPath,
  courtReportTargetFromSearchParams,
  safeCourtReturnPath,
} from "../../src/pages/courts/model/courtReportTarget";

test("Court report targets preserve canonical ids and safe return context", () => {
  assert.equal(
    courtCompositeTargetId("general:assembly", "hmrReporter"),
    "general%3Aassembly:hmrReporter",
  );
  assert.equal(
    courtReportPath(
      {
        type: "delegation",
        id: "general%3Aassembly:hmrReporter",
        revision: "revision 2",
      },
      "/app/human-nodes/hmrReporter?tab=governance",
    ),
    "/app/courts/reports/new?targetType=delegation&targetId=general%253Aassembly%3AhmrReporter&revision=revision+2&returnTo=%2Fapp%2Fhuman-nodes%2FhmrReporter%3Ftab%3Dgovernance",
  );
});

test("Court report paths reject external return destinations", () => {
  assert.equal(
    courtReportPath(
      { type: "proposal", id: "proposal-1" },
      "https://example.test/app/proposals/proposal-1",
    ),
    "/app/courts/reports/new?targetType=proposal&targetId=proposal-1",
  );
});

test("Court report query parsing accepts only known target types", () => {
  assert.deepEqual(
    courtReportTargetFromSearchParams(
      new URLSearchParams(
        "targetType=initiative&targetId=initiative-1&revision=revision-2",
      ),
    ),
    { type: "initiative", id: "initiative-1", revision: "revision-2" },
  );
  assert.equal(
    courtReportTargetFromSearchParams(
      new URLSearchParams("targetType=made_up&targetId=record-1"),
    ),
    null,
  );
  assert.equal(
    courtReportTargetFromSearchParams(
      new URLSearchParams("targetType=proposal&targetId=%20"),
    ),
    null,
  );
});

test("Court return paths remain inside the app", () => {
  assert.equal(
    safeCourtReturnPath(" /app/proposals/proposal-1 ", "/app/courts"),
    "/app/proposals/proposal-1",
  );
  assert.equal(
    safeCourtReturnPath("https://example.test/app/courts", "/app/courts"),
    "/app/courts",
  );
  assert.equal(
    safeCourtReturnPath("//example.test/app/courts", "/app/courts"),
    "/app/courts",
  );
});
