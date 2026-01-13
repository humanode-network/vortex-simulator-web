import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../api/routes/command.ts";
import { onRequestGet as clockGet } from "../api/routes/clock/index.ts";
import { onRequestPost as advanceEraPost } from "../api/routes/clock/advance-era.ts";
import { onRequestPost as rollupEraPost } from "../api/routes/clock/rollup-era.ts";
import { getSessionCookieName, issueSession } from "../api/_lib/auth.ts";
import { clearChamberVotesForTests } from "../api/_lib/chamberVotesStore.ts";
import { clearClockForTests } from "../api/_lib/clockStore.ts";
import { clearCourtsForTests } from "../api/_lib/courtsStore.ts";
import {
  clearChamberMembershipsForTests,
  ensureChamberMembership,
} from "../api/_lib/chamberMembershipsStore.ts";
import { clearEraRollupsForTests } from "../api/_lib/eraRollupStore.ts";
import { clearEraForTests } from "../api/_lib/eraStore.ts";
import { clearFormationForTests } from "../api/_lib/formationStore.ts";
import { clearIdempotencyForTests } from "../api/_lib/idempotencyStore.ts";
import { clearInlineReadModelsForTests } from "../api/_lib/readModelsStore.ts";
import { clearPoolVotesForTests } from "../api/_lib/poolVotesStore.ts";

function makeContext({ url, env, params, method = "POST", headers, body }) {
  return {
    request: new Request(url, { method, headers, body }),
    env,
    params,
  };
}

async function makeSessionCookie(env, address) {
  const headers = new Headers();
  await issueSession(headers, env, "https://local.test/api/command", address);
  const setCookie = headers.get("set-cookie");
  assert.ok(setCookie);
  const tokenPair = setCookie.split(";")[0];
  const [name, value] = tokenPair.split("=");
  assert.equal(name, getSessionCookieName());
  return `${name}=${value}`;
}

const env = {
  SESSION_SECRET: "test-secret",
  DEV_INSECURE_COOKIES: "true",
  READ_MODELS_INLINE: "true",
  DEV_BYPASS_ADMIN: "true",
  DEV_BYPASS_GATE: "true",
  SIM_ACTIVE_GOVERNORS: "150",
  SIM_REQUIRED_POOL_VOTES: "1",
  SIM_REQUIRED_CHAMBER_VOTES: "0",
  SIM_REQUIRED_COURT_ACTIONS: "0",
  SIM_REQUIRED_FORMATION_ACTIONS: "0",
};

test("rollup writes next-era activeGovernors baseline", async () => {
  await clearPoolVotesForTests();
  await clearChamberVotesForTests();
  clearChamberMembershipsForTests();
  clearCourtsForTests();
  clearFormationForTests();
  clearClockForTests();
  clearEraForTests();
  clearEraRollupsForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();

  const clockRes1 = await clockGet(
    makeContext({
      url: "https://local.test/api/clock",
      env,
      method: "GET",
    }),
  );
  assert.equal(clockRes1.status, 200);
  const clockJson1 = await clockRes1.json();
  const era = clockJson1.currentEra;
  assert.equal(era, 0);
  assert.equal(clockJson1.activeGovernors, 150);

  const address = "5RollupBaselineAddr";
  await ensureChamberMembership(env, {
    address,
    chamberId: "general",
    source: "test",
  });
  await ensureChamberMembership(env, {
    address,
    chamberId: "engineering",
    source: "test",
  });
  const cookie = await makeSessionCookie(env, address);

  const poolVote = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId: "biometric-account-recovery", direction: "up" },
      }),
    }),
  );
  assert.equal(poolVote.status, 200);

  const rollupRes = await rollupEraPost(
    makeContext({
      url: "https://local.test/api/clock/rollup-era",
      env,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ era }),
    }),
  );
  assert.equal(rollupRes.status, 200);
  const rollupJson = await rollupRes.json();
  assert.equal(rollupJson.activeGovernorsNextEra, 1);

  const advanceRes = await advanceEraPost(
    makeContext({
      url: "https://local.test/api/clock/advance-era",
      env,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }),
  );
  assert.equal(advanceRes.status, 200);

  const clockRes2 = await clockGet(
    makeContext({
      url: "https://local.test/api/clock",
      env,
      method: "GET",
    }),
  );
  assert.equal(clockRes2.status, 200);
  const clockJson2 = await clockRes2.json();
  assert.equal(clockJson2.currentEra, 1);
  assert.equal(clockJson2.activeGovernors, 1);
});
