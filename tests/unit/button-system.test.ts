import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "@rstest/core";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

test("interactive buttons use the shared Button primitive", () => {
  const violations = sourceFiles(join(process.cwd(), "src")).flatMap((path) => {
    const source = readFileSync(path, "utf8");
    const reasons = [
      source.includes("<button") ? "native button" : null,
      source.includes('role="button"') ? "simulated button role" : null,
    ].filter(Boolean);
    return reasons.map((reason) => `${path}: ${reason}`);
  });

  assert.deepEqual(violations, []);
});

test("draft visibility uses the standard action-button dimensions", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "src/pages/proposals/draft/DraftPublicationActions.tsx",
    ),
    "utf8",
  );

  assert.match(source, /variant=\{isPublic \? "primary" : "outline"\}/);
  assert.match(source, /size="sm"/);
  assert.doesNotMatch(source, /stage-chip|h-7|rounded-full/);
});
