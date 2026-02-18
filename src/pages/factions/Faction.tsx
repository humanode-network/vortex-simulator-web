import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";

import { Kicker } from "@/components/Kicker";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHint } from "@/components/PageHint";
import { Badge } from "@/components/primitives/badge";
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
  apiFactionChannelCreate,
  apiFactionChannelLock,
  apiFactionCofounderInviteCancel,
  apiFactionDelete,
  apiFactionInitiativeCreate,
  apiFactionInitiativeTransition,
  apiFactionJoin,
  apiFactionLeave,
  apiFactionMemberRoleSet,
  apiFactionThreadCreate,
  apiFactionThreadReply,
  apiFactionThreadTransition,
  apiFactionUpdate,
  apiMe,
  getApiErrorPayload,
} from "@/lib/apiClient";
import { formatDateTime } from "@/lib/dateTime";
import type { FactionDto } from "@/types/api";

function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

const Faction: React.FC = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [faction, setFaction] = useState<FactionDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [viewerAddress, setViewerAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);

  const [channelTitle, setChannelTitle] = useState("");
  const [channelScope, setChannelScope] = useState<"stewards" | "members">(
    "members",
  );

  const [threadChannelId, setThreadChannelId] = useState("");
  const [threadTitle, setThreadTitle] = useState("");
  const [threadBody, setThreadBody] = useState("");
  const [threadReplyBody, setThreadReplyBody] = useState("");

  const [initiativeTitle, setInitiativeTitle] = useState("");
  const [initiativeIntent, setInitiativeIntent] = useState("");
  const [initiativeChecklist, setInitiativeChecklist] = useState("");
  const openedThreadRef = useRef<HTMLDivElement | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFocus, setEditFocus] = useState("");
  const [editVisibility, setEditVisibility] = useState<"public" | "private">(
    "public",
  );
  const [editGoalsText, setEditGoalsText] = useState("");
  const [editTagsText, setEditTagsText] = useState("");

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
  const initiatives = faction?.initiativesDetailed ?? [];
  const cofounderInvitations = faction?.cofounderInvitations ?? [];

  const viewerMembership = useMemo(() => {
    if (!viewerAddress) return null;
    return memberships.find(
      (membership) =>
        normalizeAddress(membership.address) ===
        normalizeAddress(viewerAddress),
    );
  }, [memberships, viewerAddress]);

  const viewerRole = viewerMembership?.isActive ? viewerMembership.role : null;
  const isFounderAdmin = viewerRole === "founder";
  const canJoin = !!viewerAddress && !viewerMembership?.isActive;
  const canLeave =
    !!viewerAddress && !!viewerMembership?.isActive && viewerRole !== "founder";
  const canPost = !!viewerAddress && !!viewerMembership?.isActive;
  const canManageMembers = isFounderAdmin;

  useEffect(() => {
    if (!threadChannelId && channels.length > 0) {
      setThreadChannelId(channels[0].id);
    }
  }, [channels, threadChannelId]);

  const activeThreadId = searchParams.get("thread");
  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  useEffect(() => {
    if (threads.length === 0) return;
    if (!activeThreadId) {
      const next = new URLSearchParams(searchParams);
      next.set("thread", threads[0].id);
      setSearchParams(next, { replace: true });
      return;
    }
    if (!threads.some((thread) => thread.id === activeThreadId)) {
      const next = new URLSearchParams(searchParams);
      next.set("thread", threads[0].id);
      setSearchParams(next, { replace: true });
    }
  }, [activeThreadId, searchParams, setSearchParams, threads]);

  useEffect(() => {
    if (!activeThread || !openedThreadRef.current) return;
    openedThreadRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [activeThread?.id]);

  useEffect(() => {
    if (!faction) return;
    setEditName(faction.name);
    setEditDescription(faction.description);
    setEditFocus(faction.focus || "General");
    setEditVisibility(faction.visibility === "private" ? "private" : "public");
    setEditGoalsText((faction.goals ?? []).join("\n"));
    setEditTagsText((faction.tags ?? []).join(", "));
  }, [faction]);

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
        Loading faction…
      </Card>
    );
  }

  if (!faction) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-text">Faction not found</h1>
        {loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : null}
        <Button asChild size="sm">
          <Link to="/app/factions">Back to factions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHint pageId="faction" />
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Kicker>{faction.focus}</Kicker>
            <h1 className="text-xl font-semibold text-text">{faction.name}</h1>
            <p className="text-sm text-muted">{faction.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Members: {faction.members}</Badge>
            <Badge variant="outline">Votes: {faction.votes}</Badge>
            {viewerRole ? (
              <Badge variant="outline">Role: {viewerRole}</Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        {canJoin ? (
          <Button
            size="sm"
            disabled={mutating}
            onClick={() =>
              runAction(async () => {
                await apiFactionJoin({ factionId: faction.id });
              })
            }
          >
            Join faction
          </Button>
        ) : null}
        {canLeave ? (
          <Button
            size="sm"
            variant="outline"
            disabled={mutating}
            onClick={() =>
              runAction(async () => {
                await apiFactionLeave({ factionId: faction.id });
              })
            }
          >
            Leave faction
          </Button>
        ) : null}
        {viewerRole === "founder" ? (
          <Badge variant="outline">Founder leave disabled until transfer</Badge>
        ) : null}
        {isFounderAdmin ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditOpen((prev) => !prev)}
          >
            {editOpen ? "Close edit" : "Edit faction"}
          </Button>
        ) : null}
      </div>

      {isFounderAdmin && editOpen ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Edit faction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              placeholder="Faction name"
            />
            <textarea
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Faction description"
            />
            <Input
              value={editFocus}
              onChange={(event) => setEditFocus(event.target.value)}
              placeholder="Focus"
            />
            <Select
              value={editVisibility}
              onChange={(event) =>
                setEditVisibility(
                  event.target.value === "private" ? "private" : "public",
                )
              }
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </Select>
            <textarea
              value={editGoalsText}
              onChange={(event) => setEditGoalsText(event.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Goals, one per line"
            />
            <Input
              value={editTagsText}
              onChange={(event) => setEditTagsText(event.target.value)}
              placeholder="Tags, comma separated"
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={
                  mutating ||
                  editName.trim().length < 2 ||
                  editDescription.trim().length < 2
                }
                onClick={() =>
                  runAction(async () => {
                    await apiFactionUpdate({
                      factionId: faction.id,
                      name: editName.trim(),
                      description: editDescription.trim(),
                      focus: editFocus.trim(),
                      visibility: editVisibility,
                      goals: editGoalsText
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean),
                      tags: editTagsText
                        .split(",")
                        .map((line) => line.trim())
                        .filter(Boolean),
                    });
                    setEditOpen(false);
                  })
                }
              >
                Save changes
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={mutating}
                onClick={() =>
                  runAction(async () => {
                    await apiFactionDelete({ factionId: faction.id });
                  })
                }
              >
                Archive faction
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {actionError ? (
        <Card className="border-dashed px-4 py-3 text-sm text-destructive">
          {actionError}
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {memberships.length === 0 ? (
            <NoDataYetBar label="members" />
          ) : (
            memberships
              .filter((membership) => membership.isActive)
              .map((membership) => {
                const isSelf =
                  viewerAddress !== null &&
                  normalizeAddress(viewerAddress) ===
                    normalizeAddress(membership.address);
                return (
                  <div
                    key={membership.address}
                    className="flex flex-col gap-2 rounded-md border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold [overflow-wrap:anywhere] break-words text-text">
                        {membership.address}
                      </p>
                      <p className="text-xs text-muted">
                        Joined {formatDateTime(membership.joinedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManageMembers ? (
                        <Select
                          value={membership.role}
                          disabled={mutating}
                          onChange={(event) =>
                            runAction(async () => {
                              await apiFactionMemberRoleSet({
                                factionId: faction.id,
                                address: membership.address,
                                role: event.target.value as
                                  | "founder"
                                  | "steward"
                                  | "member",
                              });
                            })
                          }
                        >
                          <option value="founder">Founder</option>
                          <option value="steward">Steward</option>
                          <option value="member">Member</option>
                        </Select>
                      ) : (
                        <Badge variant="outline">{membership.role}</Badge>
                      )}
                      {isSelf ? <Badge variant="outline">You</Badge> : null}
                    </div>
                  </div>
                );
              })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Cofounder invitations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cofounderInvitations.length === 0 ? (
            <NoDataYetBar label="cofounder invitations" />
          ) : (
            cofounderInvitations.map((invite) => (
              <div
                key={`${invite.address}-${invite.invitedAt}`}
                className="flex flex-col gap-2 rounded-md border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold [overflow-wrap:anywhere] break-words text-text">
                    {invite.address}
                  </p>
                  <p className="text-xs text-muted">
                    Invited by {invite.invitedBy} ·{" "}
                    {formatDateTime(invite.invitedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{invite.status}</Badge>
                  {isFounderAdmin && invite.status === "pending" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={mutating}
                      onClick={() =>
                        runAction(async () => {
                          await apiFactionCofounderInviteCancel({
                            factionId: faction.id,
                            address: invite.address,
                          });
                        })
                      }
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Channels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {channels.length === 0 ? (
              <NoDataYetBar label="channels" />
            ) : (
              channels.map((channel) => (
                <div
                  key={channel.id}
                  className="rounded-md border border-border px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-text">{channel.title}</p>
                      <p className="text-xs text-muted">
                        #{channel.slug} · {channel.writeScope} · threads{" "}
                        {channel.threadCount}
                      </p>
                    </div>
                    {isFounderAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={mutating}
                        onClick={() =>
                          runAction(async () => {
                            await apiFactionChannelLock({
                              factionId: faction.id,
                              channelId: channel.id,
                              isLocked: !channel.isLocked,
                            });
                          })
                        }
                      >
                        {channel.isLocked ? "Unlock" : "Lock"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
            {isFounderAdmin ? (
              <div className="space-y-2 rounded-md border border-border p-3">
                <p className="text-xs font-semibold text-muted">
                  Create channel
                </p>
                <Input
                  value={channelTitle}
                  onChange={(event) => setChannelTitle(event.target.value)}
                  placeholder="Channel title"
                />
                <Select
                  value={channelScope}
                  onChange={(event) =>
                    setChannelScope(
                      event.target.value as "stewards" | "members",
                    )
                  }
                >
                  <option value="members">Members can post</option>
                  <option value="stewards">Stewards only</option>
                </Select>
                <Button
                  size="sm"
                  disabled={mutating || channelTitle.trim().length < 2}
                  onClick={() =>
                    runAction(async () => {
                      await apiFactionChannelCreate({
                        factionId: faction.id,
                        title: channelTitle.trim(),
                        writeScope: channelScope,
                      });
                      setChannelTitle("");
                    })
                  }
                >
                  Add channel
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Initiatives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {initiatives.length === 0 ? (
              <NoDataYetBar label="initiatives" />
            ) : (
              initiatives.map((initiative) => (
                <div
                  key={initiative.id}
                  className="rounded-md border border-border px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-text">
                      {initiative.title}
                    </p>
                    <Badge variant="outline">{initiative.status}</Badge>
                  </div>
                  <p className="text-xs text-muted">{initiative.intent}</p>
                  {isFounderAdmin ? (
                    <div className="mt-2 flex items-center gap-2">
                      <Select
                        value={initiative.status}
                        onChange={(event) =>
                          runAction(async () => {
                            await apiFactionInitiativeTransition({
                              factionId: faction.id,
                              initiativeId: initiative.id,
                              status: event.target.value as
                                | "draft"
                                | "active"
                                | "blocked"
                                | "done"
                                | "archived",
                            });
                          })
                        }
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Done</option>
                        <option value="archived">Archived</option>
                      </Select>
                    </div>
                  ) : null}
                </div>
              ))
            )}
            {canPost ? (
              <div className="space-y-2 rounded-md border border-border p-3">
                <p className="text-xs font-semibold text-muted">
                  Create initiative
                </p>
                <Input
                  value={initiativeTitle}
                  onChange={(event) => setInitiativeTitle(event.target.value)}
                  placeholder="Initiative title"
                />
                <Input
                  value={initiativeIntent}
                  onChange={(event) => setInitiativeIntent(event.target.value)}
                  placeholder="Intent"
                />
                <textarea
                  value={initiativeChecklist}
                  onChange={(event) =>
                    setInitiativeChecklist(event.target.value)
                  }
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={"Checklist, one item per line"}
                />
                <Button
                  size="sm"
                  disabled={mutating || initiativeTitle.trim().length < 2}
                  onClick={() =>
                    runAction(async () => {
                      await apiFactionInitiativeCreate({
                        factionId: faction.id,
                        title: initiativeTitle.trim(),
                        intent: initiativeIntent.trim() || undefined,
                        checklist: initiativeChecklist
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean),
                      });
                      setInitiativeTitle("");
                      setInitiativeIntent("");
                      setInitiativeChecklist("");
                    })
                  }
                >
                  Create initiative
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Threads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {threads.length === 0 ? (
            <NoDataYetBar label="threads" />
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                className="space-y-2 rounded-md border border-border px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {thread.title}
                    </p>
                    <p className="text-xs text-muted">
                      {thread.channelTitle} · {thread.status} · replies{" "}
                      {thread.replies}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{thread.status}</Badge>
                    <Button
                      size="sm"
                      variant={
                        activeThread?.id === thread.id ? "outline" : "ghost"
                      }
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.set("thread", thread.id);
                        setSearchParams(next, { replace: false });
                      }}
                    >
                      Open
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted">{thread.body}</p>
                {isFounderAdmin ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={thread.status}
                      onChange={(event) =>
                        runAction(async () => {
                          await apiFactionThreadTransition({
                            factionId: faction.id,
                            threadId: thread.id,
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
                  </div>
                ) : null}
              </div>
            ))
          )}
          {activeThread ? (
            <div
              ref={openedThreadRef}
              className="space-y-3 rounded-md border border-border p-3"
            >
              <p className="text-xs font-semibold text-muted">Opened thread</p>
              <p className="text-sm font-semibold text-text">
                {activeThread.title}
              </p>
              <p className="text-xs text-muted">
                {activeThread.channelTitle} · {activeThread.status} · replies{" "}
                {activeThread.replies}
              </p>
              <p className="text-sm text-muted">{activeThread.body}</p>
              {canPost ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={threadReplyBody}
                    onChange={(event) => setThreadReplyBody(event.target.value)}
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
            </div>
          ) : null}
          {canPost ? (
            <div className="space-y-2 rounded-md border border-border p-3">
              <p className="text-xs font-semibold text-muted">Start thread</p>
              <Select
                value={threadChannelId}
                onChange={(event) => setThreadChannelId(event.target.value)}
              >
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.title}
                  </option>
                ))}
              </Select>
              <Input
                value={threadTitle}
                onChange={(event) => setThreadTitle(event.target.value)}
                placeholder="Thread title"
              />
              <textarea
                value={threadBody}
                onChange={(event) => setThreadBody(event.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Thread body"
              />
              <Button
                size="sm"
                disabled={
                  mutating ||
                  threadTitle.trim().length < 2 ||
                  threadBody.trim().length < 2 ||
                  threadChannelId.trim().length === 0
                }
                onClick={() =>
                  runAction(async () => {
                    await apiFactionThreadCreate({
                      factionId: faction.id,
                      channelId: threadChannelId,
                      title: threadTitle.trim(),
                      body: threadBody.trim(),
                    });
                    setThreadTitle("");
                    setThreadBody("");
                  })
                }
              >
                Create thread
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default Faction;
