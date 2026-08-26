import { Link } from "react-router";

import {
  GlassyKeyValue,
  GlassyStatusChip,
  GlassyTile,
  GlassyTileHeading,
} from "@/components/GlassySection";
import { formatDateTime } from "@/lib/dateTime";
import {
  formatGovernorOpportunityStage,
  getGovernorOpportunityStateCopy,
} from "@/lib/governorOpportunityUi";
import { getProposalHrefForStage } from "@/lib/proposalListUi";
import type { GovernorOpportunityItemDto } from "@/types/api";

export function GovernorOpportunityRecord({
  item,
}: {
  item: GovernorOpportunityItemDto;
}) {
  const state = getGovernorOpportunityStateCopy(item);

  return (
    <GlassyTile className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <GlassyTileHeading>
              <Link
                className="break-words hover:text-primary hover:underline"
                to={getProposalHrefForStage(
                  item.proposalId,
                  item.proposalStage,
                )}
              >
                {item.proposalTitle}
              </Link>
            </GlassyTileHeading>
            <p className="mt-1 text-xs text-muted">
              {formatGovernorOpportunityStage(item.stage)} / {item.chamberTitle}
            </p>
          </div>
          <GlassyStatusChip tone={state.tone}>{state.label}</GlassyStatusChip>
        </div>
        <p className="text-sm leading-6 text-muted">{state.detail}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <GlassyKeyValue
            label="Opened"
            value={formatDateTime(item.openedAt)}
          />
          <GlassyKeyValue
            label="Exposure reached"
            value={formatDateTime(item.accountableAt)}
          />
          {item.closedAt ? (
            <GlassyKeyValue
              label="Closed"
              value={formatDateTime(item.closedAt)}
            />
          ) : null}
        </div>
      </div>
    </GlassyTile>
  );
}
