import { useState } from "react";
import { Link } from "react-router";

import { AddressInline } from "@/components/AddressInline";
import { GlassyRecordCard } from "@/components/GlassyRecordCard";
import { Button } from "@/components/primitives/button";
import { StatTile } from "@/components/StatTile";
import { formatDateTime } from "@/lib/dateTime";
import type { PublicProposalDraftListItemDto } from "@/types/api";
import { publicDraftKindLabels, publicDraftRoute } from "./draftUi";

type PublicDraftCardProps = {
  draft: PublicProposalDraftListItemDto;
};

export function PublicDraftCard({ draft }: PublicDraftCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <GlassyRecordCard
      association={
        draft.initiative ? `Initiative · ${draft.initiative.title}` : undefined
      }
      dateText={formatDateTime(draft.updatedAt)}
      expanded={expanded}
      meta={draft.chamber}
      onToggle={() => setExpanded((current) => !current)}
      stage="draft"
      summary={draft.summary}
      title={draft.title}
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Path"
            value={publicDraftKindLabels[draft.proposalKind]}
          />
          <StatTile label="Public revision" value={String(draft.revision)} />
          <StatTile
            label="Author"
            value={
              <AddressInline
                address={draft.proposer}
                className="justify-center"
              />
            }
          />
        </div>
        <div className="flex justify-end">
          <Button asChild size="sm">
            <Link to={publicDraftRoute(draft.id)}>Read draft</Link>
          </Button>
        </div>
      </div>
    </GlassyRecordCard>
  );
}
