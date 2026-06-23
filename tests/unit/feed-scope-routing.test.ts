import { test, expect } from "@rstest/core";

import {
  buildFeedRequestForScope,
  buildUrgentFeedRequests,
  feedScopeRequiresChambers,
  feedScopeRequiresWallet,
  PRIVATE_FEED_ENTITY_TYPES,
  SYSTEM_FEED_STAGE,
} from "../../src/lib/feedScopeRouting";

test("feed scope wallet and chamber requirements match page semantics", () => {
  expect(feedScopeRequiresWallet("urgent")).toBe(true);
  expect(feedScopeRequiresWallet("my")).toBe(true);
  expect(feedScopeRequiresWallet("chambers")).toBe(true);
  expect(feedScopeRequiresWallet("system")).toBe(false);
  expect(feedScopeRequiresWallet("all")).toBe(false);

  expect(feedScopeRequiresChambers("urgent")).toBe(true);
  expect(feedScopeRequiresChambers("chambers")).toBe(true);
  expect(feedScopeRequiresChambers("my")).toBe(false);
  expect(feedScopeRequiresChambers("system")).toBe(false);
  expect(feedScopeRequiresChambers("all")).toBe(false);
});

test("feed scope requests isolate system and private personal notifications", () => {
  expect(
    buildFeedRequestForScope({
      scope: "system",
      limit: 12,
    }),
  ).toEqual({ stage: SYSTEM_FEED_STAGE, limit: 12 });

  expect(
    buildFeedRequestForScope({
      scope: "my",
      address: "hmptest-user",
      limit: 12,
    }),
  ).toEqual({
    actor: "hmptest-user",
    excludeStages: [SYSTEM_FEED_STAGE],
    limit: 12,
  });

  expect(
    buildFeedRequestForScope({
      scope: "all",
      limit: 12,
    }),
  ).toEqual({
    excludeEntityTypes: [...PRIVATE_FEED_ENTITY_TYPES],
    limit: 12,
  });
});

test("chamber and urgent feed requests keep faction invites personal", () => {
  expect(
    buildFeedRequestForScope({
      scope: "chambers",
      chamberFilters: ["general", "media"],
      limit: 6,
    }),
  ).toEqual({
    chambers: ["general", "media"],
    excludeStages: [SYSTEM_FEED_STAGE],
    excludeEntityTypes: [...PRIVATE_FEED_ENTITY_TYPES],
    limit: 6,
  });

  const urgentRequests = buildUrgentFeedRequests({
    address: "hmptest-user",
    chamberFilters: ["general"],
    baseLimit: 6,
    stageLimit: 60,
    factionLimit: 6,
  });

  expect(urgentRequests).toEqual(
    expect.arrayContaining([
      {
        chambers: ["general"],
        excludeStages: [SYSTEM_FEED_STAGE],
        excludeEntityTypes: [...PRIVATE_FEED_ENTITY_TYPES],
        limit: 6,
      },
      { stage: "pool", chambers: ["general"], limit: 60 },
      { stage: "vote", chambers: ["general"], limit: 60 },
      { stage: "build", actor: "hmptest-user", limit: 60 },
      { stage: "faction", actor: "hmptest-user", limit: 6 },
    ]),
  );
});
