import { useCallback, useEffect, useState } from "react";

import {
  apiChambers,
  apiClock,
  apiCmMe,
  apiMyGovernance,
} from "@/lib/apiClient";
import type {
  ChamberDto,
  CmSummaryDto,
  GetClockResponse,
  GetMyGovernanceResponse,
} from "@/types/api";

export function useMyGovernancePageData() {
  const [gov, setGov] = useState<GetMyGovernanceResponse | null>(null);
  const [chambers, setChambers] = useState<ChamberDto[] | null>(null);
  const [clock, setClock] = useState<GetClockResponse | null>(null);
  const [cmSummary, setCmSummary] = useState<CmSummaryDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [delegationDrafts, setDelegationDrafts] = useState<
    Record<string, string>
  >({});

  const syncDelegationDrafts = useCallback(
    (nextGov: GetMyGovernanceResponse, options: { fillOnly: boolean }) => {
      setDelegationDrafts((current) => {
        const next = { ...current };
        for (const item of nextGov.delegation.chambers) {
          if (!options.fillOnly || next[item.chamberId] === undefined) {
            next[item.chamberId] = item.delegateeAddress ?? "";
          }
        }
        return next;
      });
    },
    [],
  );

  const refreshGovernance = useCallback(async () => {
    const fresh = await apiMyGovernance();
    setGov(fresh);
    syncDelegationDrafts(fresh, { fillOnly: false });
  }, [syncDelegationDrafts]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [govRes, chambersRes, clockRes] = await Promise.all([
          apiMyGovernance(),
          apiChambers(),
          apiClock().catch(() => null),
        ]);
        const cmRes = await apiCmMe().catch(() => null);
        if (!active) return;
        setGov(govRes);
        setChambers(chambersRes.items);
        setClock(clockRes);
        setCmSummary(cmRes);
        syncDelegationDrafts(govRes, { fillOnly: true });
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setGov(null);
        setChambers(null);
        setClock(null);
        setCmSummary(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [syncDelegationDrafts]);

  const updateDelegationDraft = useCallback(
    (chamberId: string, value: string) => {
      setDelegationDrafts((current) => ({
        ...current,
        [chamberId]: value,
      }));
    },
    [],
  );

  return {
    chambers,
    clock,
    cmSummary,
    delegationDrafts,
    gov,
    loadError,
    refreshGovernance,
    updateDelegationDraft,
  };
}
