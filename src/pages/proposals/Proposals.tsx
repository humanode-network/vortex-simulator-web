import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/primitives/button";
import { Card } from "@/components/primitives/card";
import { SearchBar } from "@/components/SearchBar";
import { PageHint } from "@/components/PageHint";
import { Surface } from "@/components/Surface";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { formatLoadError } from "@/lib/errorFormatting";
import {
  DEFAULT_PROPOSAL_LIST_FILTERS,
  filterProposalList,
  getProposalChamberFilterOptions,
  getProposalListFilterConfig,
  type ProposalListFilters,
} from "@/lib/proposalListUi";
import { apiProposals } from "@/lib/apiClient";
import type { ProposalListItemDto } from "@/types/api";
import { ProposalListCard } from "./list/ProposalListCard";
import { useProposalStageDetails } from "./list/useProposalStageDetails";

const Proposals: React.FC = () => {
  const [proposalData, setProposalData] = useState<
    ProposalListItemDto[] | null
  >(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProposalListFilters>(
    DEFAULT_PROPOSAL_LIST_FILTERS,
  );

  const detailPages = useProposalStageDetails(expanded, proposalData);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiProposals();
        if (!active) return;
        setProposalData(res.items);
        setLoadError(null);
      } catch (error) {
        if (!active) return;
        setProposalData([]);
        setLoadError((error as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filteredProposals = useMemo(() => {
    return filterProposalList(proposalData ?? [], search, filters);
  }, [proposalData, search, filters]);

  const chamberOptions = useMemo(() => {
    return getProposalChamberFilterOptions(proposalData ?? []);
  }, [proposalData]);
  const filtersConfig = useMemo(() => {
    return getProposalListFilterConfig(chamberOptions);
  }, [chamberOptions]);

  const toggleProposal = (id: string) => {
    setExpanded((current) => (current === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="proposals" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="rounded-full px-4"
        >
          <Link to="/app/proposals/drafts">Drafts</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button asChild size="sm" className="rounded-full px-4">
            <Link to="/app/proposals/new">Create proposal</Link>
          </Button>
        </div>
      </div>

      <SearchBar
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search proposals by title, hash, proposer…"
        ariaLabel="Search proposals"
        filtersConfig={filtersConfig}
        filtersState={filters}
        onFiltersChange={setFilters}
      />

      {proposalData === null ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          Loading proposals…
        </Surface>
      ) : null}
      {loadError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-destructive"
        >
          Proposals unavailable: {formatLoadError(loadError)}
        </Surface>
      ) : null}

      {proposalData !== null && proposalData.length === 0 && !loadError ? (
        <NoDataYetBar label="proposals" />
      ) : null}

      <section aria-live="polite" className="flex flex-col gap-4">
        {proposalData !== null &&
          proposalData.length > 0 &&
          filteredProposals.length === 0 && (
            <Card className="border-dashed px-5 py-6 text-center text-sm text-muted">
              No proposals match the current search.
            </Card>
          )}

        {filteredProposals.map((proposal) => (
          <ProposalListCard
            key={proposal.id}
            detailPages={detailPages}
            expanded={expanded === proposal.id}
            onToggle={() => toggleProposal(proposal.id)}
            proposal={proposal}
          />
        ))}
      </section>
    </div>
  );
};

export default Proposals;
