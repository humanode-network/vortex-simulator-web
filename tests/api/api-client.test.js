import assert from "node:assert/strict";
import { test } from "@rstest/core";

import { apiChamber } from "../../src/lib/apiClient.ts";

test("apiChamber requests the chamber endpoint with credentials", async () => {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(
      JSON.stringify({
        chamber: {
          id: "engineering",
          title: "Engineering",
          status: "active",
          multiplier: 1.4,
          createdAt: new Date().toISOString(),
          dissolvedAt: null,
          createdByProposalId: null,
          dissolvedByProposalId: null,
        },
        pipeline: { pool: 1, vote: 0, build: 0 },
        proposals: [],
        governors: [],
        threads: [],
        chatLog: [],
        stageOptions: [],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  };

  const res = await apiChamber("engineering");
  assert.equal(res.chamber.id, "engineering");
  assert.equal(calls[0].input, "/api/chambers/engineering");
  assert.equal(calls[0].init.credentials, "include");

  global.fetch = originalFetch;
});
