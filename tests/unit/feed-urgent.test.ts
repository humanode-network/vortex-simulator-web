import { test, expect } from "@rstest/core";

import { isUrgentItemInteractable } from "../../src/pages/feed/Feed";
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
