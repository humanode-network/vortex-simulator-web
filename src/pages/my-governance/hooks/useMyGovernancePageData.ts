import { useCallback, useEffect, useState } from "react";

import {
  apiChamber,
  apiChambers,
  apiClock,
  apiCmMe,
  apiMyGovernance,
} from "@/lib/apiClient";
import type {
  ChamberDto,
  ChamberGovernorDto,
  CmSummaryDto,
  DelegationGovernanceItemDto,
  GetClockResponse,
  GetMyGovernanceResponse,
} from "@/types/api";

type DelegationGovernorMap = Record<string, ChamberGovernorDto[]>;

async function loadDelegationGovernorMap(
  delegationChambers: DelegationGovernanceItemDto[],
): Promise<DelegationGovernorMap> {
  const results = await Promise.allSettled(
    delegationChambers.map(async (item) => ({
      chamberId: item.chamberId,
      detail: await apiChamber(item.chamberId),
    })),
  );

  const next: DelegationGovernorMap = {};
  for (const result of results) {
    if (result.status === "fulfilled") {
      next[result.value.chamberId] = result.value.detail.governors;
    }
  }
  return next;
}

export function useMyGovernancePageData() {
  const [gov, setGov] = useState<GetMyGovernanceResponse | null>(null);
  const [chambers, setChambers] = useState<ChamberDto[] | null>(null);
  const [delegationGovernorsByChamber, setDelegationGovernorsByChamber] =
    useState<DelegationGovernorMap>({});
  const [clock, setClock] = useState<GetClockResponse | null>(null);
  const [cmSummary, setCmSummary] = useState<CmSummaryDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshGovernance = useCallback(async () => {
    const fresh = await apiMyGovernance();
    const governorMap = await loadDelegationGovernorMap(
      fresh.delegation.chambers,
    );
    setGov(fresh);
    setDelegationGovernorsByChamber(governorMap);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const govRes = await apiMyGovernance();
        const [chambersRes, clockRes, cmRes, governorMap] = await Promise.all([
          apiChambers(),
          apiClock().catch(() => null),
          apiCmMe().catch(() => null),
          loadDelegationGovernorMap(govRes.delegation.chambers),
        ]);
        if (!active) return;
        setGov(govRes);
        setChambers(chambersRes.items);
        setDelegationGovernorsByChamber(governorMap);
        setClock(clockRes);
        setCmSummary(cmRes);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setGov(null);
        setChambers(null);
        setDelegationGovernorsByChamber({});
        setClock(null);
        setCmSummary(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return {
    chambers,
    clock,
    cmSummary,
    delegationGovernorsByChamber,
    gov,
    loadError,
    refreshGovernance,
  };
}
