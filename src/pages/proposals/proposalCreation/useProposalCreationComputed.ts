import { useMemo } from "react";

import {
  isTierEligible,
  requiredTierForProposalType,
} from "@/lib/proposalTypes";
import type { ChamberDto, TierProgressDto } from "@/types/api";
import { getWizardTemplate } from "./templates/registry";
import type { WizardComputed, WizardTemplate } from "./templates/types";
import type { ProposalDraftForm, StepKey } from "./types";

function getBudgetTotal(draft: ProposalDraftForm): number {
  if (draft.formationEligible !== false) {
    return draft.timeline.reduce((sum, item) => {
      const n = Number(item.budgetHmnd);
      if (!Number.isFinite(n) || n <= 0) return sum;
      return sum + n;
    }, 0);
  }
  return draft.budgetItems.reduce((sum, item) => {
    const n = Number(item.amount);
    if (!Number.isFinite(n) || n <= 0) return sum;
    return sum + n;
  }, 0);
}

function useWizardTemplate(
  draft: ProposalDraftForm,
  templateKind: "project" | "system",
): WizardTemplate {
  const baseTemplate = useMemo<WizardTemplate>(
    () => getWizardTemplate(templateKind),
    [templateKind],
  );

  return useMemo<WizardTemplate>(() => {
    if (baseTemplate.id !== "project" || draft.formationEligible !== false) {
      return baseTemplate;
    }
    return {
      ...baseTemplate,
      stepOrder: ["essentials", "plan", "review"],
      stepTabLabels: {
        ...baseTemplate.stepTabLabels,
        essentials: "1 · Essentials",
        plan: "2 · Plan",
        review: "3 · Review",
      },
      getNextStep(step: StepKey, computed: WizardComputed) {
        if (step === "essentials")
          return computed.essentialsValid ? "plan" : null;
        if (step === "plan") return computed.planValid ? "review" : null;
        return null;
      },
      getPrevStep(step: StepKey) {
        if (step === "review") return "plan";
        if (step === "plan") return "essentials";
        return null;
      },
    };
  }, [baseTemplate, draft.formationEligible]);
}

type UseProposalCreationComputedInput = {
  chambers: ChamberDto[];
  draft: ProposalDraftForm;
  templateKind: "project" | "system";
  tierProgress: TierProgressDto | null;
};

export function useProposalCreationComputed({
  chambers,
  draft,
  templateKind,
  tierProgress,
}: UseProposalCreationComputedInput) {
  const budgetTotal = useMemo(() => getBudgetTotal(draft), [draft]);
  const template = useWizardTemplate(draft, templateKind);
  const computed = useMemo(() => {
    return template.compute(draft, { budgetTotal });
  }, [draft, budgetTotal, template]);
  const requiredTier = requiredTierForProposalType(draft.proposalType);
  const currentTier = tierProgress?.tier ?? null;
  const tierEligible =
    currentTier && isTierEligible(currentTier, requiredTier) ? true : false;
  const tierBlocked = Boolean(currentTier) && !tierEligible;
  const guardedComputed = useMemo(
    () => ({
      ...computed,
      essentialsValid: computed.essentialsValid && !tierBlocked,
      canSubmit: computed.canSubmit && !tierBlocked,
    }),
    [computed, tierBlocked],
  );
  const selectedChamber = useMemo(() => {
    return chambers.find((c) => c.id === draft.chamberId) ?? null;
  }, [chambers, draft.chamberId]);

  return {
    budgetTotal,
    computed,
    currentTier,
    guardedComputed,
    requiredTier,
    selectedChamber,
    template,
    tierBlocked,
    tierEligible,
  };
}
