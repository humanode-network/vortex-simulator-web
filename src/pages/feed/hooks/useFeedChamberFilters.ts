import { useEffect, useState } from "react";

import { loadFeedViewer } from "@/lib/feedUrgent";
import type { FeedScope } from "@/lib/feedScopeRouting";
import type { GovernorOpportunityAccountingDto } from "@/types/api";

export function useFeedChamberFilters(input: {
  address?: string | null;
  feedScope: FeedScope;
  onLoadError: (message: string) => void;
}) {
  const { address, feedScope, onLoadError } = input;
  const [chamberFilters, setChamberFilters] = useState<string[] | null>(null);
  const [chambersLoading, setChambersLoading] = useState(false);
  const [viewerGovernorActive, setViewerGovernorActive] = useState(false);
  const [governorOpportunities, setGovernorOpportunities] =
    useState<GovernorOpportunityAccountingDto | null>(null);

  useEffect(() => {
    let active = true;
    if (feedScope !== "chambers" && feedScope !== "urgent") {
      setChamberFilters(null);
      setChambersLoading(false);
      setGovernorOpportunities(null);
      return () => {
        active = false;
      };
    }
    if (!address) {
      setChamberFilters([]);
      setChambersLoading(false);
      setGovernorOpportunities(null);
      return () => {
        active = false;
      };
    }
    setChambersLoading(true);
    (async () => {
      try {
        const viewer = await loadFeedViewer(address, feedScope === "urgent");
        if (!active) return;
        setChamberFilters(viewer.chambers);
        setViewerGovernorActive(viewer.isGovernorActive);
        setGovernorOpportunities(viewer.governorOpportunities);
      } catch (error) {
        if (!active) return;
        setChamberFilters([]);
        setViewerGovernorActive(false);
        setGovernorOpportunities(null);
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
    governorOpportunities,
    viewerGovernorActive,
  };
}
