import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";

import { Kicker } from "@/components/Kicker";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { PageHint } from "@/components/PageHint";
import { AddressInline } from "@/components/AddressInline";
import { StatTile } from "@/components/StatTile";
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
  apiFactionJoin,
  apiFactionLeave,
  apiFactionMemberRoleSet,
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const canManageMembers = isFounderAdmin;

  useEffect(() => {
    const legacyThreadId = searchParams.get("thread");
    if (!legacyThreadId || !id || threads.length === 0) return;
    const thread = threads.find((item) => item.id === legacyThreadId);
    if (!thread) return;
    navigate(
      `/app/factions/${id}/channels/${thread.channelId}/threads/${thread.id}`,
      {
        replace: true,
      },
    );
  }, [id, navigate, searchParams, threads]);

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
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <Kicker>{faction.focus}</Kicker>
              <h1 className="text-2xl leading-tight font-semibold text-text sm:text-3xl">
                {faction.name}
              </h1>
              <p className="max-w-4xl text-sm leading-relaxed text-muted sm:text-base">
                {faction.description}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
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
          </div>

          {viewerRole === "founder" ? (
            <div className="mt-3">
              <Badge variant="outline">
                Founder leave disabled until transfer
              </Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Members"
          value={String(faction.members)}
          align="center"
        />
        <StatTile label="Votes" value={String(faction.votes)} align="center" />
        <StatTile
          label="Role"
          value={
            viewerRole
              ? viewerRole.charAt(0).toUpperCase() + viewerRole.slice(1)
              : "None"
          }
          align="center"
        />
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
                      <AddressInline
                        address={membership.address}
                        className="text-text"
                        textClassName="text-sm font-semibold [overflow-wrap:anywhere] break-words"
                      />
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
                  <AddressInline
                    address={invite.address}
                    className="text-text"
                    textClassName="text-sm font-semibold [overflow-wrap:anywhere] break-words"
                  />
                  <div className="flex flex-wrap items-center gap-1 text-xs text-muted">
                    <span>Invited by</span>
                    <AddressInline address={invite.invitedBy} />
                    <span>· {formatDateTime(invite.invitedAt)}</span>
                  </div>
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
                  className="rounded-md border border-border text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/app/factions/${faction.id}/channels/${channel.id}`}
                      className="min-w-0 flex-1 px-3 py-2 hover:bg-panel-alt/50"
                    >
                      <p className="font-semibold text-text hover:underline">
                        {channel.title}
                      </p>
                      <p className="text-xs text-muted">
                        #{channel.slug} · {channel.writeScope} · threads{" "}
                        {channel.threadCount}
                      </p>
                    </Link>
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
                  className="rounded-md border border-border text-sm"
                >
                  <Link
                    to={`/app/factions/${faction.id}/initiatives/${initiative.id}`}
                    className="block px-3 py-2 hover:bg-panel-alt/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-text hover:underline">
                          {initiative.title}
                        </p>
                        <p className="text-xs text-muted">
                          {initiative.intent}
                        </p>
                      </div>
                      <Badge variant="outline">{initiative.status}</Badge>
                    </div>
                  </Link>
                </div>
              ))
            )}
            <div className="rounded-md border border-border p-3">
              <p className="text-xs text-muted">
                Open initiatives workspace to create new initiatives and manage
                status.
              </p>
              <div className="mt-2">
                <Button asChild size="sm" variant="outline">
                  <Link to={`/app/factions/${faction.id}/initiatives`}>
                    Open initiatives workspace
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 text-sm text-muted">
          Open a channel to create threads and manage discussions.
        </CardContent>
      </Card>
    </div>
  );
};

export default Faction;
