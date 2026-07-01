import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "@rstest/core";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

test("Initiative membership actions stay concise and actionable", () => {
  const page = source("src/pages/initiatives/Initiative.tsx");
  const queue = source(
    "src/pages/initiatives/components/InitiativeJoinRequestsSection.tsx",
  );
  const runner = source("src/hooks/useActionRunner.ts");

  assert.ok(
    page.indexOf("<InitiativeJoinRequestsSection") <
      page.indexOf("<InitiativeBoardSection"),
    "Join requests should appear before the potentially long board",
  );
  assert.match(queue, /pending\.length === 0\) return null/);
  assert.doesNotMatch(queue, /NoDataYetBar/);
  assert.match(queue, /aria-label=\{`Accept join request from/);
  assert.match(queue, /aria-label=\{`Decline join request from/);
  assert.match(runner, /actionInFlight\.current/);
});
