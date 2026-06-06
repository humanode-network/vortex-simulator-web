import { Link } from "react-router";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import { SectionHeader } from "@/components/SectionHeader";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader } from "@/components/primitives/card";
import type { FactionDto } from "@/types/api";

type FactionInitiative = NonNullable<FactionDto["initiativesDetailed"]>[number];

type FactionInitiativesSectionProps = {
  factionId: string;
  initiatives: FactionInitiative[];
};

export function FactionInitiativesSection({
  factionId,
  initiatives,
}: FactionInitiativesSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <SectionHeader>Initiatives</SectionHeader>
      </CardHeader>
      <CardContent className="space-y-3">
        {initiatives.length === 0 ? (
          <NoDataYetBar label="initiatives" />
        ) : (
          initiatives.map((initiative) => (
            <div
              key={initiative.id}
              className="rounded-md border border-border text-sm"
            >
              <Link
                to={`/app/factions/${factionId}/initiatives/${initiative.id}`}
                className="block px-3 py-2 hover:bg-panel-alt/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-text hover:underline">
                      {initiative.title}
                    </p>
                    <p className="text-xs text-muted">{initiative.intent}</p>
                  </div>
                  <Badge variant="outline">{initiative.status}</Badge>
                </div>
              </Link>
            </div>
          ))
        )}
        <div className="rounded-md border border-border p-3">
          <p className="text-xs text-muted">
            Open initiatives workspace to create new initiatives and manage
            status.
          </p>
          <div className="mt-2">
            <Button asChild size="sm" variant="outline">
              <Link to={`/app/factions/${factionId}/initiatives`}>
                Open initiatives workspace
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
