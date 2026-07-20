import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/primitives/badge";
import { Label } from "@/components/primitives/label";
import { Select } from "@/components/primitives/select";
import { TierLabel } from "@/components/TierLabel";
import {
  isTierEligible,
  requiredTierForProposalType,
} from "@/lib/proposalTypes";
import {
  filterPresetsForEligibility,
  getPresetCategory,
  type ProposalPreset,
} from "../presets/registry";
import type { ProposalDraftForm } from "../types";
import { WizardFieldSection } from "../WizardFieldSection";

const PROPOSAL_TYPE_OPTIONS: Array<{
  value: ProposalDraftForm["proposalType"];
  label: string;
  helper: string;
}> = [
  {
    value: "basic",
    label: "Basic",
    helper: "Routine proposals that do not change core system parameters.",
  },
  {
    value: "fee",
    label: "Fee distribution",
    helper: "Adjust fee or treasury allocation rules.",
  },
  {
    value: "monetary",
    label: "Monetary system",
    helper: "Token issuance, emission, or monetary policy changes.",
  },
  {
    value: "core",
    label: "Core infrastructure",
    helper: "Protocol and infrastructure-level changes.",
  },
  {
    value: "administrative",
    label: "Administrative",
    helper: "Governance operations such as chamber lifecycle changes.",
  },
  {
    value: "dao-core",
    label: "DAO core",
    helper: "Changes to the governance protocol itself.",
  },
];

type IntentStepProps = {
  availableChamberIds: string[];
  currentTier: string | null;
  draft: ProposalDraftForm;
  onPresetChange: (presetId: string) => void;
  onTemplateChange: (templateId: "project" | "system") => void;
  presetId: string;
  presets: ProposalPreset[];
  requiredTier: string;
  sessionId: string;
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>;
  templateId: "project" | "system";
  tierEligible: boolean;
};

export function IntentStep({
  availableChamberIds,
  currentTier,
  draft,
  onPresetChange,
  onTemplateChange,
  presetId,
  presets,
  requiredTier,
  sessionId,
  setDraft,
  templateId,
  tierEligible,
}: IntentStepProps) {
  const [kindChosen, setKindChosen] = useState(Boolean(presetId));
  const [typeChosen, setTypeChosen] = useState(Boolean(presetId));
  useEffect(() => {
    setKindChosen(Boolean(presetId));
    setTypeChosen(Boolean(presetId));
  }, [sessionId]);
  const isSystem = templateId === "system";
  const selectedPreset = presets.find((preset) => preset.id === presetId);
  const selectedCategory = selectedPreset
    ? getPresetCategory(selectedPreset)
    : null;

  const proposalTypeOptions = useMemo(
    () =>
      PROPOSAL_TYPE_OPTIONS.filter((option) =>
        isSystem ? option.value !== "basic" : true,
      ).map((option) => {
        const optionRequiredTier = requiredTierForProposalType(option.value);
        return {
          ...option,
          requiredTier: optionRequiredTier,
          eligible:
            currentTier === null ||
            isTierEligible(currentTier, optionRequiredTier),
        };
      }),
    [currentTier, isSystem],
  );

  const eligiblePresets = useMemo(
    () =>
      filterPresetsForEligibility({
        presets,
        currentTier,
        availableChamberIds,
        selectedPresetId: presetId,
        systemProposalType:
          kindChosen && typeChosen && isSystem ? draft.proposalType : null,
      }).filter(
        (preset) =>
          preset.templateId === templateId &&
          preset.proposalType === draft.proposalType,
      ),
    [
      availableChamberIds,
      currentTier,
      draft.proposalType,
      isSystem,
      kindChosen,
      presetId,
      presets,
      templateId,
      typeChosen,
    ],
  );

  const formationModes = useMemo(
    () =>
      new Set(
        eligiblePresets.map((preset) =>
          preset.formationEligible ? "formation" : "policy",
        ),
      ),
    [eligiblePresets],
  );
  const selectedMode =
    draft.formationEligible === false ? "policy" : "formation";
  const visiblePresets = isSystem
    ? eligiblePresets
    : eligiblePresets.filter(
        (preset) =>
          (preset.formationEligible ? "formation" : "policy") === selectedMode,
      );

  const selectFirstPreset = (
    nextType: ProposalDraftForm["proposalType"],
    mode?: "formation" | "policy",
  ) => {
    const candidates = filterPresetsForEligibility({
      presets,
      currentTier,
      availableChamberIds,
      selectedPresetId: presetId,
      systemProposalType: isSystem ? nextType : null,
    }).filter(
      (preset) =>
        preset.templateId === templateId &&
        preset.proposalType === nextType &&
        (isSystem || !mode
          ? true
          : preset.formationEligible === (mode === "formation")),
    );
    onPresetChange(candidates[0]?.id ?? "");
  };

  return (
    <div className="space-y-6">
      <WizardFieldSection
        title="Proposal path"
        description="Choose what the proposal changes. The wizard will show only the steps required for that path."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="proposal-kind">Kind</Label>
            <Select
              id="proposal-kind"
              value={kindChosen ? templateId : ""}
              onChange={(event) => {
                const next = event.target.value as "project" | "system";
                setKindChosen(true);
                setTypeChosen(false);
                onTemplateChange(next);
              }}
            >
              <option value="" disabled>
                Select kind
              </option>
              <option value="project">Project proposal</option>
              <option value="system">System change</option>
            </Select>
            <p className="text-xs leading-5 text-muted">
              {isSystem && kindChosen
                ? "Change a simulation entity or governance rule through General chamber."
                : "Propose policy or Formation work in a chamber."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposal-type">Proposal type</Label>
            <Select
              id="proposal-type"
              value={typeChosen ? draft.proposalType : ""}
              disabled={!kindChosen}
              onChange={(event) => {
                const nextType = event.target
                  .value as ProposalDraftForm["proposalType"];
                const option = proposalTypeOptions.find(
                  (candidate) => candidate.value === nextType,
                );
                if (!option?.eligible) return;
                setTypeChosen(true);
                setDraft((previous) => ({
                  ...previous,
                  proposalType: nextType,
                }));
                selectFirstPreset(nextType);
              }}
            >
              <option value="" disabled>
                Select type
              </option>
              {proposalTypeOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={!option.eligible}
                >
                  {option.label}
                  {option.eligible ? "" : ` (requires ${option.requiredTier})`}
                </option>
              ))}
            </Select>
            <p className="text-xs leading-5 text-muted">
              {typeChosen
                ? PROPOSAL_TYPE_OPTIONS.find(
                    (option) => option.value === draft.proposalType,
                  )?.helper
                : "Choose the governing right used for this proposal."}
            </p>
          </div>
        </div>
      </WizardFieldSection>

      <WizardFieldSection
        title="Proposal structure"
        description="Select the concrete preset and, where available, whether the proposal becomes Formation work."
      >
        {!isSystem ? (
          <div className="space-y-2">
            <Label htmlFor="proposal-formation-mode">Execution</Label>
            <Select
              id="proposal-formation-mode"
              value={typeChosen ? selectedMode : ""}
              disabled={!typeChosen || formationModes.size < 2}
              onChange={(event) => {
                const mode = event.target.value as "formation" | "policy";
                setDraft((previous) => ({
                  ...previous,
                  formationEligible: mode === "formation",
                }));
                selectFirstPreset(draft.proposalType, mode);
              }}
            >
              {!typeChosen ? (
                <option value="" disabled>
                  Select type first
                </option>
              ) : (
                <>
                  {formationModes.has("formation") ? (
                    <option value="formation">Formation project</option>
                  ) : null}
                  {formationModes.has("policy") ? (
                    <option value="policy">Policy</option>
                  ) : null}
                </>
              )}
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="proposal-preset">Preset</Label>
          <Select
            id="proposal-preset"
            value={
              visiblePresets.some((preset) => preset.id === presetId)
                ? presetId
                : ""
            }
            disabled={!kindChosen || !typeChosen}
            onChange={(event) => onPresetChange(event.target.value)}
          >
            {!kindChosen || !typeChosen ? (
              <option value="" disabled>
                Choose kind and type first
              </option>
            ) : visiblePresets.length > 0 ? (
              visiblePresets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No eligible presets
              </option>
            )}
          </Select>
          <div className="flex flex-wrap items-center gap-2 text-xs leading-5 text-muted">
            {selectedCategory ? (
              <Badge variant="muted" size="sm">
                {selectedCategory}
              </Badge>
            ) : null}
            <span>
              {selectedPreset?.description ??
                "Presets are filtered by proposal rights and chamber access."}
            </span>
          </div>
        </div>
      </WizardFieldSection>

      <div className="proposal-wizard__eligibility">
        <span>
          Required tier: <TierLabel tier={requiredTier} />
        </span>
        <span className={tierEligible ? "text-muted" : "text-destructive"}>
          {currentTier ? (
            <>
              Your tier: <TierLabel tier={currentTier} />
            </>
          ) : (
            "Connect a wallet to verify eligibility."
          )}
        </span>
      </div>
    </div>
  );
}
