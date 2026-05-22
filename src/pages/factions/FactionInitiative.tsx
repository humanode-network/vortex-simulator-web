import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import {
  apiFaction,
  apiFactionInitiativeTransition,
  apiMe,
  getApiErrorPayload,
} from "@/lib/apiClient";
import { addressesReferToSameIdentity } from "@/lib/addressIdentity";
import { formatLoadError } from "@/lib/errorFormatting";
import { findViewerFactionMembership } from "@/lib/factionUi";
import type { FactionDto } from "@/types/api";
import { FactionInitiativeDetailCard } from "./components/FactionInitiativeDetailCard";
import { FactionInitiativeListCard } from "./components/FactionInitiativeListCard";

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
    return findViewerFactionMembership(memberships, viewerAddress);
  }, [memberships, viewerAddress]);

  const canPost = !!viewerAddress && !!viewerMembership?.isActive;
  const canModerate =
    viewerMembership?.role === "founder" ||
    viewerMembership?.role === "steward";

  const initiatives = useMemo(() => {
    return initiativesRaw.filter((initiative) => {
      if (initiative.status !== "draft") return true;
      return addressesReferToSameIdentity(
        initiative.ownerAddress,
        viewerAddress,
      );
    });
  }, [initiativesRaw, viewerAddress]);

  const activeInitiative = useMemo(
    () => initiatives.find((item) => item.id === initiativeId) ?? null,
    [initiatives, initiativeId],
  );
  const canEditActiveInitiative = useMemo(() => {
    if (!activeInitiative) return false;
    if (canModerate) return true;
    return addressesReferToSameIdentity(
      activeInitiative.ownerAddress,
      viewerAddress,
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
          <p className="text-sm text-destructive">
            {formatLoadError(loadError)}
          </p>
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
          {formatLoadError(actionError)}
        </Card>
      ) : null}

      <FactionInitiativeListCard
        activeInitiativeId={initiativeId}
        canPost={canPost}
        factionId={faction.id}
        initiatives={initiatives}
      />

      {initiativeId ? (
        <FactionInitiativeDetailCard
          canEdit={canEditActiveInitiative}
          initiative={activeInitiative}
          mutating={mutating}
          onStatusChange={(status) => {
            if (!activeInitiative) return;
            void runAction(async () => {
              await apiFactionInitiativeTransition({
                factionId: faction.id,
                initiativeId: activeInitiative.id,
                status,
              });
            });
          }}
        />
      ) : null}
    </div>
  );
};

export default FactionInitiative;
