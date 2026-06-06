import { Link } from "react-router";

import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { formatLoadError } from "@/lib/errorFormatting";

type FactionThreadCreateCardProps = {
  body: string;
  canCreate: boolean;
  channelId: string;
  channelTitle: string;
  error: string | null;
  factionId: string;
  onBodyChange: (value: string) => void;
  onSubmit: () => void;
  onTitleChange: (value: string) => void;
  submitting: boolean;
  title: string;
};

export function FactionThreadCreateCard({
  body,
  canCreate,
  channelId,
  channelTitle,
  error,
  factionId,
  onBodyChange,
  onSubmit,
  onTitleChange,
  submitting,
  title,
}: FactionThreadCreateCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionHeader>Create thread</SectionHeader>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted">
          Channel: <span className="font-medium text-text">{channelTitle}</span>
        </p>

        {!canCreate ? (
          <p className="text-sm text-destructive">
            You cannot create a thread in this channel.
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive">{formatLoadError(error)}</p>
        ) : null}

        <Input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Thread title"
        />
        <textarea
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
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
            <Link to={`/app/factions/${factionId}/channels/${channelId}`}>
              Cancel
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
