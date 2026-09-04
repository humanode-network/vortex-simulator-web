import { Link } from "react-router";

import { Button } from "@/components/primitives/button";
import type { DraftPublicationSummaryDto } from "@/types/api";
import { CopyLinkButton } from "./CopyLinkButton";
import { isPublicDraftVisible } from "./draftUi";
import { useDraftPublicationActions } from "./useDraftPublicationActions";

type DraftPublicationActionsProps = {
  draftId: string;
  publication: DraftPublicationSummaryDto;
  onChanged?: (publication: DraftPublicationSummaryDto) => void;
  variant?: "actions" | "visibility-toggle";
};

export function DraftPublicationActions({
  draftId,
  publication,
  onChanged,
  variant = "actions",
}: DraftPublicationActionsProps) {
  const {
    canPublish,
    error,
    pending,
    publicUrl,
    publish,
    reportError,
    unpublish,
  } = useDraftPublicationActions({ draftId, publication, onChanged });

  if (variant === "visibility-toggle") {
    const isPublic = publication.status === "published";
    const submitted = publication.status === "submitted";
    const label = submitted
      ? "Submitted"
      : pending
        ? isPublic
          ? "Making private"
          : "Publishing"
        : isPublic
          ? "Public"
          : "Private";
    return (
      <div className="flex min-w-0 flex-col items-end gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={isPublic ? "primary" : "outline"}
          aria-label={
            submitted
              ? "Submitted draft"
              : isPublic
                ? "Make draft private"
                : "Make draft public"
          }
          aria-pressed={isPublic}
          disabled={submitted || pending !== null}
          title={
            submitted
              ? "Submitted drafts cannot change visibility"
              : isPublic
                ? "Public draft. Select to make it private."
                : "Private draft. Select to publish it."
          }
          className="min-w-24"
          onClick={() => void (isPublic ? unpublish() : publish())}
        >
          {label}
        </Button>
        {publication.hasUnpublishedChanges && isPublic ? (
          <span className="text-[0.68rem] text-muted">
            Saved edits are private
          </span>
        ) : null}
        {error ? (
          <p className="max-w-52 text-right text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {canPublish ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending !== null}
            onClick={() => void publish()}
          >
            {pending === "publish"
              ? "Publishing"
              : publication.status === "published"
                ? "Update public draft"
                : "Publish draft"}
          </Button>
        ) : null}
        {isPublicDraftVisible(publication) ? (
          <>
            <Button asChild type="button" size="sm" variant="ghost">
              <Link to={publicUrl}>
                {publication.status === "submitted"
                  ? "View Draft history"
                  : "View public draft"}
              </Link>
            </Button>
            <CopyLinkButton value={publicUrl} onError={reportError} />
          </>
        ) : null}
        {publication.status === "published" ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending !== null}
            onClick={() => void unpublish()}
          >
            {pending === "unpublish" ? "Unpublishing" : "Unpublish"}
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="max-w-md text-right text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
