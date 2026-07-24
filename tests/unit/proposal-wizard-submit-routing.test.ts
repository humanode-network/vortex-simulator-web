import { expect, test } from "@rstest/core";

import { DEFAULT_DRAFT } from "../../src/pages/proposals/proposalCreation/types";
import { proposalSubmitErrorStep } from "../../src/pages/proposals/proposalCreation/submitErrorRouting";

const context = {
  draft: {
    ...structuredClone(DEFAULT_DRAFT),
    formationEligible: false,
    title: "Policy",
    what: "Change",
    why: "Reason",
    how: "",
  },
  presetId: "project.policy",
  tierBlocked: false,
};

function apiError(code: string) {
  return { data: { error: { code } } };
}

test("proposal-right errors return to Intent", () => {
  expect(
    proposalSubmitErrorStep(
      apiError("proposal_type_ineligible"),
      "project-policy",
      context,
    ),
  ).toBe("intent");
});

test("system target errors return to System change", () => {
  expect(
    proposalSubmitErrorStep(
      apiError("invalid_meta_chamber"),
      "system-change",
      context,
    ),
  ).toBe("system-change");
});

test("scope errors return to the path-owned scope step", () => {
  expect(
    proposalSubmitErrorStep(
      apiError("invalid_initiative_association"),
      "project-policy",
      context,
    ),
  ).toBe("essentials");
});

test("incomplete server drafts resolve to the first incomplete local step", () => {
  expect(
    proposalSubmitErrorStep(
      apiError("draft_not_submittable"),
      "project-policy",
      context,
    ),
  ).toBe("plan");
});

test("publication validation returns to the path-owned content step", () => {
  expect(
    proposalSubmitErrorStep(
      apiError("draft_publication_summary_required"),
      "project-policy",
      context,
    ),
  ).toBe("essentials");
  expect(
    proposalSubmitErrorStep(
      apiError("draft_publication_system_action_required"),
      "system-change",
      context,
    ),
  ).toBe("system-change");
});
