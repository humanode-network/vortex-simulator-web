import { test, expect } from "@rstest/core";
import {
  activityMatches,
  shortAddress,
  shouldShowDetail,
} from "../../src/lib/profileUi";
import type { GovernanceActionDto } from "../../src/types/api";

const baseAction: GovernanceActionDto = {
  title: "Vote on proposal",
  action: "Voted",
  context: "Proposal pool",
  detail: "Upvoted",
  href: "/app/proposals/abc",
  timestamp: "2026-01-01T00:00:00.000Z",
};

test("shortAddress truncates long addresses", () => {
  const addr = "hmpt3fxBvpWrkZxq5H5uWjZ2BgHRMJs2hKHiWJDoqD7am1xPs";
  expect(shortAddress(addr, 6)).toBe("hmpt3f…m1xPs");
});

test("shortAddress keeps short values intact", () => {
  expect(shortAddress("hm123", 6)).toBe("hm123");
});

test("shouldShowDetail hides address-like labels", () => {
  expect(shouldShowDetail("Address")).toBe(false);
  expect(shouldShowDetail("Wallet")).toBe(false);
  expect(shouldShowDetail("ID")).toBe(false);
  expect(shouldShowDetail("Tier")).toBe(true);
});

test("activityMatches filters by category", () => {
  expect(activityMatches(baseAction, "all")).toBe(true);
  expect(activityMatches(baseAction, "votes")).toBe(true);
  expect(activityMatches(baseAction, "proposals")).toBe(true);
  expect(activityMatches(baseAction, "chambers")).toBe(false);
});
