import { test, expect } from "@rstest/core";

import {
  DEFAULT_HUMAN_NODES_FILTERS,
  filterHumanNodes,
  getHumanNodeCmTotals,
  getHumanNodeDelegationCards,
  getHumanNodeHeaderTitle,
  getHumanNodeManageableDelegationChambers,
  getHumanNodeViewerDelegationByChamber,
  getHumanNodeVisibleHeroStats,
  isLikelyHumanodeAddress,
  shouldShowHumanNodeShortBadge,
} from "../../src/lib/humanNodesUi";
import type {
  GetMyGovernanceResponse,
  HumanNodeDto,
  HumanNodeProfileDto,
} from "../../src/types/api";

const node = (
  id: string,
  overrides: Partial<HumanNodeDto> = {},
): HumanNodeDto => ({
  id,
  name: id,
  role: "Validator",
  chamber: "general",
  factionId: "builders",
  tier: "nominee",
  acm: 0,
  mm: 0,
  memberSince: "2026-01-01T00:00:00.000Z",
  active: {
    governorActive: false,
    humanNodeActive: false,
  },
  tags: [],
  ...overrides,
});

const profile = (
  overrides: Partial<HumanNodeProfileDto> = {},
): HumanNodeProfileDto => ({
  id: "hmpt3fxBvpWrkZxq5H5uWjZ2BgHRMJs2hKHiWJDoqD7am1xPs",
  name: "Human Node Profile",
  governorActive: true,
  humanNodeActive: true,
  governanceSummary: "",
  heroStats: [],
  quickDetails: [],
  proofSections: {
    time: { title: "Time", items: [] },
    devotion: { title: "Devotion", items: [] },
    governance: { title: "Governance", items: [] },
  },
  governanceActions: [],
  delegation: { chambers: [] },
  delegationEligibleChambers: [],
  projects: [],
  activity: [],
  history: [],
  ...overrides,
});

const governance = (
  chamberIds: string[],
): GetMyGovernanceResponse =>
  ({
    delegation: {
      chambers: chamberIds.map((chamberId, index) => ({
        chamberId,
        delegateeAddress: index === 0 ? "hmDelegate" : null,
        inboundWeight: index + 1,
      })),
    },
    eraActivity: {} as never,
    legitimacy: {} as never,
    myChamberIds: [],
  }) as GetMyGovernanceResponse;

test("isLikelyHumanodeAddress identifies long hm addresses only", () => {
  expect(
    isLikelyHumanodeAddress("hmpt3fxBvpWrkZxq5H5uWjZ2BgHRMJs2hKHiWJDoqD7am1xPs"),
  ).toBe(true);
  expect(isLikelyHumanodeAddress("Human Node")).toBe(false);
  expect(isLikelyHumanodeAddress("hm-short")).toBe(false);
});

test("filterHumanNodes searches chamber and faction names", () => {
  const result = filterHumanNodes({
    chambersById: {
      general: {
        id: "general",
        name: "General Chamber",
        multiplier: 1,
        stats: {} as never,
        pipeline: {} as never,
      },
    },
    factionsById: {
      builders: {
        id: "builders",
        name: "Protocol Builders",
      } as never,
    },
    filters: DEFAULT_HUMAN_NODES_FILTERS,
    nodes: [node("alice"), node("bob", { factionId: "other" })],
    search: "protocol",
  });

  expect(result.map((item) => item.id)).toEqual(["alice"]);
});

test("filterHumanNodes sorts by ACM and honors active status", () => {
  const result = filterHumanNodes({
    chambersById: {},
    factionsById: {},
    filters: {
      ...DEFAULT_HUMAN_NODES_FILTERS,
      statusFilter: "governor",
    },
    nodes: [
      node("low", {
        active: { governorActive: true, humanNodeActive: true },
        acm: 10,
      }),
      node("inactive", { acm: 100 }),
      node("high", {
        active: { governorActive: true, humanNodeActive: false },
        cmTotals: { lcm: 0, mcm: 0, acm: 50 },
      }),
    ],
    search: "",
  });

  expect(result.map((item) => item.id)).toEqual(["high", "low"]);
});

test("human node profile title and short badge handle generic names", () => {
  const generic = profile();
  const named = profile({ name: "Alice Validator" });

  expect(getHumanNodeHeaderTitle(generic)).toBe("hmpt…1xPs");
  expect(shouldShowHumanNodeShortBadge(generic)).toBe(false);
  expect(getHumanNodeHeaderTitle(named)).toBe("Alice Validator");
  expect(shouldShowHumanNodeShortBadge(named)).toBe(true);
});

test("human node visible hero stats hide CM internals", () => {
  expect(
    getHumanNodeVisibleHeroStats([
      { label: "Tier", value: "Citizen" },
      { label: "ACM", value: "100" },
      { label: "LCM", value: "10" },
      { label: "Projects", value: "2" },
    ]),
  ).toEqual([
    { label: "Tier", value: "Citizen" },
    { label: "Projects", value: "2" },
  ]);
});

test("human node CM totals parse numeric hero stats", () => {
  expect(
    getHumanNodeCmTotals([
      { label: "LCM", value: "12 pts" },
      { label: "MCM", value: "4.5" },
      { label: "ACM", value: "16.5" },
    ]),
  ).toEqual({ lcm: 12, mcm: 4.5, acm: 16.5 });
});

test("human node delegation helpers fill eligible chambers and viewer maps", () => {
  const viewerGovernance = governance(["general", "research"]);

  expect(
    getHumanNodeDelegationCards(
      [
        {
          chamberId: "research",
          delegateeAddress: "hmDelegatee",
          inboundWeight: 2,
          inboundDelegators: ["hmA"],
        },
      ],
      ["general", "research"],
    ).map((item) => ({
      chamberId: item.chamberId,
      delegateeAddress: item.delegateeAddress,
    })),
  ).toEqual([
    { chamberId: "general", delegateeAddress: null },
    { chamberId: "research", delegateeAddress: "hmDelegatee" },
  ]);
  expect(
    getHumanNodeViewerDelegationByChamber(viewerGovernance).get("general")
      ?.delegateeAddress,
  ).toBe("hmDelegate");
  expect(
    getHumanNodeManageableDelegationChambers(viewerGovernance, [
      "research",
    ]).map((item) => item.chamberId),
  ).toEqual(["research"]);
});
