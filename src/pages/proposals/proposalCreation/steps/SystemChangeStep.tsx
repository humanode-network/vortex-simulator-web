import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";
import { Select } from "@/components/primitives/select";
import type { ProposalDraftForm } from "../types";
import {
  getSystemActionMeta,
  type SystemActionId,
} from "../templates/systemActions";
import { WizardFieldSection } from "../WizardFieldSection";

type SystemChangeStepProps = {
  attemptedNext: boolean;
  draft: ProposalDraftForm;
  initiativeOptions: { value: string; label: string }[];
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>;
  textareaClassName: string;
};

export function SystemChangeStep({
  attemptedNext,
  draft,
  initiativeOptions,
  setDraft,
  textareaClassName,
}: SystemChangeStepProps) {
  const action = draft.metaGovernance?.action as SystemActionId | undefined;
  const actionMeta = action ? getSystemActionMeta(action) : null;

  const updateMeta = (
    patch: Partial<NonNullable<ProposalDraftForm["metaGovernance"]>>,
  ) => {
    setDraft((previous) => ({
      ...previous,
      chamberId: "general",
      metaGovernance: {
        ...(previous.metaGovernance ?? {
          action: "chamber.create",
        }),
        ...patch,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <WizardFieldSection
        title="System action"
        description="System changes execute through General chamber and must identify their canonical target."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="system-action">Action</Label>
            <div id="system-action" className="proposal-wizard__readonly">
              <strong>{actionMeta?.label ?? "Select a system preset"}</strong>
              <span>
                {actionMeta?.description ??
                  "Return to Intent and choose the system action."}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="chamber">Chamber</Label>
            <Input id="chamber" value="General chamber" disabled />
          </div>
        </div>

        {actionMeta?.requiresChamberId ? (
          <div className="space-y-2">
            <Label htmlFor="target-chamber-id">Target chamber id *</Label>
            <Input
              id="target-chamber-id"
              value={draft.metaGovernance?.chamberId ?? ""}
              onChange={(event) =>
                updateMeta({ chamberId: event.target.value })
              }
              placeholder="research"
            />
            {attemptedNext &&
            (draft.metaGovernance?.chamberId ?? "").trim().length === 0 ? (
              <p className="text-xs text-destructive">
                Target chamber id is required.
              </p>
            ) : null}
          </div>
        ) : null}

        {actionMeta?.requiresTargetAddress ? (
          <div className="space-y-2">
            <Label htmlFor="target-governor-address">
              Target governor address *
            </Label>
            <Input
              id="target-governor-address"
              value={draft.metaGovernance?.targetAddress ?? ""}
              onChange={(event) =>
                updateMeta({ targetAddress: event.target.value })
              }
              placeholder="hm..."
            />
            {attemptedNext &&
            (draft.metaGovernance?.targetAddress ?? "").trim().length === 0 ? (
              <p className="text-xs text-destructive">
                Target governor address is required.
              </p>
            ) : null}
          </div>
        ) : null}

        {actionMeta?.requiresTitle ? (
          <div className="space-y-2">
            <Label htmlFor="target-title">New title *</Label>
            <Input
              id="target-title"
              value={draft.metaGovernance?.title ?? ""}
              onChange={(event) => updateMeta({ title: event.target.value })}
              placeholder="Research Chamber"
            />
            {attemptedNext &&
            (draft.metaGovernance?.title ?? "").trim().length === 0 ? (
              <p className="text-xs text-destructive">Title is required.</p>
            ) : null}
          </div>
        ) : null}

        {actionMeta?.showMultiplier ? (
          <div className="space-y-2">
            <Label htmlFor="target-multiplier">Multiplier</Label>
            <Input
              id="target-multiplier"
              value={
                draft.metaGovernance?.multiplier === undefined
                  ? ""
                  : String(draft.metaGovernance.multiplier)
              }
              inputMode="decimal"
              onChange={(event) => {
                const value = event.target.value.trim();
                const multiplier = value ? Number(value) : undefined;
                updateMeta({
                  multiplier:
                    multiplier !== undefined && Number.isFinite(multiplier)
                      ? multiplier
                      : undefined,
                });
              }}
              placeholder="1.4"
            />
          </div>
        ) : null}

        {actionMeta?.showGenesisMembers ? (
          <div className="space-y-2">
            <Label htmlFor="genesis-members">
              Genesis members, one address per line
            </Label>
            <textarea
              id="genesis-members"
              rows={4}
              className={textareaClassName}
              value={(draft.metaGovernance?.genesisMembers ?? []).join("\n")}
              onChange={(event) =>
                updateMeta({
                  genesisMembers: event.target.value
                    .split("\n")
                    .map((value) => value.trim())
                    .filter(Boolean),
                })
              }
              placeholder={"hm...\nhm..."}
            />
          </div>
        ) : null}
      </WizardFieldSection>

      <WizardFieldSection
        title="Proposal identity"
        description="Give the system change a public title and concise summary."
      >
        <div className="space-y-2">
          <Label htmlFor="title">Proposal title *</Label>
          <Input
            id="title"
            value={draft.title}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                title: event.target.value,
              }))
            }
            placeholder="Create Research Chamber"
          />
          {attemptedNext && draft.title.trim().length === 0 ? (
            <p className="text-xs text-destructive">Title is required.</p>
          ) : null}
        </div>
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
        </div>
      </WizardFieldSection>
    </div>
  );
}
