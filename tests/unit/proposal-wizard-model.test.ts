import { expect, test } from "@rstest/core";

import {
  DEFAULT_DRAFT,
  type ProposalDraftForm,
} from "../../src/pages/proposals/proposalCreation/types";
import {
  createWizardState,
  firstIncompleteWizardStep,
  normalizeWizardStepId,
  pathIdForDraft,
  proposalBudgetTotal,
  reachableWizardSteps,
  resolveRequestedWizardStep,
  transitionWizard,
  validateWizardStep,
  type WizardContext,
} from "../../src/pages/proposals/proposalCreation/wizardModel";
import { isProposalDraftPublicationReady } from "../../src/pages/proposals/proposalCreation/publicationReadiness";

function completePolicyDraft(): ProposalDraftForm {
  return {
    ...structuredClone(DEFAULT_DRAFT),
    title: "Policy",
    what: "Change the policy",
    why: "Improve governance",
    how: "Publish the change",
    formationEligible: false,
    agreeRules: true,
    confirmBudget: true,
  };
}

function context(
  draft: ProposalDraftForm,
  presetId = "project.policy",
): WizardContext {
  return { draft, presetId, tierBlocked: false };
}

test("new and invalid navigation resolve to the first incomplete step", () => {
  const emptyContext = context(structuredClone(DEFAULT_DRAFT), "");
  expect(
    resolveRequestedWizardStep("project-formation", "review", emptyContext),
  ).toBe("intent");
  expect(firstIncompleteWizardStep("project-formation", emptyContext)).toBe(
    "intent",
  );
});

test("paths are derived from template and Formation mode", () => {
  expect(pathIdForDraft(completePolicyDraft(), "project")).toBe(
    "project-policy",
  );
  expect(
    pathIdForDraft(
      { ...completePolicyDraft(), formationEligible: true },
      "project",
    ),
  ).toBe("project-formation");
  expect(pathIdForDraft(completePolicyDraft(), "system")).toBe("system-change");
});

test("legacy query steps normalize into the current path vocabulary", () => {
  expect(normalizeWizardStepId("budget", "project")).toBe("funding");
  expect(normalizeWizardStepId("essentials", "system")).toBe("system-change");
  expect(normalizeWizardStepId("plan", "system")).toBe("rationale");
});

test("reachable steps stop after the first invalid requirement", () => {
  const draft = completePolicyDraft();
  expect(reachableWizardSteps("project-policy", context(draft))).toEqual([
    "intent",
    "essentials",
    "plan",
    "review",
  ]);
  expect(
    reachableWizardSteps("project-policy", context({ ...draft, how: "" })),
  ).toEqual(["intent", "essentials", "plan"]);
});

test("public review can be reached before the formal submission path is complete", () => {
  const draft = {
    ...completePolicyDraft(),
    chamberId: "general",
    summary: "Ready for public review",
    how: "",
    agreeRules: false,
    confirmBudget: false,
  };
  expect(isProposalDraftPublicationReady(draft, "project")).toBe(true);
  expect(
    reachableWizardSteps("project-policy", {
      ...context(draft),
      publicationReady: true,
    }),
  ).toEqual(["intent", "essentials", "plan", "review"]);
  expect(validateWizardStep("review", context(draft)).valid).toBe(false);
});

test("system publication requires the action's canonical target fields", () => {
  const draft: ProposalDraftForm = {
    ...completePolicyDraft(),
    title: "Create a chamber",
    chamberId: "general",
    summary: "Open a public system Draft.",
    metaGovernance: {
      action: "chamber.create",
      chamberId: "research",
    },
  };
  expect(isProposalDraftPublicationReady(draft, "system")).toBe(false);
  expect(
    isProposalDraftPublicationReady(
      {
        ...draft,
        metaGovernance: { ...draft.metaGovernance!, title: "Research" },
      },
      "system",
    ),
  ).toBe(true);
});

test("Formation funding validates every milestone budget", () => {
  const draft = {
    ...completePolicyDraft(),
    formationEligible: true,
    timeline: [
      { id: "m1", title: "M1", timeframe: "1 week", budgetHmnd: "10" },
      { id: "m2", title: "M2", timeframe: "2 weeks", budgetHmnd: "" },
    ],
  };
  expect(validateWizardStep("funding", context(draft))).toEqual({
    valid: false,
    firstInvalidFieldId: "timeline-budget-1",
  });
  draft.timeline[1].budgetHmnd = "20";
  expect(validateWizardStep("funding", context(draft))).toEqual({
    valid: true,
  });
  expect(proposalBudgetTotal(draft)).toBe(30);
});

test("system changes enforce General chamber and action targets", () => {
  const draft: ProposalDraftForm = {
    ...completePolicyDraft(),
    chamberId: "general",
    metaGovernance: {
      action: "chamber.create",
      chamberId: "research",
      title: "Research",
    },
  };
  expect(validateWizardStep("system-change", context(draft))).toEqual({
    valid: true,
  });
  expect(
    validateWizardStep(
      "system-change",
      context({ ...draft, chamberId: "design" }),
    ),
  ).toEqual({ valid: false, firstInvalidFieldId: "chamber" });
});

test("transition model guards future steps and focuses blocking fields", () => {
  const emptyDraft = structuredClone(DEFAULT_DRAFT);
  let state = createWizardState("project-formation");
  const blocked = transitionWizard(
    state,
    { type: "CONTINUE_REQUESTED" },
    context(emptyDraft, ""),
  );
  expect(blocked.state.stepId).toBe("intent");
  expect(blocked.effects).toEqual([
    { type: "focus-field", fieldId: "proposal-kind" },
  ]);
  state = blocked.state;
  const skipped = transitionWizard(
    state,
    { type: "STEP_REQUESTED", stepId: "review" },
    context(emptyDraft, ""),
  );
  expect(skipped.state.stepId).toBe("intent");
});

test("save and submit status transitions are idempotent", () => {
  const ctx = context(completePolicyDraft());
  let state = createWizardState("project-policy", "review");
  state = transitionWizard(state, { type: "LOCAL_SAVE_COMPLETED" }, ctx).state;
  expect(state.saveStatus).toBe("saved-local");
  state = transitionWizard(state, { type: "SERVER_SAVE_REQUESTED" }, ctx).state;
  expect(state.saveStatus).toBe("syncing");
  state = transitionWizard(state, { type: "LOCAL_SAVE_COMPLETED" }, ctx).state;
  expect(state.saveStatus).toBe("syncing");
  state = transitionWizard(state, { type: "SERVER_SAVE_FAILED" }, ctx).state;
  expect(state.saveStatus).toBe("sync-error");
  state = transitionWizard(state, { type: "LOCAL_SAVE_COMPLETED" }, ctx).state;
  expect(state.saveStatus).toBe("sync-error");
  state = transitionWizard(state, { type: "SERVER_SAVE_REQUESTED" }, ctx).state;
  state = transitionWizard(state, { type: "SERVER_SAVE_SUCCEEDED" }, ctx).state;
  expect(state.saveStatus).toBe("synced");
  state = transitionWizard(state, { type: "SUBMIT_REQUESTED" }, ctx).state;
  const repeated = transitionWizard(
    state,
    { type: "SUBMIT_REQUESTED" },
    ctx,
  ).state;
  expect(repeated).toEqual(state);
});
