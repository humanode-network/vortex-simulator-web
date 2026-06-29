import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { useAuth } from "@/app/auth/AuthContext";
import { GlassyCard } from "@/components/GlassyCard";
import { GlassyMetricTile } from "@/components/GlassySection";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/primitives/button";
import { apiInitiatives } from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import { initiativeStatusLabel } from "@/lib/initiativeUi";
import type { InitiativeDto, InitiativeStatusDto } from "@/types/api";
import { InitiativeCard } from "./components/InitiativeCard";

type InitiativeFilters = {
  status: "any" | InitiativeStatusDto;
  sortBy: "updated" | "members" | "threads";
};

const defaultFilters: InitiativeFilters = {
  status: "any",
  sortBy: "updated",
};

const Initiatives: React.FC = () => {
  const auth = useAuth();
  const [initiatives, setInitiatives] = useState<InitiativeDto[] | null>(null);
  const [serverTotals, setServerTotals] = useState<{
    active: number;
    paused: number;
    archived: number;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<InitiativeFilters>(defaultFilters);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const initiativeRes = await apiInitiatives();
        if (!active) return;
        setInitiatives(initiativeRes.items);
        setServerTotals(initiativeRes.totals ?? null);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setInitiatives([]);
        setServerTotals(null);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    const list = initiatives ?? [];
    return {
      active:
        serverTotals?.active ??
        list.filter((initiative) => initiative.status === "active").length,
      paused:
        serverTotals?.paused ??
        list.filter((initiative) => initiative.status === "paused").length,
      archived:
        serverTotals?.archived ??
        list.filter((initiative) => initiative.status === "archived").length,
      members: list.reduce(
        (sum, initiative) => sum + initiative.memberCount,
        0,
      ),
    };
  }, [initiatives, serverTotals]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...(initiatives ?? [])]
      .filter((initiative) => {
        const matchesTerm =
          term.length === 0 ||
          initiative.title.toLowerCase().includes(term) ||
          initiative.summary.toLowerCase().includes(term) ||
          initiative.description.toLowerCase().includes(term) ||
          initiative.tags.some((tag) => tag.toLowerCase().includes(term));
        const matchesStatus =
          filters.status === "any" || initiative.status === filters.status;
        return matchesTerm && matchesStatus;
      })
      .sort((a, b) => {
        if (filters.sortBy === "members") return b.memberCount - a.memberCount;
        if (filters.sortBy === "threads") {
          return (
            (b.threadCount ?? b.threads?.length ?? 0) -
            (a.threadCount ?? a.threads?.length ?? 0)
          );
        }
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  }, [filters.sortBy, filters.status, initiatives, query]);

  const canCreate = auth.authenticated && auth.eligible;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        {canCreate ? (
          <Button asChild>
            <Link to="/app/initiatives/new">Create initiative</Link>
          </Button>
        ) : null}
      </div>

      {initiatives === null ? (
        <GlassyCard className="px-4 py-6 text-center text-sm text-muted">
          Loading initiatives...
        </GlassyCard>
      ) : null}

      {loadError ? (
        <GlassyCard className="px-4 py-6 text-center text-sm text-destructive">
          Initiatives unavailable: {formatLoadError(loadError)}
        </GlassyCard>
      ) : null}

      {initiatives !== null && initiatives.length === 0 && !loadError ? (
        <NoDataYetBar
          label="initiatives"
          description="Active Human Nodes can create the first public coordination workspace."
        />
      ) : null}

      {initiatives !== null && initiatives.length > 0 ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <GlassyMetricTile label="Active" value={totals.active} />
            <GlassyMetricTile label="Paused" value={totals.paused} />
            <GlassyMetricTile label="Archived" value={totals.archived} />
            <GlassyMetricTile label="Memberships" value={totals.members} />
          </section>

          <SearchBar
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search initiatives by title, summary, or tag..."
            ariaLabel="Search initiatives"
            filtersConfig={[
              {
                key: "status",
                label: "Status",
                options: [
                  { value: "any", label: "Any status" },
                  { value: "active", label: initiativeStatusLabel.active },
                  { value: "paused", label: initiativeStatusLabel.paused },
                  { value: "archived", label: initiativeStatusLabel.archived },
                ],
              },
              {
                key: "sortBy",
                label: "Sort by",
                options: [
                  { value: "updated", label: "Recently updated" },
                  { value: "members", label: "Members" },
                  { value: "threads", label: "Threads" },
                ],
              },
            ]}
            filtersState={filters}
            onFiltersChange={setFilters}
          />

          <section className="grid gap-5 lg:grid-cols-2" aria-live="polite">
            {filtered.length === 0 ? (
              <GlassyCard className="px-4 py-6 text-center text-sm text-muted lg:col-span-2">
                No initiatives match this filter set.
              </GlassyCard>
            ) : (
              filtered.map((initiative) => (
                <InitiativeCard key={initiative.id} initiative={initiative} />
              ))
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};

export default Initiatives;
