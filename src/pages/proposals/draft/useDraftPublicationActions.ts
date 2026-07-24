import { useEffect, useRef, useState } from "react";

import {
  apiProposalDraftPublish,
  apiProposalDraftUnpublish,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import type { DraftPublicationSummaryDto } from "@/types/api";
import { canPublishDraft, publicationRoute } from "./draftUi";

type PublicationAction = "publish" | "unpublish";

type UseDraftPublicationActionsInput = {
  draftId: string;
  publication: DraftPublicationSummaryDto;
  onChanged?: (publication: DraftPublicationSummaryDto) => void;
};

export function useDraftPublicationActions({
  draftId,
  publication,
  onChanged,
}: UseDraftPublicationActionsInput) {
  const [pending, setPending] = useState<PublicationAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentDraftId = useRef(draftId);
  const actionKeys = useRef<Partial<Record<PublicationAction, string>>>({});
  currentDraftId.current = draftId;

  useEffect(() => {
    setPending(null);
    setError(null);
    actionKeys.current = {};
  }, [draftId]);

  const publish = async () => {
    if (pending) return;
    setPending("publish");
    setError(null);
    try {
      actionKeys.current.publish ??= `draft-publish-${crypto.randomUUID()}`;
      const response = await apiProposalDraftPublish({
        draftId,
        idempotencyKey: actionKeys.current.publish,
      });
      if (currentDraftId.current !== draftId) return;
      onChanged?.({
        status: "published",
        revision: response.revision,
        publicUrl: response.publicUrl,
        publishedAt: response.publishedAt,
        publicUpdatedAt: response.updatedAt,
        hasUnpublishedChanges: false,
      });
      actionKeys.current.publish = undefined;
    } catch (nextError) {
      setError(
        formatLoadError(
          nextError instanceof Error ? nextError.message : null,
          "Could not publish this draft.",
        ),
      );
    } finally {
      if (currentDraftId.current === draftId) setPending(null);
    }
  };

  const unpublish = async () => {
    if (pending || publication.status !== "published") return;
    if (!window.confirm("Remove this draft from public view?")) return;
    setPending("unpublish");
    setError(null);
    try {
      actionKeys.current.unpublish ??= `draft-unpublish-${crypto.randomUUID()}`;
      await apiProposalDraftUnpublish({
        draftId,
        idempotencyKey: actionKeys.current.unpublish,
      });
      if (currentDraftId.current !== draftId) return;
      onChanged?.({
        ...publication,
        status: "withdrawn",
        hasUnpublishedChanges: false,
      });
      actionKeys.current.unpublish = undefined;
    } catch (nextError) {
      setError(
        formatLoadError(
          nextError instanceof Error ? nextError.message : null,
          "Could not unpublish this draft.",
        ),
      );
    } finally {
      if (currentDraftId.current === draftId) setPending(null);
    }
  };

  return {
    canPublish: canPublishDraft(publication),
    error,
    pending,
    publicUrl: publicationRoute(draftId, publication),
    publish,
    reportError: setError,
    unpublish,
  };
}
