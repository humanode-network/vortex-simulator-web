import { useCallback, useEffect, useState } from "react";

import { apiCourtRuntimeStatusV2 } from "@/lib/apiClient";
import type { CourtRuntimeStatusV2Dto } from "@/types/api";

type CourtRuntimeSnapshot =
  | { status: "checking" }
  | {
      status: "available";
      policyVersion: string;
      policyHash: string;
    }
  | { status: "unavailable"; reason: string }
  | { status: "failed"; reason: string };

type CourtRuntimeState = CourtRuntimeSnapshot & { retry: () => void };

export function useCourtRuntime(): CourtRuntimeState {
  const [requestVersion, setRequestVersion] = useState(0);
  const retry = useCallback(
    () => setRequestVersion((current) => current + 1),
    [],
  );
  const [state, setState] = useState<CourtRuntimeSnapshot>({
    status: "checking",
  });

  useEffect(() => {
    let active = true;
    setState({ status: "checking" });
    void apiCourtRuntimeStatusV2()
      .then((result: CourtRuntimeStatusV2Dto) => {
        if (!active) return;
        setState(result);
      })
      .catch((error) => {
        if (!active) return;
        setState({
          status: "failed",
          reason:
            error instanceof Error
              ? error.message
              : "The Court runtime status could not be loaded.",
        });
      });
    return () => {
      active = false;
    };
  }, [requestVersion]);

  return { ...state, retry };
}
