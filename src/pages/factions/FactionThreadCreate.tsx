import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "@/components/primitives/button";
import { Card } from "@/components/primitives/card";
import {
  apiFaction,
  apiFactionThreadCreate,
  apiMe,
  getApiErrorPayload,
} from "@/lib/apiClient";
import { formatLoadError } from "@/lib/errorFormatting";
import { findViewerFactionMembership } from "@/lib/factionUi";
import type { FactionDto } from "@/types/api";
import { FactionThreadCreateCard } from "./components/FactionThreadCreateCard";

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
    return findViewerFactionMembership(faction?.memberships, viewerAddress, {
      activeOnly: true,
    });
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
        {error ? (
          <p className="text-sm text-destructive">{formatLoadError(error)}</p>
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
      <FactionThreadCreateCard
        body={body}
        canCreate={canCreate}
        channelId={channelId}
        channelTitle={channel.title}
        error={error}
        factionId={id}
        onBodyChange={setBody}
        onSubmit={() => void onSubmit()}
        onTitleChange={setTitle}
        submitting={submitting}
        title={title}
      />
    </div>
  );
};

export default FactionThreadCreate;
