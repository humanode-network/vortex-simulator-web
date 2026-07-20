import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { Select } from "@/components/primitives/select";
import { ProposalNarrativeEditor } from "@/components/ProposalNarrative";
import type { ProposalDraftForm } from "../types";
import { WizardFieldSection } from "../WizardFieldSection";

type ProjectEssentialsStepProps = {
  attemptedNext: boolean;
  chamberOptions: { value: string; label: string }[];
  draft: ProposalDraftForm;
  initiativeOptions: { value: string; label: string }[];
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>;
};

export function ProjectEssentialsStep({
  attemptedNext,
  chamberOptions,
  draft,
  initiativeOptions,
  setDraft,
}: ProjectEssentialsStepProps) {
  return (
    <div className="space-y-6">
      <WizardFieldSection
        title="Identity"
        description="Name the proposal and place it in its governing context."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={draft.title}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  title: event.target.value,
                }))
              }
              placeholder="Proposal title"
            />
            {attemptedNext && draft.title.trim().length === 0 ? (
              <p className="text-xs text-destructive">Title is required.</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="chamber">Chamber</Label>
            <Select
              id="chamber"
              value={draft.chamberId}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  chamberId: event.target.value,
                }))
              }
            >
              <option value="">Select a chamber</option>
              {chamberOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="proposal-initiative">Initiative association</Label>
          <Select
            id="proposal-initiative"
            value={draft.initiativeId ?? ""}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                initiativeId: event.target.value || undefined,
              }))
            }
          >
            <option value="">No Initiative</option>
            {initiativeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <p className="text-xs leading-5 text-muted">
            Initiative association records provenance only. It does not alter
            voting, quorum, CM, MM, chamber membership, or lifecycle.
          </p>
        </div>
      </WizardFieldSection>

      <WizardFieldSection
        title="Case"
        description="State what changes and why the chamber should consider it."
      >
        <div className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <Input
            id="summary"
            value={draft.summary}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                summary: event.target.value,
              }))
            }
            placeholder="One line used in proposal cards"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="what">What *</Label>
          <ProposalNarrativeEditor
            id="what"
            value={draft.what}
            onChange={(value) =>
              setDraft((previous) => ({
                ...previous,
                what: value,
              }))
            }
            placeholder="Describe the proposed work or policy."
          />
          {attemptedNext && draft.what.trim().length === 0 ? (
            <p className="text-xs text-destructive">What is required.</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="why">Why *</Label>
          <ProposalNarrativeEditor
            id="why"
            value={draft.why}
            onChange={(value) =>
              setDraft((previous) => ({
                ...previous,
                why: value,
              }))
            }
            placeholder="Explain the expected contribution to Humanode."
          />
          {attemptedNext && draft.why.trim().length === 0 ? (
            <p className="text-xs text-destructive">Why is required.</p>
          ) : null}
        </div>
      </WizardFieldSection>
    </div>
  );
}
