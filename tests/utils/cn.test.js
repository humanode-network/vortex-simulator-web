import assert from "node:assert/strict";
import { test } from "@rstest/core";

import { cn } from "../../src/lib/utils.ts";

test("cn merges class names predictably", () => {
  const value = cn("text-sm", "text-sm", "font-bold", null, undefined, false);
  assert.equal(value, "text-sm font-bold");
});
