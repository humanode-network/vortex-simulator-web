import { expect, test } from "@rstest/core";

import {
  getFeedChamberStats,
  getFeedFormationStats,
  getFeedPoolStats,
} from "../../src/lib/feedStageStats";
import type {
  ChamberProposalPageDto,
  FormationProposalPageDto,
  PoolProposalPageDto,
} from "../../src/types/api";

test("getFeedPoolStats calculates attention and upvote floor progress", () => {
  const stats = getFeedPoolStats({
    activeGovernors: 10,
    attentionQuorum: 0.3,
    downvotes: 1,
    thresholdContext: {
      quorumThreshold: {
        upvoteFloorFraction: 0.2,
      },
    },
    upvoteFloor: 2,
    upvotes: 2,
  } as PoolProposalPageDto);

  expect(stats).toMatchObject({
    activeGovernors: 10,
    attentionNeededPercent: 30,
    attentionPercent: 30,
    engaged: 3,
    engagedNeeded: 3,
    meetsAttention: true,
    meetsUpvoteFloor: true,
    upvoteFloor: 2,
    upvoteFloorFractionPercent: 20,
    upvoteFloorProgressPercent: 20,
  });
});

test("getFeedChamberStats calculates quorum, passing, and vote widths", () => {
  const stats = getFeedChamberStats({
    activeGovernors: 10,
    attentionQuorum: 0.4,
    engagedGovernors: 5,
    votes: { yes: 4, no: 1, abstain: 0 },
  } as ChamberProposalPageDto);

  expect(stats).toMatchObject({
    abstainTotal: 0,
    activeGovernors: 10,
    engaged: 5,
    meetsPassing: true,
    meetsQuorum: true,
    noTotal: 1,
    quorumNeeded: 4,
    quorumNeededPercent: 40,
    quorumPercent: 50,
    totalVotes: 5,
    yesPercentOfQuorum: 80,
    yesTotal: 4,
  });
  expect(stats.yesWidth).toBe(80);
  expect(stats.noWidth).toBe(20);
  expect(stats.abstainWidth).toBe(0);
});

test("getFeedFormationStats parses progress, team, and milestones", () => {
  expect(
    getFeedFormationStats({
      milestones: "2 / 5",
      progress: "41%",
      teamSlots: "3 / 4",
    } as FormationProposalPageDto),
  ).toEqual({
    progressValue: 41,
    team: { a: 3, b: 4 },
    milestones: { a: 2, b: 5 },
  });
});
