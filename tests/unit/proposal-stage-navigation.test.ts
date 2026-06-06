import { test } from "@rstest/core";
import assert from "node:assert/strict";

import { buildProposalStageLinks } from "../../src/components/ProposalStageBar.tsx";

test("proposal stage navigation links previous stages as snapshots and live stage as canonical", () => {
  const links = buildProposalStageLinks({
    canonicalRoute: "/app/proposals/p-1/chamber",
    liveStage: "vote",
    proposalId: "p-1",
  });

  assert.equal(links.pool, "/app/proposals/p-1/pp?snapshotStage=pool");
  assert.equal(links.vote, "/app/proposals/p-1/chamber");
  assert.equal(links.citizen_veto, undefined);
  assert.equal(links.chamber_veto, undefined);
  assert.equal(links.build, undefined);
});

test("proposal stage navigation honors route overrides without exposing future stages", () => {
  const links = buildProposalStageLinks({
    liveStage: "citizen_veto",
    proposalId: "p-2",
    routeOverrides: {
      vote: "/app/proposals/p-2/referendum",
      chamber_veto: "/app/proposals/p-2/chamber-veto",
    },
  });

  assert.equal(links.pool, "/app/proposals/p-2/pp?snapshotStage=pool");
  assert.equal(links.vote, "/app/proposals/p-2/referendum?snapshotStage=vote");
  assert.equal(links.citizen_veto, "/app/proposals/p-2/citizen-veto");
  assert.equal(links.chamber_veto, undefined);
});

test("proposal stage navigation links terminal live stage and prior formation snapshot", () => {
  const links = buildProposalStageLinks({
    canonicalRoute: "/app/proposals/p-3/finished",
    liveStage: "passed",
    proposalId: "p-3",
  });

  assert.equal(links.build, "/app/proposals/p-3/formation?snapshotStage=build");
  assert.equal(links.passed, "/app/proposals/p-3/finished");
  assert.equal(links.failed, undefined);
});
