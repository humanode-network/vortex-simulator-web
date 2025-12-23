import assert from "node:assert/strict";
import { test } from "node:test";

import { onRequestGet as gateGet } from "../functions/api/gate/status.ts";
import { onRequestPost as noncePost } from "../functions/api/auth/nonce.ts";
import { onRequestPost as verifyPost } from "../functions/api/auth/verify.ts";

function getSetCookies(response) {
  const maybe = response.headers.getSetCookie?.bind(response.headers);
  if (maybe) return maybe();
  const single = response.headers.get("set-cookie");
  return single ? [single] : [];
}

function cookiePair(setCookieValue) {
  return setCookieValue.split(";")[0];
}

function makeContext({ url, method, env, body, cookie }) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  if (body !== undefined) headers.set("content-type", "application/json");
  const request = new Request(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { request, env };
}

test("gate/status: unauthenticated vs authenticated eligible", async () => {
  const env = { SESSION_SECRET: "test-secret", DEV_BYPASS_SIGNATURE: "true" };

  const unauthRes = await gateGet(
    makeContext({
      url: "https://local.test/api/gate/status",
      method: "GET",
      env,
    }),
  );
  assert.equal(unauthRes.status, 200);
  const unauthJson = await unauthRes.json();
  assert.equal(unauthJson.eligible, false);
  assert.equal(unauthJson.reason, "not_authenticated");

  const nonceRes = await noncePost(
    makeContext({
      url: "https://local.test/api/auth/nonce",
      method: "POST",
      env,
      body: { address: "0xdef" },
    }),
  );
  const nonceJson = await nonceRes.json();
  const nonceCookie = cookiePair(getSetCookies(nonceRes)[0]);

  const verifyRes = await verifyPost(
    makeContext({
      url: "https://local.test/api/auth/verify",
      method: "POST",
      env: { ...env, DEV_BYPASS_GATE: "true" },
      body: { address: "0xdef", nonce: nonceJson.nonce, signature: "0xsig" },
      cookie: nonceCookie,
    }),
  );
  const sessionCookie = cookiePair(getSetCookies(verifyRes)[0]);

  const gateRes = await gateGet(
    makeContext({
      url: "https://local.test/api/gate/status",
      method: "GET",
      env: { ...env, DEV_BYPASS_GATE: "true" },
      cookie: sessionCookie,
    }),
  );
  const gateJson = await gateRes.json();
  assert.equal(gateJson.eligible, true);
});
