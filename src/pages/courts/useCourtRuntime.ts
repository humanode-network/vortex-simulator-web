import { useEffect, useState } from "react";

import { apiCourtRuntimeStatusV2 } from "@/lib/apiClient";
import type { CourtRuntimeStatusV2Dto } from "@/types/api";

type CourtRuntimeState =
  | { status: "checking" }
  | { status: "available"; policyVersion: string; policyHash: string }
  | { status: "unavailable"; reason: string };

export function useCourtRuntime(): CourtRuntimeState {
  const [state, setState] = useState<CourtRuntimeState>({ status: "checking" });

  useEffect(() => {
    let active = true;
    void apiCourtRuntimeStatusV2()
      .then((result: CourtRuntimeStatusV2Dto) => {
        if (!active) return;
        setState(result);
      })
      .catch(() => {
        if (!active) return;
        setState({
          status: "unavailable",
          reason:
            "The Courts v2 runtime has not been activated on this server.",
        });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
