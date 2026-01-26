import assert from "node:assert/strict";
import { test } from "@rstest/core";

import {
  apiChambers,
  apiPoolVote,
  apiProposals,
} from "../../src/lib/apiClient.ts";

test("api client respects runtime base URL, headers, and credentials", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  const calls = [];

  global.window = {
    __VORTEX_CONFIG__: {
      apiBaseUrl: "https://api.example.test",
      apiHeaders: { "x-test-header": "ok" },
      apiCredentials: "omit",
    },
  };

  global.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const res = await apiChambers();
  assert.ok(Array.isArray(res.items));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].input, "https://api.example.test/api/chambers");
  assert.equal(calls[0].init.credentials, "omit");
  assert.equal(calls[0].init.headers["x-test-header"], "ok");

  global.fetch = originalFetch;
  global.window = originalWindow;
});

test("apiPost sends JSON body and idempotency header when provided", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  const calls = [];

  global.window = {
    __VORTEX_CONFIG__: {
      apiBaseUrl: "https://api.example.test",
      apiHeaders: { "x-global": "yes" },
    },
  };

  global.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(
      JSON.stringify({
        ok: true,
        type: "pool.vote",
        proposalId: "proposal-1",
        direction: "up",
        counts: { upvotes: 1, downvotes: 0 },
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  };

  await apiPoolVote({
    proposalId: "proposal-1",
    direction: "up",
    idempotencyKey: "idem-123",
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].input, "https://api.example.test/api/command");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers["idempotency-key"], "idem-123");
  assert.equal(calls[0].init.headers["content-type"], "application/json");
  assert.equal(calls[0].init.headers["x-global"], "yes");

  global.fetch = originalFetch;
  global.window = originalWindow;
});

test("apiGet throws a structured error for non-2xx responses", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;

  global.window = { __VORTEX_CONFIG__: { apiBaseUrl: "" } };
  global.fetch = async () =>
    new Response(
      JSON.stringify({ error: { message: "Nope", code: "denied" } }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      },
    );

  let thrown = null;
  try {
    await apiProposals();
  } catch (error) {
    thrown = error;
  }

  assert.ok(thrown instanceof Error);
  assert.equal(thrown.status, 403);
  assert.equal(thrown.data?.error?.code, "denied");
  assert.ok(thrown.message.includes("HTTP 403"));

  global.fetch = originalFetch;
  global.window = originalWindow;
});
