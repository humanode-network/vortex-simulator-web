import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Chip } from "@/components/Chip";
import { GlassyCard } from "@/components/GlassyCard";
import { GlassyStatusChip } from "@/components/GlassySection";
import { MetricTile } from "@/components/MetricTile";
import { NoDataYetBar } from "@/components/NoDataYetBar";
import {
  WorkspaceHeader,
  WorkspaceHeaderAction,
} from "@/components/WorkspaceHeader";
import { formatDateTime } from "@/lib/dateTime";
import { formatLoadError } from "@/lib/errorFormatting";
import {
  canManageInitiative,
  defaultInitiativeBoardColumns,
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
import { InitiativeMembersSection } from "./components/InitiativeMembersSection";
import { InitiativeProposalsSection } from "./components/InitiativeProposalsSection";
import { InitiativeSettingsSection } from "./components/InitiativeSettingsSection";
import { InitiativeThreadsSection } from "./components/InitiativeThreadsSection";
import { useInitiativePageData } from "./hooks/useInitiativePageData";

const Initiative: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { initiative, loadError, reload } = useInitiativePageData(id);
  const [editing, setEditing] = useState(false);

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
  const canManage = canManageInitiative(initiative);
  const canAdmin = Boolean(initiative.viewerCanAdmin);
  const canParticipate = isOperational && initiative.viewerRole != null;
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
          canAdmin || canManage ? (
            <>
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
      <InitiativeChatSection
        canPost={canParticipate}
        initiativeId={initiative.id}
        messages={chatMessages}
        onChanged={reload}
      />
      <InitiativeProposalsSection proposals={proposals} />
      <InitiativeMembersSection
        canAdmin={isOperational && canAdmin}
        initiativeId={initiative.id}
        memberships={memberships}
        onChanged={reload}
      />
    </div>
  );
};

export default Initiative;
