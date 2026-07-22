import { useCallback, useRef, type MutableRefObject } from "react";

import { apiProposalDraftSave } from "@/lib/apiClient";
import { toTimestampMs } from "@/lib/dateTime";

import {
  mergeProposalWizardServerSave,
  type ProposalWizardSessionRepository,
  type ProposalWizardSessionV2,
} from "./sessionStorage";
import { draftToApiForm } from "./toApiForm";
import type { ProposalDraftForm, ProposalTemplateId } from "./types";
import type { WizardEvent } from "./wizardModel";

type ServerSaveOperation = {
  localRevision: number;
  promise: Promise<string | null>;
};

type UseProposalWizardSaveInput = {
  canAct: boolean;
  draft: ProposalDraftForm;
  onSaveError: (message: string | null) => void;
  onSavedAt: (timestamp: number) => void;
  onSessionSynced: (session: ProposalWizardSessionV2) => void;
  persistSession: (
    overrides?: Partial<ProposalWizardSessionV2>,
  ) => ProposalWizardSessionV2;
  presetId: string;
  repository: ProposalWizardSessionRepository;
  send: (event: WizardEvent) => void;
  sessionRef: MutableRefObject<ProposalWizardSessionV2>;
  templateId: ProposalTemplateId;
};

function sessionMatchesDraft(
  session: ProposalWizardSessionV2,
  draft: ProposalDraftForm,
  presetId: string,
  templateId: ProposalTemplateId,
) {
  return (
    session.templateId === templateId &&
    session.presetId === presetId &&
    JSON.stringify(session.form) === JSON.stringify(draft)
  );
}

export function useProposalWizardSave({
  canAct,
  draft,
  onSaveError,
  onSavedAt,
  onSessionSynced,
  persistSession,
  presetId,
  repository,
  send,
  sessionRef,
  templateId,
}: UseProposalWizardSaveInput) {
  const saveInFlightBySession = useRef(new Map<string, ServerSaveOperation>());

  return useCallback(() => {
    const sessionId = sessionRef.current.sessionId;
    const currentSession = sessionRef.current;
    const local = sessionMatchesDraft(
      currentSession,
      draft,
      presetId,
      templateId,
    )
      ? currentSession
      : persistSession({ form: draft });
    send({ type: "LOCAL_SAVE_COMPLETED" });
    onSavedAt(Date.now());
    onSaveError(null);
    if (!canAct) {
      onSaveError("Saved locally. Connect and verify to sync this draft.");
      return Promise.resolve(local.draftId ?? null);
    }

    const saveRevision = (
      requested: ProposalWizardSessionV2,
    ): Promise<string | null> => {
      const existing = saveInFlightBySession.current.get(sessionId);
      if (existing) {
        return existing.promise.then((draftId) => {
          if (!draftId) return null;
          const latest = repository.get(sessionId);
          return latest && latest.localRevision > existing.localRevision
            ? saveRevision(latest)
            : draftId;
        });
      }

      send({ type: "SERVER_SAVE_REQUESTED" });
      const operation = (async () => {
        try {
          const response = await apiProposalDraftSave({
            ...(requested.draftId ? { draftId: requested.draftId } : {}),
            form: draftToApiForm(requested.form, {
              templateId: requested.templateId,
            }),
          });
          const serverSavedAt = new Date(
            toTimestampMs(response.updatedAt, Date.now()),
          ).toISOString();
          const latest = repository.get(sessionId) ?? requested;
          const merged = mergeProposalWizardServerSave({
            draftId: response.draftId,
            latest,
            requested,
            serverSavedAt,
          });
          const synced = repository.save(merged.session);
          if (sessionRef.current.sessionId === sessionId) {
            sessionRef.current = synced;
            onSessionSynced(synced);
            onSavedAt(toTimestampMs(response.updatedAt, Date.now()));
            send({ type: "SERVER_SAVE_SUCCEEDED" });
            if (merged.changedDuringSync) {
              send({ type: "LOCAL_SAVE_COMPLETED" });
            }
          }
          return response.draftId;
        } catch (error) {
          if (sessionRef.current.sessionId === sessionId) {
            onSaveError((error as Error).message);
            send({ type: "SERVER_SAVE_FAILED" });
          }
          return null;
        }
      })();
      let tracked: Promise<string | null>;
      tracked = operation.finally(() => {
        if (saveInFlightBySession.current.get(sessionId)?.promise === tracked) {
          saveInFlightBySession.current.delete(sessionId);
        }
      });
      saveInFlightBySession.current.set(sessionId, {
        localRevision: requested.localRevision,
        promise: tracked,
      });
      return tracked;
    };

    return saveRevision(local);
  }, [
    canAct,
    draft,
    onSaveError,
    onSavedAt,
    onSessionSynced,
    persistSession,
    presetId,
    repository,
    send,
    sessionRef,
    templateId,
  ]);
}
