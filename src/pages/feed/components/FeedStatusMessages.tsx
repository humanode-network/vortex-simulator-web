import { NoDataYetBar } from "@/components/NoDataYetBar";
import { formatLoadError } from "@/lib/errorFormatting";
import type { FeedItemDto } from "@/types/api";

type FeedStatusMessagesProps = {
  feedItems: FeedItemDto[] | null;
  loadError: string | null;
};

export function FeedStatusMessages({
  feedItems,
  loadError,
}: FeedStatusMessagesProps) {
  return (
    <>
      {feedItems === null ? (
        <p role="status" className="feed-page__status">
          Loading feed…
        </p>
      ) : null}
      {loadError ? (
        <p role="alert" className="feed-page__status feed-page__status--error">
          Feed unavailable: {formatLoadError(loadError)}
        </p>
      ) : null}

      {feedItems !== null && feedItems.length === 0 && !loadError ? (
        <NoDataYetBar label="feed activity" />
      ) : null}
    </>
  );
}
