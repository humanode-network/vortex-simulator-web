import { test, expect } from "@rstest/core";

import { buildTierRequirementItems } from "../../src/lib/tierProgress";
import type { TierProgressDto } from "../../src/types/api";

test("buildTierRequirementItems computes progress percentages", () => {
  const progress: TierProgressDto = {
    tier: "Ecclesiast",
    nextTier: "Legate",
    metrics: {
      governorEras: 10,
      activeEras: 8,
      acceptedProposals: 1,
      formationParticipation: 0,
    },
    requirements: {
      governorEras: 13,
      activeEras: 13,
      acceptedProposals: 1,
      formationParticipation: 1,
    },
  };

  const items = buildTierRequirementItems(progress);
  const active = items.find((item) => item.key === "activeEras");
  expect(active?.done).toBe(8);
  expect(active?.required).toBe(13);
  expect(active?.percent).toBe(62);
});

test("buildTierRequirementItems returns empty when no requirements", () => {
  const items = buildTierRequirementItems(null);
  expect(items).toEqual([]);
});
