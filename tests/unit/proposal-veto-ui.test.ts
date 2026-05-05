import { test, expect } from "@rstest/core";

import { calculateCitizenVetoSupportPercent } from "../../src/lib/proposalVetoUi";

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
