import { Link } from "react-router";

import { Button } from "@/components/primitives/button";
import { Tabs } from "@/components/primitives/tabs";
import { formatTime } from "@/lib/dateTime";
import type { WizardTemplate } from "./templates/types";
import { isStepKey, type StepKey } from "./types";

type ProposalCreationToolbarProps = {
  onBackToProposalsHref: string;
  onResetDraft: () => void;
  onSaveDraft: () => void;
  onStepChange: (step: StepKey) => void;
  savedAt: number | null;
  saving: boolean;
  serverDraftId: string | null;
  step: StepKey;
  submitting: boolean;
  template: WizardTemplate;
  tierBlocked: boolean;
};

export function ProposalCreationToolbar({
  onBackToProposalsHref,
  onResetDraft,
  onSaveDraft,
  onStepChange,
  savedAt,
  saving,
  serverDraftId,
  step,
  submitting,
  template,
  tierBlocked,
}: ProposalCreationToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to={onBackToProposalsHref}>Back to proposals</Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSaveDraft}
          disabled={saving || submitting}
        >
          {saving ? "Saving…" : "Save draft"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onResetDraft}>
          Reset draft
        </Button>
        {savedAt ? (
          <span className="text-xs text-muted">
            Saved {formatTime(savedAt)}
          </span>
        ) : null}
        {serverDraftId ? (
          <Button asChild variant="ghost" size="sm">
            <Link to={`/app/proposals/drafts/${serverDraftId}`}>
              View draft
            </Link>
          </Button>
        ) : null}
      </div>

      <Tabs
        value={step}
        onValueChange={(value) => {
          if (!isStepKey(value) && value !== "review") return;
          if (tierBlocked && value !== "essentials") return;
          onStepChange(value as StepKey);
        }}
        options={template.stepOrder.map((key) => ({
          value: key,
          label: template.stepTabLabels[key],
        }))}
        className="w-full max-w-xl justify-between"
      />
    </div>
  );
}
