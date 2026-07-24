import { useEffect, useState } from "react";
import type { NavigateFunction } from "react-router";

import { apiProposalDraft, apiProposalStatus } from "@/lib/apiClient";
import { normalizeSessionDraft } from "./sessionStorage";
import { inferPresetIdFromDraft } from "./presets/registry";
import type { DraftPublicationSummaryDto } from "@/types/api";
import type { ProposalDraftForm } from "./types";

type ProposalCreationTemplateKind = "project" | "system";

export type ProposalDraftHydrationResult = {
  draft: ProposalDraftForm;
  draftId: string;
  presetId: string;
  publication: DraftPublicationSummaryDto;
  templateKind: ProposalCreationTemplateKind;
};

type UseProposalDraftHydrationInput = {
  navigate: NavigateFunction;
  onDraftLoaded: (input: ProposalDraftHydrationResult) => void;
  requestedDraftId: string;
};

export function useProposalDraftHydration({
  navigate,
  onDraftLoaded,
  requestedDraftId,
}: UseProposalDraftHydrationInput) {
  const [loadingDraftId, setLoadingDraftId] = useState<string | null>(null);
  const [loadDraftError, setLoadDraftError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestedDraftId) {
      setLoadingDraftId(null);
      setLoadDraftError(null);
      return;
    }
    let active = true;
    setLoadingDraftId(requestedDraftId);
    setLoadDraftError(null);
    (async () => {
      try {
        const detail = await apiProposalDraft(requestedDraftId);
        if (!active) return;
        if (detail.submittedProposalId) {
          try {
            const status = await apiProposalStatus(detail.submittedProposalId);
            if (!active) return;
            navigate(status.canonicalRoute, { replace: true });
          } catch {
            if (!active) return;
            navigate(`/app/proposals/${detail.submittedProposalId}/pp`, {
              replace: true,
            });
          }
          return;
        }
        if (!detail.editableForm) {
          throw new Error("Draft payload unavailable for editing.");
        }

        const normalized = normalizeSessionDraft(detail.editableForm);
        const nextTemplateKind =
          detail.editableForm.templateId ??
          (detail.editableForm.metaGovernance ? "system" : "project");
        const nextPresetId =
          detail.editableForm.presetId ?? inferPresetIdFromDraft(normalized);
        const nextDraftId = detail.id ?? requestedDraftId;

        onDraftLoaded({
          draft: normalized,
          draftId: nextDraftId,
          presetId: nextPresetId,
          publication: detail.publication,
          templateKind: nextTemplateKind,
        });
      } catch (error) {
        if (!active) return;
        setLoadDraftError((error as Error).message);
      } finally {
        if (!active) return;
        setLoadingDraftId(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate, onDraftLoaded, requestedDraftId]);

  return {
    loadDraftError,
    loadingDraftId,
  };
}
