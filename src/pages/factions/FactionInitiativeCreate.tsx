import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import {
  apiFaction,
  apiFactionInitiativeCreate,
  apiMe,
  getApiErrorPayload,
} from "@/lib/apiClient";
import type { FactionDto } from "@/types/api";

function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

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
    if (!faction || !viewerAddress) return false;
    return (faction.memberships ?? []).some(
      (membership) =>
        membership.isActive &&
        normalizeAddress(membership.address) ===
          normalizeAddress(viewerAddress),
    );
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
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button asChild size="sm">
          <Link to="/app/factions">Back to factions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Create initiative</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!canCreate ? (
            <p className="text-sm text-destructive">
              You cannot create an initiative in this faction.
            </p>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Initiative title"
          />
          <Input
            value={intent}
            onChange={(event) => setIntent(event.target.value)}
            placeholder="Intent"
          />
          <textarea
            value={checklistText}
            onChange={(event) => setChecklistText(event.target.value)}
            rows={5}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Checklist, one item per line"
          />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={!canCreate || submitting || title.trim().length < 2}
              onClick={onSubmit}
            >
              Create initiative
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={`/app/factions/${id}/initiatives`}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FactionInitiativeCreate;
