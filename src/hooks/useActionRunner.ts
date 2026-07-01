import { useRef, useState } from "react";

import { getApiErrorPayload } from "@/lib/apiClient";

type UseActionRunnerInput = {
  reload: () => Promise<void>;
};

export function useActionRunner({ reload }: UseActionRunnerInput) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const actionInFlight = useRef(false);

  const runAction = async (fn: () => Promise<void>) => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setActionError(null);
    setMutating(true);
    try {
      await fn();
      await reload();
    } catch (error) {
      const payload = getApiErrorPayload(error);
      setActionError(
        payload?.error?.message ??
          (error instanceof Error ? error.message : "Action failed"),
      );
    } finally {
      actionInFlight.current = false;
      setMutating(false);
    }
  };

  return {
    actionError,
    mutating,
    runAction,
  };
}
