import { useEffect, useState } from "react";

import { apiPublicProposalDrafts } from "@/lib/apiClient";
import type { PublicProposalDraftListItemDto } from "@/types/api";

type PublicDraftFilters = {
  author?: string;
  initiative?: string;
};

export function usePublicDrafts(filters: PublicDraftFilters) {
  const [drafts, setDrafts] = useState<PublicProposalDraftListItemDto[]>([]);

  useEffect(() => {
    setDrafts([]);
    if (!filters.author && !filters.initiative) {
      return;
    }
    let active = true;
    const loadAll = async () => {
      const items: PublicProposalDraftListItemDto[] = [];
      let cursor: string | undefined;
      do {
        const response = await apiPublicProposalDrafts({
          ...filters,
          cursor,
          limit: 100,
        });
        items.push(...response.items);
        cursor = response.nextCursor;
      } while (cursor && active);
      if (active) setDrafts(items);
    };
    void loadAll().catch(() => {
      if (active) setDrafts([]);
    });
    return () => {
      active = false;
    };
  }, [filters.author, filters.initiative]);

  return drafts;
}
