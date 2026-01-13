import http from "node:http";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { URL } from "node:url";

function setDefaultEnv() {
  process.env.SESSION_SECRET ??= "dev-secret";
  process.env.DEV_BYPASS_SIGNATURE ??= "false";
  process.env.DEV_BYPASS_GATE ??= "false";
  process.env.DEV_INSECURE_COOKIES ??= "true";

  // Ensure the backend always has access to sim config (RPC URL, genesis members)
  // even when requests come through a proxy and `request.url` origin isn't the API server.
  // `api/_lib/simConfig.ts` prefers `SIM_CONFIG_JSON` over fetching `/sim-config.json`.
  if (!process.env.SIM_CONFIG_JSON) {
    try {
      const filepath = resolve(process.cwd(), "public", "sim-config.json");
      process.env.SIM_CONFIG_JSON = readFileSync(filepath, "utf8");
    } catch {
      // ignore
    }
  }

  const hasDb = Boolean(process.env.DATABASE_URL);

  if (hasDb) {
    process.env.READ_MODELS_INLINE ??= "false";
    process.env.READ_MODELS_INLINE_EMPTY ??= "false";
    return;
  }

  process.env.READ_MODELS_INLINE ??= "false";
  if (process.env.READ_MODELS_INLINE === "true") {
    process.env.READ_MODELS_INLINE_EMPTY ??= "false";
  } else {
    process.env.READ_MODELS_INLINE_EMPTY ??= "true";
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function resolveRoute(pathname) {
  const patterns = [
    ["GET", /^\/api\/health$/, () => import("../api/routes/health.ts")],
    ["GET", /^\/api\/me$/, () => import("../api/routes/me.ts")],
    [
      "GET",
      /^\/api\/gate\/status$/,
      () => import("../api/routes/gate/status.ts"),
    ],
    [
      "POST",
      /^\/api\/auth\/nonce$/,
      () => import("../api/routes/auth/nonce.ts"),
    ],
    [
      "POST",
      /^\/api\/auth\/verify$/,
      () => import("../api/routes/auth/verify.ts"),
    ],
    [
      "POST",
      /^\/api\/auth\/logout$/,
      () => import("../api/routes/auth/logout.ts"),
    ],
    ["POST", /^\/api\/command$/, () => import("../api/routes/command.ts")],
    ["GET", /^\/api\/clock$/, () => import("../api/routes/clock/index.ts")],
    [
      "POST",
      /^\/api\/clock\/advance-era$/,
      () => import("../api/routes/clock/advance-era.ts"),
    ],
    [
      "POST",
      /^\/api\/clock\/rollup-era$/,
      () => import("../api/routes/clock/rollup-era.ts"),
    ],
    [
      "GET",
      /^\/api\/chambers$/,
      () => import("../api/routes/chambers/index.ts"),
    ],
    [
      "GET",
      /^\/api\/chambers\/([^/]+)$/,
      () => import("../api/routes/chambers/[id].ts"),
    ],
    [
      "GET",
      /^\/api\/proposals$/,
      () => import("../api/routes/proposals/index.ts"),
    ],
    [
      "GET",
      /^\/api\/proposals\/drafts$/,
      () => import("../api/routes/proposals/drafts/index.ts"),
    ],
    [
      "GET",
      /^\/api\/proposals\/drafts\/([^/]+)$/,
      () => import("../api/routes/proposals/drafts/[id].ts"),
    ],
    ["GET", /^\/api\/feed$/, () => import("../api/routes/feed/index.ts")],
    [
      "GET",
      /^\/api\/proposals\/([^/]+)\/pool$/,
      () => import("../api/routes/proposals/[id]/pool.ts"),
    ],
    [
      "GET",
      /^\/api\/proposals\/([^/]+)\/chamber$/,
      () => import("../api/routes/proposals/[id]/chamber.ts"),
    ],
    [
      "GET",
      /^\/api\/proposals\/([^/]+)\/formation$/,
      () => import("../api/routes/proposals/[id]/formation.ts"),
    ],
    ["GET", /^\/api\/courts$/, () => import("../api/routes/courts/index.ts")],
    [
      "GET",
      /^\/api\/courts\/([^/]+)$/,
      () => import("../api/routes/courts/[id].ts"),
    ],
    ["GET", /^\/api\/humans$/, () => import("../api/routes/humans/index.ts")],
    [
      "GET",
      /^\/api\/humans\/([^/]+)$/,
      () => import("../api/routes/humans/[id].ts"),
    ],
    [
      "GET",
      /^\/api\/factions$/,
      () => import("../api/routes/factions/index.ts"),
    ],
    [
      "GET",
      /^\/api\/factions\/([^/]+)$/,
      () => import("../api/routes/factions/[id].ts"),
    ],
    [
      "GET",
      /^\/api\/formation$/,
      () => import("../api/routes/formation/index.ts"),
    ],
    [
      "GET",
      /^\/api\/invision$/,
      () => import("../api/routes/invision/index.ts"),
    ],
    [
      "GET",
      /^\/api\/my-governance$/,
      () => import("../api/routes/my-governance/index.ts"),
    ],
  ];

  for (const [method, re, load] of patterns) {
    const match = pathname.match(re);
    if (!match) continue;
    return {
      method,
      load,
      params: match[1] ? { id: match[1] } : {},
    };
  }
  return null;
}

function getSetCookieHeaders(headers) {
  const getSetCookie = headers?.getSetCookie?.bind(headers);
  if (getSetCookie) return getSetCookie();
  const v = headers?.get?.("set-cookie");
  return v ? [v] : [];
}

async function handleSimConfig(_nodeReq, nodeRes) {
  try {
    const filepath = resolve(process.cwd(), "public", "sim-config.json");
    const raw = await readFile(filepath, "utf8");
    nodeRes.statusCode = 200;
    nodeRes.setHeader("content-type", "application/json; charset=utf-8");
    nodeRes.setHeader("cache-control", "no-store");
    nodeRes.end(raw);
  } catch {
    nodeRes.statusCode = 404;
    nodeRes.setHeader("content-type", "application/json; charset=utf-8");
    nodeRes.end(
      JSON.stringify({
        error: { message: "Missing public/sim-config.json for local dev" },
      }),
    );
  }
}

async function handleRequest(nodeReq, nodeRes) {
  const origin = `http://${nodeReq.headers.host ?? "127.0.0.1"}`;
  const url = new URL(nodeReq.url ?? "/", origin);

  if (nodeReq.method === "GET" && url.pathname === "/sim-config.json") {
    await handleSimConfig(nodeReq, nodeRes);
    return;
  }

  const route = resolveRoute(url.pathname);
  if (!route) {
    nodeRes.statusCode = 404;
    nodeRes.setHeader("content-type", "application/json");
    nodeRes.end(JSON.stringify({ error: { message: "Not found" } }));
    return;
  }

  if (nodeReq.method !== route.method) {
    nodeRes.statusCode = 405;
    nodeRes.setHeader("content-type", "application/json");
    nodeRes.end(JSON.stringify({ error: { message: "Method not allowed" } }));
    return;
  }

  const body = await readBody(nodeReq);
  const request = new Request(url.toString(), {
    method: nodeReq.method,
    headers: nodeReq.headers,
    body: body.length ? body : undefined,
  });

  const mod = await route.load();
  const handler =
    nodeReq.method === "POST" ? mod.onRequestPost : mod.onRequestGet;

  if (typeof handler !== "function") {
    nodeRes.statusCode = 500;
    nodeRes.setHeader("content-type", "application/json");
    nodeRes.end(
      JSON.stringify({ error: { message: "Handler not implemented" } }),
    );
    return;
  }

  const env = { ...process.env };
  const response = await handler({ request, env, params: route.params });

  nodeRes.statusCode = response.status;

  const setCookies = getSetCookieHeaders(response.headers);
  for (const cookie of setCookies) {
    nodeRes.appendHeader?.("set-cookie", cookie);
  }
  for (const [key, value] of response.headers.entries()) {
    if (key.toLowerCase() === "set-cookie") continue;
    nodeRes.setHeader(key, value);
  }

  const arrayBuffer = await response.arrayBuffer();
  nodeRes.end(Buffer.from(arrayBuffer));
}

setDefaultEnv();

const port = Number(process.env.API_PORT ?? "8788");
const host = process.env.API_HOST ?? "127.0.0.1";

const server = http.createServer((req, res) => {
  void handleRequest(req, res).catch((err) => {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({ error: { message: err?.message ?? String(err) } }),
    );
  });
});

server.listen(port, host, () => {
  console.log(`[api] listening on http://${host}:${port}`);
});
