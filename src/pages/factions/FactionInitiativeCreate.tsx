import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "@/components/primitives/button";
import { Card } from "@/components/primitives/card";
import {
  apiFaction,
  apiFactionInitiativeCreate,
  apiMe,
  getApiErrorPayload,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import { hasActiveFactionMembership } from "@/lib/factionUi";
import type { FactionDto } from "@/types/api";
import { FactionInitiativeCreateCard } from "./components/FactionInitiativeCreateCard";

const FactionInitiativeCreate: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [faction, setFaction] = useState<FactionDto | null>(null);
  const [viewerAddress, setViewerAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [intent, setIntent] = useState("");
  const [checklistText, setChecklistText] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [factionRes, meRes] = await Promise.all([
          apiFaction(id),
          apiMe(),
        ]);
        setFaction(factionRes);
        setViewerAddress(meRes.authenticated ? meRes.address : null);
        setError(null);
      } catch (err) {
        setFaction(null);
        setViewerAddress(null);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const canCreate = useMemo(() => {
    return hasActiveFactionMembership(faction?.memberships, viewerAddress);
  }, [faction, viewerAddress]);

  const onSubmit = async () => {
    if (!id || !canCreate) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFactionInitiativeCreate({
        factionId: id,
        title: title.trim(),
        intent: intent.trim() || undefined,
        checklist: checklistText
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
      });
      navigate(`/app/factions/${id}/initiatives/${res.initiative.id}`);
    } catch (err) {
      const payload = getApiErrorPayload(err);
      setError(
        payload?.error?.message ??
          (err instanceof Error ? err.message : "Failed to create initiative"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !faction) {
    return (
      <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
        Loading faction…
      </Card>
    );
  }

  if (!id || !faction) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-text">Faction not found</h1>
        {error ? (
          <p className="text-sm text-destructive">{formatLoadError(error)}</p>
        ) : null}
        <Button asChild size="sm">
          <Link to="/app/factions">Back to factions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <FactionInitiativeCreateCard
        canCreate={canCreate}
        checklistText={checklistText}
        error={error}
        factionId={id}
        intent={intent}
        onChecklistTextChange={setChecklistText}
        onIntentChange={setIntent}
        onSubmit={() => void onSubmit()}
        onTitleChange={setTitle}
        submitting={submitting}
        title={title}
      />
    </div>
  );
};

export default FactionInitiativeCreate;
