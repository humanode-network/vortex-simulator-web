import { useCallback, useEffect, useRef, useState } from "react";

import {
  loadDraft,
  loadPresetId,
  loadTemplateId,
  persistPresetId,
} from "./storage";
import type { ProposalDraftForm } from "./types";
import {
  PROPOSAL_PRESETS,
  applyPresetToDraft,
  getProposalPreset,
  inferPresetIdFromDraft,
} from "./presets/registry";

export type ProposalCreationTemplateKind = "project" | "system";

function initialPresetId(): string {
  const storedDraft = loadDraft();
  const inferred = inferPresetIdFromDraft(storedDraft);
  const storedPreset = loadPresetId();
  if (storedPreset) {
    const knownStoredPreset = PROPOSAL_PRESETS.find(
      (preset) => preset.id === storedPreset,
    );
    const inferredPreset = getProposalPreset(inferred);
    if (
      knownStoredPreset &&
      knownStoredPreset.templateId === inferredPreset.templateId
    ) {
      return storedPreset;
    }
  }
  return inferred;
}

function initialTemplateKind(presetId: string): ProposalCreationTemplateKind {
  const storedTemplateId = loadTemplateId();
  if (storedTemplateId === "project" || storedTemplateId === "system") {
    return storedTemplateId;
  }
  const preset = PROPOSAL_PRESETS.find((item) => item.id === presetId);
  return preset?.templateId ?? "project";
}

export function useProposalCreationPreset(
  setDraft: React.Dispatch<React.SetStateAction<ProposalDraftForm>>,
) {
  const presetInitialized = useRef(false);
  const skipNextPresetApply = useRef(false);
  const [presetId, setPresetId] = useState<string>(() => initialPresetId());
  const [templateKind, setTemplateKind] =
    useState<ProposalCreationTemplateKind>(() =>
      initialTemplateKind(initialPresetId()),
    );

  useEffect(() => {
    const preset = PROPOSAL_PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      persistPresetId("");
      return;
    }
    if (skipNextPresetApply.current) {
      skipNextPresetApply.current = false;
      persistPresetId(preset.id);
      return;
    }
    if (preset.templateId !== templateKind) {
      persistPresetId("");
      setPresetId("");
      return;
    }
    setDraft((prev) => {
      const shouldSoftApply = !presetInitialized.current;
      presetInitialized.current = true;
      if (shouldSoftApply) {
        const seeded = { ...prev, presetId: preset.id };
        if (preset.templateId === "system") {
          return {
            ...seeded,
            chamberId: "general",
            metaGovernance: seeded.metaGovernance ?? preset.metaGovernance,
          };
        }
        return seeded;
      }

      let next = applyPresetToDraft(prev, preset);
      if (preset.templateId === "system") {
        next = { ...next, chamberId: "general" };
      }
      return next;
    });
    persistPresetId(preset.id);
  }, [presetId, setDraft, templateKind]);

  const skipNextApply = useCallback(() => {
    skipNextPresetApply.current = true;
  }, []);

  return {
    presetId,
    setPresetId,
    setTemplateKind,
    skipNextApply,
    templateKind,
  };
}
