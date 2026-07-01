import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "@rstest/core";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const header = source("src/components/WorkspaceHeader.tsx");
const initiative = source("src/pages/initiatives/Initiative.tsx");
const board = source(
  "src/pages/initiatives/components/InitiativeBoardSection.tsx",
);
const faction = source("src/pages/factions/components/FactionHero.tsx");

test("Initiatives and factions share one workspace header grammar", () => {
  assert.match(header, /<GlassyCard as="article"/);
  assert.match(header, /type="button"/);
  assert.match(header, /size="sm"/);
  assert.match(header, /variant="outline"/);
  assert.match(header, /className="w-36[^"]*opacity-90/);
  assert.doesNotMatch(header, /asChild/);

  assert.match(initiative, /<WorkspaceHeader/);
  assert.match(initiative, /Join initiative/);
  assert.match(initiative, /Leave initiative/);
  assert.match(initiative, /Edit initiative/);
  assert.match(initiative, /Create card/);
  assert.doesNotMatch(initiative, /Back to initiatives|<PageHeader/);
  assert.doesNotMatch(board, /Create card|initiativeBoardCardCreatePath/);

  assert.match(faction, /<WorkspaceHeader/);
  assert.match(faction, /<WorkspaceHeaderAction/);
  assert.doesNotMatch(faction, /<Card|<Kicker|<Badge|<StatTile/);
  assert.doesNotMatch(faction, /label="Role"/);
  assert.match(faction, /label="Channels"/);
  assert.match(faction, /label="Initiatives"/);
});
