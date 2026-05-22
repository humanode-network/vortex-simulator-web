import { test, expect } from "@rstest/core";

import {
  factionIdFromHref,
  isUrgentItemInteractable,
  normalizeAppHref,
  proposalIdFromHref,
  toUrgentItems,
  urgentEntityKey,
} from "../../src/lib/feedUi";
import type { FeedItemDto } from "../../src/types/api";

const genericAddress = "5C62Ck4UrFPiBtoCmeSrgF7x9yv9mn38446dhCpsi2mLHiFT";
const canonicalAddress = "hmnVXRhJsFLh5CbdxZNrn5Lu6FR2nDacxgSLrsVoyoW9ERXAP";

const buildItem: FeedItemDto = {
  id: "feed:build",
  title: "Build action",
  meta: "Formation",
  stage: "build",
  summary: "Build action",
  summaryPill: "Build",
  timestamp: "2026-01-01T00:00:00.000Z",
  href: "/app/proposals/build/formation",
  actionable: true,
  proposerId: canonicalAddress,
};

test("urgent build feed actionability resolves same-key proposer variants", () => {
  expect(isUrgentItemInteractable(buildItem, false, genericAddress)).toBe(true);
  expect(isUrgentItemInteractable(buildItem, false, "hmptest-other")).toBe(
    false,
  );
});

test("feed href helpers normalize app routes and extract entity ids", () => {
  expect(normalizeAppHref("/proposals/p1/pp")).toBe("/app/proposals/p1/pp");
  expect(normalizeAppHref("/app/factions/f1/threads/t1")).toBe(
    "/app/factions/f1?thread=t1",
  );
  expect(proposalIdFromHref("/app/proposals/p1/chamber?x=1")).toBe("p1");
  expect(factionIdFromHref("/app/factions/f1")).toBe("f1");
});

test("urgent feed dedupes by entity and keeps newest item", () => {
  const older: FeedItemDto = {
    ...buildItem,
    id: "old",
    href: "/app/proposals/p1/pp",
    stage: "pool",
    timestamp: "2026-01-01T00:00:00.000Z",
  };
  const newer: FeedItemDto = {
    ...older,
    id: "new",
    timestamp: "2026-01-02T00:00:00.000Z",
  };

  expect(urgentEntityKey(older)).toBe("proposal:p1");
  expect(toUrgentItems([older, newer], true)).toEqual([newer]);
});
