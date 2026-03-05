import { test } from "@rstest/core";
import assert from "node:assert/strict";

import {
  formatProposalStageTransitionMessage,
  shouldNavigateToCanonicalRoute,
} from "../../src/pages/proposals/useProposalStageSync.ts";

test("shouldNavigateToCanonicalRoute prevents redirect loops on same path", () => {
  assert.equal(
    shouldNavigateToCanonicalRoute("/app/proposals/p-1/chamber", {
      canonicalRoute: "/app/proposals/p-1/chamber",
    }),
    false,
  );
  assert.equal(
    shouldNavigateToCanonicalRoute("/app/proposals/p-1/pp", {
      canonicalRoute: "/app/proposals/p-1/chamber",
    }),
    true,
  );
});

test("formatProposalStageTransitionMessage formats milestone and stage transitions", () => {
  assert.equal(
    formatProposalStageTransitionMessage({
      canonicalStage: "vote",
      redirectReason: "milestone_vote_open",
      pendingMilestoneIndex: 2,
    }),
    "Milestone M2 entered chamber vote.",
  );

  assert.equal(
    formatProposalStageTransitionMessage({
      canonicalStage: "build",
    }),
    "Proposal moved to Formation.",
  );
});
