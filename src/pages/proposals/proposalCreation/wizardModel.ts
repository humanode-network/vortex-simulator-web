import type { ProposalDraftForm, ProposalTemplateId } from "./types";

export type WizardPathId =
  | "project-policy"
  | "project-formation"
  | "system-change";

export type WizardStepId =
  | "intent"
  | "essentials"
  | "plan"
  | "funding"
  | "system-change"
  | "rationale"
  | "review";

export type WizardSaveStatus =
  | "idle"
  | "saved-local"
  | "syncing"
  | "synced"
  | "sync-error";

export type WizardSubmitStatus = "idle" | "submitting" | "submit-error";

export type WizardState = {
  pathId: WizardPathId;
  stepId: WizardStepId;
  attemptedStepId: WizardStepId | null;
  saveStatus: WizardSaveStatus;
  submitStatus: WizardSubmitStatus;
};

export type WizardEffect =
  | { type: "focus-step"; stepId: WizardStepId }
  | { type: "focus-field"; fieldId: string };

export type WizardEvent =
  | { type: "STEP_REQUESTED"; stepId: WizardStepId }
  | { type: "CONTINUE_REQUESTED" }
  | { type: "BACK_REQUESTED" }
  | { type: "PATH_CHANGED"; pathId: WizardPathId }
  | { type: "LOCAL_SAVE_COMPLETED" }
  | { type: "SERVER_SAVE_REQUESTED" }
  | { type: "SERVER_SAVE_SUCCEEDED" }
  | { type: "SERVER_SAVE_FAILED" }
  | { type: "SUBMIT_REQUESTED" }
  | { type: "SUBMIT_FAILED" }
  | { type: "SUBMIT_RESET" };

export type StepValidation = {
  valid: boolean;
  firstInvalidFieldId?: string;
};

export type WizardContext = {
  draft: ProposalDraftForm;
  presetId: string;
  publicationReady?: boolean;
  tierBlocked: boolean;
};

export type WizardStepDefinition = {
  description: string;
  id: WizardStepId;
  shortLabel: string;
  title: string;
};

export type WizardPathDefinition = {
  id: WizardPathId;
  label: string;
  steps: readonly WizardStepDefinition[];
};

const STEP_DEFINITIONS: Record<WizardStepId, WizardStepDefinition> = {
  intent: {
    description: "Choose the governing right, proposal structure, and preset.",
    id: "intent",
    shortLabel: "Intent",
    title: "Choose the proposal path",
  },
  essentials: {
    description: "Set the proposal identity, chamber context, and public case.",
    id: "essentials",
    shortLabel: "Essentials",
    title: "Define the proposal",
  },
  plan: {
    description:
      "Describe execution, outputs, milestones, and team requirements.",
    id: "plan",
    shortLabel: "Plan",
    title: "Explain the plan",
  },
  funding: {
    description: "Align a positive HMND budget with every Formation milestone.",
    id: "funding",
    shortLabel: "Funding",
    title: "Fund milestones and team needs",
  },
  "system-change": {
    description: "Identify the executable action and its canonical target.",
    id: "system-change",
    shortLabel: "System change",
    title: "Define the system change",
  },
  rationale: {
    description:
      "Explain how the system change should be applied and verified.",
    id: "rationale",
    shortLabel: "Rationale",
    title: "Explain the rationale",
  },
  review: {
    description:
      "Confirm the proposal, supporting material, and submission rules.",
    id: "review",
    shortLabel: "Review",
    title: "Review and submit",
  },
};

export function normalizeWizardStepId(
  value: string | null | undefined,
  templateId: ProposalTemplateId,
): string {
  if (value === "essentials") {
    return templateId === "system" ? "system-change" : "essentials";
  }
  if (value === "plan") {
    return templateId === "system" ? "rationale" : "plan";
  }
  return value === "budget" ? "funding" : (value ?? "");
}

function steps(...ids: WizardStepId[]): readonly WizardStepDefinition[] {
  return ids.map((id) => STEP_DEFINITIONS[id]);
}

export const WIZARD_PATHS: Record<WizardPathId, WizardPathDefinition> = {
  "project-policy": {
    id: "project-policy",
    label: "Project policy",
    steps: steps("intent", "essentials", "plan", "review"),
  },
  "project-formation": {
    id: "project-formation",
    label: "Formation project",
    steps: steps("intent", "essentials", "plan", "funding", "review"),
  },
  "system-change": {
    id: "system-change",
    label: "System change",
    steps: steps("intent", "system-change", "rationale", "review"),
  },
};

export function pathIdForDraft(
  draft: ProposalDraftForm,
  templateId: "project" | "system",
): WizardPathId {
  if (templateId === "system") return "system-change";
  return draft.formationEligible === false
    ? "project-policy"
    : "project-formation";
}

export function pathDefinition(pathId: WizardPathId): WizardPathDefinition {
  return WIZARD_PATHS[pathId];
}

export function stepDefinition(
  pathId: WizardPathId,
  stepId: WizardStepId,
): WizardStepDefinition {
  return (
    WIZARD_PATHS[pathId].steps.find((step) => step.id === stepId) ??
    WIZARD_PATHS[pathId].steps[0]
  );
}

function positiveAmountTotal<T>(
  items: readonly T[],
  amountFor: (item: T) => string | undefined,
): number {
  return items.reduce((sum, item) => {
    const amount = Number(amountFor(item));
    return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
  }, 0);
}

export function proposalBudgetTotal(draft: ProposalDraftForm): number {
  return draft.formationEligible !== false
    ? positiveAmountTotal(draft.timeline, (item) => item.budgetHmnd)
    : positiveAmountTotal(draft.budgetItems, (item) => item.amount);
}

export function validateSystemDraftTarget(
  draft: ProposalDraftForm,
): StepValidation {
  if (draft.title.trim().length === 0) {
    return { valid: false, firstInvalidFieldId: "title" };
  }
  if (draft.chamberId.toLowerCase() !== "general") {
    return { valid: false, firstInvalidFieldId: "chamber" };
  }
  const meta = draft.metaGovernance;
  if (!meta) return { valid: false, firstInvalidFieldId: "system-action" };
  if (
    meta.action === "governor.censure" &&
    (meta.targetAddress ?? "").trim().length === 0
  ) {
    return {
      valid: false,
      firstInvalidFieldId: "target-governor-address",
    };
  }
  if (
    meta.action !== "governor.censure" &&
    (meta.chamberId ?? "").trim().length === 0
  ) {
    return { valid: false, firstInvalidFieldId: "target-chamber-id" };
  }
  if (
    (meta.action === "chamber.create" || meta.action === "chamber.rename") &&
    (meta.title ?? "").trim().length === 0
  ) {
    return { valid: false, firstInvalidFieldId: "target-title" };
  }
  return { valid: true };
}

export function validateWizardStep(
  stepId: WizardStepId,
  context: WizardContext,
): StepValidation {
  const { draft, presetId, tierBlocked } = context;
  if (stepId === "intent") {
    if (presetId.trim().length === 0) {
      return { valid: false, firstInvalidFieldId: "proposal-kind" };
    }
    if (tierBlocked) {
      return { valid: false, firstInvalidFieldId: "proposal-type" };
    }
    return { valid: true };
  }
  if (stepId === "essentials") {
    if (draft.title.trim().length === 0) {
      return { valid: false, firstInvalidFieldId: "title" };
    }
    if (draft.what.trim().length === 0) {
      return { valid: false, firstInvalidFieldId: "what" };
    }
    if (draft.why.trim().length === 0) {
      return { valid: false, firstInvalidFieldId: "why" };
    }
    return { valid: true };
  }
  if (stepId === "system-change") return validateSystemDraftTarget(draft);
  if (stepId === "plan" || stepId === "rationale") {
    return draft.how.trim().length > 0
      ? { valid: true }
      : { valid: false, firstInvalidFieldId: "how" };
  }
  if (stepId === "funding") {
    const invalidIndex = draft.timeline.findIndex((item) => {
      const amount = Number(item.budgetHmnd);
      return !Number.isFinite(amount) || amount <= 0;
    });
    if (draft.timeline.length === 0 || proposalBudgetTotal(draft) <= 0) {
      return { valid: false, firstInvalidFieldId: "timeline-budget-0" };
    }
    return invalidIndex === -1
      ? { valid: true }
      : {
          valid: false,
          firstInvalidFieldId: `timeline-budget-${invalidIndex}`,
        };
  }
  if (!draft.agreeRules) {
    return { valid: false, firstInvalidFieldId: "agree-rules" };
  }
  if (!draft.confirmBudget) {
    return { valid: false, firstInvalidFieldId: "confirm-budget" };
  }
  return { valid: true };
}

export function reachableWizardSteps(
  pathId: WizardPathId,
  context: WizardContext,
): WizardStepId[] {
  const result: WizardStepId[] = [];
  const definition = WIZARD_PATHS[pathId];
  for (const step of definition.steps) {
    result.push(step.id);
    if (!validateWizardStep(step.id, context).valid) break;
  }
  if (context.publicationReady && !result.includes("review")) {
    result.push("review");
  }
  return result;
}

export function firstIncompleteWizardStep(
  pathId: WizardPathId,
  context: WizardContext,
): WizardStepId {
  const definition = WIZARD_PATHS[pathId];
  return (
    definition.steps.find((step) => !validateWizardStep(step.id, context).valid)
      ?.id ?? definition.steps[definition.steps.length - 1].id
  );
}

export function resolveRequestedWizardStep(
  pathId: WizardPathId,
  requestedStepId: string | null | undefined,
  context: WizardContext,
): WizardStepId {
  const reachable = reachableWizardSteps(pathId, context);
  if (requestedStepId && reachable.includes(requestedStepId as WizardStepId)) {
    return requestedStepId as WizardStepId;
  }
  return firstIncompleteWizardStep(pathId, context);
}

export function createWizardState(
  pathId: WizardPathId,
  stepId: WizardStepId = "intent",
): WizardState {
  const allowed = WIZARD_PATHS[pathId].steps.some((step) => step.id === stepId);
  return {
    pathId,
    stepId: allowed ? stepId : WIZARD_PATHS[pathId].steps[0].id,
    attemptedStepId: null,
    saveStatus: "idle",
    submitStatus: "idle",
  };
}

export function transitionWizard(
  state: WizardState,
  event: WizardEvent,
  context: WizardContext,
): { state: WizardState; effects: WizardEffect[] } {
  const definition = WIZARD_PATHS[state.pathId];
  const index = definition.steps.findIndex((step) => step.id === state.stepId);

  if (event.type === "PATH_CHANGED") {
    const stepId = resolveRequestedWizardStep(
      event.pathId,
      state.stepId,
      context,
    );
    return {
      state: {
        ...state,
        pathId: event.pathId,
        stepId,
        attemptedStepId: null,
      },
      effects: [{ type: "focus-step", stepId }],
    };
  }

  if (event.type === "STEP_REQUESTED") {
    const reachable = reachableWizardSteps(state.pathId, context);
    if (!reachable.includes(event.stepId)) return { state, effects: [] };
    return {
      state: {
        ...state,
        stepId: event.stepId,
        attemptedStepId: null,
      },
      effects: [{ type: "focus-step", stepId: event.stepId }],
    };
  }

  if (event.type === "CONTINUE_REQUESTED") {
    const validation = validateWizardStep(state.stepId, context);
    if (!validation.valid) {
      return {
        state: { ...state, attemptedStepId: state.stepId },
        effects: validation.firstInvalidFieldId
          ? [
              {
                type: "focus-field",
                fieldId: validation.firstInvalidFieldId,
              },
            ]
          : [],
      };
    }
    const next = definition.steps[index + 1];
    if (!next) return { state, effects: [] };
    return {
      state: {
        ...state,
        stepId: next.id,
        attemptedStepId: null,
      },
      effects: [{ type: "focus-step", stepId: next.id }],
    };
  }

  if (event.type === "BACK_REQUESTED") {
    const previous = definition.steps[index - 1];
    if (!previous) return { state, effects: [] };
    return {
      state: {
        ...state,
        stepId: previous.id,
        attemptedStepId: null,
      },
      effects: [{ type: "focus-step", stepId: previous.id }],
    };
  }

  if (event.type === "LOCAL_SAVE_COMPLETED") {
    if (state.saveStatus === "syncing") return { state, effects: [] };
    return {
      state: { ...state, saveStatus: "saved-local" },
      effects: [],
    };
  }
  if (event.type === "SERVER_SAVE_REQUESTED") {
    return { state: { ...state, saveStatus: "syncing" }, effects: [] };
  }
  if (event.type === "SERVER_SAVE_SUCCEEDED") {
    return { state: { ...state, saveStatus: "synced" }, effects: [] };
  }
  if (event.type === "SERVER_SAVE_FAILED") {
    return { state: { ...state, saveStatus: "sync-error" }, effects: [] };
  }
  if (event.type === "SUBMIT_REQUESTED") {
    if (state.submitStatus === "submitting") return { state, effects: [] };
    return {
      state: { ...state, submitStatus: "submitting" },
      effects: [],
    };
  }
  if (event.type === "SUBMIT_FAILED") {
    return {
      state: { ...state, submitStatus: "submit-error" },
      effects: [],
    };
  }
  if (event.type === "SUBMIT_RESET") {
    return { state: { ...state, submitStatus: "idle" }, effects: [] };
  }
  return { state, effects: [] };
}
