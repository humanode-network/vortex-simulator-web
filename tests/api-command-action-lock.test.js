import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestPost as commandPost } from "../api/routes/command.ts";
import { onRequestPost as adminLockPost } from "../api/routes/admin/users/lock.ts";
import { onRequestPost as adminUnlockPost } from "../api/routes/admin/users/unlock.ts";
import { getSessionCookieName, issueSession } from "../api/_lib/auth.ts";
import { clearActionLocksForTests } from "../api/_lib/actionLocksStore.ts";
import { clearApiRateLimitsForTests } from "../api/_lib/apiRateLimitStore.ts";
import { clearIdempotencyForTests } from "../api/_lib/idempotencyStore.ts";
import { clearPoolVotesForTests } from "../api/_lib/poolVotesStore.ts";
import { clearInlineReadModelsForTests } from "../api/_lib/readModelsStore.ts";
import {
  clearChamberMembershipsForTests,
  ensureChamberMembership,
} from "../api/_lib/chamberMembershipsStore.ts";

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
  return `${name}=${value}`;
}

const baseEnv = {
  SESSION_SECRET: "test-secret",
  DEV_BYPASS_GATE: "true",
  DEV_INSECURE_COOKIES: "true",
  READ_MODELS_INLINE: "true",
  ADMIN_SECRET: "admin-secret",
  SIM_COMMAND_RATE_LIMIT_PER_MINUTE_ADDRESS: "1000",
  SIM_COMMAND_RATE_LIMIT_PER_MINUTE_IP: "1000",
};

test("admin user lock blocks /api/command until unlocked (memory mode)", async () => {
  await clearPoolVotesForTests();
  clearIdempotencyForTests();
  clearInlineReadModelsForTests();
  clearApiRateLimitsForTests();
  clearActionLocksForTests();
  clearChamberMembershipsForTests();

  const address = "5FakeAddr";
  const cookie = await makeSessionCookie(baseEnv, address);
  const lockedUntil = new Date(Date.now() + 60_000).toISOString();

  const lockRes = await adminLockPost(
    makeContext({
      url: "https://local.test/api/admin/users/lock",
      env: baseEnv,
      headers: {
        "content-type": "application/json",
        "x-admin-secret": "admin-secret",
      },
      body: JSON.stringify({ address, lockedUntil, reason: "testing" }),
    }),
  );
  assert.equal(lockRes.status, 200);

  const blocked = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId: "biometric-account-recovery", direction: "up" },
      }),
    }),
  );
  assert.equal(blocked.status, 403);
  const blockedJson = await blocked.json();
  assert.equal(blockedJson.error.code, "action_locked");
  assert.equal(blockedJson.error.lock.address, address);

  const unlockRes = await adminUnlockPost(
    makeContext({
      url: "https://local.test/api/admin/users/unlock",
      env: baseEnv,
      headers: {
        "content-type": "application/json",
        "x-admin-secret": "admin-secret",
      },
      body: JSON.stringify({ address }),
    }),
  );
  assert.equal(unlockRes.status, 200);

  const allowed = await commandPost(
    makeContext({
      url: "https://local.test/api/command",
      env: baseEnv,
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        type: "pool.vote",
        payload: { proposalId: "biometric-account-recovery", direction: "up" },
      }),
    }),
  );
  assert.equal(allowed.status, 200);
});
