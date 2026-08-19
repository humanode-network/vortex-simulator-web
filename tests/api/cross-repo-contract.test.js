import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "@rstest/core";

import {
  HUMANODE_CODEX_JURY_SIZE,
  HUMANODE_CODEX_SENTENCE_AUTHORIZATION,
  humanodeCodexOffenses,
} from "../../src/data/humanodeCodex.ts";

const webRoot = process.cwd();
const workspaceRoot = resolve(webRoot, "..");
const serverRoot = resolve(workspaceRoot, "vortex-simulator-server");

function readServer(path) {
  return readFileSync(resolve(serverRoot, path), "utf8");
}

function readWeb(path) {
  return readFileSync(resolve(webRoot, path), "utf8");
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function readWebApiSources() {
  const apiDirectory = resolve(webRoot, "src/lib/api");
  const moduleSources = readdirSync(apiDirectory)
    .filter((filename) => filename.endsWith(".ts"))
    .map((filename) => readFileSync(resolve(apiDirectory, filename), "utf8"));
  return [readWeb("src/lib/apiClient.ts"), ...moduleSources].join("\n");
}

function extractServerCommandTypes() {
  const source = readServer("api/commandSchemas.ts");
  return new Set(
    [...source.matchAll(/type:\s*z\.literal\("([^"]+)"\)/g)].map(
      (match) => match[1],
    ),
  );
}

function extractClientCommandTypes() {
  const source = readWebApiSources();
  return unique(
    [...source.matchAll(/type:\s*"([^"]+)"/g)].map((match) => match[1]),
  ).filter((type) => type.includes("."));
}

const resourceFilesByRouter = {
  admin: "api/resources/admin.ts",
  auth: "api/resources/auth.ts",
  chambers: "api/resources/chambers.ts",
  clock: "api/resources/clock.ts",
  cm: "api/resources/cm.ts",
  command: "api/resources/command.ts",
  courts: "api/resources/courts.ts",
  factions: "api/resources/factions.ts",
  feed: "api/resources/feed.ts",
  formation: "api/resources/formation.ts",
  gate: "api/resources/gate.ts",
  health: "api/resources/health.ts",
  humans: "api/resources/humans.ts",
  invision: "api/resources/invision.ts",
  initiatives: "api/resources/initiatives.ts",
  myGovernance: "api/resources/myGovernance.ts",
  proposals: "api/resources/proposals.ts",
};

function normalizeRoute(path) {
  const withoutQuery = path.replace(/\?.*$/, "");
  const withoutTemplateQuery = withoutQuery.replace(
    /\$\{qs(?:\.toString\(\))?\}/g,
    "",
  );
  const withParams = withoutTemplateQuery
    .replace(/\$\{[^}]+\}/g, ":param")
    .replace(/:[A-Za-z0-9_]+/g, ":param");
  return withParams.replace(/\/$/, "") || "/";
}

function joinRoute(prefix, routePath) {
  const normalizedPrefix = prefix.replace(/\/$/, "");
  if (routePath === "/") return normalizedPrefix;
  return `${normalizedPrefix}${routePath.startsWith("/") ? routePath : `/${routePath}`}`;
}

function extractServerRoutes() {
  const apiSource = readServer("api/api.ts");
  const routes = new Set();

  for (const match of apiSource.matchAll(
    /api\.route\("([^"]+)",\s*([A-Za-z0-9_]+)\)/g,
  )) {
    const [, prefix, routerName] = match;
    const file = resourceFilesByRouter[routerName];
    assert.ok(file, `Missing route parser mapping for router ${routerName}`);
    const source = readServer(file);
    const routeRegex = new RegExp(`${routerName}\\.\\w+\\("([^"]+)"`, "g");
    for (const routeMatch of source.matchAll(routeRegex)) {
      routes.add(normalizeRoute(joinRoute(`/api${prefix}`, routeMatch[1])));
    }
  }

  for (const match of apiSource.matchAll(/api\.\w+\("([^"]+)"/g)) {
    routes.add(normalizeRoute(`/api${match[1]}`));
  }

  return routes;
}

function extractClientRoutes() {
  const source = readWebApiSources();
  const routes = [];
  const callRegex = /api(?:Get|Post)(?:<[^>]+>)?\(\s*([`'"])([\s\S]*?)\1/g;
  for (const match of source.matchAll(callRegex)) {
    const path = match[2].trim();
    if (path.startsWith("/api/")) routes.push(normalizeRoute(path));
  }
  return unique(routes);
}

function extractQuarantinedCourtRoutes() {
  const source = readServer("api/resources/reports.ts");
  const routes = new Set();
  for (const match of source.matchAll(/reports\.\w+\("([^"]+)"/g)) {
    routes.add(normalizeRoute(joinRoute("/api/reports", match[1])));
  }
  return routes;
}

test("web command client only emits command types accepted by the server schema", () => {
  const serverTypes = extractServerCommandTypes();
  const clientTypes = extractClientCommandTypes();
  const missing = clientTypes.filter((type) => !serverTypes.has(type));
  assert.deepEqual(missing, []);
});

test("web API client only calls routes exposed by the server router", () => {
  const serverRoutes = extractServerRoutes();
  const quarantinedCourtRoutes = extractQuarantinedCourtRoutes();
  const clientRoutes = extractClientRoutes();
  const missing = clientRoutes.filter(
    (route) => !serverRoutes.has(route) && !quarantinedCourtRoutes.has(route),
  );
  assert.deepEqual(missing, []);
});

test("Courts v2 routes remain complete but quarantined until activation", () => {
  const apiSource = readServer("api/api.ts");
  const routes = extractQuarantinedCourtRoutes();
  assert.equal(apiSource.includes('api.route("/reports", reports)'), false);
  assert.deepEqual(
    [...routes],
    [
      "/api/reports/status",
      "/api/reports/capability",
      "/api/reports/mine",
      "/api/reports/mine/:param",
      "/api/reports/notifications",
      "/api/reports/cases",
      "/api/reports/cases/:param",
    ],
  );
});

test("initiative board statuses stay aligned across server and web", () => {
  const serverSource = readServer("api/commandSchemas.ts");
  const webSource = readWeb("src/lib/initiativeUi.ts");
  const serverBlock = serverSource.match(
    /INITIATIVE_BOARD_STATUSES\s*=\s*\[([\s\S]*?)\]\s*as const/,
  )?.[1];
  const webBlock = webSource.match(
    /initiativeBoardStatusOrder:[^=]+=\s*\[([\s\S]*?)\]/,
  )?.[1];

  assert.ok(serverBlock, "Server board status contract is missing");
  assert.ok(webBlock, "Web board status contract is missing");

  const values = (source) =>
    [...source.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(values(webBlock), values(serverBlock));
});

test("readable Codex offense levels and sentence measures match the server policy", () => {
  const contracts = readServer("api/lib/courts/contracts.ts");
  const corePolicy = readServer("api/lib/courts/courtCodexV1.ts");
  const sentencePolicy = readServer(
    "api/lib/courts/courtCodexV1SentencePolicy.ts",
  );
  const quotedValues = (source) =>
    [...source.matchAll(/"([A-Z0-9-]+)"/g)].map((match) => match[1]);

  assert.match(
    contracts,
    new RegExp(`COURT_JURY_SIZE = ${HUMANODE_CODEX_JURY_SIZE}\\b`),
  );
  assert.match(
    contracts,
    new RegExp(
      `COURT_CHARTER_DECISION_THRESHOLD = ${HUMANODE_CODEX_SENTENCE_AUTHORIZATION}\\b`,
    ),
  );
  assert.match(corePolicy, /authorization: COURT_CHARTER_DECISION_THRESHOLD\b/);

  for (const offense of humanodeCodexOffenses) {
    const levels = corePolicy.match(
      new RegExp(`"${offense.code}": \\[([^\\]]+)\\]`),
    )?.[1];
    const measures = sentencePolicy.match(
      new RegExp(`"${offense.code}": template\\(\\s*\\[([^\\]]+)\\]`),
    )?.[1];
    assert.ok(levels, `Server severity policy is missing ${offense.code}`);
    assert.ok(measures, `Server sentence policy is missing ${offense.code}`);
    assert.deepEqual(quotedValues(levels), offense.allowedSeverities);
    assert.deepEqual(quotedValues(measures), offense.allowedMeasures);
  }
});
