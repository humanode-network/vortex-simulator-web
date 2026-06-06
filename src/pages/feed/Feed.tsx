import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/app/auth/AuthContext";
import { PageHint } from "@/components/PageHint";
import { factionIdFromHref, feedItemKey } from "@/lib/feedUi";
import {
  apiFactionCofounderInviteAccept,
  apiFactionCofounderInviteDecline,
} from "@/lib/apiClient";
import type { FeedItemDto } from "@/types/api";
import { FeedControls, type FeedScope } from "./components/FeedControls";
import { FeedListSection } from "./components/FeedListSection";
import { FeedStatusMessages } from "./components/FeedStatusMessages";
import { useFeedChamberFilters } from "./hooks/useFeedChamberFilters";
import { useFeedDetailPages } from "./hooks/useFeedDetailPages";
import { useFeedItems } from "./hooks/useFeedItems";
import { useFeedPageSize } from "./hooks/useFeedPageSize";
import "./Feed.css";

const Feed: React.FC = () => {
  const auth = useAuth();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedScope, setFeedScope] = useState<FeedScope>("urgent");
  const feedListRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { chamberFilters, chambersLoading, viewerGovernorActive } =
    useFeedChamberFilters({
      address: auth.address,
      feedScope,
      onLoadError: setLoadError,
    });
  const pageSize = useFeedPageSize({
    address: auth.address,
    chamberFilters,
    feedListRef,
    feedScope,
  });

  const {
    dismissItem,
    feedItems,
    handleLoadMore,
    loadingMore,
    nextCursor,
    sortedFeed,
  } = useFeedItems({
    address: auth.address,
    chamberFilters,
    chambersLoading,
    feedScope,
    onLoadError: setLoadError,
    pageSize,
    viewerGovernorActive,
  });
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [inviteActionKey, setInviteActionKey] = useState<string | null>(null);

  const toggle = (key: string) => {
    setExpandedKey((curr) => (curr === key ? null : key));
  };
  const {
    chamberPagesById,
    chamberVetoPagesById,
    citizenVetoPagesById,
    finishedPagesById,
    formationPagesById,
    poolPagesById,
  } = useFeedDetailPages({ expandedKey, feedItems });

  const handleInviteAction = useCallback(
    async (item: FeedItemDto, action: "accept" | "decline") => {
      const factionId = factionIdFromHref(item.href);
      if (!factionId) return;
      const key = feedItemKey(item);
      setInviteActionKey(key);
      try {
        if (action === "accept") {
          await apiFactionCofounderInviteAccept({ factionId });
        } else {
          await apiFactionCofounderInviteDecline({ factionId });
        }
        dismissItem(key);
      } catch (error) {
        setLoadError((error as Error).message);
      } finally {
        setInviteActionKey(null);
      }
    },
    [dismissItem, setLoadError],
  );

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void handleLoadMore();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [handleLoadMore, nextCursor]);

  return (
    <div className="feed-page">
      <PageHint pageId="feed" />

      <FeedControls feedScope={feedScope} onFeedScopeChange={setFeedScope} />

      <FeedStatusMessages feedItems={feedItems} loadError={loadError} />

      <FeedListSection
        chamberPagesById={chamberPagesById}
        chamberVetoPagesById={chamberVetoPagesById}
        citizenVetoPagesById={citizenVetoPagesById}
        expandedKey={expandedKey}
        feedListRef={feedListRef}
        finishedPagesById={finishedPagesById}
        formationPagesById={formationPagesById}
        inviteActionKey={inviteActionKey}
        onInviteAccept={(item) => void handleInviteAction(item, "accept")}
        onInviteDecline={(item) => void handleInviteAction(item, "decline")}
        onToggle={toggle}
        poolPagesById={poolPagesById}
        sortedFeed={sortedFeed}
      />

      {nextCursor ? (
        <div className="flex w-full justify-center">
          <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />
        </div>
      ) : null}
      {loadingMore ? (
        <p className="text-center text-xs tracking-[0.2em] text-muted uppercase">
          Loading more…
        </p>
      ) : null}
    </div>
  );
};

export default Feed;
