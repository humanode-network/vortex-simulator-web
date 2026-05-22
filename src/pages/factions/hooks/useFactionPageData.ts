import { useCallback, useEffect, useState } from "react";

import { apiFaction, apiMe } from "@/lib/apiClient";
import type { FactionDto } from "@/types/api";

export function useFactionPageData(factionId: string | undefined) {
  const [faction, setFaction] = useState<FactionDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewerAddress, setViewerAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!factionId) return;
    setLoading(true);
    try {
      const [factionRes, meRes] = await Promise.all([
        apiFaction(factionId),
        apiMe(),
      ]);
      setFaction(factionRes);
      setViewerAddress(meRes.authenticated ? meRes.address : null);
      setLoadError(null);
    } catch (error) {
      setFaction(null);
      setViewerAddress(null);
      setLoadError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [factionId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    faction,
    loadError,
    loading,
    reload,
    viewerAddress,
  };
}
