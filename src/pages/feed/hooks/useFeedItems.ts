import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toTimestampMs } from "@/lib/dateTime";
import { feedItemKey } from "@/lib/feedUi";
import { loadUrgentFeed, type UrgentFeedContinuation } from "@/lib/feedUrgent";
import {
  buildFeedRequestForScope,
  feedScopeRequiresChambers,
  feedScopeRequiresWallet,
} from "@/lib/feedScopeRouting";
import type { FeedScope } from "@/lib/feedScopeRouting";
import { apiFeed } from "@/lib/apiClient";
import type {
  FeedItemDto,
  GovernorOpportunityAccountingDto,
} from "@/types/api";

type UseFeedItemsInput = {
  address: string | null | undefined;
  chamberFilters: string[] | null;
  chambersLoading: boolean;
  feedScope: FeedScope;
  governorOpportunities: GovernorOpportunityAccountingDto | null;
  onLoadError: (message: string | null) => void;
  pageSize: number;
  viewerGovernorActive: boolean;
};

export function useFeedItems({
  address,
  chamberFilters,
  chambersLoading,
  feedScope,
  governorOpportunities,
  onLoadError,
  pageSize,
  viewerGovernorActive,
}: UseFeedItemsInput) {
  const [feedItems, setFeedItems] = useState<FeedItemDto[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [urgentContinuation, setUrgentContinuation] =
    useState<UrgentFeedContinuation | null>(null);
  const generation = useRef(0);
  const pendingLoadMore = useRef(false);
  const urgentLimit = useRef(pageSize);

  useEffect(() => {
    const request = ++generation.current;
    const current = () => request === generation.current;
    pendingLoadMore.current = false;
    setLoadingMore(false);
    setUrgentContinuation(null);
    setNextCursor(null);
    setFeedItems(null);
    urgentLimit.current = pageSize;
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
        setNextCursor(null);
        return;
      }
      try {
        if (!current()) return;
        if (feedScope === "urgent") {
          const urgent = await loadUrgentFeed({
            address: address ?? undefined,
            chambers: chamberFilters ?? [],
            limit: pageSize,
            isGovernorActive: viewerGovernorActive,
            governorOpportunities,
          });
          if (!current()) return;
          setFeedItems(urgent.items);
          setUrgentContinuation(urgent.continuation);
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
        if (!current()) return;
        setFeedItems(res.items);
        setNextCursor(res.nextCursor ?? null);
        onLoadError(null);
      } catch (error) {
        if (!current()) return;
        setFeedItems([]);
        setNextCursor(null);
        onLoadError((error as Error).message);
      }
    };
    void loadFeed();
    return () => {
      generation.current++;
    };
  }, [
    address,
    chambersLoading,
    chamberFilters,
    feedScope,
    governorOpportunities,
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
    if (
      pendingLoadMore.current ||
      (feedScope === "urgent" ? !urgentContinuation : !nextCursor)
    )
      return;
    pendingLoadMore.current = true;
    const request = generation.current;
    const current = () => request === generation.current;
    setLoadingMore(true);
    try {
      if (feedScope === "urgent") {
        const limit = urgentLimit.current + pageSize;
        const urgent = await loadUrgentFeed({
          address: address ?? undefined,
          chambers: chamberFilters ?? [],
          limit,
          isGovernorActive: viewerGovernorActive,
          governorOpportunities,
          continuation: urgentContinuation!,
        });
        if (!current()) return;
        urgentLimit.current = limit;
        setFeedItems(urgent.items);
        setUrgentContinuation(urgent.continuation);
        onLoadError(null);
        return;
      }
      const res = await apiFeed(
        buildFeedRequestForScope({
          scope: feedScope,
          address: address ?? undefined,
          chamberFilters,
          cursor: nextCursor,
          limit: pageSize,
        }),
      );
      if (!current()) return;
      if (res.nextCursor === nextCursor) {
        throw new Error("The feed could not advance. Please try again.");
      }
      const items = res.items;
      setFeedItems((curr) => {
        const existing = new Set((curr ?? []).map(feedItemKey));
        const nextItems = items.filter((item) => {
          const key = feedItemKey(item);
          if (existing.has(key)) return false;
          existing.add(key);
          return true;
        });
        return [...(curr ?? []), ...nextItems];
      });
      setNextCursor(res.nextCursor ?? null);
      onLoadError(null);
    } catch (error) {
      if (current()) onLoadError((error as Error).message);
    } finally {
      if (current()) {
        pendingLoadMore.current = false;
        setLoadingMore(false);
      }
    }
  }, [
    address,
    chamberFilters,
    feedScope,
    urgentContinuation,
    viewerGovernorActive,
    governorOpportunities,
    nextCursor,
    onLoadError,
    pageSize,
  ]);

  const dismissItem = useCallback((key: string) => {
    setFeedItems((curr) =>
      (curr ?? []).filter((entry) => feedItemKey(entry) !== key),
    );
    setUrgentContinuation((current) =>
      current
        ? {
            ...current,
            events: current.events.filter(
              (entry) => feedItemKey(entry) !== key,
            ),
          }
        : null,
    );
  }, []);

  return {
    dismissItem,
    feedItems,
    handleLoadMore,
    loadingMore,
    hasMore:
      feedScope === "urgent"
        ? urgentContinuation !== null
        : Boolean(nextCursor),
    sortedFeed,
  };
}
