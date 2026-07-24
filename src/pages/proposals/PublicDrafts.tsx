import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHint } from "@/components/PageHint";
import { Button } from "@/components/primitives/button";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeader } from "@/components/SectionHeader";
import { Surface } from "@/components/Surface";
import { apiPublicProposalDrafts } from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import type { PublicProposalDraftListItemDto } from "@/types/api";
import { PublicDraftCard } from "./draft/PublicDraftCard";
import { proposalDraftRoutes, publicDraftKindOptions } from "./draft/draftUi";
import type {
  PublicProposalDraftKindDto,
  PublicProposalDraftSortDto,
} from "@/types/api";

type DirectoryFilters = {
  proposalPath: "" | PublicProposalDraftKindDto;
  sort: PublicProposalDraftSortDto;
};

const initialFilters: DirectoryFilters = {
  proposalPath: "",
  sort: "updated",
};

const publicDraftSortOptions = [
  { value: "updated", label: "Recently updated" },
  { value: "published", label: "Recently published" },
] satisfies Array<{ value: PublicProposalDraftSortDto; label: string }>;

const PUBLIC_DRAFT_PAGE_SIZE = 20;

const PublicDrafts: React.FC = () => {
  const [items, setItems] = useState<PublicProposalDraftListItemDto[] | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DirectoryFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<DirectoryFilters>(initialFilters);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const query = useMemo(
    () => ({
      q: search.trim() || undefined,
      proposalPath: appliedFilters.proposalPath || undefined,
      sort: appliedFilters.sort,
      limit: PUBLIC_DRAFT_PAGE_SIZE,
    }),
    [appliedFilters.proposalPath, appliedFilters.sort, search],
  );
  const queryKey = `${query.q ?? ""}|${query.proposalPath ?? ""}|${query.sort}`;
  const hasActiveQuery = Boolean(search.trim() || appliedFilters.proposalPath);
  const activeQueryKey = useRef(queryKey);
  activeQueryKey.current = queryKey;

  useEffect(() => {
    let active = true;
    setNextCursor(undefined);
    setLoadingMore(false);
    const timer = window.setTimeout(() => {
      setItems(null);
      void apiPublicProposalDrafts(query)
        .then((response) => {
          if (!active) return;
          setItems(response.items);
          setNextCursor(response.nextCursor);
          setLoadError(null);
        })
        .catch((error) => {
          if (!active) return;
          setItems([]);
          setNextCursor(undefined);
          setLoadError(formatLoadError(error, "Could not load public drafts."));
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    const requestedQueryKey = queryKey;
    setLoadingMore(true);
    try {
      const response = await apiPublicProposalDrafts({
        ...query,
        cursor: nextCursor,
      });
      if (activeQueryKey.current !== requestedQueryKey) return;
      setItems((current) => [...(current ?? []), ...response.items]);
      setNextCursor(response.nextCursor);
      setLoadError(null);
    } catch (error) {
      if (activeQueryKey.current !== requestedQueryKey) return;
      setLoadError(
        formatLoadError(
          error instanceof Error ? error.message : String(error),
          "Could not load more public drafts.",
        ),
      );
    } finally {
      if (activeQueryKey.current === requestedQueryKey) setLoadingMore(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={proposalDraftRoutes.proposals}>Proposals</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={proposalDraftRoutes.mine}>My drafts</Link>
          </Button>
        </div>
        <Button asChild size="sm">
          <Link to={proposalDraftRoutes.create}>Create proposal</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader>Public drafts</SectionHeader>
        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search public drafts…"
          ariaLabel="Search public drafts"
          className="max-w-md"
          filtersConfig={[
            {
              key: "proposalPath",
              label: "Proposal path",
              options: [
                { value: "", label: "All paths" },
                ...publicDraftKindOptions,
              ],
            },
            {
              key: "sort",
              label: "Order",
              options: publicDraftSortOptions,
            },
          ]}
          filtersState={filters}
          onFiltersChange={setFilters}
          onApplyFilters={() => setAppliedFilters(filters)}
        />
      </div>

      {items === null ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          className="px-5 py-4 text-sm text-muted"
        >
          Loading public drafts…
        </Surface>
      ) : null}
      {loadError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          className="px-5 py-4 text-sm text-destructive"
        >
          {loadError}
        </Surface>
      ) : null}
      {items !== null && items.length === 0 && !loadError ? (
        hasActiveQuery ? (
          <Surface
            variant="panelAlt"
            radius="2xl"
            className="px-5 py-4 text-sm text-muted"
          >
            No public drafts match these filters.
          </Surface>
        ) : (
          <NoDataYetBar label="public drafts" />
        )
      ) : null}
      <section className="flex flex-col gap-4" aria-live="polite">
        {(items ?? []).map((draft) => (
          <PublicDraftCard key={draft.id} draft={draft} />
        ))}
      </section>
      {nextCursor ? (
        <div className="flex justify-center">
          <Button
            size="sm"
            variant="outline"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default PublicDrafts;
