import { useCallback, useRef, useState } from "react";

import { formatLoadError } from "@/lib/errorFormatting";
import { courtErrorIssue } from "./courtErrors";

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

export function useCourtCommandRunner(onRefresh?: () => Promise<void>) {
  const attemptKeys = useRef(new Map<string, string>());
  const busyRef = useRef<string | null>(null);
  const unlockAfterRefreshIds = useRef(new Set<string>());
  const [state, setState] = useState<CourtCommandState>({
    actionError: null,
    actionField: null,
    busy: null,
    notice: null,
    refreshError: null,
  });
  const [confirmedIds, setConfirmedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const refresh = useCallback(async () => {
    if (!onRefresh) return true;
    try {
      await onRefresh();
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
      setState((current) => ({
        ...current,
        refreshError: formatLoadError(
          error instanceof Error ? error.message : String(error),
        ),
      }));
      return false;
    }
  }, [onRefresh]);

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
        attemptKeys.current.delete(id);
        setConfirmedIds((current) => new Set(current).add(id));
        if (unlockAfterRefresh) unlockAfterRefreshIds.current.add(id);
        onConfirmed?.();
        setState((current) => ({
          ...current,
          notice: `${label} recorded.`,
        }));
        await refresh();
        return true;
      } catch (error) {
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
        if (fieldId) {
          window.requestAnimationFrame(() =>
            document.getElementById(fieldId)?.focus(),
          );
        }
        return false;
      } finally {
        busyRef.current = null;
        setState((current) => ({ ...current, busy: null }));
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
