import { test, expect } from "@rstest/core";

import {
  requiredTierForProposalType,
  isTierEligible,
} from "../../src/lib/proposalTypes";

test("requiredTierForProposalType returns expected tiers", () => {
  expect(requiredTierForProposalType("basic")).toBe("Nominee");
  expect(requiredTierForProposalType("fee")).toBe("Ecclesiast");
  expect(requiredTierForProposalType("core")).toBe("Legate");
  expect(requiredTierForProposalType("administrative")).toBe("Consul");
  expect(requiredTierForProposalType("dao-core")).toBe("Citizen");
});

test("isTierEligible compares tier order correctly", () => {
  expect(isTierEligible("Consul", "Legate")).toBe(true);
  expect(isTierEligible("Ecclesiast", "Consul")).toBe(false);
});
