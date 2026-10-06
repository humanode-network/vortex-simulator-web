import { useLocation } from "react-router";
import { useAuth } from "./auth/AuthContext";
import { loadFeedViewer, loadUrgentFeed } from "@/lib/feedUrgent";
import { FEED_MAX_PAGE_SIZE } from "@/lib/feedScopeRouting";
import { usePolledResource } from "@/hooks/usePolledResource";

async function load(address: string) {
  const viewer = await loadFeedViewer(address, true);
  const urgent = await loadUrgentFeed({
    address,
    ...viewer,
    limit: FEED_MAX_PAGE_SIZE,
  });
  return { count: urgent.items.length, hasMore: urgent.hasMore };
}

export function useUrgentFeedBadge() {
  const auth = useAuth();
  const address = auth.authenticated ? auth.address : null;
  const { pathname } = useLocation();
  const { result } = usePolledResource({
    resourceKey: address,
    load,
    refreshKey: pathname,
    refreshOnFocus: true,
  });
  return result?.state === "ready" && result.data.count > 0
    ? {
        ...result.data,
        label: `${result.data.count}${result.data.hasMore ? "+" : ""}`,
      }
    : null;
}
