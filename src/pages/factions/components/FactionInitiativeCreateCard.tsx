import { Link } from "react-router";

import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { formatLoadError } from "@/lib/errorFormatting";

type FactionInitiativeCreateCardProps = {
  canCreate: boolean;
  checklistText: string;
  error: string | null;
  factionId: string;
  intent: string;
  onChecklistTextChange: (value: string) => void;
  onIntentChange: (value: string) => void;
  onSubmit: () => void;
  onTitleChange: (value: string) => void;
  submitting: boolean;
  title: string;
};

export function FactionInitiativeCreateCard({
  canCreate,
  checklistText,
  error,
  factionId,
  intent,
  onChecklistTextChange,
  onIntentChange,
  onSubmit,
  onTitleChange,
  submitting,
  title,
}: FactionInitiativeCreateCardProps) {
  return (
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

        {error ? (
          <p className="text-sm text-destructive">{formatLoadError(error)}</p>
        ) : null}

        <Input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Initiative title"
        />
        <Input
          value={intent}
          onChange={(event) => onIntentChange(event.target.value)}
          placeholder="Intent"
        />
        <textarea
          value={checklistText}
          onChange={(event) => onChecklistTextChange(event.target.value)}
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
            <Link to={`/app/factions/${factionId}/initiatives`}>Cancel</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
