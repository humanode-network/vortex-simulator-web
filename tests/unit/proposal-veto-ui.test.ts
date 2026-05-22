import { test, expect } from "@rstest/core";

import {
  calculateCitizenVetoSupportPercent,
  getVetoActionGate,
} from "../../src/lib/proposalVetoUi";

test("citizen veto support percent uses eligible Citizens as denominator", () => {
  expect(
    calculateCitizenVetoSupportPercent({
      vetoVotes: 1,
      eligibleCitizens: 3,
    }),
  ).toBe(33);

  expect(
    calculateCitizenVetoSupportPercent({
      vetoVotes: 2,
      eligibleCitizens: 3,
    }),
  ).toBe(67);
});

test("citizen veto support percent handles an empty electorate", () => {
  expect(
    calculateCitizenVetoSupportPercent({
      vetoVotes: 1,
      eligibleCitizens: 0,
    }),
  ).toBe(0);
});

test("getVetoActionGate blocks submit, proposer, closed, recorded, and ineligible states", () => {
  const base = {
    alreadyRecorded: false,
    alreadyRecordedReason: "Already recorded.",
    ineligibleReason: "Not eligible.",
    submitting: false,
    viewerEligible: true,
    viewerIsProposer: false,
    windowOpen: true,
  };

  expect(getVetoActionGate({ ...base, submitting: true })).toEqual({
    disabled: true,
    title: undefined,
  });
  expect(getVetoActionGate({ ...base, viewerIsProposer: true })).toEqual({
    disabled: true,
    title: "You cannot vote on your own proposal.",
  });
  expect(getVetoActionGate({ ...base, alreadyRecorded: true })).toEqual({
    disabled: true,
    title: "Already recorded.",
  });
  expect(getVetoActionGate({ ...base, windowOpen: false })).toEqual({
    disabled: true,
    title: "Veto window ended.",
  });
  expect(getVetoActionGate({ ...base, viewerEligible: false })).toEqual({
    disabled: true,
    title: "Not eligible.",
  });
});

test("getVetoActionGate allows eligible open-window actions", () => {
  expect(
    getVetoActionGate({
      alreadyRecorded: false,
      alreadyRecordedReason: "Already recorded.",
      ineligibleReason: "Not eligible.",
      submitting: false,
      viewerEligible: true,
      viewerIsProposer: false,
      windowOpen: true,
    }),
  ).toEqual({
    disabled: false,
    title: undefined,
  });
});
