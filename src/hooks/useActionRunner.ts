import { useLayoutEffect, useRef, useState } from "react";

import { getApiErrorPayload } from "@/lib/apiClient";

type UseActionRunnerInput = {
  reload?: () => Promise<void>;
  // Use a stable identity for the current document/account.
  scope?: unknown;
};

export function useActionRunner({ reload, scope }: UseActionRunnerInput = {}) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const actionInFlight = useRef<object | null>(null);
  const lifetime = useRef<object | null>(null);
  const attemptKeys = useRef(new Map<string, string>());

  useLayoutEffect(() => {
    const owner = {};
    lifetime.current = owner;
    actionInFlight.current = null;
    attemptKeys.current.clear();
    setActionError(null);
    setMutating(false);
    return () => {
      lifetime.current = null;
    };
  }, [scope]);

  const runAction = async (
    fn: (idempotencyKey?: string) => Promise<void>,
    options?: { errorCurrent?: () => boolean; retryKey?: string },
  ) => {
    if (actionInFlight.current) return;
    const owner = lifetime.current;
    if (!owner) return;
    const token = {};
    const current = () =>
      lifetime.current === owner && actionInFlight.current === token;
    actionInFlight.current = token;
    const retryKey = options?.retryKey;
    const idempotencyKey = retryKey
      ? (attemptKeys.current.get(retryKey) ?? crypto.randomUUID())
      : undefined;
    if (retryKey && idempotencyKey)
      attemptKeys.current.set(retryKey, idempotencyKey);
    setActionError(null);
    setMutating(true);
    try {
      await fn(idempotencyKey);
      if (!current()) return;
      if (retryKey) attemptKeys.current.delete(retryKey);
      await reload?.();
    } catch (error) {
      if (!current() || options?.errorCurrent?.() === false) return;
      const payload = getApiErrorPayload(error);
      setActionError(
        payload?.error?.message ??
          (error instanceof Error ? error.message : "Action failed"),
      );
    } finally {
      if (current()) {
        actionInFlight.current = null;
        setMutating(false);
      }
    }
  };

  return {
    actionError,
    mutating,
    runAction,
    reportError: setActionError,
  };
}
