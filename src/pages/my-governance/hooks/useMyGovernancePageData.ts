import { useCallback, useEffect, useRef, useState } from "react";

import {
  apiChamber,
  apiChambers,
  apiClock,
  apiCmMe,
  apiMyGovernance,
} from "@/lib/apiClient";
import { mergeGovernorOpportunityPages } from "@/lib/governorOpportunityUi";
import type {
  ChamberDto,
  ChamberGovernorDto,
  CmSummaryDto,
  DelegationGovernanceItemDto,
  GetClockResponse,
  GetMyGovernanceResponse,
  GovernorOpportunityStageDto,
  GovernorOpportunityStateDto,
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
  const [opportunityLoading, setOpportunityLoading] = useState(false);
  const [opportunityError, setOpportunityError] = useState<string | null>(null);
  const governanceRequestRef = useRef(0);
  const governanceResponseRef = useRef(0);
  const opportunityRequestRef = useRef(0);

  const loadOpportunityPage = useCallback(
    async (input: {
      offset: number;
      stage: GovernorOpportunityStageDto | null;
      state: GovernorOpportunityStateDto | null;
      append: boolean;
    }) => {
      const requestId = ++opportunityRequestRef.current;
      const responseId = ++governanceResponseRef.current;
      setOpportunityLoading(true);
      setOpportunityError(null);
      try {
        const fresh = await apiMyGovernance({
          opportunityOffset: input.offset,
          opportunityStage: input.stage,
          opportunityState: input.state,
        });
        if (
          requestId !== opportunityRequestRef.current ||
          responseId !== governanceResponseRef.current
        )
          return;
        setGov((current) => {
          if (
            !input.append ||
            !current?.opportunityAccounting ||
            !fresh.opportunityAccounting
          ) {
            return fresh;
          }
          return {
            ...fresh,
            opportunityAccounting: mergeGovernorOpportunityPages(
              current.opportunityAccounting,
              fresh.opportunityAccounting,
            ),
          };
        });
      } catch (error) {
        if (requestId !== opportunityRequestRef.current) return;
        setOpportunityError((error as Error).message);
      } finally {
        if (requestId === opportunityRequestRef.current)
          setOpportunityLoading(false);
      }
    },
    [],
  );

  const filterOpportunities = useCallback(
    async (
      stage: GovernorOpportunityStageDto | null,
      state: GovernorOpportunityStateDto | null,
    ) => {
      await loadOpportunityPage({ offset: 0, stage, state, append: false });
    },
    [loadOpportunityPage],
  );

  const loadMoreOpportunities = useCallback(async () => {
    const page = gov?.opportunityAccounting?.page;
    const loaded = gov?.opportunityAccounting?.items.length ?? 0;
    if (!page || loaded >= page.total) return;
    await loadOpportunityPage({
      offset: loaded,
      stage: page.stage,
      state: page.state,
      append: true,
    });
  }, [gov, loadOpportunityPage]);

  const refreshGovernance = useCallback(async () => {
    opportunityRequestRef.current += 1;
    const requestId = ++governanceRequestRef.current;
    const responseId = ++governanceResponseRef.current;
    setOpportunityLoading(false);
    setOpportunityError(null);
    const fresh = await apiMyGovernance();
    const governorMap = await loadDelegationGovernorMap(
      fresh.delegation.chambers,
    );
    if (requestId !== governanceRequestRef.current) return;
    if (responseId === governanceResponseRef.current) setGov(fresh);
    setDelegationGovernorsByChamber(governorMap);
  }, []);

  useEffect(() => {
    let active = true;
    const requestId = ++governanceRequestRef.current;
    const responseId = ++governanceResponseRef.current;
    (async () => {
      try {
        const govRes = await apiMyGovernance();
        const [chambersRes, clockRes, cmRes, governorMap] = await Promise.all([
          apiChambers(),
          apiClock().catch(() => null),
          apiCmMe().catch(() => null),
          loadDelegationGovernorMap(govRes.delegation.chambers),
        ]);
        if (!active || requestId !== governanceRequestRef.current) return;
        if (responseId === governanceResponseRef.current) setGov(govRes);
        setChambers(chambersRes.items);
        setDelegationGovernorsByChamber(governorMap);
        setClock(clockRes);
        setCmSummary(cmRes);
        setLoadError(null);
      } catch (error) {
        if (!active || requestId !== governanceRequestRef.current) return;
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
    opportunityError,
    opportunityLoading,
    filterOpportunities,
    loadMoreOpportunities,
    refreshGovernance,
  };
}
