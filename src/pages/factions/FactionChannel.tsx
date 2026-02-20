import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { AddressInline } from "@/components/AddressInline";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Select } from "@/components/primitives/select";
import {
  apiFaction,
  apiFactionThreadDelete,
  apiFactionThreadReplyDelete,
  apiFactionThreadReply,
  apiFactionThreadTransition,
  apiMe,
  getApiErrorPayload,
} from "@/lib/apiClient";
import { formatDateTime } from "@/lib/dateTime";
import type { FactionDto } from "@/types/api";

function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

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
    if (!viewerAddress) return null;
    return memberships.find(
      (membership) =>
        normalizeAddress(membership.address) ===
        normalizeAddress(viewerAddress),
    );
  }, [memberships, viewerAddress]);

  const viewerRole = viewerMembership?.isActive ? viewerMembership.role : null;
  const canPost = !!viewerAddress && !!viewerMembership?.isActive;
  const isFounderAdmin = viewerRole === "founder";
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
          <p className="text-sm text-destructive">{loadError}</p>
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
          {actionError}
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Threads</CardTitle>
            {canPost ? (
              <Button asChild size="sm">
                <Link
                  to={`/app/factions/${faction.id}/channels/${channel.id}/threads/new`}
                >
                  Create thread
                </Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {channelThreads.length === 0 ? (
            <p className="text-sm text-muted">No threads yet.</p>
          ) : (
            channelThreads.map((thread) => (
              <div
                key={thread.id}
                className="rounded-md border border-border text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/app/factions/${faction.id}/channels/${channel.id}/threads/${thread.id}`}
                    className="min-w-0 flex-1 px-3 py-2 hover:bg-panel-alt/50"
                  >
                    <p className="text-sm font-semibold text-text hover:underline">
                      {thread.title}
                    </p>
                    <p className="text-xs text-muted">
                      {thread.status} · replies {thread.replies} · updated{" "}
                      {formatDateTime(thread.updatedAt)}
                    </p>
                  </Link>
                  {canModerate ||
                  normalizeAddress(thread.authorAddress) ===
                    normalizeAddress(viewerAddress ?? "") ? (
                    <div className="px-2 py-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={mutating}
                        onClick={() =>
                          runAction(async () => {
                            await apiFactionThreadDelete({
                              factionId: faction.id,
                              threadId: thread.id,
                            });
                          })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {threadId ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Thread</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!activeThread ? (
              <p className="text-sm text-muted">
                Thread not found in this channel.
              </p>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-text">
                    {activeThread.title}
                  </p>
                  <p className="text-xs text-muted">
                    {activeThread.status} · replies {activeThread.replies}
                  </p>
                  <AddressInline
                    address={activeThread.authorAddress}
                    className="text-text"
                    textClassName="text-xs [overflow-wrap:anywhere] break-words"
                  />
                </div>

                <p className="text-sm text-muted">{activeThread.body}</p>

                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs font-semibold text-muted">Replies</p>
                  {(activeThread.messages ?? []).length === 0 ? (
                    <p className="text-sm text-muted">No replies yet.</p>
                  ) : (
                    (activeThread.messages ?? []).map((message) => {
                      const canDeleteMessage =
                        canModerate ||
                        normalizeAddress(message.authorAddress) ===
                          normalizeAddress(viewerAddress ?? "");
                      return (
                        <div
                          key={message.id}
                          className="space-y-1 rounded-md border border-border px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <AddressInline
                              address={message.authorAddress}
                              className="text-text"
                              textClassName="text-xs [overflow-wrap:anywhere] break-words"
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted">
                                {formatDateTime(message.createdAt)}
                              </span>
                              {canDeleteMessage ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={mutating}
                                  onClick={() =>
                                    runAction(async () => {
                                      await apiFactionThreadReplyDelete({
                                        factionId: faction.id,
                                        threadId: activeThread.id,
                                        messageId: message.id,
                                      });
                                    })
                                  }
                                >
                                  Delete
                                </Button>
                              ) : null}
                            </div>
                          </div>
                          <p className="text-sm text-muted">{message.body}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                {isFounderAdmin ? (
                  <Select
                    value={activeThread.status}
                    onChange={(event) =>
                      runAction(async () => {
                        await apiFactionThreadTransition({
                          factionId: faction.id,
                          threadId: activeThread.id,
                          status: event.target.value as
                            | "open"
                            | "resolved"
                            | "locked",
                        });
                      })
                    }
                  >
                    <option value="open">Open</option>
                    <option value="resolved">Resolved</option>
                    <option value="locked">Locked</option>
                  </Select>
                ) : null}

                {canPost ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={threadReplyBody}
                      onChange={(event) =>
                        setThreadReplyBody(event.target.value)
                      }
                      placeholder="Write a reply"
                    />
                    <Button
                      size="sm"
                      disabled={mutating || !threadReplyBody.trim()}
                      onClick={() =>
                        runAction(async () => {
                          await apiFactionThreadReply({
                            factionId: faction.id,
                            threadId: activeThread.id,
                            body: threadReplyBody.trim(),
                          });
                          setThreadReplyBody("");
                        })
                      }
                    >
                      Reply
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default FactionChannel;
