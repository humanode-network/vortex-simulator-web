import assert from "node:assert/strict";
import { test } from "@rstest/core";

import {
  courtCompositeTargetId,
  courtReportPath,
} from "../../src/pages/courts/courtReportTarget";

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
