import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card } from "@/components/primitives/card";
import { Button } from "@/components/primitives/button";
import { SearchBar } from "@/components/SearchBar";
import { PageHint } from "@/components/PageHint";
import { SectionHeader } from "@/components/SectionHeader";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { apiProposalDrafts } from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import type { ProposalDraftListItemDto } from "@/types/api";
import { useAuth } from "@/app/auth/AuthContext";
import { OwnerDraftCard } from "./draft/OwnerDraftCard";
import { proposalDraftRoutes } from "./draft/draftUi";

const ProposalDrafts: React.FC = () => {
  const auth = useAuth();
  const [drafts, setDrafts] = useState<ProposalDraftListItemDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<{
    sortBy: "updated" | "chamber";
    chamberFilter: string;
  }>({ sortBy: "updated", chamberFilter: "any" });
  const { sortBy, chamberFilter } = filters;

  useEffect(() => {
    if (auth.enabled && auth.loading) {
      return;
    }
    if (auth.enabled && !auth.authenticated) {
      setDrafts(null);
      setLoadError(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await apiProposalDrafts();
        if (!active) return;
        setDrafts(res.items);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setDrafts([]);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, [auth.authenticated, auth.enabled, auth.loading]);

  const chambers = useMemo(
    () => Array.from(new Set((drafts ?? []).map((d) => d.chamber))),
    [drafts],
  );
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...(drafts ?? [])]
      .filter(
        (d) =>
          (term.length === 0 ||
            d.title.toLowerCase().includes(term) ||
            d.chamber.toLowerCase().includes(term) ||
            d.summary.toLowerCase().includes(term)) &&
          (chamberFilter === "any" ? true : d.chamber === chamberFilter),
      )
      .sort((a, b) => {
        if (sortBy === "chamber") return a.chamber.localeCompare(b.chamber);
        return b.updated.localeCompare(a.updated);
      });
  }, [drafts, query, sortBy, chamberFilter]);

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={proposalDraftRoutes.proposals}>Back to proposals</Link>
          </Button>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link to={proposalDraftRoutes.create}>New proposal</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeader>Drafts</SectionHeader>
        <SearchBar
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search drafts by title or chamber…"
          ariaLabel="Search drafts"
          className="max-w-md"
          filtersConfig={[
            {
              key: "chamberFilter",
              label: "Chamber",
              options: [
                { value: "any", label: "Any chamber" },
                ...chambers.map((c) => ({ value: c, label: c })),
              ],
            },
            {
              key: "sortBy",
              label: "Sort by",
              options: [
                { value: "updated", label: "Updated (newest)" },
                { value: "chamber", label: "Chamber (A–Z)" },
              ],
            },
          ]}
          filtersState={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {drafts === null ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
          {auth.enabled && auth.loading
            ? "Loading drafts…"
            : auth.enabled && !auth.authenticated
              ? "Connect a wallet to view your drafts."
              : "Loading drafts…"}
        </Card>
      ) : null}
      {loadError ? (
        <Card className="border-dashed px-4 py-6 text-center text-sm text-destructive">
          Drafts unavailable: {formatLoadError(loadError)}
        </Card>
      ) : null}
      {drafts !== null && drafts.length === 0 && !loadError ? (
        <NoDataYetBar label="drafts" />
      ) : null}
      {drafts !== null && drafts.length > 0 && filtered.length === 0 ? (
        <NoDataYetBar label="drafts matching these filters" />
      ) : null}

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        {filtered.map((draft) => (
          <OwnerDraftCard
            key={draft.id}
            draft={draft}
            onPublicationChanged={(publication) =>
              setDrafts(
                (current) =>
                  current?.map((item) =>
                    item.id === draft.id ? { ...item, publication } : item,
                  ) ?? null,
              )
            }
          />
        ))}
      </div>
    </div>
  );
};

export default ProposalDrafts;
