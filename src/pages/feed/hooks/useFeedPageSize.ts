import type { RefObject } from "react";
import { useEffect, useState } from "react";
import { FEED_MIN_PAGE_SIZE, FEED_MAX_PAGE_SIZE } from "@/lib/feedScopeRouting";

const FEED_CARD_ESTIMATE = 240;

export function useFeedPageSize(input: {
  address?: string | null;
  chamberFilters: string[] | null;
  feedListRef: RefObject<HTMLDivElement | null>;
  feedScope: string;
}) {
  const { address, chamberFilters, feedListRef, feedScope } = input;
  const [pageSize, setPageSize] = useState(FEED_MIN_PAGE_SIZE);

  useEffect(() => {
    const updatePageSize = () => {
      if (!feedListRef.current) return;
      const top = feedListRef.current.getBoundingClientRect().top;
      const available = window.innerHeight - top - 24;
      if (available <= 0) return;
      const estimate = Math.ceil(available / FEED_CARD_ESTIMATE) + 1;
      const clamped = Math.min(
        FEED_MAX_PAGE_SIZE,
        Math.max(FEED_MIN_PAGE_SIZE, estimate),
      );
      setPageSize(clamped);
    };
    updatePageSize();
    window.addEventListener("resize", updatePageSize);
    return () => window.removeEventListener("resize", updatePageSize);
  }, [address, chamberFilters, feedListRef, feedScope]);

  return pageSize;
}
