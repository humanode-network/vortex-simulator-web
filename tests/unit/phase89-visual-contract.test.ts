import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "@rstest/core";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";

import AppShell from "../../src/app/AppShell";
import Guide from "../../src/pages/Guide";
import Landing from "../../src/pages/Landing";
import Paper from "../../src/pages/Paper";
import Vortexopedia from "../../src/pages/Vortexopedia";

function renderWithRouter(element: React.ReactElement, path = "/") {
  return renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: [path] }, element),
  );
}

test("Phase 89 static visual contract covers public entry routes", () => {
  const landing = renderWithRouter(createElement(Landing));
  const paper = renderWithRouter(createElement(Paper), "/paper");
  const guide = renderWithRouter(createElement(Guide), "/guide");
  const vortexopedia = renderWithRouter(
    createElement(Vortexopedia),
    "/app/vortexopedia",
  );

  assert.match(landing, /Enter Vortex/);
  assert.match(landing, /This is Vortex Simulator/);
  assert.match(landing, /centralized-server app/);
  assert.match(landing, /experimental development workflow/);
  assert.doesNotMatch(landing, /1 Human/);
  assert.doesNotMatch(landing, /1 Node/);
  assert.doesNotMatch(landing, /1 Vote/);
  assert.match(landing, /poster\.png/);
  assert.match(landing, /loop\.mp4/);

  assert.match(paper, /Paper/);
  assert.match(paper, /The Vortex 1\.0 paper lives on GitBook/);
  assert.match(paper, /Open paper/);

  assert.match(guide, /Vortex Guide/);
  assert.match(guide, /How to read the UI/);
  assert.match(guide, /The two UX primitives: hints and stages/);

  assert.match(vortexopedia, /Search terms/);
  assert.match(vortexopedia, /Showing 64 \/ 64 entries/);
  assert.match(vortexopedia, /Invision band/);
  assert.match(vortexopedia, /Concentrated Invision band/);
  assert.match(vortexopedia, /Vortex/);
});

test("Phase 89 static visual contract covers the app shell", () => {
  const html = renderWithRouter(
    createElement(
      AppShell,
      null,
      createElement("section", { "aria-label": "Visual QA target" }, [
        createElement("h1", { key: "title" }, "Visual QA target"),
        createElement("p", { key: "body" }, "Representative route body"),
      ]),
    ),
    "/app/feed",
  );

  assert.match(html, /Skip to content/);
  assert.match(html, /id="main"/);
  assert.match(html, /tabindex="-1"/);
  assert.match(html, /main-atmosphere/);
  assert.match(html, /main-atmosphere__sky/);
  assert.match(html, /main-atmosphere__light/);
  assert.match(html, /main-atmosphere__night/);
  assert.match(html, /main-atmosphere__galaxy/);
  assert.match(html, /main-atmosphere__fire/);
  assert.match(html, /aria-label="Primary"/);
  assert.match(html, /Governance/);
  assert.match(html, /My governance/);
  assert.match(html, /Institutions/);
  assert.match(html, /CM panel/);
  assert.match(html, /System/);
  assert.match(html, /Settings/);
  assert.doesNotMatch(html, /1 Human/);
  assert.doesNotMatch(html, /1 Node/);
  assert.doesNotMatch(html, /1 Vote/);
  assert.match(html, /Visual QA target/);
});

test("Phase 89 release contract keeps mock data out of source wiring", () => {
  const mockDirectory = join(process.cwd(), "src/mocks");
  const httpSource = readFileSync(
    join(process.cwd(), "src/lib/api/http.ts"),
    "utf8",
  );

  assert.equal(existsSync(mockDirectory), false);
  assert.doesNotMatch(httpSource, /@\/mocks/);
  assert.doesNotMatch(httpSource, /phase89MockApi/);
  assert.doesNotMatch(httpSource, /prop-mock/);
});
