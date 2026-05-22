import { useCallback, useEffect, useState } from "react";

import { apiHuman, apiMyGovernance } from "@/lib/apiClient";
import type { GetMyGovernanceResponse, HumanNodeProfileDto } from "@/types/api";

export function useHumanNodePageData(profileId: string | undefined) {
  const [profile, setProfile] = useState<HumanNodeProfileDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewerGovernance, setViewerGovernance] =
    useState<GetMyGovernanceResponse | null>(null);

  const refreshProfile = useCallback(
    async (targetId = profileId) => {
      if (!targetId) return;
      const res = await apiHuman(targetId);
      setProfile(res);
      setLoadError(null);
    },
    [profileId],
  );

  const refreshViewerGovernance = useCallback(async () => {
    const res = await apiMyGovernance();
    setViewerGovernance(res);
  }, []);

  useEffect(() => {
    if (!profileId) return;
    let active = true;
    (async () => {
      try {
        const res = await apiHuman(profileId);
        if (!active) return;
        setProfile(res);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setProfile(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [profileId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiMyGovernance();
        if (!active) return;
        setViewerGovernance(res);
      } catch {
        if (!active) return;
        setViewerGovernance(null);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return {
    loadError,
    profile,
    refreshProfile,
    refreshViewerGovernance,
    viewerGovernance,
  };
}
