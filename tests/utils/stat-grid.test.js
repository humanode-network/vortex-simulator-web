import assert from "node:assert/strict";
import React from "react";
import { test } from "@rstest/core";

import { makeChamberStats } from "@/components/StatGrid";

test("makeChamberStats maps values to the expected slots", () => {
  const stats = {
    governors: "4",
    acm: "12",
    mcm: "7",
    lcm: "5",
  };

  const items = makeChamberStats(stats);
  assert.equal(items.length, 4);
  assert.equal(items[3].label, "Governors");
  assert.equal(items[3].value, stats.governors);

  for (const item of items.slice(0, 3)) {
    assert.ok(React.isValidElement(item.label));
    assert.ok(typeof item.value === "string");
  }
});
