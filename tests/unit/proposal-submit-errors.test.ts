import { test, expect } from "@rstest/core";

import { formatProposalSubmitError } from "../../src/lib/proposalSubmitErrors.ts";
import { formatProposalType } from "../../src/lib/proposalTypes.ts";

test("formats proposal type labels", () => {
  expect(formatProposalType("dao-core")).toBe("DAO core");
  expect(formatProposalType("administrative")).toBe("Administrative");
  expect(formatProposalType("custom-type")).toBe("custom type");
});

test("formats tier gating errors from API payload", () => {
  const error = {
    data: {
      error: {
        code: "proposal_type_ineligible",
        requiredTier: "Citizen",
        proposalType: "dao-core",
      },
    },
  };
  expect(formatProposalSubmitError(error)).toBe(
    "Not eligible for DAO core proposals. Required tier: Citizen.",
  );
});

test("formats chamber submit eligibility errors", () => {
  const generalError = {
    data: {
      error: { code: "proposal_submit_ineligible", chamberId: "general" },
    },
  };
  expect(formatProposalSubmitError(generalError)).toBe(
    "Submission to general was blocked by outdated chamber-membership gating. Any eligible human node can submit to any chamber; refresh and retry.",
  );

  const chamberError = {
    data: {
      error: { code: "proposal_submit_ineligible", chamberId: "engineering" },
    },
  };
  expect(formatProposalSubmitError(chamberError)).toBe(
    "Submission to engineering was blocked by outdated chamber-membership gating. Any eligible human node can submit to any chamber; refresh and retry.",
  );
});

test("falls back to error message when payload is missing", () => {
  const error = new Error("Submit failed");
  expect(formatProposalSubmitError(error)).toBe("Submit failed");
});
