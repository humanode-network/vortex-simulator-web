import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";

import type { FactionDto } from "@/types/api";

type FactionThread = NonNullable<FactionDto["threads"]>[number];

export function useFactionLegacyThreadRedirect(
  factionId: string | undefined,
  threads: FactionThread[],
) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const legacyThreadId = searchParams.get("thread");
    if (!legacyThreadId || !factionId || threads.length === 0) return;
    const thread = threads.find((item) => item.id === legacyThreadId);
    if (!thread) return;
    navigate(
      `/app/factions/${factionId}/channels/${thread.channelId}/threads/${thread.id}`,
      {
        replace: true,
      },
    );
  }, [factionId, navigate, searchParams, threads]);
}
