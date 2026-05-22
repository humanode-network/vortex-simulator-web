import { useCallback, useEffect, useMemo, useState } from "react";

import { toTimestampMs } from "@/lib/dateTime";
import { feedItemKey, toUrgentItems } from "@/lib/feedUi";
import { apiFeed } from "@/lib/apiClient";
import type { FeedItemDto } from "@/types/api";
import type { FeedScope } from "../components/FeedControls";
import {
  FEED_MAX_PAGE_SIZE,
  FEED_MIN_PAGE_SIZE,
} from "./useFeedPageSize";

const URGENT_STAGE_LIMIT = FEED_MAX_PAGE_SIZE * 2;

async function loadUrgentFeedItems(input: {
  address?: string;
  chambers: string[];
  limit: number;
  isGovernorActive: boolean;
}): Promise<FeedItemDto[]> {
  const [base, pool, vote, build, invites, system] = await Promise.all([
    apiFeed({ chambers: input.chambers, limit: input.limit }),
    apiFeed({
      stage: "pool",
      chambers: input.chambers,
      limit: URGENT_STAGE_LIMIT,
    }),
    apiFeed({
      stage: "vote",
      chambers: input.chambers,
      limit: URGENT_STAGE_LIMIT,
    }),
    input.address
      ? apiFeed({
          stage: "build",
          actor: input.address,
          limit: URGENT_STAGE_LIMIT,
        })
      : Promise.resolve({ items: [] as FeedItemDto[] }),
    input.address
      ? apiFeed({
          actor: input.address,
          stage: "faction",
          limit: FEED_MIN_PAGE_SIZE,
        })
      : Promise.resolve({ items: [] as FeedItemDto[] }),
    input.address
      ? apiFeed({
          actor: input.address,
          stage: "system",
          limit: URGENT_STAGE_LIMIT,
        })
      : Promise.resolve({ items: [] as FeedItemDto[] }),
  ]);

  return toUrgentItems(
    [
      ...base.items,
      ...pool.items,
      ...vote.items,
      ...build.items,
      ...invites.items,
      ...system.items,
    ],
    input.isGovernorActive,
    input.address,
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
      if (feedScope !== "all" && !address) {
        setFeedItems([]);
        onLoadError("Connect a wallet to view your feed.");
        setNextCursor(null);
        return;
      }
      if (
        (feedScope === "chambers" || feedScope === "urgent") &&
        chambersLoading
      )
        return;
      if (
        (feedScope === "chambers" || feedScope === "urgent") &&
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
        const res = await apiFeed({
          actor: feedScope === "my" ? (address ?? undefined) : undefined,
          chambers:
            feedScope === "chambers" ? (chamberFilters ?? []) : undefined,
          limit: pageSize,
        });
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
      const res = await apiFeed({
        cursor: nextCursor,
        actor: feedScope === "my" ? (address ?? undefined) : undefined,
        chambers:
          feedScope === "chambers" || feedScope === "urgent"
            ? (chamberFilters ?? [])
            : undefined,
        limit: pageSize,
      });
      const items =
        feedScope === "urgent"
          ? toUrgentItems(res.items, viewerGovernorActive, address ?? undefined)
          : res.items;
      setFeedItems((curr) => {
        if (feedScope === "urgent") {
          return toUrgentItems(
            [...(curr ?? []), ...items],
            viewerGovernorActive,
            address ?? undefined,
          );
        }
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
    viewerGovernorActive,
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
