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
  apiFactionThreadCreate,
  apiMe,
  getApiErrorPayload,
} from "@/lib/apiClient";
import type { FactionDto } from "@/types/api";

function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

const FactionThreadCreate: React.FC = () => {
  const { id, channelId } = useParams();
  const navigate = useNavigate();
  const [faction, setFaction] = useState<FactionDto | null>(null);
  const [viewerAddress, setViewerAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

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

  const viewerMembership = useMemo(() => {
    if (!faction || !viewerAddress) return null;
    return (
      (faction.memberships ?? []).find(
        (membership) =>
          normalizeAddress(membership.address) ===
            normalizeAddress(viewerAddress) && membership.isActive,
      ) ?? null
    );
  }, [faction, viewerAddress]);

  const channel = useMemo(() => {
    if (!faction || !channelId) return null;
    return (
      (faction.channels ?? []).find((item) => item.id === channelId) ?? null
    );
  }, [faction, channelId]);

  const canCreate = !!viewerMembership && !!channel && !channel.isLocked;

  const onSubmit = async () => {
    if (!id || !channelId || !canCreate) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFactionThreadCreate({
        factionId: id,
        channelId,
        title: title.trim(),
        body: body.trim(),
      });
      navigate(
        `/app/factions/${id}/channels/${channelId}/threads/${res.thread.id}`,
      );
    } catch (err) {
      const payload = getApiErrorPayload(err);
      setError(
        payload?.error?.message ??
          (err instanceof Error ? err.message : "Failed to create thread"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !faction) {
    return (
      <Card className="border-dashed px-4 py-6 text-center text-sm text-muted">
        Loading channel…
      </Card>
    );
  }

  if (!id || !channelId || !faction || !channel) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-text">Channel not found</h1>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
        <CardHeader className="pb-2">
          <CardTitle>Create thread</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">
            Channel:{" "}
            <span className="font-medium text-text">{channel.title}</span>
          </p>

          {!canCreate ? (
            <p className="text-sm text-destructive">
              You cannot create a thread in this channel.
            </p>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Thread title"
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={6}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Thread body"
          />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              disabled={
                !canCreate ||
                submitting ||
                title.trim().length < 2 ||
                body.trim().length < 2
              }
              onClick={onSubmit}
            >
              Create thread
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to={`/app/factions/${id}/channels/${channelId}`}>
                Cancel
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FactionThreadCreate;
