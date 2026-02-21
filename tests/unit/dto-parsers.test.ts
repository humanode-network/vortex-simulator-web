import { test, expect } from "@rstest/core";

import {
  computeChamberMetrics,
  getChamberNumericStats,
  getFormationProgress,
  parseCommaNumber,
  parsePercent,
  parseRatio,
} from "../../src/lib/dtoParsers.ts";
import type { ChamberDto, FormationProposalPageDto } from "../../src/types/api";

test("parseCommaNumber handles commas and invalids", () => {
  expect(parseCommaNumber("1,200")).toBe(1200);
  expect(parseCommaNumber("0")).toBe(0);
  expect(parseCommaNumber("bad")).toBe(0);
});

test("parsePercent and parseRatio normalize values", () => {
  expect(parsePercent("45%")).toBe(45);
  expect(parsePercent("bad")).toBe(0);
  expect(parseRatio("3/8")).toEqual({ a: 3, b: 8 });
  expect(parseRatio("bad")).toEqual({ a: 0, b: 0 });
});

test("chamber numeric stats and metrics aggregate without double-counting ACM", () => {
  const chambers: ChamberDto[] = [
    {
      id: "general",
      name: "General",
      multiplier: 1,
      stats: {
        governors: "10",
        acm: "1,200",
        lcm: "200",
        mcm: "400",
      },
      pipeline: { pool: 0, vote: 2, build: 1 },
    },
    {
      id: "design",
      name: "Design",
      multiplier: 1.2,
      stats: {
        governors: "5",
        acm: "800",
        lcm: "100",
        mcm: "300",
      },
      pipeline: { pool: 1, vote: 0, build: 0 },
    },
  ];

  expect(getChamberNumericStats(chambers[0])).toEqual({
    governors: 10,
    acm: 1200,
    lcm: 200,
    mcm: 400,
  });

  const metrics = computeChamberMetrics(chambers);
  expect(metrics.totalChambers).toBe(2);
  // ACM is absolute for a governor set (not chamber-local), so summing across
  // chambers would double-count governors who belong to multiple chambers.
  expect(metrics.totalAcm).toBe(1200);
  expect(metrics.liveProposals).toBe(2);
});

test("formation progress mapping uses ratios", () => {
  const formation: FormationProposalPageDto = {
    title: "Formation",
    chamber: "General chamber",
    proposer: "Alice",
    proposerId: "0xalice",
    projectState: "active",
    pendingMilestoneIndex: null,
    nextMilestoneIndex: 2,
    budget: "0 HMND",
    timeLeft: "—",
    teamSlots: "2/5",
    milestones: "1/4",
    progress: "40%",
    stageData: [],
    stats: [],
    lockedTeam: [],
    openSlots: [],
    milestonesDetail: [],
    attachments: [],
    summary: "",
    overview: "",
    executionPlan: [],
    budgetScope: "",
    invisionInsight: {
      role: "observer",
      bullets: [],
    },
  };

  const progress = getFormationProgress(formation);
  expect(progress.progressValue).toBe(40);
  expect(progress.team).toEqual({ a: 2, b: 5 });
  expect(progress.milestones).toEqual({ a: 1, b: 4 });
});
