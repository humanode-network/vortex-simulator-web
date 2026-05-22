import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import {
  apiFaction,
  apiFactionThreadReply,
  apiFactionThreadTransition,
  apiMe,
  getApiErrorPayload,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import { findViewerFactionMembership } from "@/lib/factionUi";
import type { FactionDto } from "@/types/api";
import { FactionThreadDetailCard } from "./components/FactionThreadDetailCard";
import { FactionThreadListCard } from "./components/FactionThreadListCard";

const FactionChannel: React.FC = () => {
  const { id, channelId, threadId } = useParams();
  const [faction, setFaction] = useState<FactionDto | null>(null);
  const [viewerAddress, setViewerAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [threadReplyBody, setThreadReplyBody] = useState("");

  const loadFaction = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [factionRes, meRes] = await Promise.all([apiFaction(id), apiMe()]);
      setFaction(factionRes);
      setViewerAddress(meRes.authenticated ? meRes.address : null);
      setLoadError(null);
    } catch (error) {
      setFaction(null);
      setViewerAddress(null);
      setLoadError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFaction();
  }, [id]);

  const memberships = faction?.memberships ?? [];
  const channels = faction?.channels ?? [];
  const threads = faction?.threads ?? [];

  const viewerMembership = useMemo(() => {
    return findViewerFactionMembership(memberships, viewerAddress);
  }, [memberships, viewerAddress]);

  const viewerRole = viewerMembership?.isActive ? viewerMembership.role : null;
  const canPost = !!viewerAddress && !!viewerMembership?.isActive;
  const canModerate = viewerRole === "founder" || viewerRole === "steward";

  const channel = useMemo(
    () => channels.find((item) => item.id === channelId) ?? null,
    [channels, channelId],
  );

  const channelThreads = useMemo(
    () => threads.filter((item) => item.channelId === channelId),
    [threads, channelId],
  );

  const activeThread = useMemo(
    () => channelThreads.find((item) => item.id === threadId) ?? null,
    [channelThreads, threadId],
  );

  const setCommandError = (error: unknown) => {
    const payload = getApiErrorPayload(error);
    const message =
      payload?.error?.message ??
      (error instanceof Error ? error.message : "Action failed");
    setActionError(message);
  };

  const runAction = async (fn: () => Promise<void>) => {
    setActionError(null);
    setMutating(true);
    try {
      await fn();
      await loadFaction();
    } catch (error) {
      setCommandError(error);
    } finally {
      setMutating(false);
    }
  };

  if (loading && !faction) {
    return (
      <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
        Loading channel…
      </Card>
    );
  }

  if (!faction || !id || !channelId || !channel) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-text">Channel not found</h1>
        {loadError ? (
          <p className="text-sm text-destructive">
            {formatLoadError(loadError)}
          </p>
        ) : null}
        <Button asChild size="sm">
          <Link to={id ? `/app/factions/${id}` : "/app/factions"}>
            Back to faction
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                Channel
              </p>
              <h1 className="text-xl font-semibold text-text">
                {channel.title}
              </h1>
              <p className="text-xs text-muted">
                #{channel.slug} · {channel.writeScope} · threads{" "}
                {channel.threadCount}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to={`/app/factions/${faction.id}`}>Back to faction</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {actionError ? (
        <Card className="border-dashed px-4 py-3 text-sm text-destructive">
          {formatLoadError(actionError)}
        </Card>
      ) : null}

      <FactionThreadListCard
        canPost={canPost}
        channelId={channel.id}
        factionId={faction.id}
        threads={channelThreads}
      />

      {threadId ? (
        <FactionThreadDetailCard
          canModerate={canModerate}
          canPost={canPost}
          mutating={mutating}
          onReply={() =>
            activeThread
              ? runAction(async () => {
                  await apiFactionThreadReply({
                    factionId: faction.id,
                    threadId: activeThread.id,
                    body: threadReplyBody.trim(),
                  });
                  setThreadReplyBody("");
                })
              : undefined
          }
          onReplyBodyChange={setThreadReplyBody}
          onStatusChange={(status) =>
            activeThread
              ? runAction(async () => {
                  await apiFactionThreadTransition({
                    factionId: faction.id,
                    threadId: activeThread.id,
                    status,
                  });
                })
              : undefined
          }
          replyBody={threadReplyBody}
          thread={activeThread}
        />
      ) : null}
    </div>
  );
};

export default FactionChannel;
