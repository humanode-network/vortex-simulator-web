import { useEffect, useState } from "react";

import { apiHuman, apiMyGovernance } from "@/lib/apiClient";
import type { FeedScope } from "@/lib/feedScopeRouting";

export function useFeedChamberFilters(input: {
  address?: string | null;
  feedScope: FeedScope;
  onLoadError: (message: string) => void;
}) {
  const { address, feedScope, onLoadError } = input;
  const [chamberFilters, setChamberFilters] = useState<string[] | null>(null);
  const [chambersLoading, setChambersLoading] = useState(false);
  const [viewerGovernorActive, setViewerGovernorActive] = useState(false);

  useEffect(() => {
    let active = true;
    if (feedScope !== "chambers" && feedScope !== "urgent") {
      setChamberFilters(null);
      setChambersLoading(false);
      return () => {
        active = false;
      };
    }
    if (!address) {
      setChamberFilters([]);
      setChambersLoading(false);
      return () => {
        active = false;
      };
    }
    setChambersLoading(true);
    (async () => {
      try {
        const [governance, profile] = await Promise.all([
          apiMyGovernance(),
          apiHuman(address),
        ]);
        if (!active) return;
        const chamberIds = governance.myChamberIds ?? [];
        const unique = Array.from(
          new Set(["general", ...chamberIds.map((id) => id.toLowerCase())]),
        );
        setChamberFilters(unique);
        setViewerGovernorActive(Boolean(profile.governorActive));
      } catch (error) {
        if (!active) return;
        setChamberFilters([]);
        setViewerGovernorActive(false);
        onLoadError((error as Error).message);
      } finally {
        if (active) setChambersLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [address, feedScope, onLoadError]);

  return {
    chamberFilters,
    chambersLoading,
    viewerGovernorActive,
  };
}
