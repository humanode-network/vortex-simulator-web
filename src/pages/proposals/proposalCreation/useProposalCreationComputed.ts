import { useMemo } from "react";

import {
  isTierEligible,
  requiredTierForProposalType,
} from "@/lib/proposalTypes";
import type { ChamberDto, TierProgressDto } from "@/types/api";
import type { ProposalDraftForm } from "./types";
import {
  pathIdForDraft,
  proposalBudgetTotal,
  validateWizardStep,
} from "./wizardModel";

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
  const budgetTotal = useMemo(() => proposalBudgetTotal(draft), [draft]);
  const pathId = pathIdForDraft(draft, templateKind);
  const budgetValid =
    pathId !== "project-formation" ||
    validateWizardStep("funding", {
      draft,
      presetId: "",
      tierBlocked: false,
    }).valid;
  const requiredTier = requiredTierForProposalType(draft.proposalType);
  const currentTier = tierProgress?.tier ?? null;
  const tierEligible =
    currentTier && isTierEligible(currentTier, requiredTier) ? true : false;
  const tierBlocked = Boolean(currentTier) && !tierEligible;
  const selectedChamber = useMemo(() => {
    return chambers.find((c) => c.id === draft.chamberId) ?? null;
  }, [chambers, draft.chamberId]);

  return {
    budgetTotal,
    budgetValid,
    currentTier,
    requiredTier,
    selectedChamber,
    tierBlocked,
    tierEligible,
  };
}
