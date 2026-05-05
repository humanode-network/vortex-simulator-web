import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "@rstest/core";

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

function extractServerCommandTypes() {
  const source = readServer("api/commandSchemas.ts");
  return new Set(
    [...source.matchAll(/type:\s*z\.literal\("([^"]+)"\)/g)].map(
      (match) => match[1],
    ),
  );
}

function extractClientCommandTypes() {
  const source = readWeb("src/lib/apiClient.ts");
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
  const source = readWeb("src/lib/apiClient.ts");
  const routes = [];
  const callRegex = /api(?:Get|Post)(?:<[^>]+>)?\(\s*([`'"])([\s\S]*?)\1/g;
  for (const match of source.matchAll(callRegex)) {
    const path = match[2].trim();
    if (path.startsWith("/api/")) routes.push(normalizeRoute(path));
  }
  return unique(routes);
}

test("web command client only emits command types accepted by the server schema", () => {
  const serverTypes = extractServerCommandTypes();
  const clientTypes = extractClientCommandTypes();
  const missing = clientTypes.filter((type) => !serverTypes.has(type));
  assert.deepEqual(missing, []);
});

test("web API client only calls routes exposed by the server router", () => {
  const serverRoutes = extractServerRoutes();
  const clientRoutes = extractClientRoutes();
  const missing = clientRoutes.filter((route) => !serverRoutes.has(route));
  assert.deepEqual(missing, []);
});
