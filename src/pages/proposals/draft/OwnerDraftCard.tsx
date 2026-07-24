import { Link } from "react-router";

import { Chip } from "@/components/Chip";
import { GlassyCard } from "@/components/GlassyCard";
import { Button } from "@/components/primitives/button";
import { formatDateTime } from "@/lib/dateTime";
import { proposalSummaryPreview } from "@/lib/textPreview";
import type {
  DraftPublicationSummaryDto,
  ProposalDraftListItemDto,
} from "@/types/api";
import { DraftPublicationActions } from "./DraftPublicationActions";
import { editDraftRoute, ownerDraftRoute } from "./draftUi";

type OwnerDraftCardProps = {
  draft: ProposalDraftListItemDto;
  onPublicationChanged: (publication: DraftPublicationSummaryDto) => void;
};

export function OwnerDraftCard({
  draft,
  onPublicationChanged,
}: OwnerDraftCardProps) {
  const detailUrl = ownerDraftRoute(draft.id);
  const editUrl = editDraftRoute(draft.id);

  return (
    <GlassyCard as="article" className="flex h-full min-h-64 flex-col p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <Chip className="min-h-7 max-w-[65%] bg-[var(--control-glass-bg)] text-muted [&>span]:whitespace-normal">
          {draft.chamber}
        </Chip>
        <DraftPublicationActions
          variant="visibility-toggle"
          draftId={draft.id}
          publication={draft.publication}
          onChanged={onPublicationChanged}
        />
      </div>

      <div className="mt-5 min-w-0 flex-1">
        <Link
          to={detailUrl}
          className="text-xl leading-tight font-semibold text-text transition-colors hover:text-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
        >
          {draft.title}
        </Link>
        <p className="mt-3 text-sm leading-6 text-muted">
          {proposalSummaryPreview(draft.summary, 150)}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-[color:var(--surface-glass-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-muted">
          Updated {formatDateTime(draft.updated)}
        </span>
        <div className="flex items-center justify-end gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link to={detailUrl}>Open draft</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={editUrl}>Continue editing</Link>
          </Button>
        </div>
      </div>
    </GlassyCard>
  );
}
