import { test, expect } from "@rstest/core";

import {
  getProposalChamberPageDerivation,
  getProposalOrdinaryVoteGate,
  getProposalPoolVotingGate,
  proposalFormationSummaryStats,
  viewerIsProposalAuthor,
} from "../../src/lib/proposalUi";
import type { ChamberProposalPageDto } from "../../src/types/api";

const genericAddress = "5C62Ck4UrFPiBtoCmeSrgF7x9yv9mn38446dhCpsi2mLHiFT";
const canonicalAddress = "hmnVXRhJsFLh5CbdxZNrn5Lu6FR2nDacxgSLrsVoyoW9ERXAP";

function chamberProposalFixture(
  overrides: Partial<ChamberProposalPageDto> = {},
): ChamberProposalPageDto {
  return {
    title: "Build Vortex",
    proposer: "Alice",
    proposerId: canonicalAddress,
    chamber: "General",
    voteKind: "chamber",
    voterLabel: "Governors",
    scoreLabel: "CM",
    scoreEnabled: true,
    milestoneIndex: null,
    budget: "$10,000",
    formationEligible: true,
    teamSlots: "2/5",
    milestones: "3",
    timeLeft: "3 days",
    timeContextLabel: "Time left",
    ordinaryVoteClosed: false,
    votePassedAt: null,
    voteFinalizesAt: null,
    votes: { yes: 2, no: 1, abstain: 1 },
    attentionQuorum: 0.5,
    quorumNeeded: 3,
    passingRule: "66.6% yes",
    engagedGovernors: 4,
    activeGovernors: 6,
    engagedVoters: 4,
    eligibleVoters: 6,
    attachments: [],
    teamLocked: [],
    openSlotNeeds: [],
    milestonesDetail: [],
    summary: "",
    overview: "",
    executionPlan: [],
    budgetScope: "",
    viewerVote: { choice: "yes", score: 5, updatedAt: "2026-01-01" },
    delegation: null,
    citizenVeto: {
      available: true,
      attemptsUsed: 0,
      attemptsRemaining: 2,
      eligibleCitizens: 3,
      quorumNeeded: 1,
      vetoNeeded: 2,
      votes: { veto: 0, keep: 0 },
      viewer: { eligible: true, currentVote: null },
    },
    chamberVeto: {
      activeChambers: 0,
      chamberThreshold: 0,
      vetoingChambers: 0,
      chambers: [],
    },
    ...overrides,
  };
}

test("viewerIsProposalAuthor resolves same-key SS58 encodings", () => {
  expect(viewerIsProposalAuthor(genericAddress, canonicalAddress)).toBe(true);
});

test("viewerIsProposalAuthor requires two concrete identities", () => {
  expect(viewerIsProposalAuthor(null, canonicalAddress)).toBe(false);
  expect(viewerIsProposalAuthor(genericAddress, null)).toBe(false);
  expect(viewerIsProposalAuthor("0xAlice", "0xBob")).toBe(false);
});

test("proposalFormationSummaryStats formats formation cards", () => {
  expect(
    proposalFormationSummaryStats({
      formationEligible: true,
      budget: "$10,000",
      teamSlots: "2 / 5 slots",
      milestones: "3",
    }),
  ).toEqual([
    { label: "Budget ask", value: "$10,000" },
    { label: "Formation", value: "Yes" },
    { label: "Team slots", value: "2 / 5 slots (open: 3)" },
    { label: "Milestones", value: "3 milestones planned" },
  ]);
  expect(
    proposalFormationSummaryStats({
      formationEligible: false,
      budget: "$10,000",
      teamSlots: "2 / 5 slots",
      milestones: "3",
    }),
  ).toEqual([]);
});

test("proposalFormationSummaryStats supports compact list copy", () => {
  expect(
    proposalFormationSummaryStats(
      {
        formationEligible: true,
        budget: "$10,000",
        teamSlots: "2/5",
        milestones: "3",
      },
      { milestoneSuffix: "planned" },
    )[3],
  ).toEqual({ label: "Milestones", value: "3 planned" });
});

test("getProposalChamberPageDerivation derives chamber vote display state", () => {
  expect(
    getProposalChamberPageDerivation({
      proposal: chamberProposalFixture(),
      viewerAddress: genericAddress,
    }),
  ).toMatchObject({
    abstainPercentOfTotal: 25,
    abstainTotal: 1,
    chamberTitle: "Build Vortex",
    engaged: 4,
    formationSummaryStats: [
      { label: "Budget ask", value: "$10,000" },
      { label: "Formation", value: "Yes" },
      { label: "Team slots", value: "2/5 (open: 3)" },
      { label: "Milestones", value: "3 milestones planned" },
    ],
    noPercentOfTotal: 25,
    noTotal: 1,
    ordinaryVoteClosed: false,
    quorumNeeded: 3,
    quorumNeededPercent: 50,
    quorumPercent: 67,
    referendumVote: false,
    scoreLabel: "CM",
    vetoWindowOpen: true,
    viewerIsProposer: true,
    viewerVoteLabel: "Yes (score 5)",
    yesPercentOfQuorum: 50,
    yesPercentOfTotal: 50,
    yesTotal: 2,
  });
});

test("getProposalChamberPageDerivation handles referendum and milestone titles", () => {
  expect(
    getProposalChamberPageDerivation({
      proposal: chamberProposalFixture({
        voteKind: "referendum",
        viewerVote: { choice: "no", score: null, updatedAt: "2026-01-01" },
      }),
      viewerAddress: null,
    }),
  ).toMatchObject({
    chamberTitle: "Build Vortex — Referendum",
    referendumVote: true,
    viewerIsProposer: false,
    viewerVoteLabel: "No",
  });

  expect(
    getProposalChamberPageDerivation({
      proposal: chamberProposalFixture({
        milestoneIndex: 2,
        scoreLabel: null,
        timeLeft: "Ended",
      }),
      viewerAddress: null,
    }),
  ).toMatchObject({
    chamberTitle: "Build Vortex — Milestone vote (M2)",
    milestoneVoteIndex: 2,
    scoreLabel: "MM",
    vetoWindowOpen: false,
  });
});

test("getProposalPoolVotingGate blocks proposers and wallet connection states", () => {
  expect(
    getProposalPoolVotingGate({
      viewerIsProposer: true,
      auth: {
        enabled: true,
        loading: false,
        authenticated: true,
        eligible: true,
      },
    }),
  ).toEqual({
    allowed: false,
    disabledReason: "You cannot vote on your own proposal.",
  });

  expect(
    getProposalPoolVotingGate({
      viewerIsProposer: false,
      auth: {
        enabled: true,
        loading: true,
        authenticated: false,
        eligible: false,
      },
    }),
  ).toEqual({
    allowed: false,
    disabledReason: "Checking wallet status…",
  });

  expect(
    getProposalPoolVotingGate({
      viewerIsProposer: false,
      auth: {
        enabled: true,
        loading: false,
        authenticated: false,
        eligible: false,
      },
    }),
  ).toEqual({
    allowed: false,
    disabledReason: "Connect your wallet to vote.",
  });

  expect(
    getProposalPoolVotingGate({
      viewerIsProposer: false,
      auth: {
        enabled: true,
        loading: false,
        authenticated: true,
        eligible: false,
        gateReason: "Custom gate reason.",
      },
    }),
  ).toEqual({
    allowed: true,
    disabledReason:
      "Only chamber Governors can vote. Active Governors are counted for quorum.",
  });
});

test("getProposalPoolVotingGate allows authenticated or auth-disabled voters", () => {
  expect(
    getProposalPoolVotingGate({
      viewerIsProposer: false,
      auth: {
        enabled: true,
        loading: false,
        authenticated: true,
        eligible: true,
      },
    }),
  ).toEqual({
    allowed: true,
    disabledReason:
      "Only chamber Governors can vote. Active Governors are counted for quorum.",
  });

  expect(
    getProposalPoolVotingGate({
      viewerIsProposer: false,
      auth: {
        enabled: false,
        loading: false,
        authenticated: false,
        eligible: false,
      },
    }),
  ).toEqual({
    allowed: true,
    disabledReason:
      "Only chamber Governors can vote. Active Governors are counted for quorum.",
  });
});

test("getProposalOrdinaryVoteGate blocks submit, proposer, and closed states", () => {
  expect(
    getProposalOrdinaryVoteGate({
      submitting: true,
      viewerIsProposer: false,
    }),
  ).toEqual({ disabled: true, title: undefined });

  expect(
    getProposalOrdinaryVoteGate({
      submitting: false,
      viewerIsProposer: true,
    }),
  ).toEqual({
    disabled: true,
    title: "You cannot vote on your own proposal.",
  });

  expect(
    getProposalOrdinaryVoteGate({
      closedReason: "Ordinary chamber voting is closed.",
      submitting: false,
      viewerIsProposer: false,
      votingClosed: true,
    }),
  ).toEqual({
    disabled: true,
    title: "Ordinary chamber voting is closed.",
  });

  expect(
    getProposalOrdinaryVoteGate({
      auth: {
        enabled: true,
        loading: false,
        authenticated: false,
      },
      submitting: false,
      viewerIsProposer: false,
    }),
  ).toEqual({
    disabled: true,
    title: "Connect your wallet to vote.",
  });
});

test("getProposalOrdinaryVoteGate allows open non-proposer votes", () => {
  expect(
    getProposalOrdinaryVoteGate({
      auth: {
        enabled: true,
        loading: false,
        authenticated: true,
      },
      submitting: false,
      viewerIsProposer: false,
    }),
  ).toEqual({ disabled: false, title: undefined });
});
