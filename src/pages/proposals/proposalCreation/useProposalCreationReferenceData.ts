import { useEffect, useMemo, useState } from "react";

import { apiChambers, apiMyGovernance } from "@/lib/apiClient";
import type { ChamberDto, TierProgressDto } from "@/types/api";

type UseProposalCreationReferenceDataInput = {
  authEnabled: boolean;
  authenticated: boolean;
};

export function useProposalCreationReferenceData({
  authEnabled,
  authenticated,
}: UseProposalCreationReferenceDataInput) {
  const [chambers, setChambers] = useState<ChamberDto[]>([]);
  const [tierProgress, setTierProgress] = useState<TierProgressDto | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiChambers();
        if (!active) return;
        setChambers(res.items);
      } catch {
        if (!active) return;
        setChambers([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authEnabled || !authenticated) {
      setTierProgress(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await apiMyGovernance();
        if (!active) return;
        setTierProgress(res.tier ?? null);
      } catch {
        if (!active) return;
        setTierProgress(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [authenticated, authEnabled]);

  const chamberOptions = useMemo(() => {
    return [...chambers]
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((chamber) => ({ value: chamber.id, label: chamber.name }));
  }, [chambers]);

  return {
    chamberOptions,
    chambers,
    tierProgress,
  };
}
