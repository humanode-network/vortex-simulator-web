import { expect, test } from "@rstest/core";

import {
  formatDayHourMinute,
  getRequirementProgress,
  governingStatusForProgress,
  governingStatusTermId,
  proposalRightsByTier,
  requirementLabel,
} from "../../src/lib/myGovernanceUi";
import {
  formatExposurePeriod,
  GOVERNOR_OPPORTUNITY_STAGES,
  GOVERNOR_OPPORTUNITY_STATE_OPTIONS,
  getActiveGovernorReasonCopy,
  getGovernorOpportunityStateCopy,
  governorOpportunityToFeedItem,
  isGovernorOpportunityStage,
  isGovernorOpportunityState,
  isOutstandingGovernorOpportunity,
  mergeGovernorOpportunityPages,
} from "../../src/lib/governorOpportunityUi";

test("getRequirementProgress formats capped tier requirement progress", () => {
  expect(
    getRequirementProgress(
      "activeEras",
      {
        activeEras: 7,
        acceptedProposals: 0,
        formationParticipation: 0,
        governorEras: 0,
      },
      {
        activeEras: 5,
        acceptedProposals: 0,
        formationParticipation: 0,
        governorEras: 0,
      },
    ),
  ).toEqual({ done: 7, required: 5, percent: 100 });
});

test("getRequirementProgress treats zero requirements as complete", () => {
  expect(
    getRequirementProgress(
      "acceptedProposals",
      {
        activeEras: 0,
        acceptedProposals: 0,
        formationParticipation: 0,
        governorEras: 0,
      },
      {
        activeEras: 0,
        acceptedProposals: 0,
        formationParticipation: 0,
        governorEras: 0,
      },
    ),
  ).toEqual({ done: 0, required: 0, percent: 100 });
});

test("governingStatusForProgress classifies threshold bands", () => {
  expect(governingStatusForProgress(6, 5)).toEqual({
    label: "Ahead",
    termId: "governing_status_ahead",
  });
  expect(governingStatusForProgress(5, 5)).toEqual({
    label: "Stable",
    termId: "governing_status_stable",
  });
  expect(governingStatusForProgress(4, 5)).toEqual({
    label: "Falling behind",
    termId: "governing_status_falling_behind",
  });
  expect(governingStatusForProgress(3, 5)).toEqual({
    label: "At risk",
    termId: "governing_status_at_risk",
  });
  expect(governingStatusForProgress(2, 5)).toEqual({
    label: "Losing status",
    termId: "governing_status_losing_status",
  });
});

test("governingStatusTermId maps labels to glossary term ids", () => {
  expect(governingStatusTermId("Ahead")).toBe("governing_status_ahead");
  expect(governingStatusTermId("Stable")).toBe("governing_status_stable");
  expect(governingStatusTermId("Falling behind")).toBe(
    "governing_status_falling_behind",
  );
  expect(governingStatusTermId("At risk")).toBe("governing_status_at_risk");
  expect(governingStatusTermId("Losing status")).toBe(
    "governing_status_losing_status",
  );
});

test("formatDayHourMinute formats time left", () => {
  expect(formatDayHourMinute(172_860_000, 0)).toBe("2d:00h:01m");
  expect(formatDayHourMinute(0, 60_000)).toBe("0d:00h:00m");
});

test("tier requirement and proposal-rights vocabulary stays stable", () => {
  expect(requirementLabel.governorEras).toBe("Run a node as a governor (eras)");
  expect(proposalRightsByTier.Citizen).toContain("DAO core");
});

test("fair opportunity copy distinguishes exposure, completion, and exclusions", () => {
  expect(GOVERNOR_OPPORTUNITY_STAGES.map((stage) => stage.value)).toEqual([
    "pool",
    "vote",
  ]);
  expect(GOVERNOR_OPPORTUNITY_STATE_OPTIONS).toHaveLength(5);
  expect(isGovernorOpportunityStage("vote")).toBe(true);
  expect(isGovernorOpportunityStage("build")).toBe(false);
  expect(isGovernorOpportunityState("missed")).toBe(true);
  expect(isGovernorOpportunityState("unknown")).toBe(false);
  expect(formatExposurePeriod(86_400)).toBe("1d");
  expect(formatExposurePeriod(1_800)).toBe("30m");
  expect(formatExposurePeriod(5_400)).toBe("1.5h");
  expect(formatExposurePeriod(45)).toBe("45s");
  expect(
    getActiveGovernorReasonCopy("no_accountable_opportunities").label,
  ).toBe("No accountable opportunities");
  expect(
    getGovernorOpportunityStateCopy({
      occurrenceId: "proposal:pool:opened",
      proposalId: "proposal",
      proposalTitle: "Proposal",
      chamberId: "general",
      chamberTitle: "General",
      proposalStage: "pool",
      stage: "pool",
      state: "available",
      accountable: false,
      canBecomeAccountable: true,
      participated: false,
      openedAt: "2026-08-25T00:00:00.000Z",
      accountableAt: "2026-08-26T00:00:00.000Z",
      closedAt: null,
      exclusionReason: null,
    }).label,
  ).toBe("Exposure building");
  expect(
    getGovernorOpportunityStateCopy({
      occurrenceId: "proposal:vote:opened",
      proposalId: "proposal",
      proposalTitle: "Proposal",
      chamberId: "general",
      chamberTitle: "General",
      proposalStage: "vote",
      stage: "vote",
      state: "excluded",
      accountable: false,
      canBecomeAccountable: false,
      participated: false,
      openedAt: "2026-08-25T00:00:00.000Z",
      accountableAt: "2026-08-26T00:00:00.000Z",
      closedAt: null,
      exclusionReason: "formation_team_member",
    }).detail,
  ).toContain("Formation team members");
  expect(
    getGovernorOpportunityStateCopy({
      occurrenceId: "proposal:pool:court-delayed",
      proposalId: "proposal",
      proposalTitle: "Proposal",
      chamberId: "general",
      chamberTitle: "General",
      proposalStage: "failed",
      stage: "pool",
      state: "closed_unaccountable",
      accountable: false,
      canBecomeAccountable: false,
      participated: false,
      openedAt: "2026-08-25T00:00:00.000Z",
      accountableAt: "2026-08-27T00:00:00.000Z",
      closedAt: "2026-08-26T00:00:00.000Z",
      exclusionReason: "court_voting_restriction",
    }).detail,
  ).toContain("unrestricted exposure");
});

test("opportunity page merging preserves order and removes retry duplicates", () => {
  const item = {
    occurrenceId: "proposal:pool:opened",
    proposalId: "proposal",
    proposalTitle: "Proposal",
    chamberId: "general",
    chamberTitle: "General",
    proposalStage: "pool" as const,
    stage: "pool" as const,
    state: "available" as const,
    accountable: true,
    canBecomeAccountable: true,
    participated: false,
    openedAt: "2026-08-25T00:00:00.000Z",
    accountableAt: "2026-08-26T00:00:00.000Z",
    closedAt: null,
    exclusionReason: null,
  };
  const summary = { raw: 1, accountable: 1, completed: 0, required: 1 };
  const current = {
    exposureSeconds: 86_400,
    activeGovernorReason: "not_evaluated_yet" as const,
    pool: summary,
    chamber: summary,
    items: [item],
    page: { offset: 0, limit: 20, total: 2, stage: null, state: null },
  };
  const fresh = {
    ...current,
    items: [
      item,
      {
        ...item,
        occurrenceId: "proposal:vote:opened",
        stage: "vote" as const,
      },
    ],
    page: { ...current.page, offset: 1 },
  };

  expect(mergeGovernorOpportunityPages(current, fresh).items).toHaveLength(2);
  expect(mergeGovernorOpportunityPages(current, fresh).page.offset).toBe(1);
});

test("early participation is recorded without claiming completion", () => {
  const copy = getGovernorOpportunityStateCopy({
    occurrenceId: "proposal-early:pool:2026-08-01",
    proposalId: "proposal-early",
    proposalTitle: "Early action",
    chamberId: "general",
    chamberTitle: "General",
    proposalStage: "pool",
    stage: "pool",
    state: "available",
    accountable: false,
    canBecomeAccountable: true,
    participated: true,
    openedAt: "2026-08-01T00:00:00.000Z",
    accountableAt: "2026-08-02T00:00:00.000Z",
    closedAt: null,
    exclusionReason: null,
  });

  expect(copy.label).toBe("Action recorded");
  expect(copy.detail).toContain("will count if this stage remains open");
  expect(
    isOutstandingGovernorOpportunity({
      occurrenceId: "proposal-early:pool:2026-08-01",
      proposalId: "proposal-early",
      proposalTitle: "Early action",
      chamberId: "general",
      chamberTitle: "General",
      proposalStage: "pool",
      stage: "pool",
      state: "available",
      accountable: false,
      canBecomeAccountable: true,
      participated: true,
      openedAt: "2026-08-01T00:00:00.000Z",
      accountableAt: "2026-08-02T00:00:00.000Z",
      closedAt: null,
      exclusionReason: null,
    }),
  ).toBe(false);
});

test("fair opportunity feed cards preserve canonical source and occurrence timing", () => {
  const item = governorOpportunityToFeedItem({
    occurrenceId: "proposal:vote:opened",
    proposalId: "proposal",
    proposalTitle: "A proposal requiring a chamber decision",
    chamberId: "media",
    chamberTitle: "Media and Communications",
    proposalStage: "vote",
    stage: "vote",
    state: "available",
    accountable: false,
    canBecomeAccountable: true,
    participated: false,
    openedAt: "2026-08-25T00:00:00.000Z",
    accountableAt: "2026-08-26T00:00:00.000Z",
    closedAt: null,
    exclusionReason: null,
  });

  expect(item.meta).toBe("Media and Communications");
  expect(item.href).toBe("/app/proposals/proposal/chamber");
  expect(item.summaryPill).toBe("Exposure building");
  expect(item.summary).toContain("becomes accountable");
});

test("a late-era opportunity stays actionable without promising qualification credit", () => {
  const state = getGovernorOpportunityStateCopy({
    occurrenceId: "proposal:pool:late",
    proposalId: "proposal",
    proposalTitle: "Late-era proposal",
    chamberId: "general",
    chamberTitle: "General",
    proposalStage: "pool",
    stage: "pool",
    state: "available",
    accountable: false,
    canBecomeAccountable: false,
    participated: false,
    openedAt: "2026-08-28T12:00:00.000Z",
    accountableAt: "2026-08-29T12:00:00.000Z",
    closedAt: null,
    exclusionReason: null,
  });

  expect(state.label).toBe("Available, not counted");
  expect(state.detail).toContain("not enough actionable time");
});
