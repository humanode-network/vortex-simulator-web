import { Kicker } from "@/components/Kicker";
import { StatTile } from "@/components/StatTile";
import { HintLabel } from "@/components/Hint";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import type { FactionDto } from "@/types/api";

type FactionHeroProps = {
  canJoin: boolean;
  canLeave: boolean;
  editOpen: boolean;
  faction: FactionDto;
  isFounderAdmin: boolean;
  mutating: boolean;
  onEditToggle: () => void;
  onJoin: () => void;
  onLeave: () => void;
  viewerJoinRequest: FactionDto["viewerJoinRequest"];
  viewerMembershipActive: boolean;
  viewerRole: string | null;
};

export const FactionHero: React.FC<FactionHeroProps> = ({
  canJoin,
  canLeave,
  editOpen,
  faction,
  isFounderAdmin,
  mutating,
  onEditToggle,
  onJoin,
  onLeave,
  viewerJoinRequest,
  viewerMembershipActive,
  viewerRole,
}) => {
  return (
    <>
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <Kicker>{faction.focus}</Kicker>
              <h1 className="text-2xl leading-tight font-semibold text-text sm:text-3xl">
                {faction.name}
              </h1>
              <p className="max-w-4xl text-sm leading-relaxed text-muted sm:text-base">
                {faction.description}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
              {canJoin ? (
                <Button
                  size="sm"
                  disabled={mutating || viewerJoinRequest?.status === "pending"}
                  onClick={onJoin}
                >
                  {faction.visibility === "private"
                    ? viewerJoinRequest?.status === "pending"
                      ? "Request pending"
                      : "Request to join"
                    : "Join faction"}
                </Button>
              ) : null}
              {canLeave ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={mutating}
                  onClick={onLeave}
                >
                  Leave faction
                </Button>
              ) : null}
              {isFounderAdmin ? (
                <Button size="sm" variant="outline" onClick={onEditToggle}>
                  {editOpen ? "Close edit" : "Edit faction"}
                </Button>
              ) : null}
            </div>
          </div>

          {viewerRole === "founder" ? (
            <div className="mt-3">
              <Badge variant="outline">
                Founder leave disabled until transfer
              </Badge>
            </div>
          ) : null}
          {viewerJoinRequest?.status === "pending" &&
          !viewerMembershipActive ? (
            <div className="mt-3">
              <Badge variant="outline">
                Private faction join request pending
              </Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Members"
          value={String(faction.members)}
          align="center"
        />
        <StatTile
          label={<HintLabel termId="acm" prefix="Members'" termText="ACM" />}
          value={String(faction.acm)}
          align="center"
        />
        <StatTile
          label="Role"
          value={
            viewerRole
              ? viewerRole.charAt(0).toUpperCase() + viewerRole.slice(1)
              : "None"
          }
          align="center"
        />
      </div>
    </>
  );
};
