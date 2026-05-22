import { useCallback, useEffect, useState } from "react";

import { apiProposalTimeline } from "@/lib/apiClient";
import type { ProposalTimelineItemDto } from "@/types/api";

type UseProposalPageDataOptions<TPage> = {
  id?: string;
  loadPage: (id: string) => Promise<TPage>;
  pageErrorFallback: string;
};

export function useProposalPageData<TPage>({
  id,
  loadPage,
  pageErrorFallback,
}: UseProposalPageDataOptions<TPage>) {
  const [page, setPage] = useState<TPage | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<ProposalTimelineItemDto[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const reloadPage = useCallback(async () => {
    if (!id) return null;
    const nextPage = await loadPage(id);
    setPage(nextPage);
    setLoadError(null);
    return nextPage;
  }, [id, loadPage]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        const [pageResult, timelineResult] = await Promise.allSettled([
          loadPage(id),
          apiProposalTimeline(id),
        ]);
        if (!active) return;
        if (pageResult.status === "fulfilled") {
          setPage(pageResult.value);
          setLoadError(null);
        } else {
          setPage(null);
          setLoadError(pageResult.reason?.message ?? pageErrorFallback);
        }
        if (timelineResult.status === "fulfilled") {
          setTimeline(timelineResult.value.items);
          setTimelineError(null);
        } else {
          setTimeline([]);
          setTimelineError(
            timelineResult.reason?.message ?? "Failed to load timeline",
          );
        }
      } catch (error) {
        if (!active) return;
        setPage(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, loadPage, pageErrorFallback]);

  return {
    loadError,
    page,
    reloadPage,
    setPage,
    timeline,
    timelineError,
  };
}
