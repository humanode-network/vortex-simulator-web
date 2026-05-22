import { expect, test } from "@rstest/core";

import {
  formatDayHourMinute,
  getRequirementProgress,
  governingStatusForProgress,
  governingStatusTermId,
  proposalRightsByTier,
  requirementLabel,
} from "../../src/lib/myGovernanceUi";

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
