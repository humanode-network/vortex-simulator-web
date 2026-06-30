import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "@rstest/core";

const initiativeSource = readFileSync(
  join(process.cwd(), "src/pages/initiatives/Initiative.tsx"),
  "utf8",
);
const boardSource = readFileSync(
  join(
    process.cwd(),
    "src/pages/initiatives/components/InitiativeBoardSection.tsx",
  ),
  "utf8",
);

test("Initiative header owns aligned edit and card creation actions", () => {
  assert.doesNotMatch(initiativeSource, /Back to initiatives/);
  assert.doesNotMatch(initiativeSource, /<GlassyCard as="article"/);
  assert.doesNotMatch(initiativeSource, /Action plan/);
  assert.match(initiativeSource, />\s*Edit initiative\s*</);
  assert.match(initiativeSource, />\s*Create card\s*</);
  assert.equal(
    initiativeSource.match(/className=\{initiativeActionButtonClassName\}/g)
      ?.length,
    2,
  );
  assert.doesNotMatch(boardSource, /Create card|initiativeBoardCardCreatePath/);
});
