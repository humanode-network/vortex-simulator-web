import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useAuth } from "@/app/auth/AuthContext";
import { Chip } from "@/components/Chip";
import { GlassyCard } from "@/components/GlassyCard";
import { GlassyStatusChip } from "@/components/GlassySection";
import { MetricTile } from "@/components/MetricTile";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import {
  WorkspaceHeader,
  WorkspaceHeaderAction,
} from "@/components/WorkspaceHeader";
import { useActionRunner } from "@/hooks/useActionRunner";
import {
  apiInitiativeJoin,
  apiInitiativeJoinRequestApprove,
  apiInitiativeJoinRequestDecline,
  apiInitiativeLeave,
} from "@/lib/apiClient";
import { formatDateTime } from "@/lib/dateTime";
import { formatLoadError } from "@/lib/errorFormatting";
import {
  defaultInitiativeBoardColumns,
  getInitiativeViewerCapabilities,
  initiativeBoardCardCreatePath,
  initiativeDescriptionParagraphs,
  initiativeDistinctDescription,
  initiativeRoleLabel,
  initiativeStatusLabel,
  initiativeStatusTone,
} from "@/lib/initiativeUi";
import { shortAddress } from "@/lib/profileUi";
import { InitiativeBoardSection } from "./components/InitiativeBoardSection";
import { InitiativeChatSection } from "./components/InitiativeChatSection";
import { InitiativeJoinRequestsSection } from "./components/InitiativeJoinRequestsSection";
import { InitiativeMembersSection } from "./components/InitiativeMembersSection";
import { InitiativeProposalsSection } from "./components/InitiativeProposalsSection";
import { InitiativeSettingsSection } from "./components/InitiativeSettingsSection";
import { InitiativeThreadsSection } from "./components/InitiativeThreadsSection";
import { useInitiativePageData } from "./hooks/useInitiativePageData";

const Initiative: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const { initiative, loadError, reload } = useInitiativePageData(id);
  const [editing, setEditing] = useState(false);
  const { actionError, mutating, runAction } = useActionRunner({ reload });

  const boardColumns = useMemo(() => {
    if (!initiative) return [];
    if (initiative.boardColumns && initiative.boardColumns.length > 0) {
      return initiative.boardColumns;
    }
    return defaultInitiativeBoardColumns;
  }, [initiative]);

  if (!id) {
    return <NoDataYetBar label="initiative id" />;
  }

  if (loadError) {
    return (
      <GlassyCard className="px-4 py-6 text-center text-sm text-destructive">
        Initiative unavailable: {formatLoadError(loadError)}
      </GlassyCard>
    );
  }

  if (!initiative) {
    return (
      <GlassyCard className="px-4 py-6 text-center text-sm text-muted">
        Loading initiative...
      </GlassyCard>
    );
  }

  const cards = initiative.boardCards ?? [];
  const threads = initiative.threads ?? [];
  const memberships = initiative.memberships ?? [];
  const proposals = initiative.proposals ?? [];
  const chatMessages = initiative.chatMessages ?? [];
  const isOperational = initiative.status === "active";
  const {
    canAdmin,
    canJoin: viewerCanJoin,
    canLeave: viewerCanLeave,
    canManage,
    canParticipate,
  } = getInitiativeViewerCapabilities(initiative, auth);
  const pendingJoinRequest = initiative.viewerJoinRequest?.status === "pending";
  const viewerRole = initiative.viewerRole
    ? initiativeRoleLabel[initiative.viewerRole]
    : "Observer";
  const description = initiativeDistinctDescription(
    initiative.summary,
    initiative.description,
  );
  const descriptionParagraphs = initiativeDescriptionParagraphs(description);

  return (
    <div className="flex flex-col gap-6">
      <WorkspaceHeader
        title={initiative.title}
        summary={initiative.summary}
        details={descriptionParagraphs}
        actions={
          canAdmin ||
          canManage ||
          viewerCanJoin ||
          viewerCanLeave ||
          pendingJoinRequest ? (
            <>
              {viewerCanJoin || pendingJoinRequest ? (
                <WorkspaceHeaderAction
                  disabled={mutating || pendingJoinRequest}
                  onClick={() =>
                    void runAction(async () => {
                      await apiInitiativeJoin({ initiativeId: initiative.id });
                    })
                  }
                >
                  {pendingJoinRequest
                    ? "Request pending"
                    : initiative.visibility === "private"
                      ? "Request to join"
                      : "Join initiative"}
                </WorkspaceHeaderAction>
              ) : null}
              {viewerCanLeave ? (
                <WorkspaceHeaderAction
                  disabled={mutating}
                  onClick={() =>
                    void runAction(async () => {
                      await apiInitiativeLeave({ initiativeId: initiative.id });
                    })
                  }
                >
                  Leave initiative
                </WorkspaceHeaderAction>
              ) : null}
              {canAdmin ? (
                <WorkspaceHeaderAction onClick={() => setEditing(true)}>
                  Edit initiative
                </WorkspaceHeaderAction>
              ) : null}
              {canManage ? (
                <WorkspaceHeaderAction
                  onClick={() =>
                    navigate(
                      initiativeBoardCardCreatePath({ id: initiative.id }),
                    )
                  }
                >
                  Create card
                </WorkspaceHeaderAction>
              ) : null}
            </>
          ) : undefined
        }
        markers={
          <>
            <GlassyStatusChip tone={initiativeStatusTone(initiative.status)}>
              {initiativeStatusLabel[initiative.status]}
            </GlassyStatusChip>
            <GlassyStatusChip
              tone={initiative.visibility === "public" ? "ok" : "neutral"}
            >
              {initiative.visibility === "public" ? "Public" : "Private"}
            </GlassyStatusChip>
            <GlassyStatusChip tone="neutral">{viewerRole}</GlassyStatusChip>
            {initiative.tags.length > 0 ? (
              <span
                aria-hidden="true"
                className="mx-1 h-4 w-px bg-[color:var(--surface-glass-border)]"
              />
            ) : null}
            {initiative.tags.map((tag) => (
              <Chip key={tag} className="stage-chip stage-chip--system">
                {tag}
              </Chip>
            ))}
          </>
        }
        meta={
          <>
            <span>Created by {shortAddress(initiative.createdByAddress)}</span>
            <span>Updated {formatDateTime(initiative.updatedAt)}</span>
          </>
        }
      />

      {actionError ? (
        <p className="text-sm text-destructive">{actionError}</p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Members" value={initiative.memberCount} />
        <MetricTile label="Board" value={cards.length} />
        <MetricTile label="Threads" value={threads.length} />
        <MetricTile label="Proposals" value={proposals.length} />
      </section>

      {canAdmin && editing ? (
        <InitiativeSettingsSection
          initiative={initiative}
          onChanged={reload}
          onClose={() => setEditing(false)}
        />
      ) : null}
      <InitiativeJoinRequestsSection
        canModerate={isOperational && canManage}
        joinRequests={initiative.joinRequests ?? []}
        mutating={mutating}
        onApprove={(address) =>
          void runAction(async () => {
            await apiInitiativeJoinRequestApprove({
              initiativeId: initiative.id,
              address,
            });
          })
        }
        onDecline={(address) =>
          void runAction(async () => {
            await apiInitiativeJoinRequestDecline({
              initiativeId: initiative.id,
              address,
            });
          })
        }
      />
      <InitiativeBoardSection
        cards={cards}
        canManage={canManage}
        columns={boardColumns}
        initiativeId={initiative.id}
        onChanged={reload}
      />
      <InitiativeThreadsSection
        canModerate={canManage}
        canPost={canParticipate}
        initiativeId={initiative.id}
        onChanged={reload}
        threads={threads}
      />
      <InitiativeProposalsSection proposals={proposals} />
      <InitiativeMembersSection
        canAdmin={isOperational && canAdmin}
        initiativeId={initiative.id}
        memberships={memberships}
        onChanged={reload}
      />
      <InitiativeChatSection
        canPost={canParticipate}
        initiativeId={initiative.id}
        messages={chatMessages}
        onChanged={reload}
      />
    </div>
  );
};

export default Initiative;
