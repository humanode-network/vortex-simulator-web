import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/primitives/card";
import { SearchBar } from "@/components/SearchBar";
import { PageHint } from "@/components/PageHint";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { formatLoadError } from "@/lib/errorFormatting";
import {
  DEFAULT_HUMAN_NODES_FILTERS,
  filterHumanNodes,
  type HumanNodesFilters,
} from "@/lib/humanNodesUi";
import { HumanNodesResultsCard } from "./components/HumanNodesResultsCard";
import { useHumanNodesPageData } from "./hooks/useHumanNodesPageData";

const HumanNodes: React.FC = () => {
  const {
    chambersById,
    factionsById,
    formationProjectsById,
    loadError,
    nodes,
  } = useHumanNodesPageData();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<HumanNodesFilters>(
    DEFAULT_HUMAN_NODES_FILTERS,
  );
  const { sortBy } = filters;
  const [view, setView] = useState<"cards" | "list">("cards");
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      const mobile = mediaQuery.matches;
      setIsMobileViewport(mobile);
      if (mobile) setView("list");
    };
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  const filtered = useMemo(() => {
    return filterHumanNodes({
      chambersById,
      factionsById,
      filters,
      nodes,
      search,
    });
  }, [chambersById, factionsById, filters, nodes, search]);

  const effectiveView = isMobileViewport ? "list" : view;

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="human-nodes" />
      {nodes === null ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          Loading human nodes…
        </Card>
      ) : null}
      {loadError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-destructive">
          Human nodes unavailable: {formatLoadError(loadError)}
        </Card>
      ) : null}
      {nodes !== null && nodes.length === 0 && !loadError ? (
        <NoDataYetBar label="human nodes" />
      ) : null}
      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search human nodes by handle, chamber, focus…"
        ariaLabel="Search human nodes"
        filtersConfig={[
          {
            key: "sortBy",
            label: "Sort by",
            options: [
              { value: "acm-desc", label: "ACM (desc)" },
              { value: "acm-asc", label: "ACM (asc)" },
              { value: "tier", label: "Tier" },
              { value: "name", label: "Name" },
            ],
          },
          {
            key: "tierFilter",
            label: "Tier filter",
            options: [
              { value: "all", label: "All tiers" },
              { value: "nominee", label: "Nominee" },
              { value: "ecclesiast", label: "Ecclesiast" },
              { value: "legate", label: "Legate" },
              { value: "consul", label: "Consul" },
              { value: "citizen", label: "Citizen" },
            ],
          },
          {
            key: "statusFilter",
            label: "Status",
            options: [
              { value: "all", label: "All statuses" },
              { value: "governor", label: "Governor active" },
              { value: "human", label: "Human node active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
          {
            key: "cmRange",
            label: "ACM range",
            options: [
              { value: "all", label: "All ACM" },
              { value: "0-50", label: "0–50" },
              { value: "50-200", label: "50–200" },
              { value: "200+", label: "200+" },
            ],
          },
        ]}
        filtersState={filters}
        onFiltersChange={setFilters}
      />

      <HumanNodesResultsCard
        chambersById={chambersById}
        effectiveView={effectiveView}
        factionsById={factionsById}
        filtered={filtered}
        formationProjectsById={formationProjectsById}
        isMobileViewport={isMobileViewport}
        onSortByChange={(nextSortBy) =>
          setFilters((curr) => ({
            ...curr,
            sortBy: nextSortBy,
          }))
        }
        onViewChange={setView}
        sortBy={sortBy}
      />
    </div>
  );
};

export default HumanNodes;
