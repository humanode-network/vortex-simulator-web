import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { AddressInline } from "@/components/AddressInline";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Select } from "@/components/primitives/select";
import {
  apiFaction,
  apiFactionInitiativeTransition,
  apiMe,
  getApiErrorPayload,
} from "@/lib/apiClient";
import { formatDateTime } from "@/lib/dateTime";
import type { FactionDto } from "@/types/api";

function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

const FactionInitiative: React.FC = () => {
  const { id, initiativeId } = useParams();
  const [faction, setFaction] = useState<FactionDto | null>(null);
  const [viewerAddress, setViewerAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
  const initiativesRaw = faction?.initiativesDetailed ?? [];

  const viewerMembership = useMemo(() => {
    if (!viewerAddress) return null;
    return memberships.find(
      (membership) =>
        normalizeAddress(membership.address) ===
        normalizeAddress(viewerAddress),
    );
  }, [memberships, viewerAddress]);

  const canPost = !!viewerAddress && !!viewerMembership?.isActive;
  const canModerate =
    viewerMembership?.role === "founder" ||
    viewerMembership?.role === "steward";

  const initiatives = useMemo(() => {
    const viewer = normalizeAddress(viewerAddress ?? "");
    return initiativesRaw.filter((initiative) => {
      if (initiative.status !== "draft") return true;
      return normalizeAddress(initiative.ownerAddress) === viewer;
    });
  }, [initiativesRaw, viewerAddress]);

  const activeInitiative = useMemo(
    () => initiatives.find((item) => item.id === initiativeId) ?? null,
    [initiatives, initiativeId],
  );
  const canEditActiveInitiative = useMemo(() => {
    if (!activeInitiative) return false;
    if (canModerate) return true;
    return (
      normalizeAddress(activeInitiative.ownerAddress) ===
      normalizeAddress(viewerAddress ?? "")
    );
  }, [activeInitiative, canModerate, viewerAddress]);

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
        Loading initiatives…
      </Card>
    );
  }

  if (!faction || !id) {
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
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                Initiatives
              </p>
              <h1 className="text-2xl font-semibold text-text sm:text-3xl">
                {faction.name}
              </h1>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to={`/app/factions/${faction.id}`}>Back to faction</Link>
            </Button>
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
            <CardTitle>Initiative list</CardTitle>
            {canPost ? (
              <Button asChild size="sm">
                <Link to={`/app/factions/${faction.id}/initiatives/new`}>
                  Create initiative
                </Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {initiatives.length === 0 ? (
            <p className="text-sm text-muted">No initiatives yet.</p>
          ) : (
            initiatives.map((initiative) => (
              <div
                key={initiative.id}
                className="rounded-md border border-border"
              >
                <Link
                  to={`/app/factions/${faction.id}/initiatives/${initiative.id}`}
                  className="block px-3 py-2 hover:bg-panel-alt/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text">
                        {initiative.title}
                      </p>
                      <p className="text-xs text-muted">
                        {initiative.intent} · updated{" "}
                        {formatDateTime(initiative.updatedAt)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        initiative.id === initiativeId
                          ? "border-text text-text"
                          : undefined
                      }
                    >
                      {initiative.status}
                    </Badge>
                  </div>
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {initiativeId ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              {activeInitiative
                ? activeInitiative.title
                : "Initiative not found"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!activeInitiative ? (
              <p className="text-sm text-muted">Initiative not found.</p>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-xs text-muted">
                    {activeInitiative.intent}
                  </p>
                  <AddressInline
                    address={activeInitiative.ownerAddress}
                    className="text-text"
                    textClassName="text-xs [overflow-wrap:anywhere] break-words"
                  />
                </div>

                {activeInitiative.checklist.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                    {activeInitiative.checklist.map((line, idx) => (
                      <li key={`${activeInitiative.id}-cl-${idx}`}>{line}</li>
                    ))}
                  </ul>
                ) : null}

                <div className="flex items-center gap-2">
                  <Badge variant="outline">{activeInitiative.status}</Badge>
                  <span className="text-xs text-muted">
                    Updated {formatDateTime(activeInitiative.updatedAt)}
                  </span>
                </div>

                {canEditActiveInitiative ? (
                  <Select
                    disabled={mutating}
                    value={activeInitiative.status}
                    onChange={(event) =>
                      runAction(async () => {
                        await apiFactionInitiativeTransition({
                          factionId: faction.id,
                          initiativeId: activeInitiative.id,
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
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default FactionInitiative;
