import { AddressInline } from "@/components/AddressInline";
import { Badge } from "@/components/primitives/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { Select } from "@/components/primitives/select";
import { formatDateTime } from "@/lib/dateTime";
import type { FactionDto } from "@/types/api";

type FactionInitiative = NonNullable<
  FactionDto["initiativesDetailed"]
>[number];

type FactionInitiativeStatus =
  | "draft"
  | "active"
  | "blocked"
  | "done"
  | "archived";

type FactionInitiativeDetailCardProps = {
  canEdit: boolean;
  initiative: FactionInitiative | null;
  mutating: boolean;
  onStatusChange: (status: FactionInitiativeStatus) => void;
};

export function FactionInitiativeDetailCard({
  canEdit,
  initiative,
  mutating,
  onStatusChange,
}: FactionInitiativeDetailCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>
          {initiative ? initiative.title : "Initiative not found"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!initiative ? (
          <p className="text-sm text-muted">Initiative not found.</p>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-xs text-muted">{initiative.intent}</p>
              <AddressInline
                address={initiative.ownerAddress}
                className="text-text"
                textClassName="text-xs [overflow-wrap:anywhere] break-words"
              />
            </div>

            {initiative.checklist.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {initiative.checklist.map((line, idx) => (
                  <li key={`${initiative.id}-cl-${idx}`}>{line}</li>
                ))}
              </ul>
            ) : null}

            <div className="flex items-center gap-2">
              <Badge variant="outline">{initiative.status}</Badge>
              <span className="text-xs text-muted">
                Updated {formatDateTime(initiative.updatedAt)}
              </span>
            </div>

            {canEdit ? (
              <Select
                disabled={mutating}
                value={initiative.status}
                onChange={(event) =>
                  onStatusChange(event.target.value as FactionInitiativeStatus)
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
  );
}
