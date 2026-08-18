import { useCallback, useEffect, useRef, useState } from "react";

import { formatLoadError } from "@/lib/errorFormatting";
import { courtErrorIssue } from "../model/courtErrors";
import { focusCourtField } from "../model/courtFocus";

type CourtCommandRun = {
  action: (idempotencyKey: string) => Promise<unknown>;
  fieldTargets?: Readonly<Record<string, string>>;
  id: string;
  label: string;
  onConfirmed?: () => void;
  unlockAfterRefresh?: boolean;
};

type CourtCommandState = {
  actionError: string | null;
  actionField: string | null;
  busy: string | null;
  notice: string | null;
  refreshError: string | null;
};

const EMPTY_COMMAND_STATE: CourtCommandState = {
  actionError: null,
  actionField: null,
  busy: null,
  notice: null,
  refreshError: null,
};

export function useCourtCommandRunner(
  onRefresh?: () => Promise<void>,
  resetKey?: string | null,
) {
  const attemptKeys = useRef(new Map<string, string>());
  const busyRef = useRef<string | null>(null);
  const generation = useRef(0);
  const unlockAfterRefreshIds = useRef(new Set<string>());
  const [state, setState] = useState<CourtCommandState>(EMPTY_COMMAND_STATE);
  const [confirmedIds, setConfirmedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  useEffect(() => {
    generation.current += 1;
    attemptKeys.current.clear();
    unlockAfterRefreshIds.current.clear();
    busyRef.current = null;
    setConfirmedIds(new Set());
    setState(EMPTY_COMMAND_STATE);
  }, [resetKey]);

  const refresh = useCallback(
    async (expectedGeneration = generation.current) => {
      if (!onRefresh) return true;
      try {
        await onRefresh();
        if (generation.current !== expectedGeneration) return false;
        const unlockedIds = unlockAfterRefreshIds.current;
        if (unlockedIds.size > 0) {
          setConfirmedIds((current) => {
            const next = new Set(current);
            unlockedIds.forEach((id) => next.delete(id));
            return next;
          });
          unlockAfterRefreshIds.current = new Set();
        }
        setState((current) => ({ ...current, refreshError: null }));
        return true;
      } catch (error) {
        if (generation.current !== expectedGeneration) return false;
        setState((current) => ({
          ...current,
          refreshError: formatLoadError(
            error instanceof Error ? error.message : String(error),
          ),
        }));
        return false;
      }
    },
    [onRefresh],
  );

  const run = useCallback(
    async ({
      action,
      fieldTargets,
      id,
      label,
      onConfirmed,
      unlockAfterRefresh = false,
    }: CourtCommandRun) => {
      if (busyRef.current || confirmedIds.has(id)) return false;
      const runGeneration = generation.current;
      const idempotencyKey = attemptKeys.current.get(id) ?? crypto.randomUUID();
      attemptKeys.current.set(id, idempotencyKey);
      busyRef.current = id;
      setState({
        actionError: null,
        actionField: null,
        busy: id,
        notice: null,
        refreshError: null,
      });
      try {
        await action(idempotencyKey);
        if (generation.current !== runGeneration) return false;
        attemptKeys.current.delete(id);
        setConfirmedIds((current) => new Set(current).add(id));
        if (unlockAfterRefresh) unlockAfterRefreshIds.current.add(id);
        onConfirmed?.();
        setState((current) => ({
          ...current,
          notice: `${label} recorded.`,
        }));
        await refresh(runGeneration);
        return true;
      } catch (error) {
        if (generation.current !== runGeneration) return false;
        const issue = courtErrorIssue(error);
        const status =
          error && typeof error === "object" && "status" in error
            ? Number((error as { status?: unknown }).status)
            : null;
        if (status !== null && status >= 400 && status < 500) {
          attemptKeys.current.delete(id);
        }
        setState((current) => ({
          ...current,
          actionError: issue.message,
          actionField: issue.fields[0] ?? null,
        }));
        const fieldId = issue.fields
          .map((field) => fieldTargets?.[field])
          .find((value): value is string => Boolean(value));
        if (fieldId) focusCourtField(fieldId);
        return false;
      } finally {
        if (generation.current === runGeneration) {
          busyRef.current = null;
          setState((current) => ({ ...current, busy: null }));
        }
      }
    },
    [confirmedIds, refresh],
  );

  const clearFeedback = useCallback(() => {
    setState((current) => ({
      ...current,
      actionError: null,
      actionField: null,
      notice: null,
      refreshError: null,
    }));
  }, []);

  const isConfirmed = useCallback(
    (id: string) => confirmedIds.has(id),
    [confirmedIds],
  );

  return { ...state, clearFeedback, isConfirmed, refresh, run };
}
