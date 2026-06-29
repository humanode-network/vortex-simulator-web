import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import type { ChamberDto } from "@/types/api";
import { BudgetStep } from "./steps/BudgetStep";
import { EssentialsStep } from "./steps/EssentialsStep";
import { PlanStep } from "./steps/PlanStep";
import { ReviewStep } from "./steps/ReviewStep";
import type { ProposalDraftForm, StepKey } from "./types";
import type { WizardComputed, WizardTemplate } from "./templates/types";
import { ProposalCreationMessages } from "./ProposalCreationMessages";

type ProposalCreationStepCardProps = {
  attemptedNext: boolean;
  budgetTotal: number;
  canAct: boolean;
  computed: WizardComputed;
  currentTier: string | null;
  draft: ProposalDraftForm;
  guardedComputed: WizardComputed;
  initiativeOptions: Array<{ value: string; label: string }>;
  loadDraftError: string | null;
  loadingDraftId: string | null;
  onBack: () => void;
  onNext: () => void;
  onPresetChange: (presetId: string) => void;
  onSubmit: () => void;
  onTemplateChange: (template: "project" | "system") => void;
  proposerAddress: string | null;
  requiredTier: string;
  saveError: string | null;
  selectedChamber: ChamberDto | null;
  selectedInitiative?: { id: string; title: string } | null;
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>;
  step: StepKey;
  submitDisabled: boolean;
  submitError: string | null;
  submitting: boolean;
  template: WizardTemplate;
  templateKind: "project" | "system";
  textareaClassName: string;
  tierBlocked: boolean;
  tierEligible: boolean;
  chamberOptions: Array<{ value: string; label: string }>;
  presetId: string;
  presets: Parameters<typeof EssentialsStep>[0]["presets"];
};

export function ProposalCreationStepCard({
  attemptedNext,
  budgetTotal,
  canAct,
  chamberOptions,
  computed,
  currentTier,
  draft,
  guardedComputed,
  initiativeOptions,
  loadDraftError,
  loadingDraftId,
  onBack,
  onNext,
  onPresetChange,
  onSubmit,
  onTemplateChange,
  presetId,
  presets,
  proposerAddress,
  requiredTier,
  saveError,
  selectedChamber,
  selectedInitiative,
  setDraft,
  step,
  submitDisabled,
  submitError,
  submitting,
  template,
  templateKind,
  textareaClassName,
  tierBlocked,
  tierEligible,
}: ProposalCreationStepCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-semibold text-text">
          Create proposal · {template.stepTitles[step]}
        </CardTitle>
        <p className="text-sm text-muted">
          Changes autosave locally. Eligible human nodes can save drafts to the
          simulation backend (see Drafts).
        </p>
      </CardHeader>

      <CardContent className="space-y-5 text-sm text-text">
        <ProposalCreationMessages
          currentTier={currentTier}
          loadDraftError={loadDraftError}
          loadingDraftId={loadingDraftId}
          requiredTier={requiredTier}
          saveError={saveError}
          submitError={submitError}
          tierBlocked={tierBlocked}
        />

        {step === "essentials" ? (
          <EssentialsStep
            attemptedNext={attemptedNext}
            chamberOptions={chamberOptions}
            draft={draft}
            initiativeOptions={initiativeOptions}
            setDraft={setDraft}
            templateId={templateKind}
            onTemplateChange={onTemplateChange}
            presetId={presetId}
            presets={presets}
            onPresetChange={onPresetChange}
            textareaClassName={textareaClassName}
            requiredTier={requiredTier}
            currentTier={currentTier}
            tierEligible={tierEligible}
          />
        ) : null}

        {step === "plan" ? (
          <PlanStep
            attemptedNext={attemptedNext}
            draft={draft}
            setDraft={setDraft}
            formationEligible={draft.formationEligible}
            mode={template.id}
            textareaClassName={textareaClassName}
          />
        ) : null}

        {step === "budget" ? (
          <BudgetStep
            attemptedNext={attemptedNext}
            budgetTotal={budgetTotal}
            budgetValid={computed.budgetValid}
            draft={draft}
            formationEligible={draft.formationEligible}
            setDraft={setDraft}
          />
        ) : null}

        {step === "review" ? (
          <ReviewStep
            budgetTotal={budgetTotal}
            canAct={canAct}
            canSubmit={guardedComputed.canSubmit}
            draft={draft}
            formationEligible={draft.formationEligible}
            mode={template.id}
            proposerAddress={proposerAddress}
            selectedChamber={selectedChamber}
            selectedInitiative={selectedInitiative}
            setDraft={setDraft}
            textareaClassName={textareaClassName}
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <Button variant="ghost" onClick={onBack} disabled={submitting}>
            {step === "essentials" ? "Cancel" : "Back"}
          </Button>
          <div className="flex items-center gap-2">
            {step === "review" ? (
              <Button
                disabled={submitDisabled || submitting}
                title={
                  tierBlocked
                    ? `Not eligible for this proposal type. Required tier: ${requiredTier}.`
                    : !canAct
                      ? "Connect and verify as an eligible human node to submit."
                      : undefined
                }
                onClick={onSubmit}
              >
                {submitting ? "Submitting…" : "Submit proposal"}
              </Button>
            ) : (
              <Button onClick={onNext}>Next</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
