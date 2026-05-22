import { Link } from "react-router";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card";
import { formatDateTime } from "@/lib/dateTime";
import type { FactionDto } from "@/types/api";

type FactionInitiative = NonNullable<FactionDto["initiativesDetailed"]>[number];

type FactionInitiativeListCardProps = {
  activeInitiativeId?: string;
  canPost: boolean;
  factionId: string;
  initiatives: FactionInitiative[];
};

export function FactionInitiativeListCard({
  activeInitiativeId,
  canPost,
  factionId,
  initiatives,
}: FactionInitiativeListCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Initiative list</CardTitle>
          {canPost ? (
            <Button asChild size="sm">
              <Link to={`/app/factions/${factionId}/initiatives/new`}>
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
                to={`/app/factions/${factionId}/initiatives/${initiative.id}`}
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
                      initiative.id === activeInitiativeId
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
  );
}
