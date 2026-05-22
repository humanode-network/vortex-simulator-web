import { useState } from "react";

import { getApiErrorPayload } from "@/lib/apiClient";

type UseFactionActionRunnerInput = {
  reload: () => Promise<void>;
};

export function useFactionActionRunner({ reload }: UseFactionActionRunnerInput) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const setCommandError = (error: unknown) => {
    const payload = getApiErrorPayload(error);
    const message =
      payload?.error?.message ??
      (error instanceof Error ? error.message : "Action failed");
    setActionError(message);
  };

  const runAction = async (fn: () => Promise<void>) => {
    setActionError(null);
    setMutating(true);
    try {
      await fn();
      await reload();
    } catch (error) {
      setCommandError(error);
    } finally {
      setMutating(false);
    }
  };

  return {
    actionError,
    mutating,
    runAction,
  };
}
