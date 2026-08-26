import { GlassyTile } from "@/components/GlassySection";
import { Button } from "@/components/primitives/button";
import { Select } from "@/components/primitives/select";
import { formatLoadError } from "@/lib/errorFormatting";
import {
  GOVERNOR_OPPORTUNITY_STAGES,
  GOVERNOR_OPPORTUNITY_STATE_OPTIONS,
  isGovernorOpportunityStage,
  isGovernorOpportunityState,
} from "@/lib/governorOpportunityUi";
import type {
  GovernorOpportunityAccountingDto,
  GovernorOpportunityStageDto,
  GovernorOpportunityStateDto,
} from "@/types/api";
import { GovernorOpportunityRecord } from "./GovernorOpportunityRecord";

type GovernorOpportunityLedgerProps = {
  accounting: GovernorOpportunityAccountingDto;
  error: string | null;
  loading: boolean;
  onFilter: (
    stage: GovernorOpportunityStageDto | null,
    state: GovernorOpportunityStateDto | null,
  ) => void;
  onLoadMore: () => void;
};

export function GovernorOpportunityLedger({
  accounting,
  error,
  loading,
  onFilter,
  onLoadMore,
}: GovernorOpportunityLedgerProps) {
  const loaded = accounting.items.length;
  const hasMore = loaded < accounting.page.total;

  return (
    <details className="group">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2 text-sm text-text marker:content-none hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none">
        <span>Review opportunity history</span>
        <span className="text-xs font-medium text-muted group-open:hidden">
          {accounting.page.total} records
        </span>
        <span className="hidden text-xs font-medium text-muted group-open:inline">
          Close
        </span>
      </summary>

      <div className="mt-3 space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-muted">
            Stage
            <Select
              aria-label="Filter governing opportunities by stage"
              disabled={loading}
              value={accounting.page.stage ?? "all"}
              onChange={(event) =>
                onFilter(
                  isGovernorOpportunityStage(event.target.value)
                    ? event.target.value
                    : null,
                  accounting.page.state,
                )
              }
            >
              <option value="all">All stages</option>
              {GOVERNOR_OPPORTUNITY_STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1 text-xs font-medium text-muted">
            Outcome
            <Select
              aria-label="Filter governing opportunities by outcome"
              disabled={loading}
              value={accounting.page.state ?? "all"}
              onChange={(event) =>
                onFilter(
                  accounting.page.stage,
                  isGovernorOpportunityState(event.target.value)
                    ? event.target.value
                    : null,
                )
              }
            >
              <option value="all">All outcomes</option>
              {GOVERNOR_OPPORTUNITY_STATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {error ? (
          <p className="text-sm text-destructive">{formatLoadError(error)}</p>
        ) : null}

        {accounting.items.length === 0 ? (
          <GlassyTile className="px-4 py-3 text-sm text-muted">
            No opportunities match these filters.
          </GlassyTile>
        ) : (
          <div className="space-y-2">
            {accounting.items.map((item) => (
              <GovernorOpportunityRecord item={item} key={item.occurrenceId} />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <span>
            Showing {loaded} of {accounting.page.total}
          </span>
          {hasMore ? (
            <Button
              disabled={loading}
              onClick={onLoadMore}
              size="compact"
              variant="ghost"
            >
              {loading ? "Loading..." : "Load more"}
            </Button>
          ) : null}
        </div>
      </div>
    </details>
  );
}
