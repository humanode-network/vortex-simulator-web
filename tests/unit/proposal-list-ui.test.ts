import { test, expect } from "@rstest/core";

import {
  DEFAULT_PROPOSAL_LIST_FILTERS,
  filterProposalList,
  getChamberProposalListStats,
  getPoolProposalListStats,
  getProposalChamberFilterOptions,
  getProposalListFilterConfig,
  getProposalListKeyStats,
  getProposalListLoadingMessage,
  getProposalListPrimaryHref,
  hasFinishedRoute,
  isEndedProposal,
} from "../../src/lib/proposalListUi";
import type { ProposalListItemDto } from "../../src/types/api";

function proposalFixture(
  overrides: Partial<ProposalListItemDto>,
): ProposalListItemDto {
  return {
    id: "p1",
    title: "Build Vortex",
    meta: "General chamber",
    stage: "pool",
    summaryPill: "Pool",
    summary: "A governance proposal",
    stageData: [],
    stats: [],
    proposer: "Alice",
    proposerId: "0xalice",
    chamber: "General",
    tier: "Citizen",
    proofFocus: "pog",
    tags: [],
    keywords: [],
    date: "2026-01-01",
    votes: 0,
    activityScore: 0,
    ctaPrimary: "Open",
    ctaSecondary: "",
    ...overrides,
  };
}

test("getPoolProposalListStats derives attention and upvote floor metrics", () => {
  expect(
    getPoolProposalListStats({
      activeGovernors: 4,
      attentionQuorum: 0.5,
      downvotes: 1,
      thresholdContext: {
        activityThreshold: {
          categories: [],
          qualificationEra: null,
          activationEra: null,
        },
        quorumThreshold: {
          stage: "pool",
          denominator: 4,
          source: "snapshot",
          snapshotEra: 1,
          snapshotCapturedAt: "2026-01-01T00:00:00.000Z",
          attentionQuorumFraction: 0.5,
          upvoteFloorFraction: 0.25,
        },
      },
      upvoteFloor: 2,
      upvotes: 2,
    }),
  ).toEqual({
    activeGovernors: 4,
    engaged: 3,
    attentionPercent: 75,
    attentionNeededPercent: 50,
    upvoteFloorFractionPercent: 25,
    upvoteFloorProgressPercent: 25,
    meetsAttention: true,
    meetsUpvoteFloor: true,
    engagedNeeded: 2,
    upvoteFloor: 2,
  });
});

test("getChamberProposalListStats derives quorum, passing, and bar widths", () => {
  expect(
    getChamberProposalListStats({
      activeGovernors: 3,
      quorumNeeded: 2,
      votes: { yes: 2, no: 1, abstain: 0 },
    }),
  ).toEqual({
    activeGovernors: 3,
    yesTotal: 2,
    noTotal: 1,
    abstainTotal: 0,
    totalVotes: 3,
    engaged: 3,
    quorumNeeded: 2,
    quorumPercent: 100,
    quorumNeededPercent: 67,
    yesPercentOfQuorum: 67,
    meetsQuorum: true,
    meetsPassing: true,
    yesWidth: 66.66666666666666,
    noWidth: 33.33333333333333,
    abstainWidth: 0,
  });
});

test("getProposalListKeyStats uses stage details and preserves deliberation stats", () => {
  const proposal = proposalFixture({
    stats: [
      { label: "Budget ask", value: "old" },
      { label: "Deliberation", value: "Active" },
    ],
  });

  expect(
    getProposalListKeyStats({
      proposal,
      poolPage: {
        activeGovernors: 4,
        attentionQuorum: 0.5,
        downvotes: 0,
        upvoteFloor: 1,
        upvotes: 1,
        thresholdContext: undefined,
        formationEligible: true,
        budget: "$10,000",
        teamSlots: "2/5",
        milestones: "3",
      },
    }),
  ).toEqual([
    { label: "Budget ask", value: "$10,000" },
    { label: "Formation", value: "Yes" },
    { label: "Team slots", value: "2/5 (open: 3)" },
    { label: "Milestones", value: "3 planned" },
    { label: "Deliberation", value: "Active" },
  ]);
});

test("getProposalListKeyStats builds formation stage stats", () => {
  const proposal = proposalFixture({
    id: "p2",
    title: "Execute Vortex",
    stage: "build",
    summaryPill: "Build",
    stats: [{ label: "Open concerns", value: "None" }],
  });

  expect(
    getProposalListKeyStats({
      proposal,
      formationPage: {
        budget: "$10,000",
        timeLeft: "3 days",
        teamSlots: "2/5",
        milestones: "1/3",
        stats: [{ label: "Progress", value: "40%" }],
      },
    }),
  ).toEqual([
    { label: "Budget ask", value: "$10,000" },
    { label: "Time left", value: "3 days" },
    { label: "Team slots", value: "2/5" },
    { label: "Milestones", value: "1/3" },
    { label: "Progress", value: "40%" },
    { label: "Open concerns", value: "None" },
  ]);
});

test("getProposalListPrimaryHref prefers explicit href", () => {
  expect(
    getProposalListPrimaryHref({
      href: "/custom/path",
      id: "p1",
      stage: "pool",
      summaryPill: "Pool",
    }),
  ).toBe("/custom/path");
});

test("getProposalListPrimaryHref maps proposal stages to fallback routes", () => {
  expect(
    getProposalListPrimaryHref({
      id: "p1",
      stage: "pool",
      summaryPill: "Pool",
    }),
  ).toBe("/app/proposals/p1/pp");
  expect(
    getProposalListPrimaryHref({
      id: "p1",
      stage: "vote",
      summaryPill: "Vote",
    }),
  ).toBe("/app/proposals/p1/chamber");
  expect(
    getProposalListPrimaryHref({
      id: "p1",
      stage: "citizen_veto",
      summaryPill: "Citizen veto",
    }),
  ).toBe("/app/proposals/p1/citizen-veto");
  expect(
    getProposalListPrimaryHref({
      id: "p1",
      stage: "chamber_veto",
      summaryPill: "Chamber veto",
    }),
  ).toBe("/app/proposals/p1/chamber-veto");
  expect(
    getProposalListPrimaryHref({
      id: "p1",
      stage: "passed",
      summaryPill: "Finished",
    }),
  ).toBe("/app/proposals/p1/finished");
});

test("getProposalListPrimaryHref maps build proposals by completion state", () => {
  expect(
    getProposalListPrimaryHref({
      id: "p1",
      stage: "build",
      summaryPill: "Build",
    }),
  ).toBe("/app/proposals/p1/formation");
  expect(
    getProposalListPrimaryHref({
      id: "p1",
      stage: "build",
      summaryPill: "Finished",
    }),
  ).toBe("/app/proposals/p1/finished");
});

test("isEndedProposal and hasFinishedRoute identify terminal cards", () => {
  expect(isEndedProposal(proposalFixture({ stage: "passed" }))).toBe(true);
  expect(
    isEndedProposal(proposalFixture({ stage: "build", summaryPill: "Failed" })),
  ).toBe(true);
  expect(isEndedProposal(proposalFixture({ stage: "pool" }))).toBe(false);
  expect(hasFinishedRoute("/app/proposals/p1/finished")).toBe(true);
  expect(hasFinishedRoute("/app/proposals/p1/pp")).toBe(false);
});

test("filterProposalList filters by search, lifecycle, stage, chamber, and sort", () => {
  const proposals = [
    proposalFixture({
      id: "old",
      title: "Old chamber vote",
      stage: "vote",
      chamber: "Engineering",
      date: "2026-01-01",
      activityScore: 1,
      votes: 3,
      keywords: ["infrastructure"],
    }),
    proposalFixture({
      id: "new",
      title: "New pool proposal",
      stage: "pool",
      chamber: "General",
      date: "2026-01-03",
      activityScore: 4,
      votes: 2,
      keywords: ["vortex"],
    }),
    proposalFixture({
      id: "done",
      title: "Finished proposal",
      stage: "passed",
      summaryPill: "Finished",
      chamber: "General",
      date: "2026-01-02",
      activityScore: 10,
      votes: 9,
      keywords: ["vortex"],
    }),
  ];

  expect(
    filterProposalList(proposals, "vortex", {
      stageFilter: "any",
      lifecycleFilter: "active",
      chamberFilter: "All chambers",
      sortBy: "Newest",
    }).map((proposal) => proposal.id),
  ).toEqual(["new"]);

  expect(
    filterProposalList(proposals, "", {
      stageFilter: "any",
      lifecycleFilter: "all",
      chamberFilter: "General",
      sortBy: "Votes",
    }).map((proposal) => proposal.id),
  ).toEqual(["done", "new"]);
});

test("getProposalChamberFilterOptions returns sorted unique chambers", () => {
  expect(
    getProposalChamberFilterOptions([
      proposalFixture({ chamber: "Zeta" }),
      proposalFixture({ chamber: "General" }),
      proposalFixture({ chamber: "General" }),
    ]),
  ).toEqual([
    { value: "All chambers", label: "All chambers" },
    { value: "General", label: "General" },
    { value: "Zeta", label: "Zeta" },
  ]);
});

test("getProposalListFilterConfig builds stable filters with dynamic chambers", () => {
  expect(DEFAULT_PROPOSAL_LIST_FILTERS).toEqual({
    stageFilter: "any",
    lifecycleFilter: "active",
    chamberFilter: "All chambers",
    sortBy: "Newest",
  });

  expect(
    getProposalListFilterConfig([
      { value: "All chambers", label: "All chambers" },
      { value: "General", label: "General" },
    ]),
  ).toEqual([
    {
      key: "stageFilter",
      label: "Status",
      options: [
        { value: "any", label: "Any" },
        { value: "pool", label: "Proposal pool" },
        { value: "vote", label: "Chamber vote" },
        { value: "citizen_veto", label: "Citizen veto" },
        { value: "chamber_veto", label: "Chamber veto" },
        { value: "build", label: "Formation" },
        { value: "passed", label: "Passed" },
        { value: "failed", label: "Ended (failed)" },
      ],
    },
    {
      key: "lifecycleFilter",
      label: "Lifecycle",
      options: [
        { value: "active", label: "Active only" },
        { value: "all", label: "Include ended" },
      ],
    },
    {
      key: "chamberFilter",
      label: "Chamber",
      options: [
        { value: "All chambers", label: "All chambers" },
        { value: "General", label: "General" },
      ],
    },
    {
      key: "sortBy",
      label: "Sort by",
      options: [
        { value: "Newest", label: "Newest" },
        { value: "Oldest", label: "Oldest" },
        { value: "Activity", label: "Activity" },
        { value: "Votes", label: "Votes cast" },
      ],
    },
  ]);
});

test("getProposalListLoadingMessage returns stage-specific loading copy", () => {
  expect(
    getProposalListLoadingMessage({
      href: "/app/proposals/p1/finished",
      stage: "passed",
    }),
  ).toBe("Loading outcome details…");
  expect(getProposalListLoadingMessage({ stage: "vote" })).toBe(
    "Loading chamber vote stats…",
  );
  expect(getProposalListLoadingMessage({ stage: "citizen_veto" })).toBe(
    "Loading citizen veto stats…",
  );
  expect(getProposalListLoadingMessage({ stage: "chamber_veto" })).toBe(
    "Loading chamber veto stats…",
  );
  expect(getProposalListLoadingMessage({ stage: "pool" })).toBeNull();
});
