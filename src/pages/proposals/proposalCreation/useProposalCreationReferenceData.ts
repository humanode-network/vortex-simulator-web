import { useEffect, useMemo, useState } from "react";

import { apiChambers, apiInitiatives, apiMyGovernance } from "@/lib/apiClient";
import type { ChamberDto, InitiativeDto, TierProgressDto } from "@/types/api";
import { canManageInitiative } from "@/lib/initiativeUi";

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
  const [initiatives, setInitiatives] = useState<InitiativeDto[]>([]);

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
      setInitiatives([]);
      return;
    }
    let active = true;
    (async () => {
      const [governanceResult, initiativesResult] = await Promise.allSettled([
        apiMyGovernance(),
        apiInitiatives(),
      ]);
      if (!active) return;
      setTierProgress(
        governanceResult.status === "fulfilled"
          ? (governanceResult.value.tier ?? null)
          : null,
      );
      if (initiativesResult.status === "fulfilled") {
        setInitiatives(
          initiativesResult.value.items.filter(canManageInitiative),
        );
      } else {
        setInitiatives([]);
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

  const initiativeOptions = useMemo(() => {
    return [...initiatives]
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((initiative) => ({
        value: initiative.id,
        label: initiative.title,
      }));
  }, [initiatives]);

  return {
    chamberOptions,
    chambers,
    initiativeOptions,
    initiatives,
    tierProgress,
  };
}
