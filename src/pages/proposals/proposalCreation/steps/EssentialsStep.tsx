import { useMemo, useState } from "react";
import type React from "react";
import { Label } from "@/components/primitives/label";
import { Badge } from "@/components/primitives/badge";
import { Select } from "@/components/primitives/select";
import { Input } from "@/components/primitives/input";
import { TierLabel } from "@/components/TierLabel";
import type { ProposalDraftForm } from "../types";
import {
  getSystemActionMeta,
  type SystemActionId,
} from "../templates/systemActions";
import {
  filterPresetsForEligibility,
  getPresetCategory,
  type ProposalPreset,
} from "../presets/registry";
import {
  isTierEligible,
  requiredTierForProposalType,
} from "@/lib/proposalTypes";

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
    helper: "Adjust fee/treasury allocation rules.",
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
    helper: "Governance operations (e.g., chamber lifecycle).",
  },
  {
    value: "dao-core",
    label: "DAO core",
    helper: "Changes to the governance protocol itself.",
  },
];

export function EssentialsStep(props: {
  attemptedNext: boolean;
  chamberOptions: { value: string; label: string }[];
  draft: ProposalDraftForm;
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>;
  templateId: "project" | "system";
  onTemplateChange: (templateId: "project" | "system") => void;
  presetId: string;
  presets: ProposalPreset[];
  onPresetChange: (presetId: string) => void;
  textareaClassName: string;
  requiredTier: string;
  currentTier: string | null;
  tierEligible: boolean;
}) {
  const {
    attemptedNext,
    chamberOptions,
    draft,
    setDraft,
    templateId,
    onTemplateChange,
    presetId,
    presets,
    onPresetChange,
    textareaClassName,
    requiredTier,
    currentTier,
    tierEligible,
  } = props;
  const [hasChosenKind, setHasChosenKind] = useState(false);
  const [hasChosenType, setHasChosenType] = useState(false);

  const isSystemProposal = templateId === "system";
  const hasGeneralOption = chamberOptions.some(
    (opt) => opt.value === "general",
  );
  const systemAction = draft.metaGovernance?.action as
    | SystemActionId
    | undefined;
  const systemActionMeta = systemAction
    ? getSystemActionMeta(systemAction)
    : null;
  const selectedPreset = presets.find((preset) => preset.id === presetId);
  const selectedPresetCategory = selectedPreset
    ? getPresetCategory(selectedPreset)
    : null;
  const availableChamberIds = useMemo(() => {
    const ids = chamberOptions.map((opt) => opt.value);
    if (!ids.some((id) => id.trim().toLowerCase() === "general")) {
      ids.push("general");
    }
    return ids;
  }, [chamberOptions]);
  const tierAndChamberEligiblePresets = useMemo(
    () =>
      filterPresetsForEligibility({
        presets,
        currentTier,
        availableChamberIds,
        selectedPresetId: presetId,
        systemProposalType:
          hasChosenKind && hasChosenType && isSystemProposal
            ? draft.proposalType
            : null,
      }),
    [
      availableChamberIds,
      currentTier,
      draft.proposalType,
      hasChosenKind,
      hasChosenType,
      isSystemProposal,
      presetId,
      presets,
    ],
  );

  const eligibleByKind = useMemo(
    () =>
      tierAndChamberEligiblePresets.filter(
        (preset) => preset.templateId === templateId,
      ),
    [templateId, tierAndChamberEligiblePresets],
  );

  const selectedType = hasChosenType ? draft.proposalType : null;
  const eligibleByType = useMemo(
    () =>
      selectedType
        ? eligibleByKind.filter(
            (preset) => preset.proposalType === selectedType,
          )
        : [],
    [eligibleByKind, selectedType],
  );

  const projectTypePresets = useMemo(() => {
    if (!hasChosenKind || !hasChosenType || isSystemProposal || !selectedType) {
      return [];
    }
    return eligibleByKind.filter(
      (preset) => preset.proposalType === selectedType,
    );
  }, [
    eligibleByKind,
    hasChosenKind,
    hasChosenType,
    isSystemProposal,
    selectedType,
  ]);
  const hasFormationVariants = useMemo(() => {
    if (projectTypePresets.length === 0) return false;
    const hasWithFormation = projectTypePresets.some(
      (preset) => preset.formationEligible,
    );
    const hasWithoutFormation = projectTypePresets.some(
      (preset) => !preset.formationEligible,
    );
    return hasWithFormation && hasWithoutFormation;
  }, [projectTypePresets]);
  const formationModeValue = selectedPreset?.formationEligible
    ? "formation"
    : "policy";
  const presetOptions = useMemo(() => {
    if (!hasChosenKind || !hasChosenType) return [];
    const base = eligibleByType;
    if (base.length === 0 || isSystemProposal || !hasFormationVariants) {
      return base;
    }
    const wantsFormation =
      selectedPreset?.formationEligible ?? draft.formationEligible !== false;
    const byMode = base.filter(
      (preset) => preset.formationEligible === wantsFormation,
    );
    return byMode.length > 0 ? byMode : base;
  }, [
    draft.formationEligible,
    eligibleByType,
    hasChosenKind,
    hasChosenType,
    hasFormationVariants,
    isSystemProposal,
    selectedPreset?.formationEligible,
  ]);
  const proposalTypeOptions = useMemo(
    () =>
      PROPOSAL_TYPE_OPTIONS.filter((option) =>
        isSystemProposal ? option.value !== "basic" : true,
      ).map((option) => {
        const optionRequiredTier = requiredTierForProposalType(option.value);
        const eligible =
          currentTier === null
            ? true
            : isTierEligible(currentTier, optionRequiredTier);
        return {
          ...option,
          requiredTier: optionRequiredTier,
          eligible,
        };
      }),
    [currentTier, isSystemProposal],
  );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="proposal-kind">Kind</Label>
        <Select
          id="proposal-kind"
          value={hasChosenKind ? templateId : ""}
          onChange={(e) => {
            const next = e.target.value as "project" | "system";
            setHasChosenKind(true);
            if (next === "system") {
              setDraft((prev) => ({
                ...prev,
                proposalType: "administrative",
                metaGovernance: undefined,
              }));
              setHasChosenType(false);
            } else {
              setDraft((prev) => ({
                ...prev,
                metaGovernance: undefined,
              }));
              setHasChosenType(false);
            }
            onTemplateChange(next);
          }}
        >
          <option value="" disabled>
            Select kind
          </option>
          <option value="project">Project proposal</option>
          <option value="system">System change (General)</option>
        </Select>
        <p className="text-xs text-muted">
          System changes affect simulation variables directly (e.g., chamber
          creation). Project proposals describe work outside the system.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="proposal-type">Proposal type</Label>
        <Select
          id="proposal-type"
          value={hasChosenType ? draft.proposalType : ""}
          disabled={!hasChosenKind}
          onChange={(e) => {
            const nextType = e.target
              .value as ProposalDraftForm["proposalType"];
            const nextTypeOption = proposalTypeOptions.find(
              (option) => option.value === nextType,
            );
            if (nextTypeOption && !nextTypeOption.eligible) return;
            setHasChosenType(true);
            if (templateId === "system") {
              // Keep kind stable even when this type has no system presets.
              onTemplateChange("system");
            }
            setDraft((prev) => ({
              ...prev,
              proposalType: nextType,
              ...(templateId === "system"
                ? {
                    metaGovernance: undefined,
                  }
                : {}),
            }));
            const nextOptions = eligibleByKind.filter(
              (preset) => preset.proposalType === nextType,
            );
            if (nextOptions.length > 0) {
              const nextPreset = nextOptions[0];
              onPresetChange(nextPreset.id);
            } else {
              onPresetChange("");
            }
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
        <p className="text-xs text-muted">
          {hasChosenType
            ? PROPOSAL_TYPE_OPTIONS.find(
                (option) => option.value === draft.proposalType,
              )?.helper
            : "Choose proposal type to continue."}
          <span className="mt-1 block">
            Required tier: <TierLabel tier={requiredTier} />.
            {currentTier ? (
              <span
                className={tierEligible ? "text-muted" : "text-destructive"}
              >
                {" "}
                Your tier: <TierLabel tier={currentTier} />.
              </span>
            ) : (
              <span> Connect a wallet to verify eligibility.</span>
            )}
          </span>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proposal-preset">Proposal preset</Label>
        <Select
          id="proposal-preset"
          value={
            hasChosenKind &&
            hasChosenType &&
            presetOptions.some((preset) => preset.id === presetId)
              ? presetId
              : ""
          }
          disabled={!hasChosenKind || !hasChosenType}
          onChange={(e) => onPresetChange(e.target.value)}
        >
          {!hasChosenKind ? (
            <option value="" disabled>
              Select kind first
            </option>
          ) : !hasChosenType ? (
            <option value="" disabled>
              Select type first
            </option>
          ) : presetOptions.length > 0 ? (
            presetOptions.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))
          ) : (
            <option value="" disabled>
              No presets available for this selection.
            </option>
          )}
        </Select>
        <p className="text-xs text-muted">
          {selectedPresetCategory ? (
            <span className="mb-1 block">
              <Badge variant="muted" size="sm">
                {selectedPresetCategory}
              </Badge>
            </span>
          ) : null}
          {selectedPreset?.description ??
            "Choose kind and type first, then select a preset."}
          {selectedPreset?.recommendedChamber ? (
            <span className="mt-1 block">
              Recommended chamber: {selectedPreset.recommendedChamber}.
            </span>
          ) : null}
          <span className="mt-1 block">
            Presets are filtered by kind, type, tier, and chamber access.
          </span>
        </p>
      </div>
      {!isSystemProposal ? (
        <div className="space-y-2">
          <Label htmlFor="proposal-formation-mode">Mode</Label>
          <Select
            id="proposal-formation-mode"
            value={hasChosenKind && hasChosenType ? formationModeValue : ""}
            disabled={!hasChosenKind || !hasChosenType || !hasFormationVariants}
            onChange={(e) => {
              if (!selectedType) return;
              const wantsFormation = e.target.value === "formation";
              const matches = projectTypePresets.filter(
                (preset) => preset.formationEligible === wantsFormation,
              );
              if (matches.length === 0) return;
              const nextPreset =
                matches.find((preset) => preset.id === presetId) ?? matches[0];
              onPresetChange(nextPreset.id);
            }}
          >
            {!hasChosenKind || !hasChosenType ? (
              <option value="" disabled>
                Select kind and type first
              </option>
            ) : !hasFormationVariants ? (
              <option value={formationModeValue}>
                {formationModeValue === "formation" ? "Formation" : "Policy"}
              </option>
            ) : (
              <>
                <option value="formation">Formation</option>
                <option value="policy">Policy</option>
              </>
            )}
          </Select>
          <p className="text-xs text-muted">
            {hasFormationVariants
              ? "Choose Formation (project with milestones) or Policy."
              : "This type has a fixed mode and cannot be switched."}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={draft.title}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
            placeholder="Proposal title"
          />
          {attemptedNext && draft.title.trim().length === 0 ? (
            <p className="text-xs text-destructive">Title is required.</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label htmlFor="chamber">
            {isSystemProposal ? "Chamber" : "Chamber (optional)"}
          </Label>
          <Select
            id="chamber"
            value={isSystemProposal ? "general" : draft.chamberId}
            disabled={isSystemProposal}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                chamberId: e.target.value,
              }))
            }
          >
            <option value="">Select a chamber…</option>
            {!hasGeneralOption ? (
              <option value="general">General chamber</option>
            ) : null}
            {chamberOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          {isSystemProposal ? (
            <p className="text-xs text-muted">
              System proposals must target General chamber.
            </p>
          ) : null}
        </div>
      </div>

      {isSystemProposal ? (
        <div className="space-y-3 rounded-xl border border-border bg-panel-alt p-4">
          <p className="text-sm font-semibold text-text">System change</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="system-action">Action</Label>
              <div
                id="system-action"
                className="rounded-lg border border-border bg-panel px-3 py-2 text-sm text-text"
              >
                {systemActionMeta?.label ?? "No preset selected"}
              </div>
              <p className="text-xs text-muted">
                {systemActionMeta?.description ??
                  "Select a system preset for this type to set an executable action."}
              </p>
            </div>
            {systemActionMeta?.requiresChamberId ? (
              <div className="space-y-1">
                <Label htmlFor="target-chamber-id">Target chamber id *</Label>
                <Input
                  id="target-chamber-id"
                  value={draft.metaGovernance?.chamberId ?? ""}
                  onChange={(e) => {
                    const chamberId = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      metaGovernance: {
                        ...(prev.metaGovernance ?? {
                          action: "chamber.create",
                          chamberId: "",
                          targetAddress: "",
                          title: "",
                          genesisMembers: [],
                        }),
                        chamberId,
                      },
                      chamberId: "general",
                    }));
                  }}
                  placeholder="e.g., engineering"
                />
                {attemptedNext &&
                (draft.metaGovernance?.chamberId ?? "").trim().length === 0 ? (
                  <p className="text-xs text-destructive">
                    Target chamber id is required.
                  </p>
                ) : null}
              </div>
            ) : null}
            {systemActionMeta?.requiresTargetAddress ? (
              <div className="space-y-1">
                <Label htmlFor="target-governor-address">
                  Target governor address *
                </Label>
                <Input
                  id="target-governor-address"
                  value={draft.metaGovernance?.targetAddress ?? ""}
                  onChange={(e) => {
                    const targetAddress = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      metaGovernance: {
                        ...(prev.metaGovernance ?? {
                          action: "governor.censure",
                          targetAddress: "",
                        }),
                        targetAddress,
                      },
                      chamberId: "general",
                    }));
                  }}
                  placeholder="hm..."
                />
                {attemptedNext &&
                (draft.metaGovernance?.targetAddress ?? "").trim().length ===
                  0 ? (
                  <p className="text-xs text-destructive">
                    Target governor address is required.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {systemActionMeta?.requiresTitle ||
          systemActionMeta?.showMultiplier ||
          systemActionMeta?.showGenesisMembers ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {systemActionMeta?.requiresTitle ? (
                  <div className="space-y-1">
                    <Label htmlFor="target-title">Title *</Label>
                    <Input
                      id="target-title"
                      value={draft.metaGovernance?.title ?? ""}
                      onChange={(e) => {
                        const title = e.target.value;
                        setDraft((prev) => ({
                          ...prev,
                          metaGovernance: {
                            ...(prev.metaGovernance ?? {
                              action: "chamber.create",
                              chamberId: "",
                              targetAddress: "",
                              title: "",
                              genesisMembers: [],
                            }),
                            title,
                          },
                          chamberId: "general",
                        }));
                      }}
                      placeholder="Engineering chamber"
                    />
                    {attemptedNext &&
                    (draft.metaGovernance?.title ?? "").trim().length === 0 ? (
                      <p className="text-xs text-destructive">
                        Title is required for chamber creation.
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {systemActionMeta?.showMultiplier ? (
                  <div className="space-y-1">
                    <Label htmlFor="target-multiplier">
                      Multiplier (optional)
                    </Label>
                    <Input
                      id="target-multiplier"
                      value={
                        draft.metaGovernance?.multiplier === undefined ||
                        draft.metaGovernance?.multiplier === null
                          ? ""
                          : String(draft.metaGovernance.multiplier)
                      }
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const multiplier =
                          raw.length === 0 ? undefined : Number(raw);
                        setDraft((prev) => ({
                          ...prev,
                          metaGovernance: {
                            ...(prev.metaGovernance ?? {
                              action: "chamber.create",
                              chamberId: "",
                              targetAddress: "",
                              title: "",
                              genesisMembers: [],
                            }),
                            multiplier:
                              multiplier === undefined ||
                              Number.isNaN(multiplier)
                                ? undefined
                                : multiplier,
                          },
                          chamberId: "general",
                        }));
                      }}
                      placeholder="e.g., 3"
                      inputMode="decimal"
                    />
                  </div>
                ) : null}
              </div>
              {systemActionMeta?.showGenesisMembers ? (
                <div className="space-y-1">
                  <Label htmlFor="genesis-members">
                    Genesis members (optional, one address per line)
                  </Label>
                  <textarea
                    id="genesis-members"
                    rows={4}
                    className={textareaClassName}
                    value={(draft.metaGovernance?.genesisMembers ?? []).join(
                      "\n",
                    )}
                    onChange={(e) => {
                      const genesisMembers = e.target.value
                        .split("\n")
                        .map((v) => v.trim())
                        .filter(Boolean);
                      setDraft((prev) => ({
                        ...prev,
                        metaGovernance: {
                          ...(prev.metaGovernance ?? {
                            action: "chamber.create",
                            chamberId: "",
                            targetAddress: "",
                            title: "",
                            genesisMembers: [],
                          }),
                          genesisMembers,
                        },
                        chamberId: "general",
                      }));
                    }}
                    placeholder={"5F...Alice\n5F...Bob"}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-1">
        <Label htmlFor="summary">Summary (optional)</Label>
        <Input
          id="summary"
          value={draft.summary}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, summary: e.target.value }))
          }
          placeholder="One line used in lists/cards"
        />
      </div>

      {isSystemProposal ? null : (
        <>
          <div className="space-y-1">
            <Label htmlFor="what">What *</Label>
            <textarea
              id="what"
              rows={5}
              className={textareaClassName}
              value={draft.what}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, what: e.target.value }))
              }
              placeholder="Describe the project/task you want to execute."
            />
            {attemptedNext && draft.what.trim().length === 0 ? (
              <p className="text-xs text-destructive">“What” is required.</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor="why">Why *</Label>
            <textarea
              id="why"
              rows={5}
              className={textareaClassName}
              value={draft.why}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, why: e.target.value }))
              }
              placeholder="Explain the expected contribution to Humanode."
            />
            {attemptedNext && draft.why.trim().length === 0 ? (
              <p className="text-xs text-destructive">“Why” is required.</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
