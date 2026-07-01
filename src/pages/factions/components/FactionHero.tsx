import { Chip } from "@/components/Chip";
import { GlassyStatusChip } from "@/components/GlassySection";
import { HintLabel } from "@/components/Hint";
import { MetricTile } from "@/components/MetricTile";
import {
  WorkspaceHeader,
  WorkspaceHeaderAction,
} from "@/components/WorkspaceHeader";
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
  const roleLabel = viewerRole
    ? viewerRole.charAt(0).toUpperCase() + viewerRole.slice(1)
    : "Observer";
  const pendingJoin =
    viewerJoinRequest?.status === "pending" && !viewerMembershipActive;

  return (
    <>
      <WorkspaceHeader
        title={faction.name}
        summary={faction.description}
        actions={
          canJoin || canLeave || isFounderAdmin ? (
            <>
              {canJoin ? (
                <WorkspaceHeaderAction
                  disabled={mutating || viewerJoinRequest?.status === "pending"}
                  onClick={onJoin}
                >
                  {faction.visibility === "private"
                    ? viewerJoinRequest?.status === "pending"
                      ? "Request pending"
                      : "Request to join"
                    : "Join faction"}
                </WorkspaceHeaderAction>
              ) : null}
              {canLeave ? (
                <WorkspaceHeaderAction disabled={mutating} onClick={onLeave}>
                  Leave faction
                </WorkspaceHeaderAction>
              ) : null}
              {isFounderAdmin ? (
                <WorkspaceHeaderAction onClick={onEditToggle}>
                  {editOpen ? "Close edit" : "Edit faction"}
                </WorkspaceHeaderAction>
              ) : null}
            </>
          ) : undefined
        }
        markers={
          <>
            <GlassyStatusChip
              tone={faction.visibility === "public" ? "ok" : "neutral"}
            >
              {faction.visibility === "public" ? "Public" : "Private"}
            </GlassyStatusChip>
            <GlassyStatusChip tone="neutral">{roleLabel}</GlassyStatusChip>
            <Chip className="stage-chip stage-chip--faction">
              {faction.focus}
            </Chip>
          </>
        }
        meta={
          viewerRole === "founder" || pendingJoin ? (
            <>
              {viewerRole === "founder" ? (
                <GlassyStatusChip tone="warn">
                  Founder leave requires transfer
                </GlassyStatusChip>
              ) : null}
              {pendingJoin ? (
                <GlassyStatusChip tone="warn">
                  Join request pending
                </GlassyStatusChip>
              ) : null}
            </>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Members" value={String(faction.members)} />
        <MetricTile
          label={<HintLabel termId="acm" prefix="Members'" termText="ACM" />}
          value={String(faction.acm)}
        />
        <MetricTile
          label="Channels"
          value={String(faction.channels?.length ?? 0)}
        />
        <MetricTile
          label="Initiatives"
          value={String(
            faction.initiativesDetailed?.length ??
              faction.initiatives?.length ??
              0,
          )}
        />
      </div>
    </>
  );
};
