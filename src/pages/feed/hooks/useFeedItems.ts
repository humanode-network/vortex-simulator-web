import { useCallback, useEffect, useMemo, useState } from "react";

import { toTimestampMs } from "@/lib/dateTime";
import { feedItemKey, toLimitedUrgentItems } from "@/lib/feedUi";
import {
  buildFeedRequestForScope,
  buildUrgentFeedRequests,
  feedScopeRequiresChambers,
  feedScopeRequiresWallet,
} from "@/lib/feedScopeRouting";
import type { FeedScope } from "@/lib/feedScopeRouting";
import { apiFeed } from "@/lib/apiClient";
import type { FeedItemDto } from "@/types/api";
import { FEED_MAX_PAGE_SIZE, FEED_MIN_PAGE_SIZE } from "./useFeedPageSize";

const URGENT_STAGE_LIMIT = FEED_MAX_PAGE_SIZE * 2;

async function loadUrgentFeedItems(input: {
  address?: string;
  chambers: string[];
  limit: number;
  isGovernorActive: boolean;
}): Promise<FeedItemDto[]> {
  const responses = await Promise.all(
    buildUrgentFeedRequests({
      address: input.address,
      chamberFilters: input.chambers,
      baseLimit: input.limit,
      stageLimit: URGENT_STAGE_LIMIT,
      factionLimit: FEED_MIN_PAGE_SIZE,
    }).map((request) => apiFeed(request)),
  );

  return toLimitedUrgentItems(
    responses.flatMap((response) => response.items),
    input.isGovernorActive,
    input.address,
    input.limit,
  );
}

type UseFeedItemsInput = {
  address: string | null | undefined;
  chamberFilters: string[] | null;
  chambersLoading: boolean;
  feedScope: FeedScope;
  onLoadError: (message: string | null) => void;
  pageSize: number;
  viewerGovernorActive: boolean;
};

export function useFeedItems({
  address,
  chamberFilters,
  chambersLoading,
  feedScope,
  onLoadError,
  pageSize,
  viewerGovernorActive,
}: UseFeedItemsInput) {
  const [feedItems, setFeedItems] = useState<FeedItemDto[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let active = true;
    const loadFeed = async () => {
      if (feedScopeRequiresWallet(feedScope) && !address) {
        setFeedItems([]);
        onLoadError("Connect a wallet to view your feed.");
        setNextCursor(null);
        return;
      }
      if (feedScopeRequiresChambers(feedScope) && chambersLoading) return;
      if (
        feedScopeRequiresChambers(feedScope) &&
        chamberFilters &&
        chamberFilters.length === 0
      ) {
        setFeedItems([]);
        onLoadError(null);
        setNextCursor(null);
        return;
      }
      try {
        if (!active) return;
        if (feedScope === "urgent") {
          const urgentItems = await loadUrgentFeedItems({
            address: address ?? undefined,
            chambers: chamberFilters ?? [],
            limit: pageSize,
            isGovernorActive: viewerGovernorActive,
          });
          if (!active) return;
          setFeedItems(urgentItems);
          setNextCursor(null);
          onLoadError(null);
          return;
        }
        const res = await apiFeed(
          buildFeedRequestForScope({
            scope: feedScope,
            address: address ?? undefined,
            chamberFilters,
            limit: pageSize,
          }),
        );
        if (!active) return;
        setFeedItems(res.items);
        setNextCursor(res.nextCursor ?? null);
        onLoadError(null);
      } catch (error) {
        if (!active) return;
        setFeedItems([]);
        setNextCursor(null);
        onLoadError((error as Error).message);
      }
    };
    void loadFeed();
    return () => {
      active = false;
    };
  }, [
    address,
    chambersLoading,
    chamberFilters,
    feedScope,
    onLoadError,
    pageSize,
    viewerGovernorActive,
  ]);

  const sortedFeed = useMemo(() => {
    return [...(feedItems ?? [])].sort(
      (a, b) => toTimestampMs(b.timestamp, -1) - toTimestampMs(a.timestamp, -1),
    );
  }, [feedItems]);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await apiFeed(
        buildFeedRequestForScope({
          scope: feedScope === "urgent" ? "all" : feedScope,
          address: address ?? undefined,
          chamberFilters,
          cursor: nextCursor,
          limit: pageSize,
        }),
      );
      const items = res.items;
      setFeedItems((curr) => {
        const existing = new Set((curr ?? []).map(feedItemKey));
        const nextItems = items.filter(
          (item) => !existing.has(feedItemKey(item)),
        );
        return [...(curr ?? []), ...nextItems];
      });
      setNextCursor(res.nextCursor ?? null);
      onLoadError(null);
    } catch (error) {
      onLoadError((error as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }, [
    address,
    chamberFilters,
    feedScope,
    loadingMore,
    nextCursor,
    onLoadError,
    pageSize,
  ]);

  const dismissItem = useCallback((key: string) => {
    setFeedItems((curr) =>
      (curr ?? []).filter((entry) => feedItemKey(entry) !== key),
    );
  }, []);

  return {
    dismissItem,
    feedItems,
    handleLoadMore,
    loadingMore,
    nextCursor,
    sortedFeed,
  };
}
