import { NoDataYetBar } from "@/components/NoDataYetBar";
import { Surface } from "@/components/Surface";
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
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-muted"
        >
          Loading feed…
        </Surface>
      ) : null}
      {loadError ? (
        <Surface
          variant="panelAlt"
          radius="2xl"
          shadow="tile"
          className="px-5 py-4 text-sm text-destructive"
        >
          Feed unavailable: {formatLoadError(loadError)}
        </Surface>
      ) : null}

      {feedItems !== null && feedItems.length === 0 && !loadError ? (
        <NoDataYetBar label="feed activity" />
      ) : null}
    </>
  );
}
